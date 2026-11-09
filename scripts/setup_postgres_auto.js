const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupPostgres(password = 'Hoang2005@') {
  console.log('====================================================');
  console.log('🚀 TỰ ĐỘNG THIẾT LẬP CƠ SỞ DỮ LIỆU EDUQUEST TRÊN POSTGRESQL');
  console.log('====================================================');

  // 1. Kết nối vào database postgres mặc định để kiểm tra và tạo database eduquest
  const client = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'postgres',
    connectionTimeoutMillis: 5000
  });

  try {
    console.log(`1. Đang kết nối tới PostgreSQL với mật khẩu: ${password}...`);
    await client.connect();
    console.log('✓ Kết nối thành công tới PostgreSQL!');

    // 2. Kiểm tra xem database 'eduquest' đã tồn tại chưa
    const checkDb = await client.query("SELECT 1 FROM pg_database WHERE datname = 'eduquest'");
    if (checkDb.rows.length === 0) {
      console.log("2. Database 'eduquest' chưa tồn tại. Đang tự động tạo mới...");
      await client.query('CREATE DATABASE eduquest;');
      console.log("✓ Đã tạo thành công Database 'eduquest'!");
    } else {
      console.log("2. Database 'eduquest' đã tồn tại.");
    }
  } catch (err) {
    if (err.code === '28P01') {
      console.error('\n❌ LỖI XÁC THỰC MẬT KHẨU (28P01):');
      console.error(`Mật khẩu "${password}" chưa khớp với mật khẩu của tài khoản postgres.`);
      console.error('👉 Vui lòng mở pgAdmin 4 (đang chạy sẵn), mở Query Tool và chạy câu lệnh sau:');
      console.error(`   ALTER USER postgres WITH PASSWORD '${password}';\n`);
    } else {
      console.error('Lỗi kết nối:', err.message);
    }
    await client.end().catch(() => {});
    return false;
  } finally {
    try { await client.end(); } catch (e) {}
  }

  // 3. Kết nối trực tiếp vào database 'eduquest' và chạy file schema
  const eduquestClient = new Client({
    host: '127.0.0.1',
    port: 5432,
    user: 'postgres',
    password: password,
    database: 'eduquest',
    connectionTimeoutMillis: 10000
  });

  try {
    console.log("3. Đang kết nối vào database 'eduquest'...");
    await eduquestClient.connect();
    console.log("✓ Đã kết nối vào 'eduquest'!");

    console.log("4. Đang nạp toàn bộ cấu trúc bảng và dữ liệu mẫu từ eduquest_postgres_full.sql...");
    const sqlPath = path.join(__dirname, '..', 'database', 'eduquest_postgres_full.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    await eduquestClient.query(sqlContent);
    console.log("✓ Đã khởi tạo thành công 21 bảng và nạp toàn bộ Seed Data!");

    // 5. Kiểm tra nhanh số liệu
    const userCount = await eduquestClient.query('SELECT count(*) FROM users');
    const skillCount = await eduquestClient.query('SELECT count(*) FROM skill_catalog');
    const itemCount = await eduquestClient.query('SELECT count(*) FROM item_catalog');
    const petCount = await eduquestClient.query('SELECT count(*) FROM pet_catalog');

    console.log('\n================ KẾT QUẢ KIỂM TRA ================');
    console.log(`- Số tài khoản người dùng: ${userCount.rows[0].count} (Admin, Giáo viên, Học sinh A, Học sinh B)`);
    console.log(`- Số kỹ năng RPG:         ${skillCount.rows[0].count} kỹ năng`);
    console.log(`- Số trang bị cửa hàng:    ${itemCount.rows[0].count} vật phẩm`);
    console.log(`- Số linh thú đồng hành:   ${petCount.rows[0].count} thú cưng`);
    console.log('====================================================');
    console.log('🎉 TẤT CẢ ĐÃ SẴN SÀNG TRÊN POSTGRESQL & PGADMIN 4!');

    return true;
  } catch (err) {
    console.error('Lỗi khi nạp schema:', err.message);
    return false;
  } finally {
    try { await eduquestClient.end(); } catch (e) {}
  }
}

// Cho phép truyền password qua tham số command line: node scripts/setup_postgres_auto.js "matkhau"
const pwdArg = process.argv[2] || 'Hoang2005@';
setupPostgres(pwdArg).catch(console.error);
