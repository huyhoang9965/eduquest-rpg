// HOST CONTROLLER SCRIPT 2.0 (STUDIO & ADVENTURE RPG)
const socket = io();

// State biến
let currentRoomPin = null;
let currentQuizId = null;
let currentGameMode = 'classic';
let loadedQuizzes = [];
let latestLeaderboard = [];
let isLastQuestionFlag = false;
let currentBossData = null;

// DOM Elements
const views = {
  setup: document.getElementById('viewSetup'),
  lobby: document.getElementById('viewLobby'),
  question: document.getElementById('viewQuestion'),
  result: document.getElementById('viewResult'),
  leaderboard: document.getElementById('viewLeaderboard'),
  podium: document.getElementById('viewPodium')
};

function switchView(viewName) {
  Object.keys(views).forEach(k => {
    if (k === viewName) {
      views[k].classList.remove('hidden');
      views[k].classList.add('flex');
    } else {
      views[k].classList.add('hidden');
      views[k].classList.remove('flex');
    }
  });
}

// ==========================================
// 1. TẢI VÀ HIỂN THỊ DANH SÁCH BỘ CÂU HỎI
// ==========================================
async function loadQuizzes() {
  try {
    const res = await fetch('/api/quizzes');
    loadedQuizzes = await res.json();
    renderQuizList();
  } catch (e) {
    console.error("Lỗi khi tải bộ đề:", e);
  }
}

function renderQuizList() {
  const container = document.getElementById('quizListContainer');
  document.getElementById('quizCountBadge').textContent = `${loadedQuizzes.length} bộ đề`;

  if (!loadedQuizzes.length) {
    container.innerHTML = '<div class="text-gray-400 col-span-2 text-center py-8">Chưa có bộ đề nào. Hãy bấm "Tự Soạn Câu Hỏi" hoặc "Tải Lên"!</div>';
    return;
  }

  container.innerHTML = loadedQuizzes.map((q, idx) => {
    const isSelected = (!currentQuizId && idx === 0) || currentQuizId === q.id;
    if (isSelected) currentQuizId = q.id;

    return `
      <div onclick="selectQuiz('${q.id}')" 
        class="quiz-card p-4 rounded-2xl border-2 transition cursor-pointer relative group ${
          isSelected 
            ? 'border-purple-500 bg-purple-500/10 shadow-lg shadow-purple-500/20' 
            : 'border-white/10 bg-white/5 hover:border-white/30'
        }">
        <div class="flex items-start justify-between gap-2">
          <h4 class="font-extrabold text-white text-base leading-snug">${q.title}</h4>
          <span class="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300 font-semibold shrink-0">
            ${q.questions.length} câu
          </span>
        </div>
        <p class="text-xs text-gray-400 mt-2 line-clamp-2">${q.description || 'Bộ đề khởi động học tập'}</p>
        <div class="mt-3 flex items-center justify-between text-xs">
          <span class="text-purple-300 font-bold">🏷️ ${q.category || 'Tổng hợp'}</span>
          <button onclick="event.stopPropagation(); deleteQuiz('${q.id}')" class="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1" title="Xóa bộ đề này">🗑️</button>
        </div>
      </div>
    `;
  }).join('');
}

window.selectQuiz = function(quizId) {
  currentQuizId = quizId;
  window.soundEngine.playClick();
  renderQuizList();
};

window.deleteQuiz = async function(quizId) {
  if (!confirm("Bạn có chắc chắn muốn xóa bộ đề này?")) return;
  try {
    await fetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
    loadedQuizzes = loadedQuizzes.filter(q => q.id !== quizId);
    if (currentQuizId === quizId) currentQuizId = loadedQuizzes[0]?.id || null;
    renderQuizList();
  } catch (err) {
    alert("Lỗi xóa bộ đề: " + err.message);
  }
};

