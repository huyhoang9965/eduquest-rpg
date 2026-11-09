const { generateToken } = require('../middleware/auth');

async function testCreatorProtection() {
  console.log("=== KIỂM THỬ BẢO VỆ API SOẠN ĐỀ THEO PHÂN QUYỀN ===");

  const studentToken = generateToken({
    id: 'usr-student-a',
    email: 'studentA@eduquest.edu.vn',
    username: 'hocsinh_a',
    role: 'student'
  });

  const teacherToken = generateToken({
    id: 'usr-teacher-1',
    email: 'teacher@eduquest.edu.vn',
    username: 'giaovien_nguyen',
    role: 'teacher'
  });

  // 1. Học sinh cố tình tạo bộ câu hỏi -> Phải bị chặn 403
  const res1 = await fetch('http://localhost:3000/api/custom-question-sets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${studentToken}`
    },
    body: JSON.stringify({
      title: 'Đề thi hack bởi học sinh'
    })
  });
  console.log("1. Học sinh tạo bộ đề:", res1.status, res1.status === 403 ? "✓ CHẶN THÀNH CÔNG (403)" : "✗ THẤT BẠI");

  // 2. Học sinh cố tình xóa bộ câu hỏi -> Phải bị chặn 403
  const res2 = await fetch('http://localhost:3000/api/custom-question-sets/any-id', {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });
  console.log("2. Học sinh xóa bộ đề:", res2.status, res2.status === 403 ? "✓ CHẶN THÀNH CÔNG (403)" : "✗ THẤT BẠI");

  // 3. Học sinh xem danh sách bộ câu hỏi -> Cho phép 200
  const res3 = await fetch('http://localhost:3000/api/custom-question-sets', {
    headers: {
      'Authorization': `Bearer ${studentToken}`
    }
  });
  console.log("3. Học sinh xem danh sách bộ đề:", res3.status, res3.status === 200 ? "✓ CHO PHÉP XEM (200)" : "✗ THẤT BẠI");

  // 4. Giáo viên xem danh sách bộ đề -> Cho phép 200
  const res4 = await fetch('http://localhost:3000/api/custom-question-sets', {
    headers: {
      'Authorization': `Bearer ${teacherToken}`
    }
  });
  console.log("4. Giáo viên xem danh sách bộ đề:", res4.status, res4.status === 200 ? "✓ CHO PHÉP XEM (200)" : "✗ THẤT BẠI");

  console.log("=== HOÀN TẤT KIỂM THỬ BẢO VỆ API CREATOR STUDIO ===");
}

testCreatorProtection().catch(console.error);
