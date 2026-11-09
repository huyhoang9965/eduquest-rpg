// BATTLE EFFECTS & PARTICLE ENGINE (ĐỒ HỌA HOẠT HỌA CHIẾN ĐẤU SỐNG ĐỘNG)
// Xử lý đòn đánh, đạn phép, tia kiếm, mưa tên và hạt lửa nổ bùng trên màn hình

class BattleFxEngine {
  constructor() {
    this.particles = [];
    this.projectiles = [];
    this.canvas = null;
    this.ctx = null;
    this.isLoopRunning = false;
  }

  init(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
    if (!this.isLoopRunning) {
      this.isLoopRunning = true;
      this.loop();
    }
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
  }

  // Tạo đòn tấn công bay từ học sinh sang Boss (Projectiles)
  launchAttack(heroClass, startX, startY, targetX, targetY, isCrit = false) {
    if (!this.canvas) return;
    
    // Nếu không truyền tọa độ, tự lấy tọa độ ngẫu nhiên từ dưới lên Boss
    const sX = startX || (this.canvas.width * (0.2 + Math.random() * 0.6));
    const sY = startY || (this.canvas.height - 20);
    const tX = targetX || (this.canvas.width * 0.5);
    const tY = targetY || (this.canvas.height * 0.35);

    this.projectiles.push({
      heroClass,
      x: sX,
      y: sY,
      targetX: tX,
      targetY: tY,
      speed: isCrit ? 22 : 16,
      progress: 0,
      isCrit,
      color: this.getClassColor(heroClass),
      size: isCrit ? 18 : 12,
      trail: []
    });
  }

  getClassColor(heroClass) {
    switch (heroClass) {
      case 'warrior': return '#ef4444'; // Đỏ lửa
      case 'mage': return '#a855f7';    // Tím ma thuật
      case 'archer': return '#10b981';  // Xanh ngọc gió
      case 'knight': return '#f59e0b';  // Vàng thánh
      default: return '#ec4899';
    }
  }

  // Tạo vụ nổ hạt lửa khi đòn đánh va chạm Boss
  createExplosion(x, y, color, count = 25, isCrit = false) {
    const total = isCrit ? count * 2 : count;
    for (let i = 0; i < total; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 6 + 2) * (isCrit ? 1.6 : 1.0);
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: Math.random() * (isCrit ? 7 : 4) + 2,
        color: color,
        alpha: 1,
        decay: Math.random() * 0.03 + 0.02
      });
    }
  }

  // Vòng lặp vẽ đồ họa 60 FPS
  loop() {
    if (!this.ctx || !this.canvas) return;

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // 1. Cập nhật & Vẽ đạn bay (Projectiles)
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dx = p.targetX - p.x;
      const dy = p.targetY - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < p.speed) {
        // Đã trúng mục tiêu -> Nổ tung!
        this.createExplosion(p.targetX, p.targetY, p.color, 25, p.isCrit);
        this.projectiles.splice(i, 1);
        continue;
      }

      // Di chuyển
      p.x += (dx / dist) * p.speed;
      p.y += (dy / dist) * p.speed;

      // Lưu vết đuôi hạt (Trail)
      p.trail.push({ x: p.x, y: p.y, alpha: 1 });
      if (p.trail.length > 8) p.trail.shift();

      // Vẽ vệt đuôi lấp lánh
      for (let t = 0; t < p.trail.length; t++) {
        const pt = p.trail[t];
        pt.alpha -= 0.1;
        this.ctx.beginPath();
        this.ctx.arc(pt.x, pt.y, p.size * (t / p.trail.length), 0, Math.PI * 2);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = Math.max(0, pt.alpha);
        this.ctx.fill();
      }

      // Vẽ đầu đạn (Kiếm khí, cầu lửa, mũi tên)
      this.ctx.globalAlpha = 1;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 15;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    // 2. Cập nhật & Vẽ hạt nổ (Particles)
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const part = this.particles[i];
      part.x += part.vx;
      part.y += part.vy;
      part.vy += 0.15; // Trọng lực rơi
      part.alpha -= part.decay;

      if (part.alpha <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.beginPath();
      this.ctx.arc(part.x, part.y, part.size, 0, Math.PI * 2);
      this.ctx.fillStyle = part.color;
      this.ctx.globalAlpha = part.alpha;
      this.ctx.shadowColor = part.color;
      this.ctx.shadowBlur = 8;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }

    this.ctx.globalAlpha = 1;
    requestAnimationFrame(() => this.loop());
  }

  // ==========================================
  // HIỆU ỨNG CHIẾN ĐẤU TRÊN ĐIỆN THOẠI HỌC SINH
  // ==========================================
  triggerMobileSlashAnimation(heroClass, isCrit = false) {
    let overlay = document.getElementById('mobileSlashOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'mobileSlashOverlay';
      overlay.className = 'fixed inset-0 pointer-events-none z-50 flex items-center justify-center overflow-hidden';
      document.body.appendChild(overlay);
    }

    overlay.innerHTML = '';

    // Tạo hiệu ứng tương ứng từng class
    const slashEl = document.createElement('div');
    if (heroClass === 'warrior') {
      // Vệt chém kiếm rực lửa đỏ
      slashEl.className = 'w-[140%] h-8 bg-gradient-to-r from-transparent via-red-500 to-transparent transform -rotate-45 shadow-[0_0_40px_#ef4444] animate-slash-blade';
    } else if (heroClass === 'mage') {
      // Cầu lửa tím nổ bùng
      slashEl.className = 'w-64 h-64 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-transparent opacity-80 blur-lg animate-magic-burst';
    } else if (heroClass === 'archer') {
      // 3 mũi tên xanh ngọc xuyên phá
      slashEl.className = 'w-full h-12 flex justify-around animate-arrow-volley';
      slashEl.innerHTML = `
        <div class="w-1.5 h-36 bg-emerald-400 rotate-12 shadow-[0_0_20px_#10b981]"></div>
        <div class="w-2 h-44 bg-teal-300 shadow-[0_0_25px_#14b8a6]"></div>
        <div class="w-1.5 h-36 bg-emerald-400 -rotate-12 shadow-[0_0_20px_#10b981]"></div>
      `;
    } else {
      // Khiên thánh sóng xung kích vàng chói
      slashEl.className = 'w-72 h-72 rounded-full border-8 border-amber-400 bg-amber-400/20 shadow-[0_0_60px_#f59e0b] animate-shield-pulse';
    }

    overlay.appendChild(slashEl);

    // Rung nhẹ màn hình (Screen shake)
    document.body.classList.add('mobile-screen-shake');
    setTimeout(() => {
      document.body.classList.remove('mobile-screen-shake');
      overlay.innerHTML = '';
    }, 600);
  }
}

window.battleFx = new BattleFxEngine();
