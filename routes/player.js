const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// All player routes require valid authentication
router.use(authenticateToken);

// GET /api/player/data
// Tải toàn bộ tài sản và tiến trình của ĐÚNG người dùng đang đăng nhập
router.get('/data', (req, res) => {
  try {
    const userId = req.user.id;
    const playerData = db.getFullPlayerData(userId);

    if (!playerData) {
      return res.json({
        success: true,
        hasCharacter: false,
        user: req.user
      });
    }

    res.json({
      success: true,
      hasCharacter: true,
      user: req.user,
      data: playerData
    });
  } catch (err) {
    console.error('Lỗi tải dữ liệu người chơi:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi tải dữ liệu người chơi: ' + err.message
    });
  }
});

// POST /api/player/create-character
// Khởi tạo nhân vật cho người dùng mới
router.post('/create-character', (req, res) => {
  try {
    const userId = req.user.id;
    const { name, heroClass, petId } = req.body;

    if (!name || !heroClass) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp tên nhân vật và chức nghiệp!'
      });
    }

    if (!['warrior', 'mage', 'archer'].includes(heroClass)) {
      return res.status(400).json({
        success: false,
        error: 'Chức nghiệp không hợp lệ!'
      });
    }

    const existing = db.getFullPlayerData(userId);
    if (existing) {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản của bạn đã có nhân vật!'
      });
    }

    const hp = heroClass === 'warrior' ? 120 : (heroClass === 'mage' ? 80 : 95);
    const atk = heroClass === 'warrior' ? 25 : (heroClass === 'mage' ? 35 : 30);
    const def = heroClass === 'warrior' ? 18 : (heroClass === 'mage' ? 8 : 12);
    const spd = heroClass === 'warrior' ? 10 : (heroClass === 'mage' ? 12 : 18);

    db.db.exec('BEGIN TRANSACTION;');
    try {
      db.db.prepare(`
        INSERT INTO player_characters (user_id, name, hero_class, level, exp, max_exp, active_pet_id, unlocked_pets_json, current_stage, unlocked_stages)
        VALUES (?, ?, ?, 1, 0, 100, ?, ?, 1, 1)
      `).run(userId, name.trim(), heroClass, petId || 'pet-dragon', JSON.stringify([petId || 'pet-dragon']));

      db.db.prepare(`
        INSERT INTO player_stats (user_id, hp, max_hp, mp, max_mp, atk, def, spd)
        VALUES (?, ?, ?, 50, 100, ?, ?, ?)
      `).run(userId, hp, hp, atk, def, spd);

      // Starter weapon based on class
      const starterWeapon = heroClass === 'warrior' ? 'item_sword_basic' : (heroClass === 'mage' ? 'item_staff_magic' : 'item_bow_ranger');
      db.db.prepare(`
        INSERT INTO player_inventory (id, user_id, item_id, count, is_equipped, slot)
        VALUES (?, ?, ?, 1, 1, 'weapon')
      `).run(`inv-${userId}-starter-wpn`, userId, starterWeapon);

      // Starter active skill
      const starterSkill = heroClass === 'warrior' ? 'song_kiem' : (heroClass === 'mage' ? 'hoa_cau' : 'mua_ten');
      db.db.prepare(`
        INSERT OR REPLACE INTO player_skills (user_id, skill_id, level, is_active)
        VALUES (?, ?, 1, 1)
      `).run(userId, starterSkill);

      db.db.exec('COMMIT;');
    } catch (e) {
      db.db.exec('ROLLBACK;');
      throw e;
    }

    const updated = db.getFullPlayerData(userId);
    res.json({
      success: true,
      message: 'Tạo nhân vật thành công!',
      data: updated
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Lỗi tạo nhân vật: ' + err.message
    });
  }
});

// POST /api/player/equip
// Trang bị hoặc tháo trang bị an toàn
router.post('/equip', (req, res) => {
  try {
    const userId = req.user.id;
    const { inventoryId, action } = req.body; // action: 'equip' | 'unequip'

    const item = db.db.prepare('SELECT * FROM player_inventory WHERE id = ? AND user_id = ?').get(inventoryId, userId);
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Vật phẩm không tồn tại trong túi đồ của bạn!'
      });
    }

    const catalog = db.db.prepare('SELECT type FROM item_catalog WHERE id = ?').get(item.item_id);
    if (!['weapon', 'armor', 'accessory'].includes(catalog.type)) {
      return res.status(400).json({
        success: false,
        error: 'Vật phẩm này không phải là trang bị có thể mang lên người!'
      });
    }

    db.db.exec('BEGIN TRANSACTION;');
    try {
      if (action === 'equip') {
        // Unequip any current item in the same slot
        db.db.prepare(`
          UPDATE player_inventory 
          SET is_equipped = 0, slot = NULL 
          WHERE user_id = ? AND slot = ?
        `).run(userId, catalog.type);

        // Equip this item
        db.db.prepare(`
          UPDATE player_inventory 
          SET is_equipped = 1, slot = ? 
          WHERE id = ? AND user_id = ?
        `).run(catalog.type, inventoryId, userId);
      } else {
        // Unequip
        db.db.prepare(`
          UPDATE player_inventory 
          SET is_equipped = 0, slot = NULL 
          WHERE id = ? AND user_id = ?
        `).run(inventoryId, userId);
      }

      db.db.exec('COMMIT;');
    } catch (e) {
      db.db.exec('ROLLBACK;');
      throw e;
    }

    const updated = db.getFullPlayerData(userId);
    res.json({
      success: true,
      message: action === 'equip' ? 'Trang bị vật phẩm thành công!' : 'Đã tháo trang bị!',
      data: updated
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Lỗi trang bị vật phẩm: ' + err.message
    });
  }
});

