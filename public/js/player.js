// PLAYER CONTROLLER SCRIPT 2.0 (STUDENT CLIENT & RPG HERO)
const socket = io();

// State biến
let myPin = null;
let myNickname = 'Học sinh';
let myAvatar = '🐱';
let myHeroClass = 'warrior';
let myScore = 0;
let myGold = 0;
let myMana = 0;
let myStreak = 0;
let currentGameMode = 'classic';
let hasSubmittedCurrentQuestion = false;

// DOM Screens
const screens = {
  join: document.getElementById('screenJoin'),
  lobby: document.getElementById('screenLobbyWait'),
  quiz: document.getElementById('screenClassicQuiz'),
  chests: document.getElementById('screenChests'),
  feedback: document.getElementById('screenFeedback'),
  gameOver: document.getElementById('screenGameOver')
};

function switchScreen(screenName) {
  Object.keys(screens).forEach(k => {
    if (k === screenName) {
      screens[k].classList.remove('hidden');
      screens[k].classList.add('flex');
    } else {
      screens[k].classList.add('hidden');
      screens[k].classList.remove('flex');
    }
  });
}

// 1. TỰ ĐỘNG ĐIỀN PIN & CHỌN CLASS/AVATAR
window.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const pinFromUrl = urlParams.get('pin');
  if (pinFromUrl) {
    document.getElementById('inputPin').value = pinFromUrl;
  }

  // Chọn Hero Class (Chiến binh, Phù thủy, Cung thủ, Hiệp sĩ)
  document.querySelectorAll('.hero-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.hero-opt').forEach(b => {
        b.classList.remove('border-purple-400', 'bg-purple-600/40', 'border-2');
        b.classList.add('border-white/10', 'bg-white/5');
        b.querySelector('span:last-child').classList.replace('text-white', 'text-gray-300');
      });
      btn.classList.remove('border-white/10', 'bg-white/5');
      btn.classList.add('border-purple-400', 'bg-purple-600/40', 'border-2');
      btn.querySelector('span:last-child').classList.replace('text-gray-300', 'text-white');
      myHeroClass = btn.getAttribute('data-class');
      window.soundEngine.playClick();
    });
  });

  // Chọn avatar
  document.querySelectorAll('.avatar-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.avatar-opt').forEach(b => {
        b.classList.remove('border-purple-400', 'bg-purple-600/30', 'border-2');
        b.classList.add('border-white/10', 'bg-white/5');
      });
      btn.classList.remove('border-white/10', 'bg-white/5');
      btn.classList.add('border-purple-400', 'bg-purple-600/30', 'border-2');
      myAvatar = btn.getAttribute('data-avatar');
      window.soundEngine.playClick();
    });
  });
});

// 2. VÀO PHÒNG CHƠI
document.getElementById('btnJoinGame').addEventListener('click', () => {
  window.soundEngine.init();
  window.soundEngine.playClick();

  const pin = document.getElementById('inputPin').value.trim();
  const nickname = document.getElementById('inputNickname').value.trim() || 'Học sinh';

  if (!pin || pin.length < 5) {
    alert('Vui lòng nhập đúng mã PIN phòng 6 chữ số!');
    return;
  }

  myPin = pin;
  myNickname = nickname;

  socket.emit('player_join_room', {
    pin: myPin,
    nickname: myNickname,
    avatar: myAvatar,
    heroClass: myHeroClass
  });
});

socket.on('join_error', ({ message }) => {
  alert(message);
});

socket.on('player_join_success', (data) => {
  currentGameMode = data.gameMode;
  document.getElementById('playerAvatarHeader').textContent = data.avatar;
  document.getElementById('playerNicknameHeader').textContent = data.nickname;
  document.getElementById('lobbyMyAvatar').textContent = data.avatar;
  document.getElementById('lobbyMyName').textContent = data.nickname;

  if (data.heroClass) {
    const classBadge = document.getElementById('playerClassHeader');
    classBadge.classList.remove('hidden');
    classBadge.textContent = data.heroClass;
  }

  switchScreen('lobby');
});

