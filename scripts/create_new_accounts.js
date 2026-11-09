const { pool } = require('../database/pg_db');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');

async function createAccounts() {
  console.log('--- 1. INSERT VÀO POSTGRESQL (EDUQUEST) ---');
  
  const sqlPostgres = `
    -- 1. TÀI KHOẢN QUẢN TRỊ VIÊN (ADMIN)
    INSERT INTO users (id, email, username, password_hash, role, status)
    VALUES (
      'usr-admin-master',
      'admin.master@eduquest.vn',
      'admin_master',
      crypt('AdminPassword@123', gen_salt('bf', 10)),
      'admin',
      'active'
    )
    ON CONFLICT (username) DO UPDATE 
    SET password_hash = crypt('AdminPassword@123', gen_salt('bf', 10)),
        email = EXCLUDED.email;

    INSERT INTO profiles (user_id, display_name, avatar, grade, school, bio)
    VALUES (
      'usr-admin-master',
      'Tổng Quản Trị Hệ Thống',
      '/assets/heroes/warrior_card.png',
      0,
      'Học Viện Trung Tâm EduQuest',
      'Quản trị viên cấp cao, toàn quyền giám sát hệ thống và dữ liệu.'
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET display_name = EXCLUDED.display_name;

    -- 2. TÀI KHOẢN GIÁO VIÊN (TEACHER)
    INSERT INTO users (id, email, username, password_hash, role, status)
    VALUES (
      'usr-teacher-mai',
      'cogiao.mai@eduquest.vn',
      'cogaomai',
      crypt('TeacherPass@123', gen_salt('bf', 10)),
      'teacher',
      'active'
    )
    ON CONFLICT (username) DO UPDATE 
    SET password_hash = crypt('TeacherPass@123', gen_salt('bf', 10)),
        email = EXCLUDED.email;

    INSERT INTO profiles (user_id, display_name, avatar, grade, school, bio)
    VALUES (
      'usr-teacher-mai',
      'Cô Giáo Mai Anh',
      '/assets/heroes/mage_card.png',
      5,
      'Trường Tiểu Học Ngôi Sao Sáng',
      'Giáo viên phụ trách môn Toán & Phiêu lưu tư duy khối 5.'
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET display_name = EXCLUDED.display_name;

    -- Tạo 1 lớp học mẫu cho cô Mai Anh
    INSERT INTO classes (id, name, grade, teacher_id, code, description)
    VALUES (
      'cls-5a1-star',
      'Lớp 5A1 - Đại Hiệp Nhí',
      5,
      'usr-teacher-mai',
      'L5A1-VIP',
      'Lớp học phiêu lưu dành cho các học sĩ dũng cảm.'
    )
    ON CONFLICT (code) DO UPDATE 
    SET name = EXCLUDED.name;

    -- 3. TÀI KHOẢN HỌC SINH (STUDENT)
    INSERT INTO users (id, email, username, password_hash, role, status)
    VALUES (
      'usr-student-nam',
      'hiepsi.nam@eduquest.vn',
      'hiepsi_nam',
      crypt('StudentPass@123', gen_salt('bf', 10)),
      'student',
      'active'
    )
    ON CONFLICT (username) DO UPDATE 
    SET password_hash = crypt('StudentPass@123', gen_salt('bf', 10)),
        email = EXCLUDED.email;

    INSERT INTO profiles (user_id, display_name, avatar, grade, school, bio)
    VALUES (
      'usr-student-nam',
      'Hiệp Sĩ Nam Phong',
      '/assets/heroes/archer_card.png',
      5,
      'Trường Tiểu Học Ngôi Sao Sáng',
      'Cung thủ thiện xạ luôn sẵn sàng chinh phục mọi quái vật tri thức!'
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET display_name = EXCLUDED.display_name;

    -- Tạo nhân vật Cung Thủ (Archer) cấp 8
    INSERT INTO player_characters (user_id, name, hero_class, level, exp, max_exp, active_pet_id, unlocked_pets, current_stage, unlocked_stages)
    VALUES (
      'usr-student-nam',
      'Hiệp Sĩ Nam Phong',
      'archer',
      8,
      450,
      800,
      'pet-fox',
      '["pet-fox", "pet-dragon"]'::jsonb,
      6,
      6
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET level = EXCLUDED.level, hero_class = EXCLUDED.hero_class;

    -- Chỉ số chiến đấu (Stats)
    INSERT INTO player_stats (user_id, hp, max_hp, mp, max_mp, atk, def, spd)
    VALUES (
      'usr-student-nam',
      210, 210, 80, 100, 65, 38, 42
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET hp = EXCLUDED.hp, atk = EXCLUDED.atk, spd = EXCLUDED.spd;

    -- Ví tiền học sinh (Wallet)
    INSERT INTO player_wallets (user_id, gold, gems)
    VALUES (
      'usr-student-nam',
      1500,
      80
    )
    ON CONFLICT (user_id) DO UPDATE 
    SET gold = EXCLUDED.gold, gems = EXCLUDED.gems;

    -- Thú cưng đồng hành (Pets)
    INSERT INTO player_pets (user_id, pet_id, level, evolution_stage)
    VALUES 
      ('usr-student-nam', 'pet-fox', 2, 1),
      ('usr-student-nam', 'pet-dragon', 1, 1)
    ON CONFLICT (user_id, pet_id) DO NOTHING;

    -- Kỹ năng học sinh sở hữu (Skills)
    INSERT INTO player_skills (user_id, skill_id, level, is_active)
    VALUES 
      ('usr-student-nam', 'mua_ten', 2, TRUE),
      ('usr-student-nam', 'song_kiem', 1, TRUE)
    ON CONFLICT (user_id, skill_id) DO NOTHING;

    -- Trang bị trong túi đồ (Inventory)
    INSERT INTO player_inventory (id, user_id, item_id, count, is_equipped, slot)
    VALUES 
      ('inv-nam-bow', 'usr-student-nam', 'item_bow_ranger', 1, TRUE, 'weapon'),
      ('inv-nam-armor', 'usr-student-nam', 'item_armor_iron', 1, TRUE, 'armor'),
      ('inv-nam-pot', 'usr-student-nam', 'item_potion_hp', 5, FALSE, NULL)
    ON CONFLICT (id) DO NOTHING;

    -- Thêm học sinh Nam vào Lớp 5A1
    INSERT INTO class_members (class_id, student_id)
    VALUES ('cls-5a1-star', 'usr-student-nam')
    ON CONFLICT (class_id, student_id) DO NOTHING;
  `;

  await pool.query(sqlPostgres);
  console.log('✓ Đã nạp thành công 3 tài khoản vào PostgreSQL!');

  console.log('\n--- 2. INSERT ĐỒNG BỘ VÀO SQLITE (DATA/EDUQUEST.DB) ---');
  const dbPath = path.join(__dirname, '..', 'data', 'eduquest.db');
  if (fs.existsSync(dbPath)) {
    const sqliteDb = new DatabaseSync(dbPath);
    sqliteDb.exec('PRAGMA foreign_keys = OFF;');

    const hashAdmin = bcrypt.hashSync('AdminPassword@123', 10);
    const hashTeacher = bcrypt.hashSync('TeacherPass@123', 10);
    const hashStudent = bcrypt.hashSync('StudentPass@123', 10);

    // Users
    const insertUser = sqliteDb.prepare(`
      INSERT OR REPLACE INTO users (id, email, username, password_hash, role, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
    insertUser.run('usr-admin-master', 'admin.master@eduquest.vn', 'admin_master', hashAdmin, 'admin');
    insertUser.run('usr-teacher-mai', 'cogiao.mai@eduquest.vn', 'cogaomai', hashTeacher, 'teacher');
    insertUser.run('usr-student-nam', 'hiepsi.nam@eduquest.vn', 'hiepsi_nam', hashStudent, 'student');

    // Profiles
    const insertProfile = sqliteDb.prepare(`
      INSERT OR REPLACE INTO profiles (user_id, display_name, avatar, grade, school)
      VALUES (?, ?, ?, ?, ?)
    `);
    insertProfile.run('usr-admin-master', 'Tổng Quản Trị Hệ Thống', '/assets/heroes/warrior_card.png', 0, 'Học Viện Trung Tâm EduQuest');
    insertProfile.run('usr-teacher-mai', 'Cô Giáo Mai Anh', '/assets/heroes/mage_card.png', 5, 'Trường Tiểu Học Ngôi Sao Sáng');
    insertProfile.run('usr-student-nam', 'Hiệp Sĩ Nam Phong', '/assets/heroes/archer_card.png', 5, 'Trường Tiểu Học Ngôi Sao Sáng');

    // Player characters
    const insertChar = sqliteDb.prepare(`
      INSERT OR REPLACE INTO player_characters (user_id, name, hero_class, level, exp, max_exp, active_pet_id, unlocked_pets_json, current_stage, unlocked_stages)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertChar.run('usr-student-nam', 'Hiệp Sĩ Nam Phong', 'archer', 8, 450, 800, 'pet-fox', '["pet-fox","pet-dragon"]', 6, 6);

    // Player stats
    const insertStats = sqliteDb.prepare(`
      INSERT OR REPLACE INTO player_stats (user_id, hp, max_hp, mp, max_mp, atk, def, spd)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertStats.run('usr-student-nam', 210, 210, 80, 100, 65, 38, 42);

    // Player wallets
    const insertWallet = sqliteDb.prepare(`
      INSERT OR REPLACE INTO player_wallets (user_id, gold, gems)
      VALUES (?, ?, ?)
    `);
    insertWallet.run('usr-student-nam', 1500, 80);

    sqliteDb.exec('PRAGMA foreign_keys = ON;');
    console.log('✓ Đã đồng bộ thành công 3 tài khoản vào SQLite!');
  }

  // In ra bảng xác nhận từ PostgreSQL
  const checkPg = await pool.query(`
    SELECT u.id, u.username, u.email, u.role, p.display_name,
           c.hero_class, c.level, w.gold, w.gems
    FROM users u
    LEFT JOIN profiles p ON u.id = p.user_id
    LEFT JOIN player_characters c ON u.id = c.user_id
    LEFT JOIN player_wallets w ON u.id = w.user_id
    WHERE u.id IN ('usr-admin-master', 'usr-teacher-mai', 'usr-student-nam')
  `);
  console.log('\n--- 3. KẾT QUẢ TRUY VẤN XÁC MINH TRÊN POSTGRESQL ---');
  console.table(checkPg.rows);

  await pool.end();
}

createAccounts().catch(err => {
  console.error('Lỗi khởi tạo tài khoản:', err);
  process.exit(1);
});
