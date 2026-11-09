const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const OLD_PW = 'Hoang2005@';
const NEW_PW = '123456';

async function changePassword() {
  console.log(`1. Đang kết nối tới PostgreSQL với mật khẩu cũ "${OLD_PW}"...`);
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: OLD_PW,
    database: 'postgres'
  });

  try {
    await client.connect();
    console.log('✓ Kết nối thành công!');

    console.log(`2. Đang thực thi: ALTER USER postgres WITH PASSWORD '${NEW_PW}'...`);
    await client.query(`ALTER USER postgres WITH PASSWORD '${NEW_PW}';`);
    console.log(`✓ Đã đổi mật khẩu tài khoản postgres thành công sang: ${NEW_PW}`);
  } catch (err) {
    console.error('Lỗi khi đổi mật khẩu:', err.message);
    throw err;
  } finally {
    await client.end().catch(() => {});
  }

  // Xác minh lại với mật khẩu mới
  console.log(`3. Đang thử kết nối lại với mật khẩu mới "${NEW_PW}"...`);
  const testClient = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: NEW_PW,
    database: 'eduquest'
  });

  try {
    await testClient.connect();
    console.log(`✓ TUYỆT VỜI! Đã kết nối thành công vào PostgreSQL với mật khẩu mới: "${NEW_PW}"!`);
  } catch (err) {
    console.error('Lỗi xác minh mật khẩu mới:', err.message);
    throw err;
  } finally {
    await testClient.end().catch(() => {});
  }
}

changePassword().catch(e => {
  console.error(e);
  process.exit(1);
});
