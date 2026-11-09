const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ==========================================
// MOUNT AUTH, PLAYER, SHOP, TEACHER & ADMIN ROUTES
// ==========================================
const { optionalAuth } = require('./middleware/auth');

function forbidStudentMutation(req, res, next) {
  if (req.user && req.user.role === 'student') {
    return res.status(403).json({
      success: false,
      error: 'Tài khoản Học Sinh chỉ có quyền xem bộ đề, không thể tạo, chỉnh sửa hoặc xuất bản. Vui lòng sử dụng tài khoản Giáo Viên hoặc Quản Trị Viên!'
    });
  }
  next();
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/player', require('./routes/player'));
app.use('/api/shop', require('./routes/shop'));
app.use('/api/teacher', require('./routes/teacher'));
app.use('/api/admin', require('./routes/admin'));

// Đọc ngân hàng câu hỏi
let quizzesData = [];
const quizzesFilePath = path.join(__dirname, 'sample-quizzes.json');
try {
  const raw = fs.readFileSync(quizzesFilePath, 'utf8');
  quizzesData = JSON.parse(raw);
} catch (e) {
  console.error("Không thể đọc sample-quizzes.json:", e.message);
  quizzesData = [];
}

function saveQuizzesToFile() {
  try {
    fs.writeFileSync(quizzesFilePath, JSON.stringify(quizzesData, null, 2), 'utf8');
  } catch (err) {
    console.error("Lỗi lưu file sample-quizzes.json:", err.message);
  }
}

// Danh sách Boss cho chế độ Adventure RPG
const BOSS_ROSTER = [
  { name: '🐺 Ma Sói Hắc Ám', avatar: '🐺', baseHp: 3000, description: 'Ải 1: Thử thách khởi động rừng rậm' },
  { name: '🗿 Quái Đá Khổng Lồ', avatar: '🗿', baseHp: 5000, description: 'Ải 2: Thử thách tư duy thung lũng đá' },
  { name: '🐉 Hỏa Long Bão Lửa', avatar: '🐉', baseHp: 8000, description: 'Ải 3: Trùm Cuối Đỉnh Núi Núi Lửa' }
];

// In-memory rooms
const rooms = {};

function generateRoomCode() {
  let code = '';
  do {
    code = Math.floor(100000 + Math.random() * 900000).toString();
  } while (rooms[code]);
  return code;
}

// ==========================================
// HỆ THỐNG QUẢN LÝ BỘ CÂU HỎI 30 CÂU TÙY CHỈNH (CUSTOM QUESTION SETS)
// ==========================================
const customSetsFilePath = path.join(__dirname, 'data', 'custom-question-sets.json');

function loadCustomQuestionSets() {
  try {
    if (!fs.existsSync(customSetsFilePath)) {
      fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
      fs.writeFileSync(customSetsFilePath, '[]', 'utf8');
      return [];
    }
    const raw = fs.readFileSync(customSetsFilePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error("Lỗi đọc custom-question-sets.json:", err.message);
    return [];
  }
}

function saveCustomQuestionSets(data) {
  try {
    fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
    fs.writeFileSync(customSetsFilePath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error("Lỗi ghi custom-question-sets.json:", err.message);
    return false;
  }
}

// REST API: Lấy danh sách bộ đề (kết hợp cả bộ mặc định lẫn các bộ câu hỏi tự tạo)
app.get('/api/quizzes', (req, res) => {
  try {
    const customSets = loadCustomQuestionSets().filter(s => Array.isArray(s.questions) && s.questions.length > 0);
    const convertedCustom = customSets.map(cs => ({
      id: cs.id,
      title: `[RPG] ${cs.title} (${cs.questions.length} câu)`,
      description: cs.description || `${cs.topic || 'Chủ đề tổng hợp'} - Lớp ${cs.grade}`,
      category: cs.subject ? cs.subject.toUpperCase() : 'Tự soạn',
      isCustomSet: true,
      questions: cs.questions.map((q, idx) => ({
        id: q.id || `cq-${idx + 1}`,
        question: q.question,
        timeLimit: 20,
        points: 1000,
        answers: (q.options || []).map((opt, oIdx) => ({
          id: ['a', 'b', 'c', 'd'][oIdx] || `opt-${oIdx}`,
          text: opt,
          isCorrect: opt === q.correctAnswer,
          color: ['red', 'blue', 'yellow', 'green'][oIdx % 4]
        }))
      }))
    }));
    res.json([...convertedCustom, ...quizzesData]);
  } catch (err) {
    res.json(quizzesData);
  }
});

// REST API: Lưu / Tạo bộ đề mới thủ công
app.post('/api/quizzes', (req, res) => {
  try {
    const { title, description, category, questions } = req.body;
    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Dữ liệu bộ đề không hợp lệ. Cần có tiêu đề và ít nhất 1 câu hỏi!' });
    }

    const newQuiz = {
      id: 'quiz-' + Date.now(),
      title: title.trim(),
      description: (description || 'Bộ đề do giáo viên tự tạo').trim(),
      category: (category || 'Tự soạn').trim(),
      questions: questions.map((q, idx) => ({
        id: q.id || `q-${idx + 1}`,
        question: q.question.trim(),
        timeLimit: parseInt(q.timeLimit, 10) || 15,
        points: parseInt(q.points, 10) || 1000,
        answers: (q.answers || []).map((ans, aIdx) => ({
          id: ans.id || ['a', 'b', 'c', 'd'][aIdx],
          text: ans.text.trim(),
          isCorrect: !!ans.isCorrect,
          color: ans.color || ['red', 'blue', 'yellow', 'green'][aIdx]
        }))
      }))
    };

    quizzesData.unshift(newQuiz);
    saveQuizzesToFile();
    res.json({ success: true, quiz: newQuiz });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi khi lưu bộ đề: ' + err.message });
  }
});

// REST API: Xóa bộ đề
app.delete('/api/quizzes/:id', (req, res) => {
  const quizId = req.params.id;
  quizzesData = quizzesData.filter(q => q.id !== quizId);
  saveQuizzesToFile();
  res.json({ success: true });
});

// REST API: Tải lên / Import câu hỏi nhanh bằng Văn Bản / CSV
// Định dạng hỗ trợ:
// Câu hỏi | Đáp án 1 | Đáp án 2* | Đáp án 3 | Đáp án 4
// (* đánh dấu đáp án đúng)
app.post('/api/quizzes/import-text', (req, res) => {
  try {
    const { title, rawText, category } = req.body;
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Nội dung tải lên không được để trống!' });
    }

    const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    const parsedQuestions = [];
    const colors = ['red', 'blue', 'yellow', 'green'];
    const ids = ['a', 'b', 'c', 'd'];

    lines.forEach((line, qIdx) => {
      // Phân tách bằng dấu | hoặc tab hoặc ;
      let parts = line.split(/[|;]/).map(p => p.trim()).filter(p => p.length > 0);
      if (parts.length >= 3) {
        const questionText = parts[0];
        const rawAnswers = parts.slice(1, 5); // tối đa 4 đáp án

        let hasCorrect = false;
        const answers = rawAnswers.map((txt, aIdx) => {
          let isCorrect = false;
          let cleanText = txt;
          // Nếu có dấu * ở cuối hoặc đầu thì đó là đáp án đúng
          if (txt.includes('*') || txt.toLowerCase().startsWith('(đúng)') || txt.toLowerCase().endsWith('(đúng)')) {
            isCorrect = true;
            hasCorrect = true;
            cleanText = txt.replace(/\*/g, '').replace(/\(đúng\)/gi, '').trim();
          }

          return {
            id: ids[aIdx] || `ans-${aIdx}`,
            text: cleanText,
            isCorrect: isCorrect,
            color: colors[aIdx] || 'blue'
          };
        });

        // Nếu giáo viên quên đánh dấu *, mặc định câu đầu tiên đúng
        if (!hasCorrect && answers.length > 0) {
          answers[0].isCorrect = true;
        }

        parsedQuestions.push({
          id: `q-import-${qIdx + 1}`,
          question: questionText,
          timeLimit: 15,
          points: 1000,
          answers
        });
      }
    });

    if (parsedQuestions.length === 0) {
      return res.status(400).json({
        error: 'Không nhận diện được câu hỏi nào! Vui lòng dùng định dạng: Nội dung câu hỏi | Đáp án A | Đáp án B* | Đáp án C | Đáp án D (Dấu * là đáp án đúng).'
      });
    }

    const newQuiz = {
      id: 'quiz-import-' + Date.now(),
      title: (title || 'Bộ đề Tải Lên ' + new Date().toLocaleDateString('vi-VN')).trim(),
      description: `Đã nhập thành công ${parsedQuestions.length} câu hỏi từ văn bản tải lên.`,
      category: (category || 'Đề Tải Lên').trim(),
      questions: parsedQuestions
    };

    quizzesData.unshift(newQuiz);
    saveQuizzesToFile();
    res.json({ success: true, quiz: newQuiz, count: parsedQuestions.length });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi phân tích file tải lên: ' + err.message });
  }
});

// 1. GET danh sách bộ câu hỏi (hỗ trợ lọc published=true cho học sinh, đồng thời luôn hiển thị mọi bộ có câu hỏi để người dùng tạo xong là chơi được ngay!)
app.get('/api/custom-question-sets', (req, res) => {
  const sets = loadCustomQuestionSets();
  const { published, subject, grade, playableOnly } = req.query;
  
  let filtered = sets;
  if (published === 'true') {
    // Luôn ưu tiên hiển thị: các bộ đã xuất bản HOẶC bất kỳ bộ nào có ít nhất 1 câu hỏi (người dùng tự tạo hoặc tải lên)
    filtered = filtered.filter(s => 
      s.status === 'published' || (Array.isArray(s.questions) && s.questions.length > 0)
    );
  }
  if (playableOnly === 'true') {
    filtered = filtered.filter(s => Array.isArray(s.questions) && s.questions.length > 0);
  }
  if (subject && subject !== 'all') {
    filtered = filtered.filter(s => s.subject === subject);
  }
  if (grade && grade !== 'all') {
    filtered = filtered.filter(s => s.grade === parseInt(grade, 10));
  }

  // Tóm tắt metadata để danh sách tải siêu nhanh
  const summary = filtered.map(s => ({
    id: s.id,
    title: s.title,
    subject: s.subject,
    grade: s.grade,
    topic: s.topic,
    description: s.description,
    difficulty: s.difficulty || 'medium',
    status: s.status || 'draft',
    isPublished: s.status === 'published',
    isPlayable: Array.isArray(s.questions) && s.questions.length > 0,
    questionCount: (s.questions || []).length,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    version: s.version || 1
  }));

  res.json({ success: true, total: summary.length, data: summary });
});

// 2. GET chi tiết 1 bộ câu hỏi (kèm danh sách toàn bộ câu hỏi)
app.get('/api/custom-question-sets/:id', (req, res) => {
  const sets = loadCustomQuestionSets();
  const set = sets.find(s => s.id === req.params.id);
  if (!set) {
    return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi này!' });
  }
  res.json({ success: true, data: set });
});

// 3. POST tạo bộ câu hỏi mới (mặc định bản nháp)
app.post('/api/custom-question-sets', [optionalAuth, forbidStudentMutation], (req, res) => {
  try {
    const { title, subject, grade, topic, description, difficulty, questions } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Tên bộ câu hỏi không được để trống!' });
    }

    const sets = loadCustomQuestionSets();
    const newId = 'qs-' + Date.now();
    const initialQuestions = Array.isArray(questions) ? questions : [];

    const newSet = {
      id: newId,
      title: title.trim(),
      subject: (subject || 'math').trim(),
      grade: parseInt(grade, 10) || 5,
      topic: (topic || 'Chủ đề tổng hợp').trim(),
      description: (description || '').trim(),
      difficulty: difficulty || 'medium',
      status: (initialQuestions.length > 0) ? 'published' : (req.body.status || 'draft'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      questions: initialQuestions
    };

    sets.unshift(newSet);
    saveCustomQuestionSets(sets);

    res.json({ success: true, message: 'Tạo bộ câu hỏi thành công!', data: newSet });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi tạo bộ câu hỏi: ' + err.message });
  }
});

// 4. PUT cập nhật bộ câu hỏi (lưu nháp hoặc xuất bản)
app.put('/api/custom-question-sets/:id', [optionalAuth, forbidStudentMutation], (req, res) => {
  try {
    const sets = loadCustomQuestionSets();
    const index = sets.findIndex(s => s.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi cần sửa!' });
    }

    const currentSet = sets[index];
    const { title, subject, grade, topic, description, difficulty, status, questions } = req.body;

    const updatedQuestions = Array.isArray(questions) ? questions : currentSet.questions;

    // KIỂM TRA TÍNH HỢP LỆ KHI XUẤT BẢN: CẦN ÍT NHẤT 1 CÂU HỎI
    if (status === 'published') {
      if (!Array.isArray(updatedQuestions) || updatedQuestions.length === 0) {
        return res.status(400).json({
          error: `Để Xuất Bản cho học sinh chơi, bộ câu hỏi cần có ít nhất 1 câu hỏi hợp lệ! Hãy thêm câu hỏi trước khi xuất bản.`
        });
      }

      // Kiểm tra từng câu hỏi
      for (let i = 0; i < updatedQuestions.length; i++) {
        const q = updatedQuestions[i];
        if (!q.question || !q.question.trim()) {
          return res.status(400).json({ error: `Câu số ${i + 1} chưa có nội dung câu hỏi!` });
        }
        if (!Array.isArray(q.options) || q.options.length < 2) {
          return res.status(400).json({ error: `Câu số ${i + 1} cần có ít nhất 2 đáp án lựa chọn!` });
        }
        if (!q.correctAnswer || !q.correctAnswer.trim()) {
          return res.status(400).json({ error: `Câu số ${i + 1} chưa chọn đáp án đúng!` });
        }
      }
    }

    const updatedSet = {
      ...currentSet,
      title: title !== undefined ? title.trim() : currentSet.title,
      subject: subject !== undefined ? subject.trim() : currentSet.subject,
      grade: grade !== undefined ? parseInt(grade, 10) : currentSet.grade,
      topic: topic !== undefined ? topic.trim() : currentSet.topic,
      description: description !== undefined ? description.trim() : currentSet.description,
      difficulty: difficulty !== undefined ? difficulty : currentSet.difficulty,
      status: status !== undefined ? status : currentSet.status,
      questions: updatedQuestions,
      updatedAt: new Date().toISOString(),
      version: (currentSet.version || 1) + 1
    };

    sets[index] = updatedSet;
    saveCustomQuestionSets(sets);

    res.json({ success: true, message: 'Cập nhật bộ câu hỏi thành công!', data: updatedSet });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi server khi cập nhật: ' + err.message });
  }
});

// 4b. POST chuyển đổi nhanh trạng thái Xuất Bản / Bản Nháp
app.post('/api/custom-question-sets/:id/toggle-publish', [optionalAuth, forbidStudentMutation], (req, res) => {
  try {
    const sets = loadCustomQuestionSets();
    const set = sets.find(s => s.id === req.params.id);
    if (!set) return res.status(404).json({ error: 'Không tìm thấy bộ đề!' });
    set.status = (set.status === 'published') ? 'draft' : 'published';
    set.updatedAt = new Date().toISOString();
    saveCustomQuestionSets(sets);
    res.json({ success: true, status: set.status, message: `Đã đổi trạng thái sang ${set.status === 'published' ? 'Đã Xuất Bản' : 'Bản Nháp'}!` });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi cập nhật: ' + err.message });
  }
});

// 5. DELETE xóa bộ câu hỏi
app.delete('/api/custom-question-sets/:id', [optionalAuth, forbidStudentMutation], (req, res) => {
  try {
    let sets = loadCustomQuestionSets();
    const beforeCount = sets.length;
    sets = sets.filter(s => s.id !== req.params.id);
    if (sets.length === beforeCount) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi cần xóa!' });
    }
    saveCustomQuestionSets(sets);
    res.json({ success: true, message: 'Đã xóa bộ câu hỏi thành công!' });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi xóa bộ câu hỏi: ' + err.message });
  }
});