// POST /api/player/select-pet
router.post('/select-pet', (req, res) => {
  try {
    const userId = req.user.id;
    const { petId } = req.body;

    const char = db.db.prepare('SELECT unlocked_pets_json FROM player_characters WHERE user_id = ?').get(userId);
    if (!char) {
      return res.status(404).json({ success: false, error: 'Chưa có nhân vật!' });
    }

    const unlocked = JSON.parse(char.unlocked_pets_json || '["pet-dragon"]');
    if (!unlocked.includes(petId)) {
      return res.status(400).json({
        success: false,
        error: 'Bạn chưa mở khóa thú cưng này!'
      });
    }

    db.db.prepare('UPDATE player_characters SET active_pet_id = ? WHERE user_id = ?').run(petId, userId);
    res.json({ success: true, activePetId: petId });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/player/claim-milestone-reward
// Nhận thưởng an toàn tại backend: chống spam, chống reload replay
router.post('/claim-milestone-reward', (req, res) => {
  try {
    const userId = req.user.id;
    const { runId, milestone, gold, exp, skillId, itemName } = req.body;

    if (!runId || !milestone) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin phiên chơi (runId) hoặc mốc nhận thưởng!'
      });
    }

    const result = db.claimBattleRewardAtomic(userId, runId, parseInt(milestone, 10), parseInt(gold, 10) || 0, parseInt(exp, 10) || 0, itemName, skillId);
    
    if (result.alreadyClaimed) {
      return res.status(409).json({
        success: false,
        alreadyClaimed: true,
        message: result.message
      });
    }

    const updated = db.getFullPlayerData(userId);
    res.json({
      success: true,
      message: `Nhận thưởng thành công mốc ${milestone} câu!`,
      data: updated
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/player/submit-session
// Lưu lịch sử bài làm và câu hỏi đúng/sai sau hành trình 30 câu
router.post('/submit-session', (req, res) => {
  try {
    const userId = req.user.id;
    const sessionData = req.body;

    if (!sessionData.setId) {
      return res.status(400).json({
        success: false,
        error: 'Thiếu thông tin bộ câu hỏi (setId)!'
      });
    }

    const record = db.recordLearningSession(userId, sessionData);
    res.json({
      success: true,
      message: 'Đã lưu kết quả học tập vào học bạ cá nhân!',
      sessionId: record.sessionId
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/player/import-guest-data
// Nhập dữ liệu khách từ localStorage vào tài khoản người dùng nếu họ xác nhận
router.post('/import-guest-data', (req, res) => {
  try {
    const userId = req.user.id;
    const { guestHero } = req.body;

    if (!guestHero || !guestHero.heroClass) {
      return res.status(400).json({
        success: false,
        error: 'Dữ liệu khách không hợp lệ!'
      });
    }

    const existing = db.getFullPlayerData(userId);
    // Nếu tài khoản đã có level > 1 hoặc đã chơi nhiều, cảnh báo không ghi đè bừa bãi
    if (existing && existing.character.level > 2) {
      return res.status(400).json({
        success: false,
        error: 'Tài khoản của bạn đã có tiến trình cao hơn dữ liệu khách!'
      });
    }

    db.db.exec('BEGIN TRANSACTION;');
    try {
      // Cập nhật nhân vật
      db.db.prepare(`
        INSERT OR REPLACE INTO player_characters (user_id, name, hero_class, level, exp, max_exp, active_pet_id, unlocked_pets_json, current_stage, unlocked_stages)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        userId,
        guestHero.name || req.user.display_name,
        guestHero.heroClass,
        guestHero.level || 1,
        guestHero.exp || 0,
        guestHero.maxExp || 100,
        guestHero.activePetId || 'pet-dragon',
        JSON.stringify(guestHero.unlockedPets || ['pet-dragon']),
        guestHero.currentStage || 1,
        guestHero.unlockedStages || 1
      );

      // Cập nhật vàng
      if (guestHero.gold) {
        db.db.prepare('UPDATE player_wallets SET gold = ? WHERE user_id = ?').run(guestHero.gold, userId);
      }

      db.db.exec('COMMIT;');
    } catch (e) {
      db.db.exec('ROLLBACK;');
      throw e;
    }

    const updated = db.getFullPlayerData(userId);
    res.json({
      success: true,
      message: 'Đã chuyển thành công dữ liệu chơi thử vào tài khoản cá nhân!',
      data: updated
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
