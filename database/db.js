const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'eduquest.db');
const db = new DatabaseSync(dbPath);

// Enable WAL mode and foreign keys for high performance and integrity
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

// Initialize Tables
function initDatabase() {
  db.exec(`
    -- 1. USERS & AUTHENTICATION
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'teacher', 'student')),
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'locked', 'suspended')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS profiles (
      user_id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL,
      avatar TEXT,
      bio TEXT,
      grade INTEGER DEFAULT 5,
      school TEXT DEFAULT 'Học Viện EduQuest',
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 2. PLAYER CHARACTERS & STATS
    CREATE TABLE IF NOT EXISTS player_characters (
      user_id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      hero_class TEXT NOT NULL CHECK(hero_class IN ('warrior', 'mage', 'archer')),
      level INTEGER NOT NULL DEFAULT 1,
      exp INTEGER NOT NULL DEFAULT 0,
      max_exp INTEGER NOT NULL DEFAULT 100,
      active_pet_id TEXT DEFAULT 'pet-dragon',
      unlocked_pets_json TEXT DEFAULT '["pet-dragon"]',
      current_stage INTEGER DEFAULT 1,
      unlocked_stages INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS player_stats (
      user_id TEXT PRIMARY KEY,
      hp INTEGER NOT NULL,
      max_hp INTEGER NOT NULL,
      mp INTEGER NOT NULL DEFAULT 50,
      max_mp INTEGER NOT NULL DEFAULT 100,
      atk INTEGER NOT NULL,
      def INTEGER NOT NULL,
      spd INTEGER NOT NULL,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. WALLETS & TRANSACTIONS
    CREATE TABLE IF NOT EXISTS player_wallets (
      user_id TEXT PRIMARY KEY,
      gold INTEGER NOT NULL DEFAULT 200,
      gems INTEGER NOT NULL DEFAULT 10,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'gold',
      type TEXT NOT NULL, -- 'reward', 'purchase', 'admin_adjustment', 'quest'
      description TEXT NOT NULL,
      reference_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 4. ITEM CATALOG & INVENTORY
    CREATE TABLE IF NOT EXISTS item_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('weapon', 'armor', 'accessory', 'potion')),
      cost INTEGER NOT NULL,
      icon TEXT NOT NULL,
      description TEXT NOT NULL,
      rarity TEXT NOT NULL DEFAULT 'common',
      stats_json TEXT NOT NULL DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS player_inventory (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      item_id TEXT NOT NULL,
      count INTEGER NOT NULL DEFAULT 1,
      is_equipped INTEGER NOT NULL DEFAULT 0,
      slot TEXT,
      acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(item_id) REFERENCES item_catalog(id)
    );

    -- 5. SKILL CATALOG & PLAYER SKILLS
    CREATE TABLE IF NOT EXISTS skill_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      rarity TEXT NOT NULL DEFAULT 'common',
      icon TEXT NOT NULL,
      mp_cost INTEGER NOT NULL DEFAULT 20,
      tags_json TEXT DEFAULT '[]',
      levels_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_skills (
      user_id TEXT NOT NULL,
      skill_id TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      is_active INTEGER NOT NULL DEFAULT 1,
      unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, skill_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(skill_id) REFERENCES skill_catalog(id)
    );

    -- 6. PET CATALOG & PLAYER PETS
    CREATE TABLE IF NOT EXISTS pet_catalog (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      element TEXT NOT NULL,
      image TEXT NOT NULL,
      buff_text TEXT NOT NULL,
      desc TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS player_pets (
      user_id TEXT NOT NULL,
      pet_id TEXT NOT NULL,
      level INTEGER NOT NULL DEFAULT 1,
      evolution_stage INTEGER NOT NULL DEFAULT 1,
      acquired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(user_id, pet_id),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(pet_id) REFERENCES pet_catalog(id)
    );

    -- 7. CLASSES & ASSIGNMENTS
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      grade INTEGER NOT NULL DEFAULT 5,
      teacher_id TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS class_members (
      class_id TEXT NOT NULL,
      student_id TEXT NOT NULL,
      joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(class_id, student_id),
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(student_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      class_id TEXT NOT NULL,
      set_id TEXT NOT NULL,
      teacher_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date DATETIME,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(class_id) REFERENCES classes(id) ON DELETE CASCADE,
      FOREIGN KEY(teacher_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 8. LEARNING SESSIONS & ATTEMPTS
    CREATE TABLE IF NOT EXISTS learning_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      set_id TEXT NOT NULL,
      assignment_id TEXT,
      score INTEGER NOT NULL DEFAULT 0,
      total_questions INTEGER NOT NULL DEFAULT 30,
      correct_count INTEGER NOT NULL DEFAULT 0,
      wrong_count INTEGER NOT NULL DEFAULT 0,
      gold_earned INTEGER NOT NULL DEFAULT 0,
      exp_earned INTEGER NOT NULL DEFAULT 0,
      duration_seconds INTEGER DEFAULT 0,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS question_attempts (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      q_index INTEGER NOT NULL,
      question TEXT NOT NULL,
      chosen_answer TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      is_correct INTEGER NOT NULL,
      used_hint INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES learning_sessions(id) ON DELETE CASCADE,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 9. ADVENTURE RUNS & MILESTONE REWARDS (ANTI-EXPLOIT)
    CREATE TABLE IF NOT EXISTS adventure_runs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      set_id TEXT NOT NULL,
      mode TEXT NOT NULL, -- 'journey_30' | 'world_map'
      status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'abandoned'
      current_q_index INTEGER NOT NULL DEFAULT 0,
      hero_hp INTEGER NOT NULL,
      hero_mp INTEGER NOT NULL,
      checkpoint_data_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rewards_claimed (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      run_id TEXT NOT NULL,
      milestone INTEGER NOT NULL, -- e.g. 5, 10, 15, 20, 25, 30
      reward_type TEXT NOT NULL,
      reward_value_json TEXT,
      claimed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, run_id, milestone),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 10. AUDIT LOGS FOR ADMIN & TEACHERS
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      details_json TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );
  `);

  seedCatalogs();
  seedInitialUsers();
}

