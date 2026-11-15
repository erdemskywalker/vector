import { buildPortalsMap } from './movement.js';

export class GameState {
  constructor(levelData) {
    this.init(levelData);
  }

  init(levelData) {
    this.level = levelData;
    this.width = levelData.width;
    this.height = levelData.height;
    this.grid = levelData.grid;
    this.par = levelData.par || 1;

    // Find start and exit
    this.start = levelData.start || this.findTile('S') || { x: 1, y: 1 };
    this.exit = levelData.exit || this.findTile('E') || { x: this.width - 2, y: this.height - 2 };

    // Logical state
    this.playerX = this.start.x;
    this.playerY = this.start.y;

    // Visual animated position
    this.visualX = this.playerX;
    this.visualY = this.playerY;

    // Quantum Warp Portals map
    this.portalsMap = buildPortalsMap(this.grid, this.width, this.height);

    // Laser Gates state (false = closed forcefield, true = open beam)
    this.gatesOpen = Boolean(levelData.gatesOpen);

    // Count Energy Cores
    this.totalCores = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === 'K') this.totalCores++;
      }
    }

    // Dynamic Max Moves calculation
    if (levelData.maxMoves !== undefined) {
      this.maxMoves = levelData.maxMoves;
    } else if (levelData.id <= 10) {
      this.maxMoves = null; // Unlimited for introductory levels 1-10
    } else if (levelData.id <= 20) {
      this.maxMoves = this.par + 4;
    } else if (levelData.id <= 40) {
      this.maxMoves = this.par + 3;
    } else {
      this.maxMoves = this.par + 2; // Tighter limit for late-game worlds
    }

    this.collectedCores = new Set();
    this.brokenCrackedWalls = new Set();
    this.moveCount = 0;
    this.isCompleted = false;
    this.isDead = false;
    this.deathReason = null;
    this.isMoving = false;

    // Undo History Stack
    this.history = [];
  }

  findTile(char) {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === char) {
          return { x, y };
        }
      }
    }
    return null;
  }

  isPortalActive() {
    return this.collectedCores.size >= this.totalCores;
  }

  getMovesRemaining() {
    if (this.maxMoves === null) return null;
    return Math.max(0, this.maxMoves - this.moveCount);
  }

  saveSnapshot() {
    this.history.push({
      playerX: this.playerX,
      playerY: this.playerY,
      collectedCores: new Set(this.collectedCores),
      brokenCrackedWalls: new Set(this.brokenCrackedWalls),
      gatesOpen: this.gatesOpen,
      moveCount: this.moveCount,
      isDead: this.isDead,
      deathReason: this.deathReason
    });
  }

  undo() {
    if (this.isMoving || this.history.length === 0) {
      return false;
    }

    const snapshot = this.history.pop();
    this.playerX = snapshot.playerX;
    this.playerY = snapshot.playerY;
    this.visualX = snapshot.playerX;
    this.visualY = snapshot.playerY;
    this.collectedCores = snapshot.collectedCores;
    this.brokenCrackedWalls = snapshot.brokenCrackedWalls;
    this.gatesOpen = snapshot.gatesOpen;
    this.moveCount = snapshot.moveCount;
    this.isDead = snapshot.isDead;
    this.deathReason = snapshot.deathReason;
    this.isCompleted = false;

    return true;
  }

  reset() {
    if (this.isMoving) return false;

    this.playerX = this.start.x;
    this.playerY = this.start.y;
    this.visualX = this.start.x;
    this.visualY = this.start.y;
    this.collectedCores.clear();
    this.brokenCrackedWalls.clear();
    this.gatesOpen = Boolean(this.level.gatesOpen);
    this.moveCount = 0;
    this.isCompleted = false;
    this.isDead = false;
    this.deathReason = null;
    this.history = [];

    return true;
  }
}
