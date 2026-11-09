const express = require('express');
const router = express.Router();
const db = require('../database/db');
const { authenticateToken, requireRole } = require('../middleware/auth');

// Yêu cầu quyền Teacher hoặc Admin
router.use(authenticateToken);
router.use(requireRole(['teacher', 'admin']));

// GET /api/teacher/classes
// Lấy danh sách các lớp học do giáo viên này phụ trách
router.get('/classes', (req, res) => {
  try {
    const classes = db.getTeacherClasses(req.user.id);
    res.json({
      success: true,
      classes
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/teacher/classes
// Tạo lớp học mới (kèm mã mời lớp học tự động)
router.post('/classes', (req, res) => {
  try {
    const { name, grade, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Tên lớp học không được để trống!'
      });
    }

    const newClass = db.createClass(req.user.id, {
      name: name.trim(),
      grade: parseInt(grade, 10) || 5,
      description: (description || '').trim()
    });

    res.json({
      success: true,
      message: 'Tạo lớp học thành công!',
      class: newClass
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/teacher/assignments
// Giao bài tập 30 câu hỏi cho lớp học
router.post('/assignments', (req, res) => {
  try {
    const { classId, setId, title, dueDate } = req.body;

    if (!classId || !setId || !title) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp Lớp học, Bộ câu hỏi và Tiêu đề bài tập!'
      });
    }

    const assignment = db.createAssignment(req.user.id, {
      classId,
      setId,
      title: title.trim(),
      dueDate
    });

    res.json({
      success: true,
      message: 'Đã giao bài tập thành công cho lớp học!',
      assignment
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/teacher/analytics/:assignmentId
// Xem thống kê làm bài của học sinh và các câu thường sai
router.get('/analytics/:assignmentId', (req, res) => {
  try {
    const { assignmentId } = req.params;
    const analytics = db.getAssignmentAnalytics(assignmentId);

    if (!analytics) {
      return res.status(404).json({
        success: false,
        error: 'Không tìm thấy bài tập hoặc bài tập đã bị xóa!'
      });
    }

    // Bảo mật: Đảm bảo giáo viên chỉ xem bài của lớp mình (trừ Admin)
    if (req.user.role !== 'admin' && analytics.assignment.teacher_id !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Bạn không có quyền xem thống kê của bài tập thuộc giáo viên khác!'
      });
    }

    res.json({
      success: true,
      data: analytics
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
