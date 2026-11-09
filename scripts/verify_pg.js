const { query } = require('../database/pg_db');

async function test() {
  const tables = await query("SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;");
  console.log(`✓ Đã xác minh kết nối thành công! Tìm thấy ${tables.rows.length} bảng trong database 'eduquest':`);
  tables.rows.forEach((t, i) => {
    console.log(`  ${(i + 1).toString().padStart(2, ' ')}. ${t.tablename}`);
  });

  const students = await query(`
    SELECT u.username, p.display_name, c.hero_class, c.level, w.gold, w.gems
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    JOIN player_characters c ON u.id = c.user_id
    JOIN player_wallets w ON u.id = w.user_id;
  `);

  console.log('\n✓ Dữ liệu nhân vật học sinh trong PostgreSQL:');
  console.table(students.rows);

  process.exit(0);
}

test().catch(console.error);
