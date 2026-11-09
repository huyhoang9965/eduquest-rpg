// BỘ ÂM THANH GAME NHẬP VAI RPG EDUQUEST (WEB AUDIO API CHUYÊN NGHIỆP)
// Chạy 100% độc lập không cần file ngoài, có nhạc nền phiêu lưu, nhạc chiến đấu và hiệu ứng SFX

class RpgSoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.isSfxMuted = false;
    this.masterGain = null;
    this.bgmGain = null;
    this.bgmTimer = null;
    this.currentTrack = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.5;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMusic() {
    this.isMuted = !this.isMuted;
    if (this.bgmGain) {
      this.bgmGain.gain.value = this.isMuted ? 0 : 0.15;
    }
    return !this.isMuted;
  }

  toggleSfx() {
    this.isSfxMuted = !this.isSfxMuted;
    return !this.isSfxMuted;
  }

  // Tiếng bấm nút
  playClick() {
    this.init();
    if (this.isSfxMuted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(700, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1000, this.ctx.currentTime + 0.04);
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  // Đòn chém kiếm (Warrior)
  playSlash() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(950, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.18);
    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.19);
  }

  // Phép thuật ma thuật (Mage)
  playMagic() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.05, 0.1].forEach((delay, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + i * 250, now + delay);
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });
  }

  // Mũi tên xé gió (Archer)
  playArrow() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(1400, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.13);
  }

  // Quái vật trúng đòn
  playMonsterHit() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.25);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Anh hùng bị phản công
  playPlayerHurt() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(90, now + 0.2);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  // Tuyệt chiêu chí mạng nổ bùng
  playCriticalHit() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.5);
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  // Lên cấp (Level Up Fanfare)
  playLevelUp() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C E G C E
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.35, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.3);
    });
  }

  // Khúc nhạc chiến thắng Ải (Victory Chime)
  playVictory() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880]; // A C# E A
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.3, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.4);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.4);
    });
  }

  // Trang bị vật phẩm (Equip Sound)
  playEquip() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.08);
    gain.gain.setValueAtTime(0.25, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  // Hồi máu / Dùng bình thuốc (Heal Sound)
  playHeal() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.25, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.2);
    });
  }

  // Mở rương báu leng keng vàng
  playChestOpen() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.08, 0.16, 0.24, 0.32].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1000 + idx * 180, now + delay);
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.25);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.25);
    });
  }

  // Mua đồ thành công
  playBuyItem() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.08].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900 + idx * 400, now + delay);
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }

  // Âm thanh Sấm Sét (Thunder Strike)
  playThunder() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.35);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  // Âm thanh Hỏa Cầu (Fireball)
  playFireball() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(90, now + 0.3);
    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  // Âm thanh Băng Giá (Ice Freeze)
  playIceFreeze() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.06, 0.12].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1200 + idx * 300, now + delay);
      gain.gain.setValueAtTime(0.25, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.2);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.2);
    });
  }

  // Âm thanh Khiên Tri Thức (Knowledge Shield)
  playShield() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  // Âm thanh Thú Cưng Hỗ Trợ
  playPetAssist() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.08, 0.16].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600 + idx * 200, now + delay);
      gain.gain.setValueAtTime(0.3, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.15);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.15);
    });
  }

  // Âm thanh Chọn Thẻ Kỹ Năng / Level Up Draft
  playDraftSelect() {
    this.init();
    if (this.isSfxMuted) return;
    const now = this.ctx.currentTime;
    [0, 0.07, 0.14, 0.21].forEach((delay, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime([523.25, 659.25, 783.99, 1046.50][idx], now + delay);
      gain.gain.setValueAtTime(0.35, now + delay);
      gain.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.3);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now + delay);
      osc.stop(now + delay + 0.3);
    });
  }

  // ==========================================
  // NHẠC NỀN BGM (PROCEDURAL FANTASY MELODIES)
  // ==========================================
  playTownBGM() {
    if (this.currentTrack === 'town') return;
    this.stopBGM();
    this.init();
    this.currentTrack = 'town';

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.12, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    const melody = [261.63, 329.63, 392.00, 523.25, 440.00, 392.00, 329.63, 293.66]; // Nhạc thị trấn êm đềm
    let step = 0;

    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const freq = melody[step % melody.length];
      step++;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.35);
    }, 400);
  }

  playBattleBGM(isBoss = false) {
    const trackName = isBoss ? 'boss' : 'battle';
    if (this.currentTrack === trackName) return;
    this.stopBGM();
    this.init();
    this.currentTrack = trackName;

    this.bgmGain = this.ctx.createGain();
    this.bgmGain.gain.setValueAtTime(this.isMuted ? 0 : 0.15, this.ctx.currentTime);
    this.bgmGain.connect(this.masterGain);

    let step = 0;
    const intervalTime = isBoss ? 260 : 320;

    this.bgmTimer = setInterval(() => {
      if (this.isMuted || !this.ctx) return;
      step++;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const freq = isBoss
        ? (step % 2 === 0 ? 110 : 82.4) // Bass Trùm dồn dập
        : (step % 2 === 0 ? 146.8 : 110);

      osc.type = isBoss ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.18);

      osc.connect(gain);
      gain.connect(this.bgmGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.18);
    }, intervalTime);
  }

  stopBGM() {
    if (this.bgmTimer) clearInterval(this.bgmTimer);
    this.currentTrack = null;
  }
}

window.rpgSound = new RpgSoundEngine();
