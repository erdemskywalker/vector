/**
 * Visual Effects: Particle Systems, Shockwaves, Wall Debris, Screen Shake
 */
export class VisualEffects {
  constructor() {
    this.particles = [];
    this.trails = [];
    this.shockwaves = [];
    this.shakeIntensity = 0;
    this.shakeDecay = 0.9;
    this.shakeOffsetX = 0;
    this.shakeOffsetY = 0;
  }

  addTrail(x, y, size, color) {
    this.trails.push({
      x,
      y,
      size,
      alpha: 0.65,
      color: color || '#73D7FF'
    });
  }

  addBurst(centerX, centerY, color, count = 14) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 40 + Math.random() * 80;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        alpha: 1,
        color: color,
        life: 0.45,
        maxLife: 0.45
      });
    }
  }

  addDebris(centerX, centerY, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 25 + Math.random() * 45;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 4,
        alpha: 0.9,
        color: '#4B5563',
        life: 0.4,
        maxLife: 0.4
      });
    }
  }

  addShockwave(centerX, centerY, color = '#86EFAC', maxRadius = 60) {
    this.shockwaves.push({
      x: centerX,
      y: centerY,
      radius: 5,
      maxRadius: maxRadius,
      color: color,
      alpha: 0.9,
      speed: 140
    });
  }

  triggerImpact(intensity = 4) {
    this.shakeIntensity = intensity;
  }

  update(dt) {
    // 1. Screen Shake
    if (this.shakeIntensity > 0.05) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeIntensity = 0;
    }

    // 2. Trails
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      t.alpha -= dt * 3.8;
      if (t.alpha <= 0) {
        this.trails.splice(i, 1);
      }
    }

    // 3. Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.alpha = Math.max(0, p.life / p.maxLife);
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // 4. Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += s.speed * dt;
      s.alpha = Math.max(0, 1 - (s.radius / s.maxRadius));
      if (s.radius >= s.maxRadius || s.alpha <= 0) {
        this.shockwaves.splice(i, 1);
      }
    }
  }

  renderTrails(ctx) {
    for (const t of this.trails) {
      ctx.save();
      ctx.globalAlpha = t.alpha;
      ctx.fillStyle = t.color;
      ctx.shadowColor = t.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(t.x, t.y, t.size, t.size, t.size * 0.2);
      ctx.fill();
      ctx.restore();
    }
  }

  renderShockwaves(ctx) {
    for (const s of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = s.alpha;
      ctx.strokeStyle = s.color;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  renderParticles(ctx) {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}