// 6. POST nhân bản bộ câu hỏi (Duplicate)
app.post('/api/custom-question-sets/:id/duplicate', [optionalAuth, forbidStudentMutation], (req, res) => {
  try {
    const sets = loadCustomQuestionSets();
    const source = sets.find(s => s.id === req.params.id);
    if (!source) {
      return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi nguồn!' });
    }

    const duplicated = {
      ...JSON.parse(JSON.stringify(source)),
      id: 'qs-' + Date.now(),
      title: `${source.title} (Bản sao)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1
    };

    sets.unshift(duplicated);
    saveCustomQuestionSets(sets);
    res.json({ success: true, message: 'Nhân bản thành công!', data: duplicated });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi nhân bản: ' + err.message });
  }
});

// 7. GET xuất file JSON bộ câu hỏi
app.get('/api/custom-question-sets/:id/export', (req, res) => {
  const sets = loadCustomQuestionSets();
  const set = sets.find(s => s.id === req.params.id);
  if (!set) return res.status(404).json({ error: 'Không tìm thấy bộ câu hỏi!' });

  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(set.title)}.json"`);
  res.send(JSON.stringify(set, null, 2));
});

// 8. POST nhập câu hỏi từ JSON / CSV
app.post('/api/custom-question-sets/import', [optionalAuth, forbidStudentMutation], (req, res) => {
  try {
    const { title, subject, grade, topic, description, rawData, format } = req.body;
    let questions = [];

    if (format === 'json') {
      const parsed = typeof rawData === 'string' ? JSON.parse(rawData) : rawData;
      if (Array.isArray(parsed)) {
        questions = parsed;
      } else if (parsed && Array.isArray(parsed.questions)) {
        questions = parsed.questions;
      }
    } else {
      // Định dạng CSV / Text: Mỗi dòng: Câu hỏi | Đáp án 1 | Đáp án 2* | Đáp án 3 | Đáp án 4 | Lời giải
      const lines = rawData.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      lines.forEach((line, idx) => {
        const parts = line.split(/[|;\t]/).map(p => p.trim());
        if (parts.length >= 3) {
          const qText = parts[0];
          const rawOpts = parts.slice(1, 5);
          const explanation = parts[5] || '';
          let correct = '';
          const cleanOpts = rawOpts.map(opt => {
            if (opt.includes('*') || opt.toLowerCase().startsWith('(đúng)')) {
              const clean = opt.replace(/\*/g, '').replace(/\(đúng\)/gi, '').trim();
              correct = clean;
              return clean;
            }
            return opt;
          });
          if (!correct && cleanOpts.length > 0) correct = cleanOpts[0];

          questions.push({
            id: `q-${idx + 1}`,
            question: qText,
            options: cleanOpts,
            correctAnswer: correct,
            explanation: explanation,
            difficulty: 'medium',
            damage: 30
          });
        }
      });
    }

    const sets = loadCustomQuestionSets();
    const newSet = {
      id: 'qs-' + Date.now(),
      title: (title || 'Bộ đề nhập file ' + new Date().toLocaleDateString('vi-VN')).trim(),
      subject: subject || 'math',
      grade: parseInt(grade, 10) || 5,
      topic: topic || 'Chủ đề tùy chỉnh',
      description: description || `Đã nhập thành công ${questions.length} câu hỏi.`,
      difficulty: 'medium',
      status: questions.length > 0 ? 'published' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      questions
    };

    sets.unshift(newSet);
    saveCustomQuestionSets(sets);

    res.json({ success: true, count: questions.length, data: newSet });
  } catch (err) {
    res.status(500).json({ error: 'Lỗi nhập dữ liệu: ' + err.message });
  }
});

// REST API: AI Generate Quiz
app.post('/api/ai-generate', async (req, res) => {
  try {
    const { topic, text, count = 5, difficulty = 'Vừa phải', apiKey } = req.body;
    const effectiveApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (effectiveApiKey) {
      try {
        const prompt = `Bạn là chuyên gia thiết kế game giáo dục vui nhộn cho học sinh khởi động đầu giờ học.
Hãy tạo bộ ${count} câu hỏi trắc nghiệm tiếng Việt theo chủ đề/văn bản sau:
Chủ đề: "${topic || 'Khởi động bài học'}"
Văn bản đính kèm: "${text || ''}"
Độ khó: ${difficulty}
Yêu cầu:
1. Câu hỏi ngắn gọn, vui vẻ, kích thích tư duy, gây tò mò.
2. Mỗi câu có đúng 4 phương án, chỉ DUY NHẤT 1 phương án đúng.
3. Trả về ĐÚNG ĐỊNH DẠNG JSON sau (không kèm markdown):
{
  "title": "Tiêu đề bộ đề",
  "description": "Mô tả ngắn gọn",
  "questions": [
    {
      "question": "Nội dung câu hỏi?",
      "timeLimit": 15,
      "points": 1000,
      "answers": [
        { "id": "a", "text": "Phương án A", "isCorrect": false, "color": "red" },
        { "id": "b", "text": "Phương án B", "isCorrect": true, "color": "blue" },
        { "id": "c", "text": "Phương án C", "isCorrect": false, "color": "yellow" },
        { "id": "d", "text": "Phương án D", "isCorrect": false, "color": "green" }
      ]
    }
  ]
}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${effectiveApiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
          })
        });

        if (response.ok) {
          const data = await response.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
          const parsed = JSON.parse(rawText);
          parsed.id = 'ai-quiz-' + Date.now();
          quizzesData.unshift(parsed);
          saveQuizzesToFile();
          return res.json({ success: true, quiz: parsed, source: 'gemini' });
        }
      } catch (geminiError) {
        console.warn("Lỗi gọi Gemini API, chuyển sang Smart Educational Generator fallback:", geminiError.message);
      }
    }

    // Heuristic Smart Generator Fallback
    const generatedQuiz = generateSmartFallbackQuiz(topic, text, count, difficulty);
    quizzesData.unshift(generatedQuiz);
    saveQuizzesToFile();
    return res.json({ success: true, quiz: generatedQuiz, source: 'smart-template' });
  } catch (error) {
    console.error("Lỗi AI generate:", error);
    res.status(500).json({ error: 'Không thể tạo đề lúc này' });
  }
});

function generateSmartFallbackQuiz(topic = '', text = '', count = 5, difficulty = 'Vừa phải') {
  const cleanTopic = topic.trim() || 'Khởi động Não Bộ';
  const questionPool = [
    {
      q: `Theo chủ đề "${cleanTopic}", điều cốt lõi giúp học sinh ghi nhớ sâu và lâu nhất là gì?`,
      correct: 'Chủ động tư duy và vận dụng vào bài tập thực tế',
      wrongs: ['Học vẹt thuộc lòng không cần hiểu', 'Chờ đợi đáp án từ người khác', 'Chỉ đọc lướt qua một lần']
    },
    {
      q: `Đố vui tư duy: Khi bắt đầu tìm hiểu về "${cleanTopic}", bước khởi đầu quan trọng nhất là:`,
      correct: 'Nắm vững các khái niệm và nguyên lý cơ bản',
      wrongs: ['Giải ngay những bài toán siêu phức tạp', 'Bỏ qua bước đọc kỹ đề bài', 'Đoán mò theo cảm tính']
    },
    {
      q: `Phương pháp nào sau đây giúp cả lớp thảo luận hiệu quả nhất về "${cleanTopic}"?`,
      correct: 'Lắng nghe tích cực và tôn trọng ý kiến đồng đội',
      wrongs: ['Ngắt lời khi bạn đang trình bày', 'Không chia sẻ quan điểm của mình', 'Chỉ một người làm toàn bộ']
    },
    {
      q: `Tốc độ phản xạ: Trong thực tiễn, việc ứng dụng "${cleanTopic}" mang lại lợi ích gì?`,
      correct: 'Tối ưu hóa thời gian và nâng cao hiệu suất làm việc',
      wrongs: ['Làm phức tạp thêm vấn đề', 'Không đem lại giá trị ứng dụng', 'Khiến công việc đình trệ']
    },
    {
      q: `Câu hỏi thử thách: Nếu gặp một bài tập lạ về "${cleanTopic}", hành động đúng đắn là gì?`,
      correct: 'Phân tích dữ kiện, chia nhỏ bài toán để xử lý từng bước',
      wrongs: ['Bỏ qua ngay lập tức', 'Chọn bừa phương án bất kỳ', 'Đóng sách vở lại']
    }
  ];

  const questions = [];
  const colors = ['red', 'blue', 'yellow', 'green'];
  const ids = ['a', 'b', 'c', 'd'];

  const selected = questionPool.slice(0, Math.min(count, questionPool.length));
  selected.forEach((item, idx) => {
    const rawOptions = [
      { text: item.correct, isCorrect: true },
      { text: item.wrongs[0], isCorrect: false },
      { text: item.wrongs[1], isCorrect: false },
      { text: item.wrongs[2], isCorrect: false }
    ].sort(() => Math.random() - 0.5);

    questions.push({
      id: `q-smart-${idx + 1}`,
      question: item.q,
      timeLimit: 15,
      points: 1000,
      answers: rawOptions.map((ans, aIdx) => ({
        id: ids[aIdx],
        text: ans.text,
        isCorrect: ans.isCorrect,
        color: colors[aIdx]
      }))
    });
  });

  return {
    id: 'ai-quiz-' + Date.now(),
    title: `⚡ Khởi Động: ${cleanTopic}`,
    description: `Bộ đề khởi động thông minh cho chủ đề "${cleanTopic}" (${difficulty})`,
    category: cleanTopic,
    questions
  };
}

// Logic Gold Quest Mystery Chests
function generateChestsForPlayer(player, room) {
  const outcomesPool = [
    { type: 'GOLD_ADD', value: 100, label: '+100 Vàng! 🪙', sound: 'coin' },
    { type: 'GOLD_ADD', value: 250, label: '+250 Vàng! 💰', sound: 'coin' },
    { type: 'GOLD_ADD', value: 500, label: '+500 Vàng Khủng! 💎', sound: 'jackpot' },
    { type: 'GOLD_MULT', value: 1.5, label: '+50% Kho Vàng! 🚀', sound: 'jackpot' },
    { type: 'GOLD_LOSE', value: 0.25, label: 'Úi! Mất 25% Vàng! 💥', sound: 'lose' },
    { type: 'SWAP', label: 'HOÁN ĐỔI VÀNG VỚI TOP 1! 🔄', sound: 'swap' },
    { type: 'STEAL', value: 0.25, label: 'CƯỚP 25% VÀNG TỪ TOP 1! 🥷', sound: 'steal' }
  ];
  const shuffled = outcomesPool.sort(() => Math.random() - 0.5).slice(0, 3);
  return shuffled.map((outcome, idx) => ({ chestIndex: idx, outcome }));
}

function applyChestReward(player, outcome, room) {
  player.gold = player.gold || 0;
  let logMessage = '';
  const allPlayers = Object.values(room.players).sort((a, b) => (b.gold || 0) - (a.gold || 0));
  const topPlayer = allPlayers.find(p => p.id !== player.id) || allPlayers[0];

  switch (outcome.type) {
    case 'GOLD_ADD':
      player.gold += outcome.value;
      logMessage = `${player.nickname} vừa nhận được +${outcome.value} vàng!`;
      break;
    case 'GOLD_MULT':
      const bonus = Math.round(player.gold * 0.5);
      player.gold += bonus;
      logMessage = `${player.nickname} tăng thêm 50% vàng (+${bonus} vàng)!`;
      break;
    case 'GOLD_LOSE':
      const lost = Math.round(player.gold * outcome.value);
      player.gold = Math.max(0, player.gold - lost);
      logMessage = `Úi chà! ${player.nickname} rơi trúng bẫy và mất ${lost} vàng!`;
      break;
    case 'SWAP':
      if (topPlayer && topPlayer.id !== player.id && topPlayer.gold > player.gold) {
        const myOldGold = player.gold;
        player.gold = topPlayer.gold;
        topPlayer.gold = myOldGold;
        logMessage = `⚡ ĐỈNH CAO: ${player.nickname} vừa ĐỔI TOÀN BỘ VÀNG với ${topPlayer.nickname}!`;
      } else {
        player.gold += 300;
        logMessage = `${player.nickname} nhận +300 vàng chiến lợi phẩm!`;
      }
      break;
    case 'STEAL':
      if (topPlayer && topPlayer.id !== player.id && topPlayer.gold > 0) {
        const stolen = Math.round(topPlayer.gold * outcome.value);
        topPlayer.gold = Math.max(0, topPlayer.gold - stolen);
        player.gold += stolen;
        logMessage = `🥷 ĐỘT KÍCH: ${player.nickname} vừa cướp ${stolen} vàng từ ${topPlayer.nickname}!`;
      } else {
        player.gold += 200;
        logMessage = `${player.nickname} nhận +200 vàng chiến lợi phẩm!`;
      }
      break;
  }
  return logMessage;
}

// SOCKET.IO REALTIME ENGINE
io.on('connection', (socket) => {
  // 1. Host tạo phòng
  socket.on('host_create_room', async ({ quizId, gameMode = 'classic' }) => {
    const pin = generateRoomCode();
    const quiz = quizzesData.find(q => q.id === quizId) || quizzesData[0];

    const hostAddress = socket.handshake.headers.host || `localhost:${PORT}`;
    const joinUrl = `http://${hostAddress}/player.html?pin=${pin}`;
    const qrCodeDataUrl = await QRCode.toDataURL(joinUrl, { margin: 1, width: 220 });

    // Khởi tạo Boss nếu là chế độ Phiêu Lưu Adventure
    const bossTemplate = BOSS_ROSTER[Math.floor(Math.random() * BOSS_ROSTER.length)];
    const bossTotalHp = Math.max(3000, quiz.questions.length * 1500);

    rooms[pin] = {
      pin,
      hostSocketId: socket.id,
      gameMode, // 'classic' | 'goldquest' | 'adventure'
      quiz,
      currentQuestionIndex: -1,
      state: 'LOBBY',
      players: {},
      timerInterval: null,
      remainingTime: 0,
      // Thống kê Boss trong Adventure RPG Mode
      boss: {
        name: bossTemplate.name,
        avatar: bossTemplate.avatar,
        maxHp: bossTotalHp,
        currentHp: bossTotalHp,
        isDefeated: false,
        totalDamageReceived: 0
      },
      questionAnalytics: [] // Phân tích câu hỏi nào học sinh sai nhiều nhất
    };

    socket.join(pin);
    socket.emit('room_created', {
      pin,
      joinUrl,
      qrCodeDataUrl,
      quizTitle: quiz.title,
      gameMode,
      totalQuestions: quiz.questions.length,
      boss: rooms[pin].boss
    });
  });

  // 2. Học sinh vào phòng (chọn Avatar & Hero Class)
  socket.on('player_join_room', ({ pin, nickname, avatar, heroClass = 'warrior' }) => {
    const room = rooms[pin];
    if (!room) {
      return socket.emit('join_error', { message: 'Mã PIN phòng không tồn tại hoặc đã kết thúc!' });
    }
    if (room.state !== 'LOBBY') {
      return socket.emit('join_error', { message: 'Trò chơi đã bắt đầu, không thể vào lúc này!' });
    }

    const cleanName = (nickname || 'Học sinh').trim().slice(0, 20);
    const player = {
      id: socket.id,
      nickname: cleanName,
      avatar: avatar || '🐱',
      heroClass: heroClass || 'warrior', // 'warrior' (Chiến binh), 'mage' (Phù thủy), 'archer' (Cung thủ), 'knight' (Hiệp sĩ)
      score: 0,
      streak: 0,
      gold: 0,
      mana: 0, // Nộ khí cho Adventure RPG
      totalDamageDealt: 0,
      lastAnswer: null,
      isAnswered: false,
      lastAnswerCorrect: false
    };

    room.players[socket.id] = player;
    socket.join(pin);

    socket.emit('player_join_success', {
      pin,
      nickname: player.nickname,
      avatar: player.avatar,
      heroClass: player.heroClass,
      gameMode: room.gameMode
    });

    // Cập nhật sảnh chờ Host
    io.to(room.hostSocketId).emit('update_player_list', {
      players: Object.values(room.players),
      totalPlayers: Object.keys(room.players).length
    });
  });

  // 3. Host bắt đầu game
  socket.on('host_start_game', ({ pin }) => {
    const room = rooms[pin];
    if (!room || room.hostSocketId !== socket.id) return;
    if (Object.keys(room.players).length === 0) {
      return socket.emit('host_error', { message: 'Chưa có học sinh nào tham gia sảnh chờ!' });
    }

    // Tự động cân bằng máu Boss theo số lượng học sinh trong phòng
    const playerCount = Math.max(1, Object.keys(room.players).length);
    room.boss.maxHp = Math.round(room.quiz.questions.length * playerCount * 600);
    room.boss.currentHp = room.boss.maxHp;

    room.state = 'COUNTDOWN';
    io.to(pin).emit('game_countdown', { count: 3 });

    setTimeout(() => {
      sendNextQuestion(room);
    }, 3500);
  });

  // 4. Học sinh nộp bài
  socket.on('player_submit_answer', ({ pin, answerId, answerTimeMs }) => {
    const room = rooms[pin];
    if (!room || room.state !== 'QUESTION') return;

    const player = room.players[socket.id];
    if (!player || player.isAnswered) return;

    const currentQ = room.quiz.questions[room.currentQuestionIndex];
    if (!currentQ) return;

    const chosenAnswer = currentQ.answers.find(a => a.id === answerId);
    const isCorrect = chosenAnswer ? chosenAnswer.isCorrect : false;

    player.isAnswered = true;
    player.lastAnswer = answerId;
    player.lastAnswerCorrect = isCorrect;

    let pointsEarned = 0;
    let damageDealt = 0;
    let isCriticalHit = false;

    if (isCorrect) {
      player.streak += 1;
      const timeBonusFactor = Math.max(0.3, room.remainingTime / (currentQ.timeLimit || 15));
      pointsEarned = Math.round(currentQ.points * (0.5 + 0.5 * timeBonusFactor));
      if (player.streak > 1) {
        pointsEarned += Math.min(500, (player.streak - 1) * 100);
      }
      player.score += pointsEarned;

      // Xử lý chế độ Phiêu Lưu Adventure RPG
      if (room.gameMode === 'adventure') {
        damageDealt = pointsEarned;
        // Phù thủy (Mage) có 40% tỉ lệ chí mạng 1.8x
        if (player.heroClass === 'mage' && Math.random() < 0.4) {
          damageDealt = Math.round(damageDealt * 1.8);
          isCriticalHit = true;
        }
        // Cung thủ (Archer) tăng nộ cực nhanh
        player.mana = Math.min(100, (player.mana || 0) + (player.heroClass === 'archer' ? 40 : 25));
        player.totalDamageDealt += damageDealt;

        // Trừ máu Boss
        room.boss.currentHp = Math.max(0, room.boss.currentHp - damageDealt);
        room.boss.totalDamageReceived += damageDealt;

        // Phát sự kiện tấn công Boss lên Host và các bạn
        io.to(pin).emit('boss_damaged_event', {
          attackerName: player.nickname,
          attackerAvatar: player.avatar,
          heroClass: player.heroClass,
          damage: damageDealt,
          isCrit: isCriticalHit,
          bossHp: room.boss.currentHp,
          bossMaxHp: room.boss.maxHp,
          bossPercent: Math.round((room.boss.currentHp / room.boss.maxHp) * 100)
        });
      }
    } else {
      player.streak = 0;
    }

    // Nếu là Gold Quest và đúng -> gửi rương báu
    if (room.gameMode === 'goldquest' && isCorrect) {
      const chests = generateChestsForPlayer(player, room);
      player.pendingChests = chests;
      socket.emit('goldquest_chests_available', { chests });
    }

    socket.emit('player_answer_result', {
      isCorrect,
      pointsEarned,
      currentScore: player.score,
      streak: player.streak,
      damageDealt,
      isCriticalHit,
      mana: player.mana || 0,
      correctAnswerId: isCorrect ? answerId : (currentQ.answers.find(a => a.isCorrect)?.id)
    });

    // Cập nhật tiến độ nộp bài cho Host
    const answeredCount = Object.values(room.players).filter(p => p.isAnswered).length;
    const totalPlayers = Object.keys(room.players).length;
    io.to(room.hostSocketId).emit('update_answers_progress', { answeredCount, totalPlayers });

    if (answeredCount >= totalPlayers && totalPlayers > 0) {
      clearInterval(room.timerInterval);
      finishQuestion(room);
    }
  });

  // 5. Học sinh thi triển Tuyệt Chiêu Nộ (Adventure Ultimate Strike)
  socket.on('player_cast_ultimate', ({ pin }) => {
    const room = rooms[pin];
    if (!room || room.gameMode !== 'adventure') return;
    const player = room.players[socket.id];
    if (!player || (player.mana || 0) < 100) return;

    player.mana = 0;
    const ultDamage = 2500;
    room.boss.currentHp = Math.max(0, room.boss.currentHp - ultDamage);

    io.to(pin).emit('boss_damaged_event', {
      attackerName: `⚡ CHIÊU THỨC TỐI THƯỢNG: ${player.nickname}`,
      attackerAvatar: '💥',
      heroClass: player.heroClass,
      damage: ultDamage,
      isCrit: true,
      bossHp: room.boss.currentHp,
      bossMaxHp: room.boss.maxHp,
      bossPercent: Math.round((room.boss.currentHp / room.boss.maxHp) * 100)
    });

    socket.emit('ultimate_cast_success');
  });

  // 6. Học sinh chọn rương Gold Quest
  socket.on('player_select_chest', ({ pin, chestIndex }) => {
    const room = rooms[pin];
    if (!room || room.gameMode !== 'goldquest') return;
    const player = room.players[socket.id];
    if (!player || !player.pendingChests) return;

    const chosen = player.pendingChests.find(c => c.chestIndex === chestIndex);
    if (!chosen) return;

    const outcome = chosen.outcome;
    const logMsg = applyChestReward(player, outcome, room);
    delete player.pendingChests;

    socket.emit('chest_opened_result', {
      outcome,
      currentGold: player.gold
    });

    io.to(pin).emit('goldquest_event_log', {
      message: logMsg,
      players: Object.values(room.players)
    });
  });

  // 7. Host chuyển câu hỏi
  socket.on('host_next_question', ({ pin }) => {
    const room = rooms[pin];
    if (!room || room.hostSocketId !== socket.id) return;
    sendNextQuestion(room);
  });

  // Ngắt kết nối
  socket.on('disconnect', () => {
    for (const pin in rooms) {
      const room = rooms[pin];
      if (room.hostSocketId === socket.id) {
        clearInterval(room.timerInterval);
        io.to(pin).emit('room_closed', { message: 'Giáo viên đã kết thúc phòng chơi!' });
        delete rooms[pin];
        break;
      } else if (room.players[socket.id]) {
        delete room.players[socket.id];
        io.to(room.hostSocketId).emit('update_player_list', {
          players: Object.values(room.players),
          totalPlayers: Object.keys(room.players).length
        });
        break;
      }
    }
  });
});

function sendNextQuestion(room) {
  room.currentQuestionIndex += 1;

  if (room.currentQuestionIndex >= room.quiz.questions.length) {
    room.state = 'FINISHED';
    const sortedPlayers = Object.values(room.players).sort((a, b) => {
      if (room.gameMode === 'goldquest') return (b.gold || 0) - (a.gold || 0);
      if (room.gameMode === 'adventure') return (b.totalDamageDealt || 0) - (a.totalDamageDealt || 0);
      return b.score - a.score;
    });

    io.to(room.pin).emit('game_finished', {
      podium: sortedPlayers.slice(0, 3),
      allRankings: sortedPlayers,
      gameMode: room.gameMode,
      boss: room.boss,
      questionAnalytics: room.questionAnalytics
    });
    return;
  }

  // Reset trạng thái từng học sinh
  Object.values(room.players).forEach(p => {
    p.isAnswered = false;
    p.lastAnswer = null;
    p.lastAnswerCorrect = false;
    delete p.pendingChests;
  });

  const question = room.quiz.questions[room.currentQuestionIndex];
  room.state = 'QUESTION';
  room.remainingTime = question.timeLimit || 15;

  io.to(room.hostSocketId).emit('question_start', {
    questionIndex: room.currentQuestionIndex + 1,
    totalQuestions: room.quiz.questions.length,
    questionText: question.question,
    timeLimit: question.timeLimit || 15,
    answers: question.answers.map(a => ({ id: a.id, text: a.text, color: a.color })),
    gameMode: room.gameMode,
    boss: room.boss
  });

  io.to(room.pin).emit('player_question_start', {
    questionIndex: room.currentQuestionIndex + 1,
    totalQuestions: room.quiz.questions.length,
    timeLimit: question.timeLimit || 15,
    gameMode: room.gameMode,
    questionText: (room.gameMode === 'goldquest' || room.gameMode === 'adventure') ? question.question : null,
    answers: question.answers.map(a => ({
      id: a.id,
      color: a.color,
      text: (room.gameMode === 'goldquest' || room.gameMode === 'adventure') ? a.text : ''
    })),
    boss: room.boss
  });

  clearInterval(room.timerInterval);
  room.timerInterval = setInterval(() => {
    room.remainingTime -= 1;
    io.to(room.pin).emit('timer_tick', { remainingTime: room.remainingTime });

    if (room.remainingTime === 5) {
      io.to(room.pin).emit('timer_rush_5s');
    }

    if (room.remainingTime <= 0) {
      clearInterval(room.timerInterval);
      finishQuestion(room);
    }
  }, 1000);
}

function finishQuestion(room) {
  room.state = 'RESULT';
  const currentQ = room.quiz.questions[room.currentQuestionIndex];
  const correctAnswer = currentQ.answers.find(a => a.isCorrect);

  const stats = { a: 0, b: 0, c: 0, d: 0 };
  let correctCount = 0;
  const totalInRoom = Object.keys(room.players).length;

  Object.values(room.players).forEach(p => {
    if (p.lastAnswer && stats[p.lastAnswer] !== undefined) {
      stats[p.lastAnswer] += 1;
      if (p.lastAnswerCorrect) correctCount++;
    }
  });

  // Lưu phân tích cho giáo viên
  room.questionAnalytics.push({
    questionIndex: room.currentQuestionIndex + 1,
    questionText: currentQ.question,
    correctCount,
    totalPlayers: totalInRoom,
    accuracyPercent: totalInRoom > 0 ? Math.round((correctCount / totalInRoom) * 100) : 0
  });

  const leaderboard = Object.values(room.players)
    .sort((a, b) => {
      if (room.gameMode === 'goldquest') return (b.gold || 0) - (a.gold || 0);
      if (room.gameMode === 'adventure') return (b.totalDamageDealt || 0) - (a.totalDamageDealt || 0);
      return b.score - a.score;
    })
    .map(p => ({
      id: p.id,
      nickname: p.nickname,
      avatar: p.avatar,
      heroClass: p.heroClass,
      score: p.score,
      gold: p.gold,
      totalDamageDealt: p.totalDamageDealt,
      streak: p.streak
    }));

  io.to(room.hostSocketId).emit('question_result', {
    correctAnswerId: correctAnswer?.id,
    correctAnswerText: correctAnswer?.text,
    stats,
    leaderboard: leaderboard.slice(0, 5),
    isLastQuestion: room.currentQuestionIndex === room.quiz.questions.length - 1,
    gameMode: room.gameMode,
    boss: room.boss
  });

  io.to(room.pin).emit('question_time_up', {
    correctAnswerId: correctAnswer?.id
  });
}

server.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 EDUQUEST GAME SERVER 2.0 (Classic + Gold Quest + Adventure RPG)`);
  console.log(`💻 Màn hình máy chiếu (Host):  http://localhost:${PORT}/host.html`);
  console.log(`📱 Màn hình học sinh (Player): http://localhost:${PORT}/player.html`);
  console.log(`🏠 Trang chủ:                 http://localhost:${PORT}/`);
  console.log(`====================================================`);
});
