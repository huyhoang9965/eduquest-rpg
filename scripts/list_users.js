const { pool } = require('../database/pg_db');

async function listUsers() {
  try {
    const res = await pool.query('SELECT id, username, email, role, status FROM users ORDER BY created_at ASC');
    console.table(res.rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

listUsers();
