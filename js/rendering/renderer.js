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
      cubeStart: '#73D7FF',
      cubeEnd: '#A78BFA',
      exit: '#86EFAC',
      exitGlow: 'rgba(134, 239, 172, 0.4)',
      key: '#FDE047',
      door: '#F59E0B',
      doorLockedBorder: '#FB7185'
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

    const padding = 24;
    const availWidth = this.viewWidth - padding * 2;
    const availHeight = this.viewHeight - padding * 2;

    const sizeX = Math.floor(availWidth / gridWidth);
    const sizeY = Math.floor(availHeight / gridHeight);

    // Keep square cells, maximum limit for visual balance
    this.cellSize = Math.min(sizeX, sizeY, 68);

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

    // Clear entire frame
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    // Apply camera shake if active
    ctx.translate(this.effects.shakeOffsetX, this.effects.shakeOffsetY);

    // 1. Draw Grid Outer Card / Background
    const boardW = gameState.width * this.cellSize;
    const boardH = gameState.height * this.cellSize;
    const cornerRadius = 16;

    ctx.save();
    ctx.fillStyle = this.colors.bgGrid;
    ctx.strokeStyle = this.colors.borderGrid;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(this.originX - 4, this.originY - 4, boardW + 8, boardH + 8, cornerRadius);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 2. Draw Cells & Walls
    for (let y = 0; y < gameState.height; y++) {
      for (let x = 0; x < gameState.width; x++) {
        const cellX = this.originX + x * this.cellSize;
        const cellY = this.originY + y * this.cellSize;
        const tile = gameState.grid[y][x];
        const coord = `${x},${y}`;

        this.drawCell(ctx, tile, coord, cellX, cellY, gameState);
      }
    }

    // 3. Render Visual Trails
    this.effects.renderTrails(ctx);

    // 4. Render Player Cube
    this.drawPlayerCube(ctx, gameState, dt);

    // 5. Render Particle Bursts
    this.effects.renderParticles(ctx);

    ctx.restore();
  }

  drawCell(ctx, tile, coord, cellX, cellY, gameState) {
    const size = this.cellSize;
    const innerPadding = 2;

    // Empty cell grid line
    ctx.strokeStyle = 'rgba(37, 44, 58, 0.4)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cellX, cellY, size, size);

    if (tile === TILE_TYPES.WALL) {
      // Premium Beveled Wall
      ctx.save();
      ctx.fillStyle = this.colors.wall;
      ctx.beginPath();
      ctx.roundRect(cellX + innerPadding, cellY + innerPadding, size - innerPadding * 2, size - innerPadding * 2, 6);
      ctx.fill();

      // Top edge highlight for 3D depth
      ctx.strokeStyle = this.colors.wallHighlight;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cellX + innerPadding + 4, cellY + innerPadding + 1);
      ctx.lineTo(cellX + size - innerPadding - 4, cellY + innerPadding + 1);
      ctx.stroke();
      ctx.restore();
    } else if (tile === TILE_TYPES.EXIT) {
      // Exit Portal
      this.drawExit(ctx, cellX, cellY, size);
    } else if (tile === TILE_TYPES.KEY) {
      if (!gameState.collectedKeys.has(coord)) {
        this.drawKey(ctx, cellX, cellY, size);
      }
    } else if (tile === TILE_TYPES.DOOR) {
      const isUnlocked = gameState.unlockedDoors.has(coord);
      this.drawDoor(ctx, cellX, cellY, size, isUnlocked);
    }
  }

  drawExit(ctx, cellX, cellY, size) {
    const cx = cellX + size / 2;
    const cy = cellY + size / 2;
    const pulse = 1 + Math.sin(this.pulseTime * 4) * 0.08;
    const radius = (size * 0.32) * pulse;

    ctx.save();
    // Outer Glow Ring
    ctx.shadowColor = this.colors.exit;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = this.colors.exit;
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner Portal Diamond
    ctx.fillStyle = 'rgba(134, 239, 172, 0.25)';
    ctx.beginPath();
    ctx.roundRect(cx - radius * 0.5, cy - radius * 0.5, radius, radius, 4);
    ctx.fill();

    ctx.restore();
  }

  drawKey(ctx, cellX, cellY, size) {
    const cx = cellX + size / 2;
    const cy = cellY + size / 2;
    const pulse = 1 + Math.sin(this.pulseTime * 5) * 0.06;
    const keySize = (size * 0.28) * pulse;

    ctx.save();
    ctx.shadowColor = this.colors.key;
    ctx.shadowBlur = 12;
    ctx.fillStyle = this.colors.key;

    // Glowing Diamond Key
    ctx.beginPath();
    ctx.moveTo(cx, cy - keySize);
    ctx.lineTo(cx + keySize, cy);
    ctx.lineTo(cx, cy + keySize);
    ctx.lineTo(cx - keySize, cy);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  drawDoor(ctx, cellX, cellY, size, isUnlocked) {
    const p = 3;
    const w = size - p * 2;
    const h = size - p * 2;

    ctx.save();
    if (isUnlocked) {
      // Open / Unlocked Door (Recessed Floor)
      ctx.fillStyle = 'rgba(23, 28, 39, 0.5)';
      ctx.strokeStyle = 'rgba(134, 239, 172, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(cellX + p, cellY + p, w, h, 6);
      ctx.fill();
      ctx.stroke();
    } else {
      // Locked Door Barrier
      ctx.fillStyle = '#2A1B1D';
      ctx.strokeStyle = this.colors.doorLockedBorder;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(cellX + p, cellY + p, w, h, 6);
      ctx.fill();
      ctx.stroke();

      // Lock Icon Motif
      const cx = cellX + size / 2;
      const cy = cellY + size / 2;
      ctx.fillStyle = this.colors.door;
      ctx.beginPath();
      ctx.roundRect(cx - 5, cy - 2, 10, 8, 2);
      ctx.fill();
      ctx.strokeStyle = this.colors.door;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(cx, cy - 3, 4, Math.PI, 0);
      ctx.stroke();
    }
    ctx.restore();
  }

  drawPlayerCube(ctx, gameState, dt) {
    const px = this.originX + gameState.visualX * this.cellSize;
    const py = this.originY + gameState.visualY * this.cellSize;
    const padding = Math.max(3, this.cellSize * 0.1);
    const cubeSize = this.cellSize - padding * 2;
    const corner = cubeSize * 0.22;

    // Emit trail when moving
    if (gameState.isMoving) {
      this.trailTimer += dt;
      if (this.trailTimer > 0.02) {
        this.trailTimer = 0;
        this.effects.addTrail(px + padding, py + padding, cubeSize, this.colors.cubeStart);
      }
    }

    ctx.save();
    // Soft outer neon glow
    ctx.shadowColor = this.colors.cubeStart;
    ctx.shadowBlur = 14;

    // Cube Gradient
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

    // Subtle inner bevel/highlight
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(px + padding + 1, py + padding + 1, cubeSize - 2, cubeSize - 2, corner - 1);
    ctx.stroke();

    ctx.restore();
  }
}