// Xuất bộ đề ra file JSON tải về
document.getElementById('btnExportQuiz').addEventListener('click', () => {
  const currentQuiz = loadedQuizzes.find(q => q.id === currentQuizId);
  if (!currentQuiz) return alert("Vui lòng chọn 1 bộ đề để xuất!");
  const blob = new Blob([JSON.stringify(currentQuiz, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${currentQuiz.title.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  a.click();
});

// ==========================================
// 2. KHỞI TẠO VÀ BẮT ĐẦU PHÒNG CHƠI
// ==========================================
document.getElementById('btnCreateRoom').addEventListener('click', () => {
  window.soundEngine.init();
  window.soundEngine.playClick();

  const selectedModeInput = document.querySelector('input[name="gameMode"]:checked');
  currentGameMode = selectedModeInput ? selectedModeInput.value : 'classic';

  socket.emit('host_create_room', {
    quizId: currentQuizId,
    gameMode: currentGameMode
  });
});

socket.on('room_created', (data) => {
  currentRoomPin = data.pin;
  currentGameMode = data.gameMode;
  currentBossData = data.boss;

  document.getElementById('headerPinCode').textContent = data.pin;
  document.getElementById('headerPinBadge').classList.remove('hidden');
  document.getElementById('headerPinBadge').classList.add('flex');

  document.getElementById('lobbyPinDisplay').textContent = data.pin;
  document.getElementById('lobbyQrCode').src = data.qrCodeDataUrl;

  const modeBadges = {
    classic: '⚡ Đấu Trường Tốc Độ (Kahoot)',
    adventure: '🏰 Phiêu Lưu Diệt Boss (RPG Quest)',
    goldquest: '🏴‍☠️ Truy Tìm Kho Báu (Blooket Gold)'
  };
  document.getElementById('lobbyModeBadge').textContent = modeBadges[data.gameMode] || 'Classic';
  document.getElementById('headerModeText').textContent = `Chế độ: ${modeBadges[data.gameMode]}`;

  switchView('lobby');
  window.soundEngine.playLobbyBGM();
});

let currentPlayersList = [];

socket.on('update_player_list', (data) => {
  currentPlayersList = data.players || [];
  const container = document.getElementById('lobbyPlayerGrid');
  const countLabel = document.getElementById('playerCountLabel');
  countLabel.textContent = `${data.totalPlayers} học sinh đã sẵn sàng`;

  if (!data.players.length) {
    container.innerHTML = '<div class="text-gray-400 text-sm py-4 w-full text-center italic">Đang chờ học sinh đầu tiên nhập mã PIN...</div>';
    return;
  }

  container.innerHTML = data.players.map(p => `
    <div class="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/10 border border-white/20 animate-bounce duration-300">
      <span class="text-2xl">${p.avatar || '🐱'}</span>
      <div class="text-left">
        <span class="font-extrabold text-sm text-white block leading-none">${p.nickname}</span>
        ${p.heroClass ? `<span class="text-[10px] text-purple-300 font-semibold uppercase">${p.heroClass}</span>` : ''}
      </div>
    </div>
  `).join('');
});

document.getElementById('btnStartGame').addEventListener('click', () => {
  window.soundEngine.playClick();
  socket.emit('host_start_game', { pin: currentRoomPin });
});

socket.on('game_countdown', ({ count }) => {
  window.soundEngine.stopBGM();
  let c = count;
  const countOverlay = document.createElement('div');
  countOverlay.id = 'countdownOverlay';
  countOverlay.className = 'fixed inset-0 bg-black/85 z-50 flex items-center justify-center';
  countOverlay.innerHTML = `<span class="text-9xl font-black text-yellow-400 animate-ping font-mono">${c}</span>`;
  document.body.appendChild(countOverlay);

  const interval = setInterval(() => {
    c--;
    if (c > 0) {
      countOverlay.innerHTML = `<span class="text-9xl font-black text-yellow-400 animate-ping font-mono">${c}</span>`;
    } else {
      clearInterval(interval);
      countOverlay.remove();
    }
  }, 1000);
});

// ==========================================
// 3. DIỄN BIẾN CÂU HỎI & TRẬN CHIẾN BOSS
// ==========================================
socket.on('question_start', (data) => {
  switchView('question');

  document.getElementById('qIndexBadge').textContent = `Câu ${data.questionIndex}/${data.totalQuestions}`;
  document.getElementById('qTitleDisplay').textContent = data.questionText;
  document.getElementById('timerText').textContent = data.timeLimit;
  document.getElementById('answersProgressText').textContent = '0 đã nộp';

  const timerContainer = document.getElementById('timerContainer');
  timerContainer.classList.remove('timer-rush');
  timerContainer.style.borderColor = '#a855f7';

  // Hiển thị Boss nếu ở chế độ Phiêu Lưu Adventure RPG
  const bossContainer = document.getElementById('adventureBossContainer');
  if (data.gameMode === 'adventure' && data.boss) {
    bossContainer.classList.remove('hidden');
    bossContainer.classList.add('flex');
    document.getElementById('bossAvatarEl').textContent = data.boss.avatar || '🐉';
    document.getElementById('bossNameEl').textContent = data.boss.name;
    document.getElementById('bossHpText').textContent = `${data.boss.currentHp.toLocaleString()} / ${data.boss.maxHp.toLocaleString()}`;
    const percent = Math.round((data.boss.currentHp / data.boss.maxHp) * 100);
    document.getElementById('bossHpBar').style.width = `${percent}%`;

    // Khởi tạo Canvas VFX 60 FPS
    setTimeout(() => {
      window.battleFx.init('battleCanvas');
      renderArenaSquad();
    }, 100);
  } else {
    bossContainer.classList.add('hidden');
    bossContainer.classList.remove('flex');
  }

  // 4 phương án
  data.answers.forEach(a => {
    const textEl = document.getElementById(`ansText-${a.id}`);
    if (textEl) textEl.textContent = a.text;
  });

  window.soundEngine.playQuestionBGM(data.gameMode === 'adventure');
});

function renderArenaSquad() {
  const squadContainer = document.getElementById('arenaHeroSquad');
  if (!squadContainer) return;
  if (!currentPlayersList || currentPlayersList.length === 0) {
    squadContainer.innerHTML = '<span class="text-xs text-gray-400 italic">Đang tải hiệp sĩ...</span>';
    return;
  }

  const classIcons = { warrior: '⚔️', mage: '🧙', archer: '🏹', knight: '🛡️' };
  squadContainer.innerHTML = currentPlayersList.map(p => `
    <div id="heroBadge-${p.nickname.replace(/[^a-zA-Z0-9]/g, '')}" class="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-white/20 text-xs font-bold transition transform hover:scale-105">
      <span class="text-lg">${p.avatar || '🐱'}</span>
      <span class="text-white">${p.nickname}</span>
      <span class="text-sm">${classIcons[p.heroClass] || '⚔️'}</span>
    </div>
  `).join('');
}

socket.on('update_answers_progress', (data) => {
  document.getElementById('answersProgressText').textContent = `${data.answeredCount} / ${data.totalPlayers}`;
});

socket.on('timer_tick', ({ remainingTime }) => {
  document.getElementById('timerText').textContent = remainingTime;
});

socket.on('timer_rush_5s', () => {
  const timerContainer = document.getElementById('timerContainer');
  timerContainer.classList.add('timer-rush');
  window.soundEngine.playRush5sBGM();
});

// SỰ KIỆN BOSS BỊ CHÉM TRONG CHẾ ĐỘ PHIÊU LƯU RPG
socket.on('boss_damaged_event', (data) => {
  const bossAvatar = document.getElementById('bossAvatarEl');
  bossAvatar.classList.remove('boss-damaged-anim');
  void bossAvatar.offsetWidth; // reset animation
  bossAvatar.classList.add('boss-damaged-anim');

  // Cập nhật thanh máu Boss
  document.getElementById('bossHpText').textContent = `${data.bossHp.toLocaleString()} / ${data.bossMaxHp.toLocaleString()}`;
  document.getElementById('bossHpBar').style.width = `${data.bossPercent}%`;

  // Bắn đạn hiệu ứng hoạt họa 60 FPS bay vào Boss!
  window.battleFx.launchAttack(data.heroClass, null, null, null, null, data.isCrit);

  // Hiệu ứng anh hùng nhảy lên chém
  const safeName = data.attackerName.replace(/[^a-zA-Z0-9]/g, '');
  const badge = document.getElementById(`heroBadge-${safeName}`);
  if (badge) {
    badge.classList.add('scale-125', 'bg-red-500/40', 'border-red-400');
    setTimeout(() => badge.classList.remove('scale-125', 'bg-red-500/40', 'border-red-400'), 500);
  }

  // Sát thương bay lên
  showFloatingDamage(data.damage, data.isCrit);

  // Âm thanh chém trúng quái
  window.soundEngine.playSlash(data.isCrit);
});

function showFloatingDamage(dmg, isCrit) {
  const container = document.getElementById('damageFloatContainer');
  if (!container) return;
  const dmgEl = document.createElement('div');
  dmgEl.className = `damage-float ${isCrit ? 'text-yellow-300 text-3xl font-black' : 'text-red-400 text-xl font-extrabold'}`;
  dmgEl.textContent = isCrit ? `💥 CHÍ MẠNG -${dmg}!` : `-${dmg}`;
  dmgEl.style.left = `${35 + Math.random() * 30}%`;
  dmgEl.style.top = `${20 + Math.random() * 20}%`;
  container.appendChild(dmgEl);
  setTimeout(() => dmgEl.remove(), 1200);
}

// ==========================================
// 4. KẾT QUẢ CÂU HỎI & BẢNG XẾP HẠNG
// ==========================================
socket.on('question_result', (data) => {
  window.soundEngine.stopBGM();
  latestLeaderboard = data.leaderboard;
  isLastQuestionFlag = data.isLastQuestion;

  switchView('result');
  document.getElementById('resultAnswerTitle').textContent = `Đáp án đúng: ${data.correctAnswerText || '...'}`;

  const maxVotes = Math.max(1, data.stats.a, data.stats.b, data.stats.c, data.stats.d);
  ['a', 'b', 'c', 'd'].forEach(id => {
    const count = data.stats[id] || 0;
    const barEl = document.getElementById(`bar-${id}`);
    const countEl = document.getElementById(`barCount-${id}`);
    countEl.textContent = count;
    const heightPercent = Math.max(10, Math.round((count / maxVotes) * 100));
    barEl.style.height = `${heightPercent}%`;

    if (id === data.correctAnswerId) {
      barEl.classList.add('ring-4', 'ring-yellow-400');
    } else {
      barEl.classList.remove('ring-4', 'ring-yellow-400');
    }
  });

  window.soundEngine.playCorrect();
});

document.getElementById('btnGoToLeaderboard').addEventListener('click', () => {
  window.soundEngine.playClick();
  switchView('leaderboard');
  renderLeaderboard(latestLeaderboard);

  const btnNext = document.getElementById('btnNextQuestion');
  btnNext.textContent = isLastQuestionFlag ? 'KẾT QUẢ CHUNG CUỘC 🏆' : 'CÂU HỎI TIẾP THEO ⏩';
});

function renderLeaderboard(board) {
  const container = document.getElementById('leaderboardList');
  if (!board.length) {
    container.innerHTML = '<div class="text-center text-gray-400 py-4">Chưa có điểm số được ghi nhận.</div>';
    return;
  }

  container.innerHTML = board.map((p, idx) => {
    let metricDisplay = '';
    if (currentGameMode === 'goldquest') {
      metricDisplay = `<span class="text-xl font-black text-amber-400 flex items-center gap-1">🪙 ${(p.gold || 0).toLocaleString()} Vàng</span>`;
    } else if (currentGameMode === 'adventure') {
      metricDisplay = `<span class="text-xl font-black text-red-400 flex items-center gap-1">⚔️ ${(p.totalDamageDealt || 0).toLocaleString()} Dame</span>`;
    } else {
      metricDisplay = `<span class="text-xl font-black text-yellow-400">${p.score.toLocaleString()} pts</span>`;
    }

    return `
      <div class="flex items-center justify-between p-4 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md transition transform hover:scale-[1.01]">
        <div class="flex items-center gap-4">
          <span class="w-8 font-black text-xl text-center ${idx === 0 ? 'text-yellow-400' : 'text-gray-300'}">#${idx + 1}</span>
          <span class="text-3xl">${p.avatar || '🐱'}</span>
          <div>
            <h4 class="font-extrabold text-white text-lg">${p.nickname}</h4>
            <div class="flex items-center gap-2">
              ${p.heroClass ? `<span class="text-[10px] uppercase font-bold text-purple-300 px-2 py-0.5 rounded bg-purple-500/20">${p.heroClass}</span>` : ''}
              ${p.streak > 1 ? `<span class="text-xs px-2 py-0.5 rounded-full bg-red-500/30 text-red-300 font-bold">🔥 Chuỗi ${p.streak}x</span>` : ''}
            </div>
          </div>
        </div>
        ${metricDisplay}
      </div>
    `;
  }).join('');
}

socket.on('goldquest_event_log', (data) => {
  const ticker = document.getElementById('gameEventTicker');
  ticker.classList.remove('hidden');
  ticker.textContent = data.message;
  ticker.classList.add('animate-pulse');
  setTimeout(() => ticker.classList.remove('animate-pulse'), 1200);
});

document.getElementById('btnNextQuestion').addEventListener('click', () => {
  window.soundEngine.playClick();
  socket.emit('host_next_question', { pin: currentRoomPin });
});

// ==========================================
// 5. VINH DANH CHUNG CUỘC & BÁO CÁO GIÁO VIÊN
// ==========================================
socket.on('game_finished', (data) => {
  switchView('podium');
  window.soundEngine.playPodiumFanfare();

  confetti({ particleCount: 150, spread: 90, origin: { y: 0.6 } });

  const podium = data.podium || [];
  const formatMetric = (p) => {
    if (!p) return '0 pts';
    if (data.gameMode === 'goldquest') return `🪙 ${(p.gold || 0).toLocaleString()} Vàng`;
    if (data.gameMode === 'adventure') return `⚔️ ${(p.totalDamageDealt || 0).toLocaleString()} Sát thương`;
    return `${p.score.toLocaleString()} điểm`;
  };

  if (podium[0]) {
    document.getElementById('p1Avatar').textContent = podium[0].avatar || '👑';
    document.getElementById('p1Name').textContent = podium[0].nickname;
    document.getElementById('p1Score').textContent = formatMetric(podium[0]);
  }
  if (podium[1]) {
    document.getElementById('p2Avatar').textContent = podium[1].avatar || '🥈';
    document.getElementById('p2Name').textContent = podium[1].nickname;
    document.getElementById('p2Score').textContent = formatMetric(podium[1]);
  }
  if (podium[2]) {
    document.getElementById('p3Avatar').textContent = podium[2].avatar || '🥉';
    document.getElementById('p3Name').textContent = podium[2].nickname;
    document.getElementById('p3Score').textContent = formatMetric(podium[2]);
  }

  // BÁO CÁO PHÂN TÍCH CHO GIÁO VIÊN (Teacher Insights)
  const analyticsList = document.getElementById('teacherAnalyticsList');
  if (data.questionAnalytics && data.questionAnalytics.length > 0) {
    analyticsList.innerHTML = data.questionAnalytics.map(qa => {
      const isWeak = qa.accuracyPercent < 50;
      return `
        <div class="p-3 rounded-xl border flex items-center justify-between text-xs ${
          isWeak ? 'bg-red-500/10 border-red-500/30 text-red-200' : 'bg-white/5 border-white/10 text-gray-200'
        }">
          <div class="space-y-0.5">
            <span class="font-bold">Câu ${qa.questionIndex}: ${qa.questionText}</span>
            <div class="text-[11px] text-gray-400">
              Có ${qa.correctCount}/${qa.totalPlayers} bạn trả lời đúng (${qa.accuracyPercent}%)
            </div>
          </div>
          ${isWeak ? '<span class="text-xs font-black text-rose-400 px-2 py-1 rounded bg-rose-500/20">Cần Giảng Lại ⚠️</span>' : '<span class="text-xs font-black text-emerald-400">Đạt Tốt ✓</span>'}
        </div>
      `;
    }).join('');
  } else {
    analyticsList.innerHTML = '<div class="text-gray-400 text-xs">Chưa có đủ dữ liệu câu hỏi.</div>';
  }
});

document.getElementById('btnPlayAgain').addEventListener('click', () => {
  window.location.reload();
});

// ==========================================
// 6. MODAL 1: SOẠN THẢO BỘ CÂU HỎI THỦ CÔNG
// ==========================================
const creatorModal = document.getElementById('creatorModal');
let manualQuestions = [];

document.getElementById('btnOpenCreatorModal').addEventListener('click', () => {
  creatorModal.classList.remove('hidden');
  window.soundEngine.playClick();
  if (manualQuestions.length === 0) {
    addManualQuestionBlock();
  }
});
document.getElementById('btnCloseCreatorModal').addEventListener('click', () => creatorModal.classList.add('hidden'));
document.getElementById('btnCancelCreator').addEventListener('click', () => creatorModal.classList.add('hidden'));

function addManualQuestionBlock() {
  const qNum = manualQuestions.length + 1;
  const qId = `q-${Date.now()}-${qNum}`;
  manualQuestions.push({
    id: qId,
    question: '',
    timeLimit: 15,
    points: 1000,
    answers: [
      { id: 'a', text: '', isCorrect: true, color: 'red' },
      { id: 'b', text: '', isCorrect: false, color: 'blue' },
      { id: 'c', text: '', isCorrect: false, color: 'yellow' },
      { id: 'd', text: '', isCorrect: false, color: 'green' }
    ]
  });
  renderManualQuestions();
}

document.getElementById('btnAddQuestionItem').addEventListener('click', () => {
  addManualQuestionBlock();
});

function renderManualQuestions() {
  const container = document.getElementById('manualQuestionsContainer');
  container.innerHTML = manualQuestions.map((q, idx) => `
    <div class="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3 relative">
      <div class="flex items-center justify-between">
        <span class="font-black text-sm text-emerald-400">Câu hỏi #${idx + 1}</span>
        ${manualQuestions.length > 1 ? `<button onclick="removeManualQuestion(${idx})" class="text-xs text-red-400 hover:text-red-300 font-bold">Xóa câu này ✖</button>` : ''}
      </div>

      <div>
        <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Nội dung câu hỏi:</label>
        <input type="text" value="${q.question}" onchange="manualQuestions[${idx}].question = this.value" placeholder="Nhập câu hỏi tại đây..."
          class="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500">
      </div>

      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Thời gian (giây):</label>
          <select onchange="manualQuestions[${idx}].timeLimit = parseInt(this.value, 10)" class="w-full bg-gray-800 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white">
            <option value="10" ${q.timeLimit === 10 ? 'selected' : ''}>10 giây</option>
            <option value="15" ${q.timeLimit === 15 ? 'selected' : ''}>15 giây</option>
            <option value="20" ${q.timeLimit === 20 ? 'selected' : ''}>20 giây</option>
            <option value="30" ${q.timeLimit === 30 ? 'selected' : ''}>30 giây</option>
          </select>
        </div>
        <div>
          <label class="block text-[11px] font-bold text-gray-400 uppercase mb-1">Điểm thưởng:</label>
          <select onchange="manualQuestions[${idx}].points = parseInt(this.value, 10)" class="w-full bg-gray-800 border border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-white">
            <option value="500" ${q.points === 500 ? 'selected' : ''}>500 điểm</option>
            <option value="1000" ${q.points === 1000 ? 'selected' : ''}>1000 điểm</option>
            <option value="2000" ${q.points === 2000 ? 'selected' : ''}>2000 điểm</option>
          </select>
        </div>
      </div>

      <!-- 4 ĐÁP ÁN KÈM NÚT TÍCH ĐÁP ÁN ĐÚNG RÕ RÀNG -->
      <div>
        <label class="block text-[11px] font-bold text-gray-300 uppercase mb-2">4 Phương án & Đánh dấu đáp án đúng:</label>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          ${q.answers.map((ans, aIdx) => `
            <div class="flex items-center gap-2 p-2 rounded-xl bg-black/40 border ${ans.isCorrect ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10'}">
              <input type="radio" name="correctRadio-${idx}" ${ans.isCorrect ? 'checked' : ''} onchange="setCorrectAnswer(${idx}, ${aIdx})" title="Tích chọn nếu đây là đáp án ĐÚNG" class="w-4 h-4 text-emerald-500 cursor-pointer">
              <span class="text-xs font-black ${ans.color === 'red' ? 'text-red-400' : ans.color === 'blue' ? 'text-blue-400' : ans.color === 'yellow' ? 'text-yellow-400' : 'text-emerald-400'}">${['A', 'B', 'C', 'D'][aIdx]}</span>
              <input type="text" value="${ans.text}" onchange="manualQuestions[${idx}].answers[${aIdx}].text = this.value" placeholder="Đáp án ${['A', 'B', 'C', 'D'][aIdx]}..."
                class="flex-1 bg-transparent text-white text-xs outline-none">
              ${ans.isCorrect ? '<span class="text-[10px] text-emerald-400 font-extrabold uppercase">✓ ĐÚNG</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `).join('');
}

window.removeManualQuestion = function(idx) {
  manualQuestions.splice(idx, 1);
  renderManualQuestions();
};

window.setCorrectAnswer = function(qIdx, aIdx) {
  manualQuestions[qIdx].answers.forEach((ans, i) => {
    ans.isCorrect = (i === aIdx);
  });
  renderManualQuestions();
};

document.getElementById('btnSaveManualQuiz').addEventListener('click', async () => {
  const title = document.getElementById('manualQuizTitle').value.trim();
  const category = document.getElementById('manualQuizCategory').value.trim() || 'Tự soạn';

  if (!title) return alert("Vui lòng nhập Tiêu đề cho bộ đề!");
  if (manualQuestions.some(q => !q.question.trim())) {
    return alert("Vui lòng nhập đầy đủ nội dung câu hỏi!");
  }
  if (manualQuestions.some(q => q.answers.some(a => !a.text.trim()))) {
    return alert("Vui lòng điền đủ 4 phương án cho từng câu hỏi!");
  }

  try {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, category, questions: manualQuestions })
    });
    const result = await res.json();
    if (result.success) {
      loadedQuizzes.unshift(result.quiz);
      currentQuizId = result.quiz.id;
      renderQuizList();
      creatorModal.classList.add('hidden');
      manualQuestions = [];
      window.soundEngine.playCorrect();
      alert("Đã lưu bộ câu hỏi mới thành công!");
    }
  } catch (err) {
    alert("Lỗi khi lưu bộ đề: " + err.message);
  }
});

// ==========================================
// 7. MODAL 2: TẢI CÂU HỎI LÊN (BATCH IMPORT)
// ==========================================
const importModal = document.getElementById('importModal');
document.getElementById('btnOpenImportModal').addEventListener('click', () => {
  importModal.classList.remove('hidden');
  window.soundEngine.playClick();
});
document.getElementById('btnCloseImportModal').addEventListener('click', () => importModal.classList.add('hidden'));
document.getElementById('btnCancelImport').addEventListener('click', () => importModal.classList.add('hidden'));

document.getElementById('btnSubmitImport').addEventListener('click', async () => {
  const title = document.getElementById('importQuizTitle').value.trim();
  const rawText = document.getElementById('importRawText').value.trim();

  if (!rawText) return alert("Vui lòng dán danh sách câu hỏi theo mẫu!");

  try {
    const res = await fetch('/api/quizzes/import-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, rawText })
    });
    const result = await res.json();
    if (result.success && result.quiz) {
      loadedQuizzes.unshift(result.quiz);
      currentQuizId = result.quiz.id;
      renderQuizList();
      importModal.classList.add('hidden');
      document.getElementById('importRawText').value = '';
      window.soundEngine.playCorrect();
      alert(`Đã nhận diện và tải lên thành công ${result.count} câu hỏi!`);
    } else {
      alert(result.error || "Không thể nhận diện nội dung tải lên.");
    }
  } catch (err) {
    alert("Lỗi tải lên: " + err.message);
  }
});

// ==========================================
// 8. MODAL 3: AI TẠO ĐỀ TỰ ĐỘNG
// ==========================================
const aiModal = document.getElementById('aiModal');
document.getElementById('btnOpenAiModal').addEventListener('click', () => {
  aiModal.classList.remove('hidden');
  window.soundEngine.playClick();
});
document.getElementById('btnCloseAiModal').addEventListener('click', () => aiModal.classList.add('hidden'));
document.getElementById('btnCancelAi').addEventListener('click', () => aiModal.classList.add('hidden'));

document.getElementById('btnGenerateAiSubmit').addEventListener('click', async () => {
  const topic = document.getElementById('aiTopicInput').value;
  const text = document.getElementById('aiTextInput').value;
  const count = parseInt(document.getElementById('aiCountSelect').value, 10);
  const difficulty = document.getElementById('aiDiffSelect').value;

  const spinner = document.getElementById('aiBtnSpinner');
  const btnText = document.getElementById('aiBtnText');
  spinner.classList.remove('hidden');
  btnText.textContent = 'Đang suy nghĩ & tạo đề...';

  try {
    const res = await fetch('/api/ai-generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, text, count, difficulty })
    });
    const result = await res.json();
    if (result.success && result.quiz) {
      loadedQuizzes.unshift(result.quiz);
      currentQuizId = result.quiz.id;
      renderQuizList();
      aiModal.classList.add('hidden');
      window.soundEngine.playCorrect();
    }
  } catch (err) {
    alert("Có lỗi khi tạo đề bằng AI: " + err.message);
  } finally {
    spinner.classList.add('hidden');
    btnText.textContent = 'Tạo Đề Ngay ⚡';
  }
});

// Sound & Fullscreen
document.getElementById('btnSoundToggle').addEventListener('click', () => {
  const isMuted = window.soundEngine.toggleMute();
  document.getElementById('soundIcon').textContent = isMuted ? '🔇' : '🔊';
  document.getElementById('soundLabel').textContent = isMuted ? 'Âm thanh: Tắt' : 'Âm thanh: Bật';
});

document.getElementById('btnFullscreen').addEventListener('click', () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
});

loadQuizzes();