// Seed Item, Skill, and Pet Catalogs
function seedCatalogs() {
  // 1. ITEMS
  const items = [
    { id: 'item_sword_basic', name: 'Kiếm Sắt Tân Binh', type: 'weapon', cost: 150, icon: '/assets/items/sword.png', description: 'Kiếm rèn cho dũng sĩ mới nhập môn. Tăng +15 ATK.', rarity: 'common', stats_json: JSON.stringify({ atk: 15 }) },
    { id: 'item_sword_flame', name: 'Kiếm Hỏa Long', type: 'weapon', cost: 450, icon: '/assets/skills/skill_flame_sword.jpg', description: 'Kiếm tôi luyện từ vảy rồng lửa. Tăng +35 ATK và +5% chí mạng.', rarity: 'rare', stats_json: JSON.stringify({ atk: 35, critRate: 0.05 }) },
    { id: 'item_staff_magic', name: 'Trượng Pháp Thuật', type: 'weapon', cost: 200, icon: '/assets/items/mana_crystal.png', description: 'Trượng tụ hội linh khí tự nhiên. Tăng +20 ATK và +25 MP tối đa.', rarity: 'common', stats_json: JSON.stringify({ atk: 20, maxMp: 25 }) },
    { id: 'item_bow_ranger', name: 'Cung Thần Gió', type: 'weapon', cost: 200, icon: '/assets/items/bow.png', description: 'Cung tên nhẹ và chuẩn xác. Tăng +20 ATK và +10 SPD.', rarity: 'common', stats_json: JSON.stringify({ atk: 20, spd: 10 }) },
    { id: 'item_armor_iron', name: 'Giáp Bạc Hiệp Sĩ', type: 'armor', cost: 250, icon: '/assets/items/shield.png', description: 'Áo giáp bằng hợp kim bạc nhẹ. Tăng +20 DEF và +60 HP.', rarity: 'common', stats_json: JSON.stringify({ def: 20, maxHp: 60 }) },
    { id: 'item_shield_knowledge', name: 'Khiên Tri Thức Thần Thánh', type: 'armor', cost: 500, icon: '/assets/skills/skill_knowledge_shield.png', description: 'Lá chắn hộ thể tạo từ ánh sáng chân lý. Tăng +35 DEF và +100 HP.', rarity: 'epic', stats_json: JSON.stringify({ def: 35, maxHp: 100 }) },
    { id: 'item_potion_hp', name: 'Bình Máu Nhỏ', type: 'potion', cost: 50, icon: '/assets/items/potion_hp.png', description: 'Hồi phục ngay lập tức 50 HP.', rarity: 'common', stats_json: JSON.stringify({ healHp: 50 }) },
    { id: 'item_potion_mp', name: 'Bình Năng Lượng MP', type: 'potion', cost: 60, icon: '/assets/items/potion_mp.png', description: 'Hồi phục ngay lập tức 40 MP.', rarity: 'common', stats_json: JSON.stringify({ healMp: 40 }) }
  ];

  const checkItem = db.prepare('SELECT id FROM item_catalog WHERE id = ?');
  const insertItem = db.prepare('INSERT INTO item_catalog (id, name, type, cost, icon, description, rarity, stats_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  items.forEach(it => {
    if (!checkItem.get(it.id)) {
      insertItem.run(it.id, it.name, it.type, it.cost, it.icon, it.description, it.rarity, it.stats_json);
    }
  });

  // 2. SKILLS (10 Authentic Skills)
  const skills = [
    {
      id: 'song_kiem',
      name: 'Song Kiếm',
      type: 'active',
      rarity: 'rare',
      icon: '/assets/skills/skill_flame_sword.jpg',
      mp_cost: 20,
      tags_json: JSON.stringify(['Tấn công liên hoàn', 'Chém 2 lần']),
      levels_json: JSON.stringify([
        { level: 1, multiplier: 1.5, desc: 'Tung 2 đòn chém liên tiếp khi trả lời đúng. Tổng sát thương bằng 150% đòn thường.' },
        { level: 2, multiplier: 1.75, desc: 'Tung 2 đòn chém dũng mãnh. Tổng sát thương tăng lên 175% đòn thường.' },
        { level: 3, multiplier: 2.0, desc: 'Song kiếm cuồng phong bão lửa. Tổng sát thương đạt cực đại 200%!' }
      ])
    },
    {
      id: 'khien_tri_thuc',
      name: 'Khiên Tri Thức',
      type: 'active_buff',
      rarity: 'rare',
      icon: '/assets/skills/skill_knowledge_shield.png',
      mp_cost: 25,
      tags_json: JSON.stringify(['Bảo hộ', 'Chặn phản công']),
      levels_json: JSON.stringify([
        { level: 1, desc: 'Tạo vòng bảo vệ màu xanh quanh người. Chặn hoàn toàn 1 lần quái phản công khi trả lời sai.' },
        { level: 2, desc: 'Khiên dày hơn. Chặn 1 lần quái phản công và phản lại 30 sát thương sấm sét lên quái.' },
        { level: 3, desc: 'Khiên thần thoại. Có thể chặn tới 2 lần quái phản công trong suốt hành trình.' }
      ])
    },
    {
      id: 'hoa_cau',
      name: 'Hỏa Cầu',
      type: 'active',
      rarity: 'common',
      icon: '/assets/items/mana_crystal.png',
      mp_cost: 20,
      tags_json: JSON.stringify(['Phép lửa', 'Nổ diện rộng']),
      levels_json: JSON.stringify([
        { level: 1, bonusDmg: 45, desc: 'Phóng quả cầu lửa phát nổ, gây thêm +45 sát thương lửa khi trả lời đúng.' },
        { level: 2, bonusDmg: 70, desc: 'Hỏa cầu rực cháy, gây thêm +70 sát thương lửa và hồi phục 10 MP.' },
        { level: 3, bonusDmg: 100, desc: 'Đại Hỏa Cầu thiêu đốt, gây thêm +100 sát thương chí mạng.' }
      ])
    },
    {
      id: 'mua_ten',
      name: 'Mưa Tên',
      type: 'active',
      rarity: 'common',
      icon: '/assets/items/bow.png',
      mp_cost: 20,
      tags_json: JSON.stringify(['Xạ thủ', 'Bắn 3 mũi tên']),
      levels_json: JSON.stringify([
        { level: 1, multiplier: 1.6, desc: 'Bắn liên tiếp 3 mũi tên xuyên phá. Tổng sát thương đạt 160% đòn đánh thường.' },
        { level: 2, multiplier: 1.85, desc: '3 mũi tên tẩm độc phát sáng. Tổng sát thương đạt 185% đòn đánh thường.' },
        { level: 3, multiplier: 2.1, desc: 'Mưa tên ánh sáng cuồng phong. Tổng sát thương xuyên giáp đạt 210%!' }
      ])
    },
    {
      id: 'bang_gia',
      name: 'Băng Giá',
      type: 'active',
      rarity: 'epic',
      icon: '/assets/skills/skill_frost.jpg',
      mp_cost: 25,
      tags_json: JSON.stringify(['Khống chế', 'Đóng băng quái']),
      levels_json: JSON.stringify([
        { level: 1, desc: 'Đóng băng quái vật trong lượt kế tiếp. Quái vật bị đóng băng KHÔNG THỂ phản công nếu bạn trả lời sai!' },
        { level: 2, desc: 'Đóng băng quái 1 lượt và gây thêm +35 sát thương băng tuyết buốt giá.' },
        { level: 3, desc: 'Đóng băng vĩnh cửu. Đóng băng quái và tăng 25% sát thương mọi đòn đánh lên quái khi bị đóng băng.' }
      ])
    },
    {
      id: 'hoi_phuc',
      name: 'Hồi Phục',
      type: 'support',
      rarity: 'common',
      icon: '/assets/items/potion_hp.png',
      mp_cost: 30,
      tags_json: JSON.stringify(['Hồi máu', 'Trị liệu']),
      levels_json: JSON.stringify([
        { level: 1, healPercent: 0.20, desc: 'Kích hoạt lập tức hồi phục 20% HP tối đa của nhân vật.' },
        { level: 2, healPercent: 0.30, desc: 'Kích hoạt lập tức hồi phục 30% HP tối đa của nhân vật.' },
        { level: 3, healPercent: 0.45, desc: 'Ánh Sáng Thánh: Hồi phục 45% HP tối đa của nhân vật.' }
      ])
    },
    {
      id: 'nhin_thau',
      name: 'Nhìn Thấu (50:50)',
      type: 'utility',
      rarity: 'rare',
      icon: '/assets/items/quest_scroll.png',
      mp_cost: 0,
      tags_json: JSON.stringify(['Trợ giúp học tập', 'Loại 2 đáp án sai']),
      levels_json: JSON.stringify([
        { level: 1, charges: 3, desc: 'Loại trừ ngay 2 đáp án sai ngẫu nhiên trong câu hỏi 4 lựa chọn (3 lượt/hành trình).' },
        { level: 2, charges: 5, desc: 'Tăng lên 5 lượt Nhìn Thấu trong suốt hành trình.' },
        { level: 3, charges: 7, desc: 'Thấu Kính Thần Thoại: Tăng lên 7 lượt Nhìn Thấu.' }
      ])
    },
    {
      id: 'sam_set',
      name: 'Sấm Sét',
      type: 'active',
      rarity: 'rare',
      icon: '/assets/skills/skill_lightning.png',
      mp_cost: 25,
      tags_json: JSON.stringify(['Lôi phạt', 'Sát thương cực lớn']),
      levels_json: JSON.stringify([
        { level: 1, bonusDmg: 55, desc: 'Triệu hồi tia sét từ trời giáng xuống quái, gây thêm +55 sát thương sấm sét.' },
        { level: 2, bonusDmg: 80, desc: 'Lôi đình vạn trượng, gây thêm +80 sát thương và tăng 15% tỷ lệ chí mạng câu tiếp theo.' },
        { level: 3, bonusDmg: 110, desc: 'Thiên Lôi Thần Phạt, gây thêm +110 sát thương và làm choáng quái vật.' }
      ])
    },
    {
      id: 'phuong_hoang',
      name: 'Phượng Hoàng Hộ Mệnh',
      type: 'passive_rare',
      rarity: 'legendary',
      icon: '/assets/items/medal.png',
      mp_cost: 0,
      tags_json: JSON.stringify(['Hồi sinh', 'Nội tại huyền thoại']),
      levels_json: JSON.stringify([
        { level: 1, desc: 'Khi HP chạm 0 lần đầu tiên trong hành trình, Phượng Hoàng hồi sinh bạn với 25% HP và tiếp tục chiến đấu!' },
        { level: 2, desc: 'Hồi sinh với 40% HP và tự động tạo 1 Khiên Tri Thức bảo vệ.' },
        { level: 3, desc: 'Hồi sinh với 60% HP, đầy 100% MP và phản lại 60 sát thương thiêu đốt lên quái.' }
      ])
    },
    {
      id: 'thu_cung_ho_tro',
      name: 'Thú Cưng Hỗ Trợ',
      type: 'passive',
      rarity: 'rare',
      icon: '/assets/pets/pet_fox.png',
      mp_cost: 0,
      tags_json: JSON.stringify(['Đồng hành', 'Tấn công bổ trợ']),
      levels_json: JSON.stringify([
        { level: 1, desc: 'Cứ sau mỗi 3 câu trả lời đúng, thú cưng đồng hành sẽ lao lên tấn công hoặc buff năng lượng hỗ trợ bạn!' },
        { level: 2, desc: 'Kích hoạt sau mỗi 2 câu trả lời đúng và tăng 30% hiệu ứng hỗ trợ của thú cưng.' },
        { level: 3, desc: 'Thú cưng tiến hóa thần thoại: Mỗi 2 câu đúng tung tuyệt kỹ gây 50 sát thương + hồi 20 MP.' }
      ])
    }
  ];

  const checkSkill = db.prepare('SELECT id FROM skill_catalog WHERE id = ?');
  const insertSkill = db.prepare('INSERT INTO skill_catalog (id, name, type, rarity, icon, mp_cost, tags_json, levels_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');

  skills.forEach(sk => {
    if (!checkSkill.get(sk.id)) {
      insertSkill.run(sk.id, sk.name, sk.type, sk.rarity, sk.icon, sk.mp_cost, sk.tags_json, sk.levels_json);
    }
  });

  // 3. PETS
  const pets = [
    { id: 'pet-dragon', name: 'Long Con Thần Bí', element: 'Hỏa Long', image: '/assets/pets/pet_dragon.png', buff_text: '+10% Sát thương đòn đánh', desc: 'Tăng 10% sát thương đòn đánh. Khi hỗ trợ: Phun lửa gây thêm 35 sát thương.' },
    { id: 'pet-fox', name: 'Cáo Lửa Tinh Nhanh', element: 'Hỏa Linh', image: '/assets/pets/pet_fox.png', buff_text: '+25 MP khi kích hoạt hỗ trợ', desc: 'Tăng năng lượng kỹ năng sau chuỗi combo. Khi hỗ trợ: Hồi ngay +25 MP!' },
    { id: 'pet-cat', name: 'Mèo Phù Thủy Cổ Xưa', element: 'Bí Thuật', image: '/assets/pets/pet_cat.png', buff_text: 'Tự động làm mờ 1 đáp án sai', desc: 'Hỗ trợ phép thuật và gợi ý học tập. Khi hỗ trợ: Tự động loại bỏ 1 đáp án sai ngẫu nhiên!' },
    { id: 'pet-wolf', name: 'Sói Tuyết Băng Giá', element: 'Băng Tuyết', image: '/assets/pets/pet_wolf.png', buff_text: 'Giảm 25% sát thương quái đánh', desc: 'Tạo lá chắn băng giá. Khi hỗ trợ: Giảm 25% sát thương đòn đánh tiếp theo của quái.' }
  ];

  const checkPet = db.prepare('SELECT id FROM pet_catalog WHERE id = ?');
  const insertPet = db.prepare('INSERT INTO pet_catalog (id, name, element, image, buff_text, desc) VALUES (?, ?, ?, ?, ?, ?)');

  pets.forEach(p => {
    if (!checkPet.get(p.id)) {
      insertPet.run(p.id, p.name, p.element, p.image, p.buff_text, p.desc);
    }
  });
}

