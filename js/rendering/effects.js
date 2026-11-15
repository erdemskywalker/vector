/**
 * Visual Effects: Particle Systems, Trail Manager, Screen Shake
 */
export class VisualEffects {
  constructor() {
    this.particles = [];
    this.trails = [];
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
      alpha: 0.6,
      color: color || '#73D7FF'
    });
  }

  addBurst(centerX, centerY, color, count = 12) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 40 + Math.random() * 60;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        alpha: 1,
        color: color,
        life: 0.5,
        maxLife: 0.5
      });
    }
  }

  triggerImpact(intensity = 4) {
    this.shakeIntensity = intensity;
  }

  update(dt) {
    // 1. Update Screen Shake
    if (this.shakeIntensity > 0.05) {
      this.shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
      this.shakeIntensity *= Math.pow(this.shakeDecay, dt * 60);
    } else {
      this.shakeOffsetX = 0;
      this.shakeOffsetY = 0;
      this.shakeIntensity = 0;
    }

    // 2. Update Trails
    for (let i = this.trails.length - 1; i >= 0; i--) {
      const t = this.trails[i];
      t.alpha -= dt * 3.5;
      if (t.alpha <= 0) {
        this.trails.splice(i, 1);
      }
    }

    // 3. Update Particles
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
