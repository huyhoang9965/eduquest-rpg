-- ==============================================================================
-- 🏰 EDUQUEST: HỌC VIỆN PHIÊU LƯU - CƠ SỞ DỮ LIỆU POSTGRESQL HOÀN CHỈNH
-- Tương thích 100% với pgAdmin 4, PostgreSQL 12+, Supabase, RDS, Docker
-- ==============================================================================

-- Bật các tiện ích mở rộng cần thiết
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- PHẦN 1: TẠO CÁC BẢNG DỮ LIỆU CHÍNH (TABLES & CONSTRAINTS)
-- ==============================================================================

-- 1. BẢNG NGƯỜI DÙNG & XÁC THỰC (USERS)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. HỒ SƠ CÁ NHÂN (PROFILES)
CREATE TABLE IF NOT EXISTS profiles (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(150) NOT NULL,
    avatar TEXT,
    bio TEXT,
    grade INTEGER DEFAULT 5,
    school VARCHAR(255) DEFAULT 'Học Viện Phiêu Lưu EduQuest',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. NHÂN VẬT ANH HÙNG (PLAYER CHARACTERS)
CREATE TABLE IF NOT EXISTS player_characters (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    hero_class VARCHAR(20) NOT NULL CHECK (hero_class IN ('warrior', 'mage', 'archer')),
    level INTEGER NOT NULL DEFAULT 1,
    exp INTEGER NOT NULL DEFAULT 0,
    max_exp INTEGER NOT NULL DEFAULT 100,
    active_pet_id VARCHAR(64) DEFAULT 'pet-dragon',
    unlocked_pets JSONB DEFAULT '["pet-dragon"]'::jsonb,
    current_stage INTEGER DEFAULT 1,
    unlocked_stages INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. CHỈ SỐ CHIẾN ĐẤU CỦA NHÂN VẬT (PLAYER STATS)
CREATE TABLE IF NOT EXISTS player_stats (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    hp INTEGER NOT NULL,
    max_hp INTEGER NOT NULL,
    mp INTEGER NOT NULL DEFAULT 50,
    max_mp INTEGER NOT NULL DEFAULT 100,
    atk INTEGER NOT NULL,
    def INTEGER NOT NULL,
    spd INTEGER NOT NULL
);

-- 5. VÍ VÀNG & KIM CƯƠNG (PLAYER WALLETS)
CREATE TABLE IF NOT EXISTS player_wallets (
    user_id VARCHAR(64) PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    gold INTEGER NOT NULL DEFAULT 200,
    gems INTEGER NOT NULL DEFAULT 10,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. LỊCH SỬ GIAO DỊCH TÀI SẢN (WALLET TRANSACTIONS)
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    currency VARCHAR(20) NOT NULL DEFAULT 'gold' CHECK (currency IN ('gold', 'gems')),
    type VARCHAR(50) NOT NULL, -- 'reward', 'purchase', 'admin_adjustment', 'quest'
    description TEXT NOT NULL,
    reference_id VARCHAR(64),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. DANH MỤC CỬA HÀNG TRANG BỊ & VẬT PHẨM (ITEM CATALOG)
CREATE TABLE IF NOT EXISTS item_catalog (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('weapon', 'armor', 'accessory', 'potion')),
    cost INTEGER NOT NULL,
    icon TEXT NOT NULL,
    description TEXT NOT NULL,
    rarity VARCHAR(30) NOT NULL DEFAULT 'common',
    stats JSONB NOT NULL DEFAULT '{}'::jsonb
);

-- 8. TÚI ĐỒ CÁ NHÂN CỦA HỌC SINH (PLAYER INVENTORY)
CREATE TABLE IF NOT EXISTS player_inventory (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id VARCHAR(64) NOT NULL REFERENCES item_catalog(id) ON DELETE CASCADE,
    count INTEGER NOT NULL DEFAULT 1,
    is_equipped BOOLEAN NOT NULL DEFAULT FALSE,
    slot VARCHAR(30), -- 'weapon', 'armor', 'accessory'
    acquired_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. DANH MỤC 10 KỸ NĂNG RPG (SKILL CATALOG)
CREATE TABLE IF NOT EXISTS skill_catalog (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'active', 'active_buff', 'support', 'utility', 'passive'
    rarity VARCHAR(30) NOT NULL DEFAULT 'common',
    icon TEXT NOT NULL,
    mp_cost INTEGER NOT NULL DEFAULT 20,
    tags JSONB DEFAULT '[]'::jsonb,
    levels JSONB NOT NULL
);

-- 10. KỸ NĂNG HỌC SINH ĐÃ MỞ KHÓA & TRANG BỊ (PLAYER SKILLS)
CREATE TABLE IF NOT EXISTS player_skills (
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    skill_id VARCHAR(64) NOT NULL REFERENCES skill_catalog(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    unlocked_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, skill_id)
);

-- 11. DANH MỤC THÚ CƯNG ĐỒNG HÀNH (PET CATALOG)
CREATE TABLE IF NOT EXISTS pet_catalog (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    element VARCHAR(50) NOT NULL,
    image TEXT NOT NULL,
    buff_text VARCHAR(255) NOT NULL,
    description TEXT NOT NULL
);

-- 12. THÚ CƯNG CỦA HỌC SINH (PLAYER PETS)
CREATE TABLE IF NOT EXISTS player_pets (
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    pet_id VARCHAR(64) NOT NULL REFERENCES pet_catalog(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1,
    evolution_stage INTEGER NOT NULL DEFAULT 1,
    acquired_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(user_id, pet_id)
);

-- 13. LỚP HỌC DO GIÁO VIÊN TẠO (CLASSES)
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    name VARCHAR(150) NOT NULL,
    grade INTEGER NOT NULL DEFAULT 5,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 14. THÀNH VIÊN LỚP HỌC (CLASS MEMBERS)
CREATE TABLE IF NOT EXISTS class_members (
    class_id VARCHAR(64) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY(class_id, student_id)
);

-- 15. BÀI TẬP GIAO CHO LỚP (ASSIGNMENTS)
CREATE TABLE IF NOT EXISTS assignments (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    class_id VARCHAR(64) NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    set_id VARCHAR(64) NOT NULL,
    teacher_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    due_date TIMESTAMPTZ,
    status VARCHAR(30) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 16. BỘ CÂU HỎI TÙY CHỈNH 30 CÂU (CUSTOM QUESTION SETS)
CREATE TABLE IF NOT EXISTS custom_question_sets (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    subject VARCHAR(50) NOT NULL DEFAULT 'math',
    grade INTEGER NOT NULL DEFAULT 5,
    topic VARCHAR(255) NOT NULL DEFAULT 'Chủ đề tổng hợp',
    description TEXT,
    difficulty VARCHAR(30) DEFAULT 'medium',
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    author_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 17. PHIÊN HỌC TẬP & LÀM BÀI HÀNH TRÌNH (LEARNING SESSIONS)
CREATE TABLE IF NOT EXISTS learning_sessions (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    set_id VARCHAR(64) NOT NULL,
    set_title VARCHAR(255),
    mode VARCHAR(50) DEFAULT 'journey_30', -- 'journey_30' | 'world_map'
    assignment_id VARCHAR(64),
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 30,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    accuracy INTEGER NOT NULL DEFAULT 0,
    gold_earned INTEGER NOT NULL DEFAULT 0,
    exp_earned INTEGER NOT NULL DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 18. CHI TIẾT TỪNG CÂU TRẢ LỜI CỦA HỌC SINH (QUESTION ATTEMPTS)
CREATE TABLE IF NOT EXISTS question_attempts (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    session_id VARCHAR(64) NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    q_index INTEGER NOT NULL,
    question TEXT NOT NULL,
    chosen_answer TEXT NOT NULL,
    correct_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    used_hint BOOLEAN DEFAULT FALSE,
    time_spent_seconds INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 19. PHIÊN CHIẾN ĐẤU & TRẠM LƯU TẠM (ADVENTURE RUNS)
CREATE TABLE IF NOT EXISTS adventure_runs (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    set_id VARCHAR(64) NOT NULL,
    mode VARCHAR(50) NOT NULL, -- 'journey_30' | 'world_map'
    status VARCHAR(30) NOT NULL DEFAULT 'active', -- 'active' | 'completed' | 'abandoned'
    current_q_index INTEGER NOT NULL DEFAULT 0,
    hero_hp INTEGER NOT NULL,
    hero_mp INTEGER NOT NULL,
    checkpoint_data JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 20. BẢO MẬT NHẬN THƯỞNG: CHỐNG DUPLICATE / REPLAY EXPLOIT (REWARDS CLAIMED)
CREATE TABLE IF NOT EXISTS rewards_claimed (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    run_id VARCHAR(64) NOT NULL,
    milestone INTEGER NOT NULL, -- mốc 5, 10, 15, 20, 25, 30 hoặc ải 1..10
    reward_type VARCHAR(50) NOT NULL, -- 'gold_exp', 'skill_card', 'chest_item'
    reward_value JSONB,
    claimed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_run_milestone UNIQUE(user_id, run_id, milestone)
);

-- 21. NHẬT KÝ KIỂM TOÁN HỆ THỐNG (AUDIT LOGS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
    user_id VARCHAR(64) REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id VARCHAR(64),
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- PHẦN 2: CHỈ MỤC TỐI ƯU TRUY VẤN (INDEXES)
-- ==============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_inventory_user ON player_inventory(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_user ON player_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_classes_teacher ON classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_class_members_student ON class_members(student_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_set ON learning_sessions(set_id);
CREATE INDEX IF NOT EXISTS idx_attempts_session ON question_attempts(session_id);
CREATE INDEX IF NOT EXISTS idx_attempts_user ON question_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_rewards_user_run ON rewards_claimed(user_id, run_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON wallet_transactions(user_id);

-- ==============================================================================
-- PHẦN 3: NẠP DỮ LIỆU BAN ĐẦU CHUẨN (SEED DATA)
-- ==============================================================================

-- 1. NẠP DANH MỤC TRANG BỊ CỬA HÀNG (ITEM CATALOG)
INSERT INTO item_catalog (id, name, type, cost, icon, description, rarity, stats)
VALUES 
  ('item_sword_basic', 'Kiếm Sắt Tân Binh', 'weapon', 150, '/assets/items/sword.png', 'Kiếm rèn cho dũng sĩ mới nhập môn. Tăng +15 ATK.', 'common', '{"atk": 15}'::jsonb),
  ('item_sword_flame', 'Kiếm Hỏa Long', 'weapon', 450, '/assets/skills/skill_flame_sword.jpg', 'Kiếm tôi luyện từ vảy rồng lửa. Tăng +35 ATK và +5% chí mạng.', 'rare', '{"atk": 35, "critRate": 0.05}'::jsonb),
  ('item_staff_magic', 'Trượng Pháp Thuật', 'weapon', 200, '/assets/items/mana_crystal.png', 'Trượng tụ hội linh khí tự nhiên. Tăng +20 ATK và +25 MP tối đa.', 'common', '{"atk": 20, "maxMp": 25}'::jsonb),
  ('item_bow_ranger', 'Cung Thần Gió', 'weapon', 200, '/assets/items/bow.png', 'Cung tên nhẹ và chuẩn xác. Tăng +20 ATK và +10 SPD.', 'common', '{"atk": 20, "spd": 10}'::jsonb),
  ('item_armor_iron', 'Giáp Bạc Hiệp Sĩ', 'armor', 250, '/assets/items/shield.png', 'Áo giáp bằng hợp kim bạc nhẹ. Tăng +20 DEF và +60 HP.', 'common', '{"def": 20, "maxHp": 60}'::jsonb),
  ('item_shield_knowledge', 'Khiên Tri Thức Thần Thánh', 'armor', 500, '/assets/skills/skill_knowledge_shield.png', 'Lá chắn hộ thể tạo từ ánh sáng chân lý. Tăng +35 DEF và +100 HP.', 'epic', '{"def": 35, "maxHp": 100}'::jsonb),
  ('item_potion_hp', 'Bình Máu Nhỏ', 'potion', 50, '/assets/items/potion_hp.png', 'Hồi phục ngay lập tức 50 HP.', 'common', '{"healHp": 50}'::jsonb),
  ('item_potion_mp', 'Bình Năng Lượng MP', 'potion', 60, '/assets/items/potion_mp.png', 'Hồi phục ngay lập tức 40 MP.', 'common', '{"healMp": 40}'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, cost = EXCLUDED.cost, stats = EXCLUDED.stats;

-- 2. NẠP DANH MỤC 10 KỸ NĂNG RPG (SKILL CATALOG)
INSERT INTO skill_catalog (id, name, type, rarity, icon, mp_cost, tags, levels)
VALUES
  ('song_kiem', 'Song Kiếm', 'active', 'rare', '/assets/skills/skill_flame_sword.jpg', 20, '["Tấn công liên hoàn", "Chém 2 lần"]'::jsonb, 
   '[{"level": 1, "multiplier": 1.5, "desc": "Tung 2 đòn chém liên tiếp khi trả lời đúng. Tổng sát thương bằng 150% đòn thường."}, {"level": 2, "multiplier": 1.75, "desc": "Tung 2 đòn chém dũng mãnh. Tổng sát thương tăng lên 175% đòn thường."}, {"level": 3, "multiplier": 2.0, "desc": "Song kiếm cuồng phong bão lửa. Tổng sát thương đạt cực đại 200%!"}]'::jsonb),

  ('khien_tri_thuc', 'Khiên Tri Thức', 'active_buff', 'rare', '/assets/skills/skill_knowledge_shield.png', 25, '["Bảo hộ", "Chặn phản công"]'::jsonb,
   '[{"level": 1, "desc": "Tạo vòng bảo vệ màu xanh quanh người. Chặn hoàn toàn 1 lần quái phản công khi trả lời sai."}, {"level": 2, "desc": "Khiên dày hơn. Chặn 1 lần quái phản công và phản lại 30 sát thương sấm sét lên quái."}, {"level": 3, "desc": "Khiên thần thoại. Có thể chặn tới 2 lần quái phản công trong suốt hành trình."}]'::jsonb),

  ('hoa_cau', 'Hỏa Cầu', 'active', 'common', '/assets/items/mana_crystal.png', 20, '["Phép lửa", "Nổ diện rộng"]'::jsonb,
   '[{"level": 1, "bonusDmg": 45, "desc": "Phóng quả cầu lửa phát nổ, gây thêm +45 sát thương lửa khi trả lời đúng."}, {"level": 2, "bonusDmg": 70, "desc": "Hỏa cầu rực cháy, gây thêm +70 sát thương lửa và hồi phục 10 MP."}, {"level": 3, "bonusDmg": 100, "desc": "Đại Hỏa Cầu thiêu đốt, gây thêm +100 sát thương chí mạng."}]'::jsonb),

  ('mua_ten', 'Mưa Tên', 'active', 'common', '/assets/items/bow.png', 20, '["Xạ thủ", "Bắn 3 mũi tên"]'::jsonb,
   '[{"level": 1, "multiplier": 1.6, "desc": "Bắn liên tiếp 3 mũi tên xuyên phá. Tổng sát thương đạt 160% đòn đánh thường."}, {"level": 2, "multiplier": 1.85, "desc": "3 mũi tên tẩm độc phát sáng. Tổng sát thương đạt 185% đòn đánh thường."}, {"level": 3, "multiplier": 2.1, "desc": "Mưa tên ánh sáng cuồng phong. Tổng sát thương xuyên giáp đạt 210%!"}]'::jsonb),

  ('bang_gia', 'Băng Giá', 'active', 'epic', '/assets/skills/skill_frost.jpg', 25, '["Khống chế", "Đóng băng quái"]'::jsonb,
   '[{"level": 1, "desc": "Đóng băng quái vật trong lượt kế tiếp. Quái vật bị đóng băng KHÔNG THỂ phản công nếu bạn trả lời sai!"}, {"level": 2, "desc": "Đóng băng quái 1 lượt và gây thêm +35 sát thương băng tuyết buốt giá."}, {"level": 3, "desc": "Đóng băng vĩnh cửu. Đóng băng quái và tăng 25% sát thương mọi đòn đánh lên quái khi bị đóng băng."}]'::jsonb),

  ('hoi_phuc', 'Hồi Phục', 'support', 'common', '/assets/items/potion_hp.png', 30, '["Hồi máu", "Trị liệu"]'::jsonb,
   '[{"level": 1, "healPercent": 0.20, "desc": "Kích hoạt lập tức hồi phục 20% HP tối đa của nhân vật."}, {"level": 2, "healPercent": 0.30, "desc": "Kích hoạt lập tức hồi phục 30% HP tối đa của nhân vật."}, {"level": 3, "healPercent": 0.45, "desc": "Ánh Sáng Thánh: Hồi phục 45% HP tối đa của nhân vật."}]'::jsonb),

  ('nhin_thau', 'Nhìn Thấu (50:50)', 'utility', 'rare', '/assets/items/quest_scroll.png', 0, '["Trợ giúp học tập", "Loại 2 đáp án sai"]'::jsonb,
   '[{"level": 1, "charges": 3, "desc": "Loại trừ ngay 2 đáp án sai ngẫu nhiên trong câu hỏi 4 lựa chọn (3 lượt/hành trình)."}, {"level": 2, "charges": 5, "desc": "Tăng lên 5 lượt Nhìn Thấu trong suốt hành trình."}, {"level": 3, "charges": 7, "desc": "Thấu Kính Thần Thoại: Tăng lên 7 lượt Nhìn Thấu."}]'::jsonb),

  ('sam_set', 'Sấm Sét', 'active', 'rare', '/assets/skills/skill_lightning.png', 25, '["Lôi phạt", "Sát thương cực lớn"]'::jsonb,
   '[{"level": 1, "bonusDmg": 55, "desc": "Triệu hồi tia sét từ trời giáng xuống quái, gây thêm +55 sát thương sấm sét."}, {"level": 2, "bonusDmg": 80, "desc": "Lôi đình vạn trượng, gây thêm +80 sát thương và tăng 15% tỷ lệ chí mạng câu tiếp theo."}, {"level": 3, "bonusDmg": 110, "desc": "Thiên Lôi Thần Phạt, gây thêm +110 sát thương và làm choáng quái vật."}]'::jsonb),

  ('phuong_hoang', 'Phượng Hoàng Hộ Mệnh', 'passive', 'legendary', '/assets/items/medal.png', 0, '["Hồi sinh", "Nội tại huyền thoại"]'::jsonb,
   '[{"level": 1, "desc": "Khi HP chạm 0 lần đầu tiên trong hành trình, Phượng Hoàng hồi sinh bạn với 25% HP và tiếp tục chiến đấu!"}, {"level": 2, "desc": "Hồi sinh với 40% HP và tự động tạo 1 Khiên Tri Thức bảo vệ."}, {"level": 3, "desc": "Hồi sinh với 60% HP, đầy 100% MP và phản lại 60 sát thương thiêu đốt lên quái."}]'::jsonb),

  ('thu_cung_ho_tro', 'Thú Cưng Hỗ Trợ', 'passive', 'rare', '/assets/pets/pet_fox.png', 0, '["Đồng hành", "Tấn công bổ trợ"]'::jsonb,
   '[{"level": 1, "desc": "Cứ sau mỗi 3 câu trả lời đúng, thú cưng đồng hành sẽ lao lên tấn công hoặc buff năng lượng hỗ trợ bạn!"}, {"level": 2, "desc": "Kích hoạt sau mỗi 2 câu trả lời đúng và tăng 30% hiệu ứng hỗ trợ của thú cưng."}, {"level": 3, "desc": "Thú cưng tiến hóa thần thoại: Mỗi 2 câu đúng tung tuyệt kỹ gây 50 sát thương + hồi 20 MP."}]'::jsonb)
ON CONFLICT (id) DO UPDATE 
SET name = EXCLUDED.name, levels = EXCLUDED.levels;

-- 3. NẠP DANH MỤC THÚ CƯNG (PET CATALOG)
INSERT INTO pet_catalog (id, name, element, image, buff_text, description)
VALUES
  ('pet-dragon', 'Long Con Thần Bí', 'Hỏa Long', '/assets/pets/pet_dragon.png', '+10% Sát thương đòn đánh', 'Tăng 10% sát thương đòn đánh. Khi hỗ trợ: Phun lửa gây thêm 35 sát thương.'),
  ('pet-fox', 'Cáo Lửa Tinh Nhanh', 'Hỏa Linh', '/assets/pets/pet_fox.png', '+25 MP khi kích hoạt hỗ trợ', 'Tăng năng lượng kỹ năng sau chuỗi combo. Khi hỗ trợ: Hồi ngay +25 MP!'),
  ('pet-cat', 'Mèo Phù Thủy Cổ Xưa', 'Bí Thuật', '/assets/pets/pet_cat.png', 'Tự động làm mờ 1 đáp án sai', 'Hỗ trợ phép thuật và gợi ý học tập. Khi hỗ trợ: Tự động loại bỏ 1 đáp án sai ngẫu nhiên!'),
  ('pet-wolf', 'Sói Tuyết Băng Giá', 'Băng Tuyết', '/assets/pets/pet_wolf.png', 'Giảm 25% sát thương quái đánh', 'Tạo lá chắn băng giá. Khi hỗ trợ: Giảm 25% sát thương đòn đánh tiếp theo của quái.')
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name, buff_text = EXCLUDED.buff_text;

-- 4. NẠP 4 TÀI KHOẢN MẪU (USERS: ADMIN, TEACHER, STUDENT A, STUDENT B)
-- Mật khẩu tương ứng:
-- admin@eduquest.edu.vn: Admin@123456
-- teacher@eduquest.edu.vn: Teacher@123456
-- studentA@eduquest.edu.vn: StudentA@123456
-- studentB@eduquest.edu.vn: StudentB@123456
INSERT INTO users (id, email, username, password_hash, role, status)
VALUES
  ('usr-admin-01', 'admin@eduquest.edu.vn', 'admin', '$2b$10$S1MOlEsn.6EHBr6gLM9UReS3NbTeAja4ylH2kpF4l8.STcXM/be1W', 'admin', 'active'),
  ('usr-teacher-01', 'teacher@eduquest.edu.vn', 'thaygiaoviet', '$2b$10$92X9uz1PibGiUBKQ2WrGSeWuCGxgMOSBY95Qq2its4ZYOgyZOnGWO', 'teacher', 'active'),
  ('usr-student-a', 'studentA@eduquest.edu.vn', 'hocsinh_a', '$2b$10$/o6p97.q5na4Bv9xm715vuRaTMzLLk/nl3ZFvByIV6G0fJr2HpfzC', 'student', 'active'),
  ('usr-student-b', 'studentB@eduquest.edu.vn', 'hocsinh_b', '$2b$10$V6pC.4xsrX.fsVZ43tccw.welIlKFEEsnmzS5XW.30L7FizxlpK8S', 'student', 'active')
ON CONFLICT (id) DO UPDATE 
SET password_hash = EXCLUDED.password_hash, role = EXCLUDED.role;

-- 5. HỒ SƠ 4 TÀI KHOẢN MẪU (PROFILES)
INSERT INTO profiles (user_id, display_name, avatar, grade, school)
VALUES
  ('usr-admin-01', 'Tổng Quản Trị EduQuest', '/assets/heroes/warrior_card.png', 0, 'Hệ Thống Trung Tâm EduQuest'),
  ('usr-teacher-01', 'Thầy Giáo Nguyễn Văn Việt', '/assets/heroes/mage_card.png', 5, 'Trường THCS Ánh Sáng Tri Thức'),
  ('usr-student-a', 'Dũng Sĩ Minh Quân (Học Sinh A)', '/assets/heroes/warrior_card.png', 5, 'Học Viện Phiêu Lưu EduQuest'),
  ('usr-student-b', 'Phù Thủy Bảo Châu (Học Sinh B)', '/assets/heroes/mage_card.png', 5, 'Học Viện Phiêu Lưu EduQuest')
ON CONFLICT (user_id) DO UPDATE
SET display_name = EXCLUDED.display_name;

-- 6. NHÂN VẬT ANH HÙNG CHO HỌC SINH A & B (CHARACTERS)
-- Học Sinh A: Chiến Binh Cấp 15
INSERT INTO player_characters (user_id, name, hero_class, level, exp, max_exp, active_pet_id, unlocked_pets, current_stage, unlocked_stages)
VALUES
  ('usr-student-a', 'Dũng Sĩ Minh Quân (Học Sinh A)', 'warrior', 15, 120, 1500, 'pet-dragon', '["pet-dragon", "pet-fox"]'::jsonb, 10, 10),
  ('usr-student-b', 'Phù Thủy Bảo Châu (Học Sinh B)', 'mage', 4, 30, 400, 'pet-cat', '["pet-cat"]'::jsonb, 4, 4)
ON CONFLICT (user_id) DO UPDATE
SET level = EXCLUDED.level, hero_class = EXCLUDED.hero_class;

-- 7. CHỈ SỐ CHIẾN ĐẤU CHO HỌC SINH A & B (STATS)
INSERT INTO player_stats (user_id, hp, max_hp, mp, max_mp, atk, def, spd)
VALUES
  ('usr-student-a', 260, 260, 50, 100, 75, 52, 28),
  ('usr-student-b', 140, 140, 70, 120, 55, 20, 26)
ON CONFLICT (user_id) DO UPDATE
SET hp = EXCLUDED.hp, atk = EXCLUDED.atk;

-- 8. VÍ TIỀN TỆ ĐỘC LẬP (WALLETS)
-- A: 2000 vàng, 120 kim cương; B: 500 vàng, 30 kim cương
INSERT INTO player_wallets (user_id, gold, gems)
VALUES
  ('usr-student-a', 2000, 120),
  ('usr-student-b', 500, 30)
ON CONFLICT (user_id) DO UPDATE
SET gold = EXCLUDED.gold, gems = EXCLUDED.gems;

-- 9. TRANG BỊ VŨ KHÍ TÚI ĐỒ (INVENTORY)
INSERT INTO player_inventory (id, user_id, item_id, count, is_equipped, slot)
VALUES
  ('inv-a-sword', 'usr-student-a', 'item_sword_flame', 1, TRUE, 'weapon'),
  ('inv-a-armor', 'usr-student-a', 'item_armor_iron', 1, TRUE, 'armor'),
  ('inv-b-staff', 'usr-student-b', 'item_staff_magic', 1, TRUE, 'weapon')
ON CONFLICT (id) DO NOTHING;

-- 10. KỸ NĂNG CỦA HỌC SINH A & B (SKILLS)
-- A sở hữu Song Kiếm Cấp 3; B sở hữu Hỏa Cầu Cấp 1
INSERT INTO player_skills (user_id, skill_id, level, is_active)
VALUES
  ('usr-student-a', 'song_kiem', 3, TRUE),
  ('usr-student-a', 'khien_tri_thuc', 1, TRUE),
  ('usr-student-b', 'hoa_cau', 1, TRUE)
ON CONFLICT (user_id, skill_id) DO UPDATE
SET level = EXCLUDED.level;

-- 11. LỚP HỌC MẪU CỦA GIÁO VIÊN (CLASSES & MEMBERS)
INSERT INTO classes (id, name, grade, teacher_id, code, description)
VALUES
  ('cls-5a1-2026', 'Lớp 5A1 - Biệt Đội Dũng Sĩ Tri Thức', 5, 'usr-teacher-01', 'EDU5A1', 'Lớp học Toán & Khoa Học khám phá vùng đất EduQuest kỳ thú')
ON CONFLICT (code) DO NOTHING;

INSERT INTO class_members (class_id, student_id)
VALUES
  ('cls-5a1-2026', 'usr-student-a'),
  ('cls-5a1-2026', 'usr-student-b')
ON CONFLICT (class_id, student_id) DO NOTHING;

-- 12. BÀI TẬP VÍ DỤ (ASSIGNMENTS)
INSERT INTO assignments (id, class_id, set_id, teacher_id, title, due_date, status)
VALUES
  ('asg-math-01', 'cls-5a1-2026', 'set_grade3_math', 'usr-teacher-01', 'Chinh phục 30 câu: Thử Thách Phép Tính Vương Quốc Rồng', NOW() + INTERVAL '7 days', 'active')
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- HOÀN TẤT THIẾT LẬP CƠ SỞ DỮ LIỆU EDUQUEST
-- ==============================================================================
