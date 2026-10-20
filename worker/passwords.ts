export const iterations = 100_000;

export interface Credential {
  salt: string;
  hash: string;
  iterations: number;
}

export const encode = (bytes: Uint8Array): string =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");

export const decode = (value: string): Uint8Array<ArrayBuffer> => {
  if (!/^[A-Za-z0-9_-]+$/.test(value)) throw new Error("Invalid encoding");
  const bytes = Uint8Array.from(
    atob(value.replaceAll("-", "+").replaceAll("_", "/")),
    (char) => char.charCodeAt(0),
  );
  if (encode(bytes) != value) throw new Error("Invalid encoding");
  return bytes;
};

export const hashPassword = async (
  password: string,
  salt: Uint8Array<ArrayBuffer>,
  count = iterations,
): Promise<Uint8Array<ArrayBuffer>> => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const hash = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt, iterations: count },
    key,
    256,
  );
  return new Uint8Array(hash);
};
