// models/db.js
const { Client } = require('pg');

const client = new Client({
  user: process.env.PG_USER,
  host: process.env.PG_HOST,
  database: process.env.PG_DB,
  password: process.env.PG_PASSWORD,
  port: process.env.PG_PORT,
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL successfully!');
    return client.query('SELECT version();');
  })
  .then(res => {
    console.log('PostgreSQL version:', res.rows[0]);
  })
  .catch(err => {
    console.error('Connection error:', err.stack);
  });

// Graceful shutdown
process.on('SIGINT', async () => {
  await client.end();
  console.log('Database connection closed gracefully.');
  process.exit(0);
});

module.exports = client;