// 3. BẮT ĐẦU CÂU HỎI MỚI
socket.on('player_question_start', (data) => {
  hasSubmittedCurrentQuestion = false;
  currentGameMode = data.gameMode;

  switchScreen('quiz');

  document.getElementById('playerQIndexText').textContent = `Câu ${data.questionIndex}/${data.totalQuestions}`;
  document.getElementById('playerTimerText').textContent = data.timeLimit;
  document.getElementById('playerSubmittedNotice').classList.add('hidden');

  // Giao diện Boss & Mana trong Adventure RPG
  const bossBar = document.getElementById('playerBossBarContainer');
  const manaBar = document.getElementById('playerManaContainer');
  if (currentGameMode === 'adventure' && data.boss) {
    bossBar.classList.remove('hidden');
    bossBar.classList.add('flex');
    manaBar.classList.remove('hidden');
    manaBar.classList.add('flex');
    document.getElementById('playerBossName').textContent = data.boss.name;
    const percent = Math.round((data.boss.currentHp / data.boss.maxHp) * 100);
    document.getElementById('playerBossHpPercent').textContent = `${percent}% HP`;
    document.getElementById('playerBossHpBar').style.width = `${percent}%`;
  } else {
    bossBar.classList.add('hidden');
    bossBar.classList.remove('flex');
    manaBar.classList.add('hidden');
    manaBar.classList.remove('flex');
  }

  // Mở khóa 4 nút
  ['a', 'b', 'c', 'd'].forEach(id => {
    const btn = document.getElementById(`btnAns-${id}`);
    btn.disabled = false;
    btn.classList.remove('opacity-40', 'scale-95', 'ring-4', 'ring-white');

    const textEl = document.getElementById(`playerAnsText-${id}`);
    const answerItem = data.answers.find(a => a.id === id);
    if ((currentGameMode === 'goldquest' || currentGameMode === 'adventure') && answerItem && answerItem.text) {
      textEl.textContent = answerItem.text;
      textEl.classList.remove('hidden');
    } else {
      textEl.classList.add('hidden');
    }
  });

  if (currentGameMode === 'goldquest' || currentGameMode === 'adventure') {
    document.getElementById('classicHintBanner').textContent = '💡 Đọc câu hỏi và chọn phương án đúng trên điện thoại của bạn!';
  } else {
    document.getElementById('classicHintBanner').textContent = '👀 Đọc câu hỏi trên máy chiếu và chọn màu tương ứng!';
  }
});

socket.on('timer_tick', ({ remainingTime }) => {
  const timerEl = document.getElementById('playerTimerText');
  timerEl.textContent = remainingTime;
  if (remainingTime <= 5) {
    timerEl.classList.add('text-red-500');
  } else {
    timerEl.classList.remove('text-red-500');
  }
});

// 4. HỌC SINH NỘP ĐÁP ÁN
window.submitAnswer = function(answerId) {
  if (hasSubmittedCurrentQuestion) return;
  hasSubmittedCurrentQuestion = true;

  window.soundEngine.playClick();

  ['a', 'b', 'c', 'd'].forEach(id => {
    const btn = document.getElementById(`btnAns-${id}`);
    btn.disabled = true;
    if (id !== answerId) {
      btn.classList.add('opacity-40');
    } else {
      btn.classList.add('scale-95', 'ring-4', 'ring-white');
    }
  });

  document.getElementById('playerSubmittedNotice').classList.remove('hidden');

  socket.emit('player_submit_answer', {
    pin: myPin,
    answerId
  });
};

// 5. PHẢN HỒI KẾT QUẢ ĐÁP ÁN
socket.on('player_answer_result', (data) => {
  if (data.isCorrect) {
    myScore = data.currentScore;
    myStreak = data.streak;
    myMana = data.mana || 0;

    document.getElementById('playerScoreHeader').textContent = `${myScore.toLocaleString()} pts`;
    if (myStreak > 1) {
      document.getElementById('playerStreakBadge').classList.remove('hidden');
      document.getElementById('playerStreakBadge').classList.add('flex');
      document.getElementById('playerStreakText').textContent = `${myStreak}x`;
    }

    // Cập nhật Mana Bar trong RPG
    if (currentGameMode === 'adventure') {
      document.getElementById('playerManaPercent').textContent = `${myMana}%`;
      document.getElementById('playerManaBar').style.width = `${myMana}%`;
      const btnUlt = document.getElementById('btnCastUltimate');
      if (myMana >= 100) {
        btnUlt.classList.remove('hidden');
      }

      // KÍCH HOẠT HOẠT HỌA CHIẾN ĐẤU ĐẬM CHẤT ANIME TẤN CÔNG TOÀN MÀN HÌNH
      if (window.battleFx) {
        window.battleFx.triggerMobileSlashAnimation(myHeroClass, data.isCriticalHit);
      }
    }

    if (currentGameMode === 'classic' || currentGameMode === 'adventure') {
      showFeedbackScreen(true, data.pointsEarned, myStreak, data.damageDealt, data.isCriticalHit);
      window.soundEngine.playCorrect();
    }
  } else {
    myStreak = 0;
    document.getElementById('playerStreakBadge').classList.add('hidden');
    showFeedbackScreen(false, 0, 0, 0, false);
    window.soundEngine.playIncorrect();
  }
});

