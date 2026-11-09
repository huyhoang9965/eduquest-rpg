const { Client } = require('pg');

const candidates = [
  // User clue variations
  'Hoang2005@',
  'Hoang@2005',
  'hoang@2005',
  'hoang2005@',
  'Hoang2005!',
  'hoang2005!',
  'Hoang2005#',
  'hoang2005#',
  'Hoang2005$',
  'Hoang2005.',
  'Hoang@2005@',
  'Hoang2005@@',
  'Hoang2005',
  'hoang2005',
  'Hoang@123',
  'Hoang123@',
  'Hoang123',
  'hoang123',
  'Hoang@123456',
  'Hoang@123456@',
  'Hoang',
  'hoang',

  // Machine user 'asus'
  'asus',
  'Asus',
  'asus@123',
  'Asus@123',
  'Asus2005',
  'asus2005',
  'Asus2005@',
  'asus2005@',

  // Standard postgres passwords
  'postgres',
  'Postgres',
  'Postgres@123',
  'Postgres@123456',
  'Postgres2005',
  'Postgres@2005',
  'admin',
  'Admin',
  'Admin@123',
  'Admin@123456',
  'root',
  '123456',
  '12345678',
  '123456789',
  '1234',
  '1',
  'password',
  'Password@123'
];

async function run() {
  console.log(`Bắt đầu thử ${candidates.length} mật khẩu ứng viên...`);

  for (let i = 0; i < candidates.length; i++) {
    const pwd = candidates[i];
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: pwd,
      database: 'postgres',
      connectionTimeoutMillis: 1500
    });

    try {
      await client.connect();
      console.log(`\n========================================`);
      console.log(`🎉 CHÍNH XÁC RỒI! MẬT KHẨU LÀ: "${pwd}"`);
      console.log(`========================================\n`);
      await client.end();
      return pwd;
    } catch (err) {
      if (err.code === '28P01') {
        process.stdout.write(`[${i + 1}/${candidates.length}] Sai: ${pwd}\n`);
      } else {
        console.log(`Lỗi khác khi thử ${pwd}:`, err.message);
      }
    } finally {
      try { await client.end(); } catch (e) {}
    }
  }

  console.log('\nChưa tìm thấy mật khẩu trong danh sách biến thể.');
  return null;
}

run().catch(console.error);
