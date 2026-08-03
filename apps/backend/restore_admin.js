require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    const res = await client.query("UPDATE users SET role = 'ADMIN' WHERE email = 'dmelamem@gmail.com'");
    console.log('Restored ADMIN role count:', res.rowCount);
  } catch (err) {
    console.error('Error restoring role:', err);
  } finally {
    await client.end();
  }
}

run();
