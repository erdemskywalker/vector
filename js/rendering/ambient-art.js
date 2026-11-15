/**
 * Ambient Cerebral / Generative Geometric Art Canvas
 * Renders slow-drifting isometric geometric wireframes, constellation lines,
 * and meditative ambient ripples for a high-end "Mind Art" gallery feel.
 */
export class AmbientArtCanvas {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.nodeCount = 28;
    this.tesseractRotation = 0;
    this.dpr = window.devicePixelRatio || 1;

    this.pointerX = -1000;
    this.pointerY = -1000;

    this.initNodes();
    this.resize();

    window.addEventListener('resize', () => this.resize());
    window.addEventListener('mousemove', (e) => {
      this.pointerX = e.clientX;
      this.pointerY = e.clientY;
    });
    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.pointerX = e.touches[0].clientX;
        this.pointerY = e.touches[0].clientY;
      }
    }, { passive: true });
  }

  resize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.width = w;
    this.height = h;
    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(w * this.dpr);
    this.canvas.height = Math.floor(h * this.dpr);
    this.ctx.resetTransform();
    this.ctx.scale(this.dpr, this.dpr);
  }

  initNodes() {
    this.nodes = [];
    const w = window.innerWidth || 480;
    const h = window.innerHeight || 800;

    for (let i = 0; i < this.nodeCount; i++) {
      this.nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        radius: 1 + Math.random() * 2,
        baseAlpha: 0.15 + Math.random() * 0.35,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  updateAndRender(dt, time) {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    this.tesseractRotation += dt * 0.25;

    // 1. Draw Meditative Rotating Wireframe Hypercube (Tesseract/Merkaba Glyph in Center)
    this.drawCentralGeometry(ctx, w / 2, h * 0.32, time);

    // 2. Update and Draw Constellation Nodes & Fine Hairlines
    for (let i = 0; i < this.nodes.length; i++) {
      const node = this.nodes[i];

      node.x += node.vx * dt;
      node.y += node.vy * dt;

      // Gentle bounds wrap
      if (node.x < 0) node.x = w;
      if (node.x > w) node.x = 0;
      if (node.y < 0) node.y = h;
      if (node.y > h) node.y = 0;

      // Gentle mouse avoidance / ripple
      const dx = node.x - this.pointerX;
      const dy = node.y - this.pointerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 120 && dist > 0) {
        node.x += (dx / dist) * 18 * dt;
        node.y += (dy / dist) * 18 * dt;
      }

      // Draw subtle node
      const pulseAlpha = node.baseAlpha + Math.sin(time * 2 + node.phase) * 0.1;
      ctx.fillStyle = `rgba(115, 215, 255, ${Math.max(0.05, pulseAlpha)})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fill();

      // Connect hairlines to nearby nodes
      for (let j = i + 1; j < this.nodes.length; j++) {
        const other = this.nodes[j];
        const nx = other.x - node.x;
        const ny = other.y - node.y;
        const nDist = Math.sqrt(nx * nx + ny * ny);

        if (nDist < 90) {
          const lineAlpha = (1 - nDist / 90) * 0.08;
          ctx.strokeStyle = `rgba(167, 139, 250, ${lineAlpha})`;
          ctx.lineWidth = 0.75;
          ctx.beginPath();
          ctx.moveTo(node.x, node.y);
          ctx.lineTo(other.x, other.y);
          ctx.stroke();
        }
      }
    }
  }

  drawCentralGeometry(ctx, cx, cy, time) {
    ctx.save();
    ctx.translate(cx, cy);

    const baseRadius = 75;
    const rot = this.tesseractRotation;

    // Outer slow-spinning geometric ring
    ctx.strokeStyle = 'rgba(115, 215, 255, 0.07)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, 0, baseRadius * 1.5, 0, Math.PI * 2);
    ctx.stroke();

    // Sacred Hexagram / Isometric Cube projection
    const points1 = [];
    const points2 = [];
    const sides = 6;

    for (let i = 0; i < sides; i++) {
      const angle = (Math.PI * 2 * i) / sides + rot;
      const r1 = baseRadius * 0.95;
      const r2 = baseRadius * 0.52;
      points1.push({ x: Math.cos(angle) * r1, y: Math.sin(angle) * r1 });
      points2.push({ x: Math.cos(angle + Math.PI / 6) * r2, y: Math.sin(angle + Math.PI / 6) * r2 });
    }

    // Outer Polygon
    ctx.strokeStyle = 'rgba(115, 215, 255, 0.12)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const p = points1[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Inner Polygon
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.14)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
      const p = points2[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.closePath();
    ctx.stroke();

    // Connecting Vertex Lines (Tesseract illusion)
    ctx.strokeStyle = 'rgba(115, 215, 255, 0.08)';
    ctx.lineWidth = 0.8;
    for (let i = 0; i < sides; i++) {
      ctx.beginPath();
      ctx.moveTo(points1[i].x, points1[i].y);
      ctx.lineTo(points2[i].x, points2[i].y);
      ctx.stroke();
    }

    ctx.restore();
  }
}
