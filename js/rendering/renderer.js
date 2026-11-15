import { TILE_TYPES } from '../engine/tiles.js';
import { VisualEffects } from './effects.js';

export class CanvasRenderer {
  constructor(canvas, container) {
    this.canvas = canvas;
    this.container = container;
    this.ctx = canvas.getContext('2d');
    this.effects = new VisualEffects();

    this.cellSize = 40;
    this.originX = 0;
    this.originY = 0;
    this.dpr = window.devicePixelRatio || 1;

    this.pulseTime = 0;
    this.trailTimer = 0;

    this.colors = {
      bgGrid: '#171C27',
      borderGrid: '#252C3A',
      wall: '#1E2536',
      wallHighlight: '#2A344A',
      crackedWall: '#232B3D',
      crackedLines: '#73D7FF',
      hazardBg: 'rgba(251, 113, 133, 0.12)',
      hazardBorder: '#FB7185',
      cubeStart: '#73D7FF',
      cubeEnd: '#A78BFA',
      exitActive: '#86EFAC',
      exitInactive: '#333C4E',
      core: '#73D7FF',
      coreInner: '#FDE047'
    };

    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.container) return;
    const rect = this.container.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    this.dpr = window.devicePixelRatio || 1;
    this.canvas.width = Math.floor(width * this.dpr);
    this.canvas.height = Math.floor(height * this.dpr);
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    this.ctx.resetTransform();
    this.ctx.scale(this.dpr, this.dpr);
    this.viewWidth = width;
    this.viewHeight = height;
  }

  calculateLayout(gridWidth, gridHeight) {
    if (!this.viewWidth || !this.viewHeight) {
      this.resize();
    }

    const padding = 20;
    const availWidth = this.viewWidth - padding * 2;
    const availHeight = this.viewHeight - padding * 2;

    const sizeX = Math.floor(availWidth / gridWidth);
    const sizeY = Math.floor(availHeight / gridHeight);

    this.cellSize = Math.min(sizeX, sizeY, 64);

    const boardWidth = this.cellSize * gridWidth;
    const boardHeight = this.cellSize * gridHeight;

    this.originX = Math.floor((this.viewWidth - boardWidth) / 2);
    this.originY = Math.floor((this.viewHeight - boardHeight) / 2);
  }

  render(gameState, dt = 0.016) {
    if (!gameState) return;

    this.pulseTime += dt;
    this.effects.update(dt);

    const ctx = this.ctx;
    const width = this.viewWidth;
    const height = this.viewHeight;

    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(this.effects.shakeOffsetX, this.effects.shakeOffsetY);

    // 1. Grid Background Card
    const boardW = gameState.width * this.cellSize;
    const boardH = gameState.height * this.cellSize;
    const cornerRadius = 14;

    ctx.save();
    ctx.fillStyle = this.colors.bgGrid;
    ctx.strokeStyle = this.colors.borderGrid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.originX - 4, this.originY - 4, boardW + 8, boardH + 8, cornerRadius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. Grid Cells
    for (let y = 0; y < gameState.height; y++) {
      for (let x = 0; x < gameState.width; x++) {
        const cellX = this.originX + x * this.cellSize;
        const cellY = this.originY + y * this.cellSize;
        const tile = gameState.grid[y][x];
        const coord = `${x},${y}`;

        this.drawCell(ctx, tile, coord, cellX, cellY, gameState);
      }
    }

    // 3. Shockwaves & Trails
    this.effects.renderShockwaves(ctx);
    this.effects.renderTrails(ctx);

    // 4. Player Cube (if not destroyed)
    if (!gameState.isDead) {
      this.drawPlayerCube(ctx, gameState, dt);
    }

    // 5. Particles
    this.effects.renderParticles(ctx);

    ctx.restore();
  }

  drawCell(ctx, tile, coord, cellX, cellY, gameState) {
    const size = this.cellSize;
    const p = 2;

    // Grid wireframe
    ctx.strokeStyle = 'rgba(37, 44, 58, 0.45)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cellX, cellY, size, size);

    if (tile === TILE_TYPES.WALL) {
      // Solid Wall
      ctx.save();
      ctx.fillStyle = this.colors.wall;
      ctx.beginPath();
      ctx.roundRect(cellX + p, cellY + p, size - p * 2, size - p * 2, 6);
      ctx.fill();

      ctx.strokeStyle = this.colors.wallHighlight;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cellX + p + 3, cellY + p + 1);
      ctx.lineTo(cellX + size - p - 3, cellY + p + 1);
      ctx.stroke();
      ctx.restore();
    } else if (tile === TILE_TYPES.CRACKED) {
      // Cracked Wall
      const isBroken = gameState.brokenCrackedWalls.has(coord);
      ctx.save();
      if (isBroken) {
        // Broken rubble imprint
        ctx.fillStyle = 'rgba(23, 28, 39, 0.4)';
        ctx.strokeStyle = 'rgba(115, 215, 255, 0.15)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(cellX + p, cellY + p, size - p * 2, size - p * 2, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        // Solid with fracture lines
        ctx.fillStyle = this.colors.crackedWall;
        ctx.beginPath();
        ctx.roundRect(cellX + p, cellY + p, size - p * 2, size - p * 2, 6);
        ctx.fill();

        // Fracture neon lines
        ctx.strokeStyle = 'rgba(115, 215, 255, 0.55)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cellX + size * 0.3, cellY + p + 2);
        ctx.lineTo(cellX + size * 0.5, cellY + size * 0.5);
        ctx.lineTo(cellX + size * 0.4, cellY + size * 0.8);
        ctx.lineTo(cellX + size * 0.7, cellY + size - p - 2);
        ctx.stroke();
      }
      ctx.restore();
    } else if (tile === TILE_TYPES.HAZARD) {
      // Deadly Hazard Laser Plate
      ctx.save();
      const pulse = 0.7 + Math.sin(this.pulseTime * 6) * 0.3;
      ctx.fillStyle = this.colors.hazardBg;
      ctx.strokeStyle = `rgba(251, 113, 133, ${pulse})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cellX + p, cellY + p, size - p * 2, size - p * 2, 4);
      ctx.fill();
      ctx.stroke();

      // Danger Cross
      const cx = cellX + size / 2;
      const cy = cellY + size / 2;
      const r = size * 0.22;
      ctx.strokeStyle = '#FB7185';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - r, cy - r);
      ctx.lineTo(cx + r, cy + r);
      ctx.moveTo(cx + r, cy - r);
      ctx.lineTo(cx - r, cy + r);
      ctx.stroke();
      ctx.restore();
    } else if (tile === TILE_TYPES.CORE) {
      // Energy Core
      if (!gameState.collectedCores.has(coord)) {
        this.drawCore(ctx, cellX, cellY, size);
      }
    } else if (tile === TILE_TYPES.EXIT) {
      // Exit Portal
      this.drawExit(ctx, cellX, cellY, size, gameState.isPortalActive());
    } else if (tile === TILE_TYPES.TELEPORT) {
      // Quantum Warp Portal
      this.drawPortal(ctx, cellX, cellY, size);
    } else if (tile === TILE_TYPES.SWITCH) {
      // Logic Pressure Switch
      this.drawSwitch(ctx, cellX, cellY, size, gameState.gatesOpen);
    } else if (tile === TILE_TYPES.GATE) {
      // Laser Forcefield Gate
      this.drawGate(ctx, cellX, cellY, size, gameState.gatesOpen);
    }
  }

  drawCore(ctx, cellX, cellY, size) {
    const cx = cellX + size / 2;
    const cy = cellY + size / 2;
    const pulse = 1 + Math.sin(this.pulseTime * 5) * 0.1;
    const r = (size * 0.26) * pulse;

    ctx.save();
    ctx.shadowColor = this.colors.core;
    ctx.shadowBlur = 12;

    // Outer Aura Ring
    ctx.strokeStyle = 'rgba(115, 215, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 1.3, 0, Math.PI * 2);
    ctx.stroke();

    // Floating Diamond Core
    ctx.fillStyle = this.colors.core;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();

    // Inner bright center
    ctx.fillStyle = this.colors.coreInner;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawExit(ctx, cellX, cellY, size, isActive) {
    const cx = cellX + size / 2;
    const cy = cellY + size / 2;

    ctx.save();
    if (isActive) {
      // Active Radiant Exit Portal
      const pulse = 1 + Math.sin(this.pulseTime * 4.5) * 0.08;
      const radius = (size * 0.34) * pulse;

      ctx.shadowColor = this.colors.exitActive;
      ctx.shadowBlur = 16;
      ctx.strokeStyle = this.colors.exitActive;
      ctx.lineWidth = 2.5;

      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Spinning inner diamond
      ctx.fillStyle = 'rgba(134, 239, 172, 0.3)';
      ctx.beginPath();
      ctx.roundRect(cx - radius * 0.5, cy - radius * 0.5, radius, radius, 4);
      ctx.fill();
    } else {
      // Inactive / Sleeping Portal
      const radius = size * 0.3;
      ctx.strokeStyle = this.colors.exitInactive;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      // Central Lock Icon / Dot
      ctx.fillStyle = this.colors.exitInactive;
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  drawPortal(ctx, cellX, cellY, size) {
    const cx = cellX + size / 2;
    const cy = cellY + size / 2;
    const r = size * 0.35;
    const angle = this.pulseTime * 2.2;

    ctx.save();
    // Outer rotating ring (Cyan)
    ctx.shadowColor = '#73D7FF';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#73D7FF';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.arc(cx, cy, r, angle, angle + Math.PI * 1.5);
    ctx.stroke();

    // Inner counter-rotating ring (Purple)
    ctx.strokeStyle = '#A78BFA';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.65, -angle, -angle + Math.PI * 1.5);
    ctx.stroke();

    // Central Singularity Void
    ctx.fillStyle = '#07090E';
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.35, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawSwitch(ctx, cellX, cellY, size, isArmed) {
    const cx = cellX + size / 2;
    const cy = cellY + size / 2;
    const p = size * 0.18;

    ctx.save();
    // Switch Base Pad
    ctx.fillStyle = isArmed ? 'rgba(251, 191, 36, 0.12)' : 'rgba(100, 116, 139, 0.1)';
    ctx.strokeStyle = isArmed ? '#FBBF24' : '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cellX + p, cellY + p, size - p * 2, size - p * 2, 4);
    ctx.fill();
    ctx.stroke();

    // Core Indicator Light
    const pulse = 1 + Math.sin(this.pulseTime * 6) * 0.15;
    ctx.fillStyle = isArmed ? '#FBBF24' : '#38BDF8';
    if (isArmed) {
      ctx.shadowColor = '#FBBF24';
      ctx.shadowBlur = 10;
    }
    ctx.beginPath();
    ctx.arc(cx, cy, (size * 0.12) * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawGate(ctx, cellX, cellY, size, isOpen) {
    const p = 2;
    ctx.save();

    if (!isOpen) {
      // Closed Laser Forcefield Barrier
      ctx.fillStyle = 'rgba(251, 113, 133, 0.12)';
      ctx.strokeStyle = 'rgba(251, 113, 133, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cellX + p, cellY + p, size - p * 2, size - p * 2, 4);
      ctx.fill();
      ctx.stroke();

      // Laser energy beams
      const pulse = 0.8 + Math.sin(this.pulseTime * 8) * 0.2;
      ctx.shadowColor = '#FB7185';
      ctx.shadowBlur = 10;
      ctx.strokeStyle = `rgba(251, 113, 133, ${pulse})`;
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.moveTo(cellX + p + 2, cellY + size * 0.35);
      ctx.lineTo(cellX + size - p - 2, cellY + size * 0.35);
      ctx.moveTo(cellX + p + 2, cellY + size * 0.65);
      ctx.lineTo(cellX + size - p - 2, cellY + size * 0.65);
      ctx.stroke();
    } else {
      // Open / Deactivated Gate Guide
      ctx.strokeStyle = 'rgba(115, 215, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cellX + size * 0.5, cellY + p);
      ctx.lineTo(cellX + size * 0.5, cellY + size - p);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    ctx.restore();
  }

  drawPlayerCube(ctx, gameState, dt) {
    const px = this.originX + gameState.visualX * this.cellSize;
    const py = this.originY + gameState.visualY * this.cellSize;
    const padding = Math.max(3, this.cellSize * 0.1);
    const cubeSize = this.cellSize - padding * 2;
    const corner = cubeSize * 0.22;

    if (gameState.isMoving) {
      this.trailTimer += dt;
      if (this.trailTimer > 0.02) {
        this.trailTimer = 0;
        this.effects.addTrail(px + padding, py + padding, cubeSize, this.colors.cubeStart);
      }
    }

    ctx.save();
    ctx.shadowColor = this.colors.cubeStart;
    ctx.shadowBlur = 14;

    const gradient = ctx.createLinearGradient(
      px + padding,
      py + padding,
      px + padding + cubeSize,
      py + padding + cubeSize
    );
    gradient.addColorStop(0, this.colors.cubeStart);
    gradient.addColorStop(1, this.colors.cubeEnd);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(px + padding, py + padding, cubeSize, cubeSize, corner);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px + padding + 1, py + padding + 1, cubeSize - 2, cubeSize - 2, corner - 1);
    ctx.stroke();

    ctx.restore();
  }
}
