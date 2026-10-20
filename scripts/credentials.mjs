import { openSync } from "node:fs";
import { Writable } from "node:stream";
import { ReadStream, WriteStream } from "node:tty";
import { createInterface } from "node:readline/promises";

import { roster } from "../src/game/roster.ts";
import { encode, hashPassword, iterations } from "../worker/passwords.ts";

// Use the terminal directly so stdout can feed Wrangler without echoing passwords.
const input = new ReadStream(openSync("/dev/tty", "r"));
const output = new WriteStream(openSync("/dev/tty", "w"));
const hidden = new Writable({ write(_chunk, _encoding, done) { done(); } });
const reader = createInterface({ input, output: hidden, terminal: true, historySize: 0 });
const abort = new AbortController();
reader.on("SIGINT", () => abort.abort());

const ask = async (prompt) => {
  const answer = reader.question("", { signal: abort.signal });
  output.write(prompt);
  try {
    return await answer;
  } finally {
    output.write("\n");
  }
};

try {
  const args = process.argv.slice(2);
  const local = args.includes("--local");
  const names = args.filter((arg) => arg != "--local");
  const selected = names.length ? names : Object.keys(roster);
  if (selected.some((name) => !Object.hasOwn(roster, name))) {
    throw new Error("Use usernames from the roster");
  }

  const credentials = {};
  for (const name of selected) {
    const password = await ask(`${name} password: `);
    const confirmation = await ask(`${name} password again: `);
    if (!password || password.length > 1024 || password != confirmation) {
      throw new Error("Passwords must match and contain 1 to 1024 characters");
    }
    const salt = crypto.getRandomValues(new Uint8Array(16));
    credentials[name] = {
      salt: encode(salt), hash: encode(await hashPassword(password, salt)), iterations,
    };
  }

  const json = JSON.stringify(credentials);
  if (local) {
    const secret = encode(crypto.getRandomValues(new Uint8Array(32)));
    process.stdout.write(`PLAYER_CREDENTIALS='${json}'\nSESSION_SECRET='${secret}'\nALLOW_LOCAL_HTTP=true\n`);
  } else {
    process.stdout.write(`${json}\n`);
  }
} catch (error) {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
} finally {
  reader.close();
  input.destroy();
  output.end();
}
