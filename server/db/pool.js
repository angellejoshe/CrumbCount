
import pg from 'pg'

// Ensure the database URL is configured.
if (!process.env.DATABASE_URL) {
  console.error(
    'DATABASE_URL is not set. Configure it in your local .env file or hosting dashboard.'
  )
  process.exit(1)
}

const databaseUrl = new URL(process.env.DATABASE_URL)

const isLocal = [
  'localhost',
  '127.0.0.1',
  '[::1]',
].includes(databaseUrl.hostname)

// Local PostgreSQL typically doesn't use TLS.
// Render PostgreSQL uses TLS with a self-signed certificate
// on internal connections, so encryption is enabled without
// validating that certificate against a trusted CA.
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal
    ? false
    : { rejectUnauthorized: false },
  max: 5,
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 5_000,
})

pool.on('error', (error) => {
  console.error('Unexpected database pool error:', error.message)
})
