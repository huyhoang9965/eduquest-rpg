const { Client } = require('pg');

const candidates = [
  'hoang2005',
  'Hoang2005',
  'hoang@2005',
  'Hoang@2005',
  'hoang2005@',
  'Hoang2005@',
  'Hoang2k5',
  'hoang2k5',
  'Hoang@2k5',
  'hoang@2k5',
  'Hoang2k5@',
  'hoang2k5@',
  'hoang',
  'Hoang',
  'Hoang123',
  'hoang123',
  'Hoang@123',
  'hoang@123',
  'Hoang123@',
  'hoang123@',
  'Hoang@123456',
  'hoang@123456',
  'Hoang123456',
  'hoang123456',
  'Hoang123456@',
  'hoang123456@',
  'Hoang#2005',
  'hoang#2005',
  'Hoang!2005',
  'hoang!2005',
  'Hoang_2005',
  'hoang_2005',
  'Hoang2005.',
  'hoang2005.',
  '2005',
  '2005@',
  '@2005',
  'nguyenhoang',
  'NguyenHoang',
  'nguyenhoang2005',
  'NguyenHoang2005',
  'NguyenHoang@2005',
  'nguyenhoang@2005',
  'NguyenHoang2005@',
  'nguyenhoang2005@',
  'postgres',
  'Postgres',
  'PostgreSQL',
  'PostgreSQL18',
  'admin',
  'Admin',
  'root',
  '123456',
  '12345678',
  '123456789',
  '1234',
  '123',
  '1',
  'password',
  'Password',
  'Password123',
  'Password@123',
  'P@ssword123',
  'asus',
  'Asus',
  'asus123',
  'Asus123',
  'Asus@123',
  'asus@123',
  'asus2005',
  'Asus2005',
  'Asus@2005',
  'asus@2005',
  'Asus2005@',
  'asus2005@'
];

async function run() {
  console.log(`Kiểm tra ${candidates.length} mật khẩu tiềm năng...`);
  for (let i = 0; i < candidates.length; i++) {
    const pwd = candidates[i];
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: pwd,
      database: 'postgres',
      connectionTimeoutMillis: 1000
    });

    try {
      await client.connect();
      console.log(`\n======================================================`);
      console.log(`🎉 TÌM THẤY RỒI! MẬT KHẨU CHÍNH XÁC LÀ: "${pwd}"`);
      console.log(`======================================================\n`);
      await client.end();
      return pwd;
    } catch (err) {
      if (err.code !== '28P01') {
        console.log(`Lỗi khác với "${pwd}":`, err.code, err.message);
      }
    } finally {
      try { await client.end(); } catch (e) {}
    }
  }
  console.log("Đã thử hết danh sách nhưng chưa khớp.");
  return null;
}

run().catch(console.error);
