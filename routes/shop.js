const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// GET /api/shop/catalog
// Công khai danh mục vật phẩm và kỹ năng (giá niêm yết từ DB server)
router.get('/catalog', (req, res) => {
  try {
    const items = db.db.prepare('SELECT * FROM item_catalog').all();
    const skills = db.db.prepare('SELECT * FROM skill_catalog').all();

    res.json({
      success: true,
      items: items.map(it => ({
        ...it,
        stats: JSON.parse(it.stats_json || '{}')
      })),
      skills: skills.map(sk => ({
        ...sk,
        tags: JSON.parse(sk.tags_json || '[]'),
        levels: JSON.parse(sk.levels_json || '[]')
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/shop/buy
// Giao dịch mua vật phẩm an toàn: Server kiểm tra giá niêm yết, kiểm tra số dư ví thực tế, trừ vàng và cấp đồ trong 1 Transaction
router.post('/buy', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng chọn vật phẩm muốn mua!'
      });
    }

    const result = db.buyItemAtomic(userId, itemId);
    const updatedPlayerData = db.getFullPlayerData(userId);

    res.json({
      success: true,
      message: `Mua thành công ${result.item.name}!`,
      remainingGold: result.remainingGold,
      playerData: updatedPlayerData
    });

  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

// POST /api/shop/use-potion
// Dùng bình máu/năng lượng từ túi đồ
router.post('/use-potion', authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const { itemId } = req.body;

    if (!itemId) {
      return res.status(400).json({ success: false, error: 'Thiếu mã dược phẩm!' });
    }

    const result = db.usePotionAtomic(userId, itemId);
    const updatedPlayerData = db.getFullPlayerData(userId);

    res.json({
      success: true,
      message: 'Sử dụng dược phẩm thành công!',
      stats: { hp: result.hp, mp: result.mp },
      playerData: updatedPlayerData
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

module.exports = router;