// Seed Demo Users (Admin, Teacher, Student A, Student B)
function seedInitialUsers() {
  const checkUser = db.prepare('SELECT id FROM users WHERE email = ?');

  const demoAccounts = [
    {
      id: 'usr-admin-01',
      email: 'admin@eduquest.edu.vn',
      username: 'admin',
      password: 'Admin@123456',
      role: 'admin',
      displayName: 'Tổng Quản Trị EduQuest'
    },
    {
      id: 'usr-teacher-01',
      email: 'teacher@eduquest.edu.vn',
      username: 'thaygiaoviet',
      password: 'Teacher@123456',
      role: 'teacher',
      displayName: 'Thầy Giáo Nguyễn Văn Việt'
    },
    {
      id: 'usr-student-a',
      email: 'studentA@eduquest.edu.vn',
      username: 'hocsinh_a',
      password: 'StudentA@123456',
      role: 'student',
      displayName: 'Dũng Sĩ Minh Quân (Học Sinh A)',
      heroClass: 'warrior',
      gold: 2000,
      level: 15,
      skillId: 'song_kiem',
      skillLevel: 3,
      weaponId: 'item_sword_flame'
    },
    {
      id: 'usr-student-b',
      email: 'studentB@eduquest.edu.vn',
      username: 'hocsinh_b',
      password: 'StudentB@123456',
      role: 'student',
      displayName: 'Phù Thủy Bảo Châu (Học Sinh B)',
      heroClass: 'mage',
      gold: 500,
      level: 4,
      skillId: 'hoa_cau',
      skillLevel: 1,
      weaponId: 'item_staff_magic'
    }
  ];

  demoAccounts.forEach(acc => {
    const existing = checkUser.get(acc.email);
    if (!existing) {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(acc.password, salt);

      // Insert User
      db.prepare(`
        INSERT INTO users (id, email, username, password_hash, role, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(acc.id, acc.email, acc.username, hash, acc.role);

      // Insert Profile
      db.prepare(`
        INSERT INTO profiles (user_id, display_name, avatar, grade, school)
        VALUES (?, ?, ?, 5, 'Học Viện Phiêu Lưu EduQuest')
      `).run(acc.id, acc.displayName, acc.heroClass === 'mage' ? '/assets/heroes/mage_card.png' : '/assets/heroes/warrior_card.png');

      // If Student, create their independent game character, stats, wallet, inventory, skills
      if (acc.role === 'student') {
        initStudentProfile(acc);
      }
    }
  });
}

function initStudentProfile(acc) {
  const hp = acc.heroClass === 'warrior' ? 120 : (acc.heroClass === 'mage' ? 80 : 95);
  const atk = acc.heroClass === 'warrior' ? 25 : (acc.heroClass === 'mage' ? 35 : 30);
  const def = acc.heroClass === 'warrior' ? 18 : (acc.heroClass === 'mage' ? 8 : 12);
  const spd = acc.heroClass === 'warrior' ? 10 : (acc.heroClass === 'mage' ? 12 : 18);

  // Character
  db.prepare(`
    INSERT INTO player_characters (user_id, name, hero_class, level, exp, max_exp, active_pet_id, unlocked_pets_json, current_stage, unlocked_stages)
    VALUES (?, ?, ?, ?, ?, ?, 'pet-dragon', '["pet-dragon"]', ?, ?)
  `).run(acc.id, acc.displayName, acc.heroClass, acc.level, 50, acc.level * 100, Math.min(10, acc.level), Math.min(10, acc.level));

  // Stats
  db.prepare(`
    INSERT INTO player_stats (user_id, hp, max_hp, mp, max_mp, atk, def, spd)
    VALUES (?, ?, ?, 50, 100, ?, ?, ?)
  `).run(acc.id, hp, hp, atk, def, spd);

  // Wallet
  db.prepare(`
    INSERT INTO player_wallets (user_id, gold, gems)
    VALUES (?, ?, 10)
  `).run(acc.id, acc.gold);

  // Initial Wallet Transaction
  db.prepare(`
    INSERT INTO wallet_transactions (id, user_id, amount, currency, type, description)
    VALUES (?, ?, ?, 'gold', 'reward', 'Khởi tạo tài khoản dũng sĩ')
  `).run(`tx-init-${acc.id}`, acc.id, acc.gold);

  // Skill
  if (acc.skillId) {
    db.prepare(`
      INSERT INTO player_skills (user_id, skill_id, level, is_active)
      VALUES (?, ?, ?, 1)
    `).run(acc.id, acc.skillId, acc.skillLevel || 1);
  }

  // Weapon item
  if (acc.weaponId) {
    db.prepare(`
      INSERT INTO player_inventory (id, user_id, item_id, count, is_equipped, slot)
      VALUES (?, ?, ?, 1, 1, 'weapon')
    `).run(`inv-${acc.id}-${acc.weaponId}`, acc.id, acc.weaponId);
  }

  // Basic starter potion
  db.prepare(`
    INSERT INTO player_inventory (id, user_id, item_id, count, is_equipped, slot)
    VALUES (?, ?, 'item_potion_hp', 3, 0, NULL)
  `).run(`inv-${acc.id}-pot`, acc.id);
}

// Run DB Initialization
initDatabase();

module.exports = {
  db,

  // USER CRUD
  getUserByEmail(email) {
    return db.prepare('SELECT * FROM users WHERE email = ? COLLATE NOCASE').get(email);
  },

  getUserByUsername(username) {
    return db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE').get(username);
  },

  getUserById(id) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  },

  getUserWithProfile(id) {
    return db.prepare(`
      SELECT u.id, u.email, u.username, u.role, u.status, u.created_at,
             p.display_name, p.avatar, p.bio, p.grade, p.school
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      WHERE u.id = ?
    `).get(id);
  },

  createUser({ id, email, username, passwordHash, role = 'student', displayName, grade = 5 }) {
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO users (id, email, username, password_hash, role, status)
        VALUES (?, ?, ?, ?, ?, 'active')
      `).run(id, email, username, passwordHash, role);

      db.prepare(`
        INSERT INTO profiles (user_id, display_name, avatar, grade, school)
        VALUES (?, ?, ?, ?, 'Học Viện Phiêu Lưu EduQuest')
      `).run(id, displayName || username, '/assets/heroes/warrior_card.png', grade);

      // If student, create initial empty character and starter wallet
      if (role === 'student') {
        const starterClass = 'warrior';
        const hp = 100, atk = 25, def = 15, spd = 12;

        db.prepare(`
          INSERT INTO player_characters (user_id, name, hero_class, level, exp, max_exp, active_pet_id, unlocked_pets_json, current_stage, unlocked_stages)
          VALUES (?, ?, ?, 1, 0, 100, 'pet-dragon', '["pet-dragon"]', 1, 1)
        `).run(id, displayName || username, starterClass);

        db.prepare(`
          INSERT INTO player_stats (user_id, hp, max_hp, mp, max_mp, atk, def, spd)
          VALUES (?, ?, ?, 50, 100, ?, ?, ?)
        `).run(id, hp, hp, atk, def, spd);

        db.prepare(`
          INSERT INTO player_wallets (user_id, gold, gems)
          VALUES (?, 200, 10)
        `).run(id);

        db.prepare(`
          INSERT INTO wallet_transactions (id, user_id, amount, currency, type, description)
          VALUES (?, ?, 200, 'gold', 'reward', 'Quà tân thủ nhập môn EduQuest')
        `).run(`tx-welcome-${id}`, id);

        // Starter skill
        db.prepare(`
          INSERT INTO player_skills (user_id, skill_id, level, is_active)
          VALUES (?, 'song_kiem', 1, 1)
        `).run(id);

        // Starter basic potion
        db.prepare(`
          INSERT INTO player_inventory (id, user_id, item_id, count, is_equipped, slot)
          VALUES (?, ?, 'item_potion_hp', 2, 0, NULL)
        `).run(`inv-starter-${id}`, id);
      }

      db.exec('COMMIT;');
      return this.getUserWithProfile(id);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  changePassword(userId, newPasswordHash) {
    return db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newPasswordHash, userId);
  },

  // COMPLETE PLAYER DATA (ISOLATED PER USER)
  getFullPlayerData(userId) {
    const character = db.prepare('SELECT * FROM player_characters WHERE user_id = ?').get(userId);
    if (!character) return null;

    const stats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(userId);
    const wallet = db.prepare('SELECT * FROM player_wallets WHERE user_id = ?').get(userId) || { gold: 0, gems: 0 };
    
    const inventory = db.prepare(`
      SELECT pi.id, pi.item_id, pi.count, pi.is_equipped, pi.slot,
             ic.name, ic.type, ic.cost, ic.icon, ic.description, ic.rarity, ic.stats_json
      FROM player_inventory pi
      JOIN item_catalog ic ON pi.item_id = ic.id
      WHERE pi.user_id = ?
    `).all(userId);

    const skills = db.prepare(`
      SELECT ps.skill_id, ps.level, ps.is_active,
             sc.name, sc.type, sc.rarity, sc.icon, sc.mp_cost, sc.tags_json, sc.levels_json
      FROM player_skills ps
      JOIN skill_catalog sc ON ps.skill_id = sc.id
      WHERE ps.user_id = ?
    `).all(userId);

    const history = db.prepare(`
      SELECT * FROM learning_sessions WHERE user_id = ? ORDER BY completed_at DESC LIMIT 10
    `).all(userId);

    return {
      character: {
        ...character,
        unlocked_pets: JSON.parse(character.unlocked_pets_json || '["pet-dragon"]')
      },
      stats,
      wallet,
      inventory: inventory.map(item => ({
        ...item,
        stats: JSON.parse(item.stats_json || '{}')
      })),
      skills: skills.map(sk => ({
        ...sk,
        tags: JSON.parse(sk.tags_json || '[]'),
        levels: JSON.parse(sk.levels_json || '[]')
      })),
      history
    };
  },

  // ATOMIC SHOP PURCHASE (Prevents duplicate buying, validates server price & wallet)
  buyItemAtomic(userId, itemId) {
    db.exec('BEGIN TRANSACTION;');
    try {
      const item = db.prepare('SELECT * FROM item_catalog WHERE id = ?').get(itemId);
      if (!item) {
        throw new Error('Vật phẩm không tồn tại trong danh mục!');
      }

      const wallet = db.prepare('SELECT gold FROM player_wallets WHERE user_id = ?').get(userId);
      if (!wallet || wallet.gold < item.cost) {
        throw new Error(`Không đủ vàng! Bạn có ${wallet ? wallet.gold : 0} vàng, vật phẩm có giá ${item.cost} vàng.`);
      }

      // Deduct gold
      db.prepare('UPDATE player_wallets SET gold = gold - ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
        .run(item.cost, userId);

      // Record transaction
      const txId = `tx-buy-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      db.prepare(`
        INSERT INTO wallet_transactions (id, user_id, amount, currency, type, description, reference_id)
        VALUES (?, ?, ?, 'gold', 'purchase', ?, ?)
      `).run(txId, userId, -item.cost, `Mua vật phẩm: ${item.name}`, itemId);

      // Check if user already has this item in inventory
      const existing = db.prepare('SELECT * FROM player_inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId);
      if (existing) {
        db.prepare('UPDATE player_inventory SET count = count + 1 WHERE id = ?').run(existing.id);
      } else {
        const invId = `inv-${userId}-${Date.now()}`;
        db.prepare(`
          INSERT INTO player_inventory (id, user_id, item_id, count, is_equipped, slot)
          VALUES (?, ?, ?, 1, 0, NULL)
        `).run(invId, userId, itemId);
      }

      db.exec('COMMIT;');
      return { success: true, item, remainingGold: wallet.gold - item.cost };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  // USE POTION ATOMICALLY
  usePotionAtomic(userId, itemId) {
    db.exec('BEGIN TRANSACTION;');
    try {
      const invItem = db.prepare('SELECT * FROM player_inventory WHERE user_id = ? AND item_id = ?').get(userId, itemId);
      if (!invItem || invItem.count <= 0) {
        throw new Error('Bạn không có dược phẩm này trong túi đồ!');
      }

      const catalogItem = db.prepare('SELECT * FROM item_catalog WHERE id = ?').get(itemId);
      const statsEffect = JSON.parse(catalogItem.stats_json || '{}');

      const currentStats = db.prepare('SELECT * FROM player_stats WHERE user_id = ?').get(userId);
      let newHp = currentStats.hp;
      let newMp = currentStats.mp;

      if (statsEffect.healHp) {
        newHp = Math.min(currentStats.max_hp, currentStats.hp + statsEffect.healHp);
      }
      if (statsEffect.healMp) {
        newMp = Math.min(currentStats.max_mp, currentStats.mp + statsEffect.healMp);
      }

      // Update player stats
      db.prepare('UPDATE player_stats SET hp = ?, mp = ? WHERE user_id = ?').run(newHp, newMp, userId);

      // Deduct 1 count from inventory
      if (invItem.count > 1) {
        db.prepare('UPDATE player_inventory SET count = count - 1 WHERE id = ?').run(invItem.id);
      } else {
        db.prepare('DELETE FROM player_inventory WHERE id = ?').run(invItem.id);
      }

      db.exec('COMMIT;');
      return { success: true, hp: newHp, mp: newMp };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  // CLAIM RUN REWARD ATOMICALLY (Prevents replay / re-claim on reload)
  claimBattleRewardAtomic(userId, runId, milestone, gold, exp, itemName, skillId) {
    db.exec('BEGIN TRANSACTION;');
    try {
      // Check if already claimed
      const claimed = db.prepare('SELECT * FROM rewards_claimed WHERE user_id = ? AND run_id = ? AND milestone = ?')
        .get(userId, runId, milestone);
      if (claimed) {
        db.exec('COMMIT;');
        return { success: false, alreadyClaimed: true, message: 'Phần thưởng mốc này đã được nhận trước đó!' };
      }

      // Record claim
      const claimId = `claim-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      db.prepare(`
        INSERT INTO rewards_claimed (id, user_id, run_id, milestone, reward_type, reward_value_json)
        VALUES (?, ?, ?, ?, 'milestone', ?)
      `).run(claimId, userId, runId, milestone, JSON.stringify({ gold, exp, itemName, skillId }));

      // Add gold
      if (gold > 0) {
        db.prepare('UPDATE player_wallets SET gold = gold + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?')
          .run(gold, userId);
        db.prepare(`
          INSERT INTO wallet_transactions (id, user_id, amount, currency, type, description, reference_id)
          VALUES (?, ?, ?, 'gold', 'reward', ?, ?)
        `).run(`tx-reward-${claimId}`, userId, gold, `Thưởng chiến tích mốc ${milestone} câu`, runId);
      }

      // Add EXP & level up check
      if (exp > 0) {
        const char = db.prepare('SELECT * FROM player_characters WHERE user_id = ?').get(userId);
        let nextExp = char.exp + exp;
        let nextLevel = char.level;
        let nextMaxExp = char.max_exp;

        while (nextExp >= nextMaxExp) {
          nextExp -= nextMaxExp;
          nextLevel += 1;
          nextMaxExp = nextLevel * 100;
        }

        db.prepare(`
          UPDATE player_characters 
          SET level = ?, exp = ?, max_exp = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE user_id = ?
        `).run(nextLevel, nextExp, nextMaxExp, userId);
      }

      // Grant skill if specified
      if (skillId) {
        const existingSkill = db.prepare('SELECT * FROM player_skills WHERE user_id = ? AND skill_id = ?').get(userId, skillId);
        if (existingSkill) {
          db.prepare('UPDATE player_skills SET level = MIN(3, level + 1) WHERE user_id = ? AND skill_id = ?')
            .run(userId, skillId);
        } else {
          db.prepare('INSERT INTO player_skills (user_id, skill_id, level, is_active) VALUES (?, ?, 1, 1)')
            .run(userId, skillId);
        }
      }

      db.exec('COMMIT;');
      return { success: true, alreadyClaimed: false, gold, exp };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  // RECORD LEARNING SESSION
  recordLearningSession(userId, sessionData) {
    db.exec('BEGIN TRANSACTION;');
    try {
      const sessionId = sessionData.id || `session-${Date.now()}`;
      db.prepare(`
        INSERT INTO learning_sessions (id, user_id, set_id, assignment_id, score, total_questions, correct_count, wrong_count, gold_earned, exp_earned, duration_seconds)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        sessionId,
        userId,
        sessionData.setId,
        sessionData.assignmentId || null,
        sessionData.score || 0,
        sessionData.totalQuestions || 30,
        sessionData.correctCount || 0,
        sessionData.wrongCount || 0,
        sessionData.goldEarned || 0,
        sessionData.expEarned || 0,
        sessionData.durationSeconds || 0
      );

      // Insert question attempts
      if (Array.isArray(sessionData.attempts)) {
        const insertAttempt = db.prepare(`
          INSERT INTO question_attempts (id, session_id, user_id, q_index, question, chosen_answer, correct_answer, is_correct, used_hint)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        sessionData.attempts.forEach((att, idx) => {
          const attemptId = `att-${sessionId}-${idx}`;
          insertAttempt.run(
            attemptId,
            sessionId,
            userId,
            att.qIndex || idx,
            att.question || '',
            att.chosenAnswer || '',
            att.correctAnswer || '',
            att.isCorrect ? 1 : 0,
            att.usedHint ? 1 : 0
          );
        });
      }

      db.exec('COMMIT;');
      return { success: true, sessionId };
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  },

  // TEACHER: CLASSES & ASSIGNMENTS
  getTeacherClasses(teacherId) {
    return db.prepare('SELECT * FROM classes WHERE teacher_id = ? ORDER BY created_at DESC').all(teacherId);
  },

  createClass(teacherId, { name, grade, description }) {
    const classId = `class-${Date.now()}`;
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    db.prepare(`
      INSERT INTO classes (id, name, grade, teacher_id, code, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(classId, name, grade || 5, teacherId, code, description || '');
    return db.prepare('SELECT * FROM classes WHERE id = ?').get(classId);
  },

  createAssignment(teacherId, { classId, setId, title, dueDate }) {
    const id = `assign-${Date.now()}`;
    db.prepare(`
      INSERT INTO assignments (id, class_id, set_id, teacher_id, title, due_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, classId, setId, teacherId, title, dueDate || null);
    return db.prepare('SELECT * FROM assignments WHERE id = ?').get(id);
  },

  getAssignmentAnalytics(assignmentId) {
    const assignment = db.prepare('SELECT * FROM assignments WHERE id = ?').get(assignmentId);
    if (!assignment) return null;

    const sessions = db.prepare(`
      SELECT ls.*, p.display_name, u.username
      FROM learning_sessions ls
      JOIN users u ON ls.user_id = u.id
      JOIN profiles p ON ls.user_id = p.user_id
      WHERE ls.assignment_id = ?
      ORDER BY ls.completed_at DESC
    `).all(assignmentId);

    const wrongAttempts = db.prepare(`
      SELECT qa.question, qa.chosen_answer, qa.correct_answer, COUNT(*) as fail_count
      FROM question_attempts qa
      JOIN learning_sessions ls ON qa.session_id = ls.id
      WHERE ls.assignment_id = ? AND qa.is_correct = 0
      GROUP BY qa.question, qa.chosen_answer
      ORDER BY fail_count DESC
      LIMIT 10
    `).all(assignmentId);

    return {
      assignment,
      totalSubmissions: sessions.length,
      averageScore: sessions.length ? Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length) : 0,
      studentSubmissions: sessions,
      commonErrors: wrongAttempts
    };
  },

  // ADMIN OPERATIONS
  getAllUsers() {
    return db.prepare(`
      SELECT u.id, u.email, u.username, u.role, u.status, u.created_at,
             p.display_name, p.grade, p.school,
             pw.gold, pw.gems,
             pc.level, pc.hero_class
      FROM users u
      LEFT JOIN profiles p ON u.id = p.user_id
      LEFT JOIN player_wallets pw ON u.id = pw.user_id
      LEFT JOIN player_characters pc ON u.id = pc.user_id
      ORDER BY u.created_at DESC
    `).all();
  },

  updateUserRole(adminUserId, targetUserId, newRole) {
    if (!['admin', 'teacher', 'student'].includes(newRole)) {
      throw new Error('Vai trò không hợp lệ!');
    }
    db.prepare('UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newRole, targetUserId);
    
    // Log audit
    const logId = `audit-${Date.now()}`;
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json)
      VALUES (?, ?, 'UPDATE_ROLE', 'user', ?, ?)
    `).run(logId, adminUserId, targetUserId, JSON.stringify({ newRole }));

    return { success: true, targetUserId, newRole };
  },

  updateUserStatus(adminUserId, targetUserId, newStatus) {
    if (!['active', 'locked', 'suspended'].includes(newStatus)) {
      throw new Error('Trạng thái không hợp lệ!');
    }
    db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(newStatus, targetUserId);

    // Log audit
    const logId = `audit-${Date.now()}`;
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, action, target_type, target_id, details_json)
      VALUES (?, ?, 'UPDATE_STATUS', 'user', ?, ?)
    `).run(logId, adminUserId, targetUserId, JSON.stringify({ newStatus }));

    return { success: true, targetUserId, newStatus };
  },

  getSystemStats() {
    const totalUsers = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
    const totalStudents = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student'").get().count;
    const totalTeachers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher'").get().count;
    const totalLearningSessions = db.prepare('SELECT COUNT(*) as count FROM learning_sessions').get().count;
    const totalGoldCirculation = db.prepare('SELECT SUM(gold) as total FROM player_wallets').get().total || 0;

    return {
      totalUsers,
      totalStudents,
      totalTeachers,
      totalLearningSessions,
      totalGoldCirculation
    };
  }
};
