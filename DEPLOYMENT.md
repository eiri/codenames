# Deploy to Cloudflare

Run these commands from the project directory on your machine. The deployment uses the Worker named `codenames` and the configuration in `wrangler.jsonc`. If a command fails, stop before the next step.

## Prepare

Use Node.js 24 and npm. Install the project dependencies:

```sh
npm ci
```

Sign in to Cloudflare:

```sh
npx wrangler login
npx wrangler whoami
```

Make sure that the account is correct. In `wrangler.jsonc`, make sure that `name` is `codenames`. Keep the existing `ROOMS` binding and storage migrations unchanged so that deployments preserve saved rooms.

The `workers_dev` property enables the public `workers.dev` address. Keep it `true` unless you serve the game through a custom domain instead. Never enable `ALLOW_LOCAL_HTTP` in production.

## Deploy an update

Build and deploy:

```sh
npm run build && npx wrangler deploy --config wrangler.jsonc
```

Existing secrets and saved rooms remain intact. You do not need to upload secrets again. Use the HTTPS URL from the deployment output to open the game.

## Set up secrets for a first deployment

Skip this section if production already has its secrets. A secret is a value stored outside the code. `PLAYER_CREDENTIALS` contains password hashes, and `SESSION_SECRET` signs login cookies.

Use `jq` and `openssl` for these commands. Keep the same terminal open until cleanup. Do not put passwords or secrets in Git, chat, or command arguments.

Create a private temporary directory:

```sh
umask 077
secret_dir=$(mktemp -d "${TMPDIR:-/tmp}/codenames-secrets.XXXXXX")
```

Generate credentials for every player:

```sh
npm run --silent credentials > "$secret_dir/players.json"
```

Enter each player's existing password twice. The generator hides your input. If you cancel or the generator fails, run it again before continuing.

Make sure that the file contains a nonempty JSON object without printing its contents:

```sh
jq -e 'type == "object" and length > 0' "$secret_dir/players.json" > /dev/null
```

Generate the session key:

```sh
openssl rand -hex 32 > "$secret_dir/session-key"
```

Create the secrets file:

```sh
jq -n \
  --rawfile players "$secret_dir/players.json" \
  --rawfile key "$secret_dir/session-key" \
  '{PLAYER_CREDENTIALS: ($players | fromjson | tojson), SESSION_SECRET: ($key | rtrimstr("\n"))}' \
  > "$secret_dir/production.json"
```

Deploy the code and secrets together:

```sh
npm run build && npx wrangler deploy --config wrangler.jsonc \
  --secrets-file "$secret_dir/production.json"
```

Do not upload `.dev.vars` or use the credential generator's `--local` option. Those values include an HTTP exception for local development. For future updates, use the command in “Deploy an update” instead.

Remove the temporary files after deployment or if you abandon this procedure:

```sh
if [ -n "$secret_dir" ] && [ -d "$secret_dir" ]; then
  rm -r -- "$secret_dir"
fi
unset secret_dir
```

This removes local files, not Cloudflare secrets. Changing `SESSION_SECRET` invalidates existing login signatures. Replacing `PLAYER_CREDENTIALS` replaces the whole player map, so preserve every player's entry during password changes.

## Undeploy

Do not use deletion to pause the site or undo a deployment. Deletion removes the Worker and can permanently destroy its saved rooms. If you need to preserve games, stop before running this command.

To permanently remove production, name the Worker explicitly:

```sh
npx wrangler delete codenames --config wrangler.jsonc
```

This targets production in the selected Cloudflare account. Redeployment is not a way to recover deleted rooms. The local source files remain on your computer.
