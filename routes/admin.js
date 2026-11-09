const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Yêu cầu nghiêm ngặt quyền Admin
router.use(authenticateToken);
router.use(requireRole('admin'));

// GET /api/admin/users
// Danh sách tất cả tài khoản trong hệ thống
router.get('/users', (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json({
      success: true,
      users
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users/:id/role
// Cấp quyền hoặc thay đổi vai trò (Ví dụ: phê duyệt Giáo Viên)
router.post('/users/:id/role', (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { role } = req.body;

    if (!['admin', 'teacher', 'student'].includes(role)) {
      return res.status(400).json({
        success: false,
        error: 'Vai trò phải là: admin, teacher, hoặc student!'
      });
    }

    // Không cho phép tự giáng quyền của chính mình nếu là admin duy nhất
    if (targetUserId === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Bạn không thể tự hạ quyền Admin của chính mình!'
      });
    }

    const result = db.updateUserRole(req.user.id, targetUserId, role);
    res.json({
      success: true,
      message: `Đã cập nhật vai trò tài khoản thành: ${role}`,
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/admin/users/:id/status
// Khóa hoặc mở khóa tài khoản vi phạm
router.post('/users/:id/status', (req, res) => {
  try {
    const targetUserId = req.params.id;
    const { status } = req.body;

    if (!['active', 'locked', 'suspended'].includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Trạng thái phải là: active, locked, hoặc suspended!'
      });
    }

    if (targetUserId === req.user.id) {
      return res.status(400).json({
        success: false,
        error: 'Bạn không thể tự khóa tài khoản của chính mình!'
      });
    }

    const result = db.updateUserStatus(req.user.id, targetUserId, status);
    res.json({
      success: true,
      message: `Đã cập nhật trạng thái tài khoản thành: ${status}`,
      result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/admin/stats
// Xem báo cáo thống kê toàn hệ thống
router.get('/stats', (req, res) => {
  try {
    const stats = db.getSystemStats();
    res.json({
      success: true,
      stats
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
