const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const db = require('../database/db');
const { generateToken, authenticateToken } = require('../middleware/auth');

// POST /api/auth/register
// Tự động gán quyền 'student'. Không cho phép người dùng tự cấp quyền teacher hoặc admin khi đăng ký.
router.post('/register', (req, res) => {
  try {
    const { email, username, password, displayName, grade } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng điền đầy đủ Email, Tên Đăng Nhập và Mật Khẩu!'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Định dạng Email không hợp lệ!'
      });
    }

    // Username validation
    const cleanUsername = username.trim().toLowerCase();
    if (cleanUsername.length < 3 || cleanUsername.length > 20) {
      return res.status(400).json({
        success: false,
        error: 'Tên đăng nhập phải có từ 3 đến 20 ký tự!'
      });
    }

    // Password validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu phải có ít nhất 6 ký tự để bảo đảm an toàn!'
      });
    }

    // Check duplicate
    if (db.getUserByEmail(email.trim())) {
      return res.status(400).json({
        success: false,
        error: 'Email này đã được sử dụng bởi một tài khoản khác!'
      });
    }

    if (db.getUserByUsername(cleanUsername)) {
      return res.status(400).json({
        success: false,
        error: 'Tên đăng nhập này đã tồn tại! Vui lòng chọn tên khác.'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);
    const userId = `usr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newUser = db.createUser({
      id: userId,
      email: email.trim().toLowerCase(),
      username: cleanUsername,
      passwordHash,
      role: 'student', // Bắt buộc là Student
      displayName: (displayName || cleanUsername).trim(),
      grade: parseInt(grade, 10) || 5
    });

    const token = generateToken(newUser);

    res.json({
      success: true,
      message: 'Đăng ký tài khoản Học Sinh thành công!',
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        displayName: newUser.display_name,
        grade: newUser.grade
      }
    });

  } catch (err) {
    console.error('Lỗi đăng ký:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi đăng ký tài khoản: ' + err.message
    });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng nhập Tên Đăng Nhập / Email và Mật Khẩu!'
      });
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    let user = db.getUserByEmail(cleanIdentifier);
    if (!user) {
      user = db.getUserByUsername(cleanIdentifier);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Tài khoản không tồn tại trong hệ thống!'
      });
    }

    if (user.status === 'locked' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng bởi Quản Trị Viên!'
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Mật khẩu không chính xác. Vui lòng kiểm tra lại!'
      });
    }

    const userWithProfile = db.getUserWithProfile(user.id);
    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      token,
      user: {
        id: userWithProfile.id,
        email: userWithProfile.email,
        username: userWithProfile.username,
        role: userWithProfile.role,
        displayName: userWithProfile.display_name,
        avatar: userWithProfile.avatar,
        grade: userWithProfile.grade
      }
    });

  } catch (err) {
    console.error('Lỗi đăng nhập:', err);
    res.status(500).json({
      success: false,
      error: 'Lỗi máy chủ khi đăng nhập: ' + err.message
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    user: req.user
  });
});

// POST /api/auth/change-password
router.post('/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng cung cấp mật khẩu hiện tại và mật khẩu mới!'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu mới phải có ít nhất 6 ký tự!'
      });
    }

    const userRaw = db.getUserById(req.user.id);
    const isMatch = bcrypt.compareSync(currentPassword, userRaw.password_hash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        error: 'Mật khẩu hiện tại không chính xác!'
      });
    }

    const salt = bcrypt.genSaltSync(10);
    const newHash = bcrypt.hashSync(newPassword, salt);
    db.changePassword(req.user.id, newHash);

    res.json({
      success: true,
      message: 'Đổi mật khẩu thành công!'
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Lỗi đổi mật khẩu: ' + err.message
    });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Đã đăng xuất thành công!'
  });
});

module.exports = router;
