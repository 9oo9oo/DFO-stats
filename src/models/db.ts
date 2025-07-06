// src/models/db.ts
import 'dotenv/config';
import { Client, QueryResult } from 'pg';

// Build config with proper types and defaults
const client = new Client({
  user: process.env.PG_USER!,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
});

// Connect and verify
client
  .connect()
  .then(() => {
    console.log('Connected to PostgreSQL successfully!');
    return client.query<{ version: string }>('SELECT version();');
  })
  .then((res: QueryResult<{ version: string }>) => {
    console.log('PostgreSQL version:', res.rows[0].version);
  })
  .catch((err: Error) => {
    console.error('Connection error:', err.stack);
  });

// Graceful shutdown on SIGINT (Ctrl+C)
process.on('SIGINT', async () => {
  await client.end();
  console.log('Database connection closed gracefully.');
  process.exit(0);
});

export default client;
