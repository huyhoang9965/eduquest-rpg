const jwt = require('jsonwebtoken');
const db = require('../database/db');

const JWT_SECRET = process.env.JWT_SECRET || 'eduquest-rpg-secret-jwt-key-2026-secure';

function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Yêu cầu đăng nhập để thực hiện thao tác này!'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserWithProfile(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Tài khoản không tồn tại hoặc phiên đăng nhập không hợp lệ!'
      });
    }

    if (user.status === 'locked' || user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Tài khoản của bạn đã bị khóa hoặc tạm ngưng bởi Quản Trị Viên!'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại!'
    });
  }
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Chưa xác thực người dùng!'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Bạn không có quyền truy cập chức năng này! Yêu cầu vai trò: [${roles.join(', ')}]`
      });
    }

    next();
  };
}

function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = db.getUserWithProfile(decoded.id);
      if (user && user.status === 'active') {
        req.user = user;
      }
    } catch (e) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
}

module.exports = {
  JWT_SECRET,
  generateToken,
  authenticateToken,
  requireRole,
  optionalAuth
};
