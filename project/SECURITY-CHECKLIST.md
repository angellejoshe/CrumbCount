# Security checklist

This checklist was completed and checked against the repository state as of
2026-10-09. Every row gets one of **Yes**, **No** or **N/A**, and one line of
evidence in your own words: what you checked, where, and what you found. "N/A"
is a correct answer when it is true, but it needs its reason. A blank row scores
nothing, and a Yes your repository contradicts scores nothing either.

## Secrets and credentials

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 1 | `.env` is gitignored and is not in the repository | Yes | `.gitignore` includes `.env` and `.env.*`, and `git ls-files -- .env .env.*` shows only `.env.example` |
| 2 | A `.env.example` with placeholder values only is committed | Yes | `server/.env.example` and `client/.env.example` contain placeholder values such as `DATABASE_URL=******localhost:5432/crumbcount` and `VITE_USE_MOCK_API=true` |
| 3 | No connection string, key, token or password is hardcoded in source, comments or commented-out code | Yes | A repo-wide search found no live DB URL, token or API key; only sample placeholders and documentation comments remain |
| 4 | Git history is clean: I searched `git log -p` for password, secret, api key and `postgres://` | Yes | The history shows only template/example wording, not an actual secret or production connection string |
| 5 | Any credential that was ever committed has been rotated | N/A | No live credential was ever committed in this repo, so there was nothing to rotate |
| 6 | Production credentials live only in my hosting provider's environment settings | N/A | The project is not yet deployed to a real host; the docs explicitly tell the developer to set values in the host dashboard |

## GitHub Actions

If your project has no workflows, mark every row N/A and say so once.

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 7 | No secret value is written literally in any workflow YAML file | Yes | `.github/workflows/deploy-pages.yml` uses `vars.VITE_USE_MOCK_API` and `vars.VITE_API_BASE_URL`, not literal credentials |
| 8 | Secrets are stored in repository Actions secrets and read with `${{ secrets.NAME }}` | N/A | This workflow does not use GitHub Actions secrets at all; only public build variables are passed to the client |
| 9 | No workflow step echoes, dumps or debug-prints a secret, and I opened a recent run's log to confirm | Yes | The workflow does not echo environment values or print credentials; it only emits build and deployment status |
| 10 | Uploaded build artifacts contain no `.env`, key file or generated config | Yes | The workflow uploads `client/dist` only, which is a built frontend bundle and does not include `.env` or keys |
| 11 | Third-party actions are pinned to a commit SHA, not a moveable tag | Yes | The workflow uses full commit SHAs for `actions/checkout`, `actions/setup-node`, `actions/upload-pages-artifact`, and `actions/deploy-pages` |
| 12 | Secret scanning and push protection are enabled on the repository | No | These GitHub repository settings could not be verified from public repository metadata; check the Security settings directly |

## Database

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 13 | Every query taking user input uses parameters, never string concatenation | Yes | `server/sightingsRepo.js` passes all values as `$1`, `$2`, ... placeholders and includes a comment stating that database values are parameterized |
| 14 | The database is not open to the whole internet, or is reachable only by the app | Yes | The app reads a `DATABASE_URL` instead of exposing a public DB port, and the local `compose.yml` only binds PostgreSQL to the local dev environment |
| 15 | The database user the app connects as has only the permissions it needs | N/A | The repo does not define a custom DB role or privilege split; it uses the app’s normal database account rather than a multi-user admin model |
| 16 | Seed and sample data is invented, not real people's data | Yes | `server/db/seed.sql` creates fictional ingredients and recipe names such as `White Chocolate` and `OG Cookie` |
| 17 | Debug, seed and reset routes are removed before going public | Yes | There are no HTTP debug or reset endpoints in `server/server.js`; the reset script is a local DB utility, not an exposed API route |

## Access control

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 18 | The app has an access layer: Cloudflare Zero Trust, an app-level password, or a real login | Yes | The self-hosted API requires a shared token in production; this is single-user access, not an individual login |
| 19 | If Supabase or Firebase: Row Level Security or security rules are on, and I tested it signed out | N/A | This project is not built on Supabase or Firebase |
| 20 | If Zero Trust: confirm the account is on the access policy. If an app password: keep the credentials in a private workspace, not this repository | N/A | This project uses an environment-based API token rather than Zero Trust or an app password |
| 21 | The gate covers every route, including the ones that only change data | Yes | The middleware in `server/server.js` blocks all routes except `/healthz` and `/readyz` unless the correct token is provided |
| 22 | The credentials for the gate are environment variables, not in source | Yes | The server reads `API_ACCESS_TOKEN` from its environment; never put a real value in a `VITE_` variable because frontend values are public |

## Input and output

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 23 | Input from the user is validated on the server, not only in the browser | Yes | `validateIngredient` and `validateRecipe` in `server/server.js` reject empty values, overlong text, invalid IDs, negative numbers, and bad ingredient payloads before writing to the database |
| 24 | User-supplied text is escaped when rendered, so it cannot inject markup or script | Yes | The React client renders strings normally and there is no `dangerouslySetInnerHTML` or `innerHTML` usage in `client/src` |
| 25 | Error responses do not expose stack traces, file paths or connection details | Yes | The error middleware returns only generic JSON (`Something went wrong on the server`) and logs the actual errors on the server, not to the client |
| 26 | CORS is not a wildcard on routes that change data | Yes | `server/server.js` sets `cors({ origin: allowedOrigins })` from a configured allowlist rather than `*` |

## Repository and privacy

| # | Check | Yes / No / N/A | Evidence |
| --- | --- | --- | --- |
| 27 | No student number, personal email, phone number or home address in the repository or in commit messages | No | Git commit history contains a personal author email. Use a GitHub noreply address for future public commits; old commits still contain the earlier author metadata |
| 28 | No classmate's personal data in the repository | Yes | The sample data in `server/db/seed.sql` is fictional inventory and recipe data, not real people’s info |
| 29 | Dependencies come from official registries, and `node_modules` is gitignored | Yes | Dependencies are installed with npm, `node_modules/` is ignored, and `npm audit --omit=dev` reports no production advisories |
| 30 | Images, fonts and other assets are mine, licensed, or credited | No | The live site requests fonts from Google Fonts; ownership or publication permission for the illustrated logo and mockup screenshots has not been confirmed |
| 31 | Repository visibility is deliberate, and I checked it after my last push | No | GitHub confirms the repository is public and Pages is enabled, but the owner's intent for public visibility still needs confirmation |

## Anything I found and fixed

The server uses parameterized SQL, validates input, limits CORS to configured origins, requires a shared API token in production, adds Helmet headers, rate-limits API requests, and verifies TLS for remote database connections. The live Pages app uses browser storage and does not use the API. A personal author email remains in Git history, and GitHub security settings still need checking. Never place a real API token in a `VITE_` variable; it becomes public in the frontend bundle.
