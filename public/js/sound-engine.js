// SOUND ENGINE 2.0 (WEB AUDIO API CHUẨN CAO CẤP)
// Tích hợp: Nhạc nền Lobby, Nhạc đếm ngược 5s dồn dập, Hiệu ứng RPG Diệt Boss, Rương Vàng Blooket

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;
    this.bgmGain = null;
    this.bgmTimer = null;
    this.rushInterval = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.6;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain) {
      this.masterGain.gain.value = this.isMuted ? 0 : 0.6;
    }
    return this.isMuted;
  }

  playClick() {
    this.init();
    if (this.isMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }

  playCorrect() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;
    
    const osc1 = this.ctx.createOscillator();
    const gain1 = this.ctx.createGain();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(784, now);
    gain1.gain.setValueAtTime(0.4, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(this.masterGain);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = this.ctx.createOscillator();
    const gain2 = this.ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1046, now + 0.12);
    gain2.gain.setValueAtTime(0.5, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
    osc2.connect(gain2);
    gain2.connect(this.masterGain);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.6);
  }

  playIncorrect() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(160, now + 0.25);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Âm thanh chém trúng quái vật RPG (Adventure Slash)
  playSlash(isCrit = false) {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isCrit ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(isCrit ? 1200 : 800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(isCrit ? 0.6 : 0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Âm thanh Tuyệt Chiêu Nộ Nổ Tung (Ultimate Blast)
  playUltimateBlast() {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;
    
    // Tiếng rền trầm (bass rumble)
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(250, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.6);

    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.6);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.6);
  }

  // Nhạc nền Lobby
  playLobbyBGM() {
    this.stopBGM();
    this.init();
    if (this.isMuted) return;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    const notes = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00];
    let noteIdx = 0;

    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = notes[noteIdx % notes.length];
      noteIdx++;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    }, 300);
  }

  // Nhạc nền lúc đang trả lời câu hỏi
  playQuestionBGM(isAdventure = false) {
    this.stopBGM();
    this.init();
    if (this.isMuted) return;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.15, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    let step = 0;
    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      step++;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = isAdventure 
        ? ((step % 2 === 0) ? 180 : 90) // Nhạc chiến đấu dồn nhịp hơn
        : ((step % 2 === 0) ? 140 : 110);

      osc.type = isAdventure ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    }, isAdventure ? 320 : 450);
  }

  // 5 GIÂY CUỐI CÙNG NHẠC DỒN DẬP (180 BPM)
  playRush5sBGM() {
    this.stopBGM();
    this.init();
    if (this.isMuted) return;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(0.25, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    let rushStep = 0;
    this.rushInterval = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      rushStep++;
      const now = this.ctx.currentTime;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(rushStep % 2 === 0 ? 880 : 1100, now);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start(now);
      osc.stop(now + 0.09);
    }, 180);
  }

  // Rương vàng mở
  playChestReward(type) {
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;

    if (type === 'lose') {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(70, now + 0.4);
      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.4);
      return;
    }

    [0, 0.08, 0.16, 0.24].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + (idx * 200), now + delay);
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });
  }

  // Fanfare chiến thắng
  playPodiumFanfare() {
    this.stopBGM();
    this.init();
    if (this.isMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.15);
      gain.gain.setValueAtTime(0.35, now + idx * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.15 + (idx === 3 ? 1.0 : 0.25));
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.15);
      osc.stop(now + idx * 0.15 + (idx === 3 ? 1.0 : 0.25));
    });
  }

  stopBGM() {
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    if (this.rushInterval) clearInterval(this.rushInterval);
  }
}

window.soundEngine = new SoundEngine();
