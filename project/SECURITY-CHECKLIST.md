# Security Checklist

| Requirement | Status | Evidence |
|---|---|---|
| No secrets in repository | Yes | `.env` files are ignored and committed `.env.example` files contain placeholders only. |
| No secrets in Git history | Yes | Git history was checked and no real passwords, API keys, tokens, or connection strings were found. |
| GitHub Actions secrets protected | Yes | Workflow does not print or expose secrets; public `VITE_` values are treated as non-secret variables. |
| GitHub Actions pinned to commit SHAs | Yes | All third-party Actions in `deploy-pages.yml` use full commit SHAs. |
| Secret scanning / push protection | N/A | No repository-level Secret Protection option is available in the current GitHub settings. |
| No personal information | Yes | Repository search found no personal name, student number, personal email, or phone number. |
| Database queries parameterized | Yes | `sightingsRepo.js` uses PostgreSQL parameterized queries (`$1`, `$2`, etc.). |
| Stack traces not exposed | Yes | Server logs detailed errors while returning a generic error message to clients. |
| Debug/seed/reset routes exposed | No | No debug, seed, or reset HTTP routes were found in `server/server.js`. |
| Public database write authentication | N/A | Current deployed frontend uses the mock API by default; the real database API is not used by the public deployment. |