import pg from 'pg'

// Fail at boot with one clear line, rather than with a mystery 500 an hour
// later. The commonest deployment mistake is setting a variable in .env on your
// laptop and never setting it in the host's dashboard.
if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Locally: copy .env.example to .env and fill it in. ' +
    'On a host: add it in the dashboard, then redeploy.'
  )
  process.exit(1)
}

// Local PostgreSQL has no TLS. Managed database URLs should request TLS with
// certificate verification (for example, sslmode=verify-full).
const databaseUrl = new URL(process.env.DATABASE_URL)
const isLocal = ['localhost', '127.0.0.1', '[::1]'].includes(
  databaseUrl.hostname
)

if (!isLocal) {
  const sslMode = databaseUrl.searchParams.get('sslmode')?.toLowerCase()
  const usesLibpqCompat =
    databaseUrl.searchParams.get('uselibpqcompat')?.toLowerCase() === 'true'
  const sslSetting = databaseUrl.searchParams.get('ssl')?.toLowerCase()

  if (
    sslMode === 'disable' ||
    sslMode === 'no-verify' ||
    sslSetting === '0' ||
    sslSetting === 'false' ||
    (usesLibpqCompat && sslMode !== 'verify-full')
  ) {
    throw new Error(
      'Remote DATABASE_URL must verify its TLS certificate; remove insecure SSL options.'
    )
  }
}

export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: true },
  max: 5,                          // free tiers allow far fewer than you think
  idleTimeoutMillis: 10_000,       // hand connections back quickly
  connectionTimeoutMillis: 5_000,  // fail fast rather than hanging the request
})

// A pool whose server goes away should say so once, loudly, not take the
// process down.
pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error.message)
})
