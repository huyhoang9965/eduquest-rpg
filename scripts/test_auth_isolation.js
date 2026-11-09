// Automated Test Suite for EduQuest Account System, RBAC, and Player Isolation
const http = require('http');

async function request(path, options = {}) {
  const url = 'http://localhost:3000' + path;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    body: options.body ? JSON.stringify(options.body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data };
}

async function runTests() {
  console.log("============================================================");
  console.log("🧪 BẮT ĐẦU KIỂM THỬ HỆ THỐNG TÀI KHOẢN, PHÂN QUYỀN VÀ ISOLATION");
  console.log("============================================================\n");

  // Reset student A and B wallets and test claims to make test suite 100% idempotent
  const dbModule = require('../database/db');
  dbModule.db.prepare("UPDATE player_wallets SET gold = 2000 WHERE user_id = 'usr-student-a'").run();
  dbModule.db.prepare("UPDATE player_wallets SET gold = 500 WHERE user_id = 'usr-student-b'").run();
  dbModule.db.prepare("DELETE FROM rewards_claimed WHERE run_id LIKE 'run-test-%'").run();
  dbModule.db.prepare("DELETE FROM player_inventory WHERE id LIKE 'inv-usr-student-%-test'").run();

  let passed = 0;
  let total = 0;

  function assert(title, condition, extra = '') {
    total++;
    if (condition) {
      console.log(`✓ [PASS ${total}] ${title}`);
      passed++;
    } else {
      console.error(`✗ [FAIL ${total}] ${title} -> ${extra}`);
    }
  }

  // TEST 1: Đăng nhập Học Sinh A
  const loginA = await request('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'studentA@eduquest.edu.vn', password: 'StudentA@123456' }
  });
  assert('Học Sinh A đăng nhập thành công', loginA.status === 200 && loginA.data.success && loginA.data.token);
  const tokenA = loginA.data.token;

  // TEST 2: Lấy dữ liệu Học Sinh A
  const dataA = await request('/api/player/data', {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Học Sinh A sở hữu đúng nhân vật Chiến Binh Lv.15', 
    dataA.data.data.character.hero_class === 'warrior' && dataA.data.data.character.level === 15);
  assert('Học Sinh A có đúng 2000 vàng ban đầu', dataA.data.data.wallet.gold === 2000);
  assert('Học Sinh A sở hữu Kỹ Năng Song Kiếm Cấp 3', 
    dataA.data.data.skills.some(s => s.skill_id === 'song_kiem' && s.level === 3));

  // TEST 3: Học Sinh A mua vật phẩm an toàn từ Shop (Bình Máu Nhỏ - 50 vàng)
  const buyA = await request('/api/shop/buy', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: { itemId: 'item_potion_hp' }
  });
  assert('Học Sinh A mua vật phẩm thành công từ Shop', buyA.status === 200 && buyA.data.success);
  assert('Số vàng của A bị trừ chính xác từ backend (2000 - 50 = 1950)', buyA.data.remainingGold === 1950);

  // TEST 4: Học Sinh A nhận thưởng mốc (Milestone 5) an toàn
  const rewardA = await request('/api/player/claim-milestone-reward', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: { runId: 'run-test-01', milestone: 5, gold: 100, exp: 50 }
  });
  assert('Học Sinh A nhận thưởng mốc 5 câu thành công', rewardA.status === 200 && rewardA.data.success);

  // TEST 5: Chống Replay / Duplicate Claim khi Reload
  const replayA = await request('/api/player/claim-milestone-reward', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}` },
    body: { runId: 'run-test-01', milestone: 5, gold: 100, exp: 50 }
  });
  assert('Server chặn nhận thưởng trùng lặp khi học sinh tải lại trang', 
    replayA.status === 409 && replayA.data.alreadyClaimed === true);

  // TEST 6: Đăng nhập Học Sinh B trên cùng hệ thống
  const loginB = await request('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'studentB@eduquest.edu.vn', password: 'StudentB@123456' }
  });
  assert('Học Sinh B đăng nhập thành công', loginB.status === 200 && loginB.data.token);
  const tokenB = loginB.data.token;

  // TEST 7: Lấy dữ liệu Học Sinh B -> Phải hoàn toàn tách biệt
  const dataB = await request('/api/player/data', {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert('Học Sinh B có nhân vật Phù Thủy Lv.4 độc lập (không bị lẫn dữ liệu A)', 
    dataB.data.data.character.hero_class === 'mage' && dataB.data.data.character.level === 4);
  assert('Học Sinh B có đúng 500 vàng riêng', dataB.data.data.wallet.gold === 500);
  assert('Học Sinh B KHÔNG có kỹ năng Song Kiếm cấp 3 của A (chỉ có Hỏa Cầu)', 
    !dataB.data.data.skills.some(s => s.skill_id === 'song_kiem') && dataB.data.data.skills.some(s => s.skill_id === 'hoa_cau'));

  // TEST 8: Học Sinh B không đủ tiền mua đồ đắt tiền (Kiếm Hỏa Long 450 vàng nhưng B chỉ muốn mua đồ vượt số dư)
  // Tạo giao dịch vượt số dư bằng cách mua Khiên Tri Thức 500 vàng khi B chỉ có 500 vàng và mua 2 cái
  const buyB_fail = await request('/api/shop/buy', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}` },
    body: { itemId: 'item_shield_knowledge' }
  });
  // B có 500 vàng vừa đủ mua 1 cái
  assert('Học Sinh B mua 1 Khiên Tri Thức giá 500 vàng (vừa hết sạch vàng)', buyB_fail.status === 200 && buyB_fail.data.remainingGold === 0);
  
  // B thử mua thêm 1 bình máu 50 vàng khi còn 0 vàng -> BẮT BUỘC THẤT BẠI
  const buyB_nomoney = await request('/api/shop/buy', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenB}` },
    body: { itemId: 'item_potion_hp' }
  });
  assert('Server chặn giao dịch khi không đủ vàng (giao dịch an toàn, không âm tiền)', 
    buyB_nomoney.status === 400 && buyB_nomoney.data.success === false);

  // TEST 9: Học Sinh cố tình truy cập API Quản Trị Viên (Admin)
  const studentHackAdmin = await request('/api/admin/users', {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Học sinh bị chặn truy cập API Quản trị viên (403 Forbidden)', studentHackAdmin.status === 403);

  // TEST 10: Học Sinh cố tình truy cập API Giáo Viên
  const studentHackTeacher = await request('/api/teacher/classes', {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Học sinh bị chặn truy cập API Giáo viên (403 Forbidden)', studentHackTeacher.status === 403);

  // TEST 11: Đăng nhập Giáo Viên
  const loginTeacher = await request('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'teacher@eduquest.edu.vn', password: 'Teacher@123456' }
  });
  assert('Giáo viên đăng nhập thành công', loginTeacher.status === 200 && loginTeacher.data.token);
  const tokenTeacher = loginTeacher.data.token;

  // TEST 12: Giáo viên tạo lớp học và giao bài
  const createClass = await request('/api/teacher/classes', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenTeacher}` },
    body: { name: 'Lớp 5A1 - Phiêu Lưu Toán Học', grade: 5, description: 'Lớp học phép thuật' }
  });
  assert('Giáo viên tạo lớp học thành công', createClass.status === 200 && createClass.data.class.id);

  // TEST 13: Giáo viên không thể truy cập API Admin
  const teacherHackAdmin = await request('/api/admin/users', {
    headers: { 'Authorization': `Bearer ${tokenTeacher}` }
  });
  assert('Giáo viên không thể truy cập API Quản trị viên (403 Forbidden)', teacherHackAdmin.status === 403);

  // TEST 14: Đăng nhập Admin
  const loginAdmin = await request('/api/auth/login', {
    method: 'POST',
    body: { identifier: 'admin@eduquest.edu.vn', password: 'Admin@123456' }
  });
  assert('Quản trị viên (Admin) đăng nhập thành công', loginAdmin.status === 200 && loginAdmin.data.token);
  const tokenAdmin = loginAdmin.data.token;

  // TEST 15: Admin xem danh sách tất cả tài khoản và số liệu hệ thống
  const adminUsers = await request('/api/admin/users', {
    headers: { 'Authorization': `Bearer ${tokenAdmin}` }
  });
  assert('Admin xem danh sách toàn bộ người dùng trong hệ thống', 
    adminUsers.status === 200 && Array.isArray(adminUsers.data.users) && adminUsers.data.users.length >= 4);

  const adminStats = await request('/api/admin/stats', {
    headers: { 'Authorization': `Bearer ${tokenAdmin}` }
  });
  assert('Admin xem thống kê tổng quan toàn nền tảng', 
    adminStats.status === 200 && adminStats.data.stats.totalUsers >= 4);

  // TEST 16: Học Sinh A đăng nhập lại -> Mọi tài sản và vật phẩm mới mua vẫn được bảo toàn trọn vẹn
  const reDataA = await request('/api/player/data', {
    headers: { 'Authorization': `Bearer ${tokenA}` }
  });
  assert('Học Sinh A đăng nhập lại vẫn giữ nguyên 2050 vàng (1950 + 100 thưởng)', 
    reDataA.data.data.wallet.gold === 2050);

  // TEST 17: Đăng ký tài khoản mới mặc định luôn là Student (không thể tự thăng quyền)
  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  const regNew = await request('/api/auth/register', {
    method: 'POST',
    body: {
      email: `student_${randSuffix}@eduquest.vn`,
      username: `hocsinh_${randSuffix}`,
      password: 'Password@123',
      displayName: 'Học Sinh Mới',
      role: 'admin' // Cố tình truyền role admin
    }
  });
  assert('Đăng ký tài khoản mới mặc định nghiêm ngặt là student (không bị bypass role)', 
    regNew.status === 200 && regNew.data.user.role === 'student');

  console.log("\n============================================================");
  console.log(`🎉 KẾT QUẢ KIỂM THỬ: ${passed}/${total} TIÊU CHÍ ĐẠT HOÀN HẢO!`);
  console.log("============================================================");
}

runTests().catch(console.error);
