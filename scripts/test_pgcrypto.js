const { pool } = require('../database/pg_db');
const bcrypt = require('bcryptjs');

async function test() {
  try {
    const res = await pool.query("SELECT crypt('MatKhau123@', gen_salt('bf', 10)) AS hash");
    const hash = res.rows[0].hash;
    console.log('PostgreSQL generated hash:', hash);
    const match = bcrypt.compareSync('MatKhau123@', hash);
    console.log('bcrypt match:', match);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

test();