function showFeedbackScreen(isCorrect, points, streak, damage, isCrit) {
  switchScreen('feedback');
  const screenEl = document.getElementById('screenFeedback');
  const iconEl = document.getElementById('feedbackIcon');
  const titleEl = document.getElementById('feedbackTitle');
  const pointsEl = document.getElementById('feedbackPoints');
  const streakEl = document.getElementById('feedbackStreakContainer');

  if (isCorrect) {
    screenEl.className = 'flex flex-col items-center justify-center text-center space-y-4 py-8 rounded-3xl p-6 bg-emerald-600/30 border border-emerald-500/40 shadow-2xl';
    iconEl.textContent = '🎉';
    titleEl.textContent = 'Chính Xác!';
    titleEl.className = 'text-2xl font-black text-emerald-300';
    
    if (currentGameMode === 'adventure' && damage > 0) {
      pointsEl.textContent = `${isCrit ? '💥 CHÍ MẠNG' : '⚔️ SÁT THƯƠNG'}: -${damage.toLocaleString()} Máu Boss!`;
      pointsEl.className = 'text-lg font-black text-amber-300';
    } else {
      pointsEl.textContent = `+${points.toLocaleString()} Điểm`;
      pointsEl.className = 'text-lg font-bold text-yellow-300';
    }
    pointsEl.classList.remove('hidden');

    if (streak > 1) {
      streakEl.classList.remove('hidden');
      streakEl.textContent = `🔥 Chuỗi đúng ${streak}x`;
    } else {
      streakEl.classList.add('hidden');
    }
  } else {
    screenEl.className = 'flex flex-col items-center justify-center text-center space-y-4 py-8 rounded-3xl p-6 bg-rose-600/30 border border-rose-500/40 shadow-2xl';
    iconEl.textContent = '😅';
    titleEl.textContent = 'Chưa Đúng Rồi!';
    titleEl.className = 'text-2xl font-black text-rose-300';
    pointsEl.classList.add('hidden');
    streakEl.classList.add('hidden');
  }
}

// 6. TUNG CHIÊU THỨC TỐI THƯỢNG (ULTIMATE CAST)
window.castUltimate = function() {
  window.soundEngine.playUltimateBlast();
  if (window.battleFx) {
    window.battleFx.triggerMobileSlashAnimation('mage', true);
  }
  socket.emit('player_cast_ultimate', { pin: myPin });
  document.getElementById('btnCastUltimate').classList.add('hidden');
  document.getElementById('playerManaPercent').textContent = '0%';
  document.getElementById('playerManaBar').style.width = '0%';
};

// Cập nhật máu Boss trên điện thoại khi ai đó gây sát thương
socket.on('boss_damaged_event', (data) => {
  const hpPercentEl = document.getElementById('playerBossHpPercent');
  const hpBarEl = document.getElementById('playerBossHpBar');
  if (hpPercentEl && hpBarEl) {
    hpPercentEl.textContent = `${data.bossPercent}% HP`;
    hpBarEl.style.width = `${data.bossPercent}%`;
  }
});

// 7. GOLD QUEST 3 RƯƠNG
socket.on('goldquest_chests_available', () => {
  switchScreen('chests');
  document.getElementById('chestResultDisplay').classList.add('hidden');
  window.soundEngine.playCorrect();
});

window.selectChest = function(chestIndex) {
  window.soundEngine.playClick();
  socket.emit('player_select_chest', { pin: myPin, chestIndex });
};

socket.on('chest_opened_result', (data) => {
  myGold = data.currentGold;
  document.getElementById('playerScoreHeader').textContent = `🪙 ${myGold.toLocaleString()} Vàng`;

  const resultDisplay = document.getElementById('chestResultDisplay');
  resultDisplay.classList.remove('hidden');
  resultDisplay.textContent = `🎁 BẠN NHẬN ĐƯỢC: ${data.outcome.label}`;

  window.soundEngine.playChestReward(data.outcome.type === 'GOLD_LOSE' ? 'lose' : 'coin');

  setTimeout(() => {
    switchScreen('feedback');
    showFeedbackScreen(true, 0, myStreak, 0, false);
  }, 2200);
});

// 8. KẾT THÚC TRÒ CHƠI
socket.on('game_finished', (data) => {
  switchScreen('gameOver');

  const myRankIndex = (data.allRankings || []).findIndex(p => p.id === socket.id);
  const myPlayerObj = (data.allRankings || []).find(p => p.id === socket.id);

  if (data.gameMode === 'goldquest') {
    document.getElementById('finalScoreDisplay').textContent = `🪙 ${(myGold || 0).toLocaleString()} Vàng`;
  } else if (data.gameMode === 'adventure') {
    document.getElementById('finalScoreDisplay').textContent = `⚔️ ${(myPlayerObj?.totalDamageDealt || 0).toLocaleString()} Sát thương`;
  } else {
    document.getElementById('finalScoreDisplay').textContent = `${(myScore || 0).toLocaleString()} điểm`;
  }

  if (myRankIndex >= 0) {
    document.getElementById('finalRankDisplay').textContent = `Bạn xếp hạng: #${myRankIndex + 1} cả lớp 🌟`;
    if (myRankIndex < 3) {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      window.soundEngine.playPodiumFanfare();
    }
  }
});

socket.on('room_closed', ({ message }) => {
  alert(message);
  window.location.reload();
});
