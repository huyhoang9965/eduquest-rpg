const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  host: process.env.PGHOST || '127.0.0.1',
  port: parseInt(process.env.PGPORT, 10) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || '123456',
  database: process.env.PGDATABASE || 'eduquest',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

pool.on('error', (err) => {
  console.error('Lỗi bất ngờ trong pool kết nối PostgreSQL:', err);
});

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params)
};
