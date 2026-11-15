import { GameState } from './state.js';
import { DIRECTIONS, calculateSlide } from './movement.js';

export class GameEngine {
  constructor() {
    this.state = null;
    this.animationQueue = [];
    this.animatingPathIndex = 0;
    this.currentSegmentProgress = 0;
    this.slideSpeed = 22; // Snappy arcade speed

    // Event hooks
    this.onMoveStart = null;
    this.onMoveStep = null;
    this.onCoreCollect = null;
    this.onWallCrack = null;
    this.onWallHit = null;
    this.onPortalActivate = null;
    this.onPortalWarp = null;
    this.onSwitchToggle = null;
    this.onPlayerDeath = null;
    this.onLevelComplete = null;
    this.onStateChange = null;
  }

  loadLevel(levelData) {
    this.state = new GameState(levelData);
    this.animationQueue = [];
    this.animatingPathIndex = 0;
    this.currentSegmentProgress = 0;
    if (this.onStateChange) this.onStateChange(this.state);
  }

  move(directionKey) {
    if (!this.state || this.state.isMoving || this.state.isCompleted || this.state.isDead) {
      return false;
    }

    const dir = DIRECTIONS[directionKey];
    if (!dir) return false;

    const result = calculateSlide(
      this.state.grid,
      this.state.width,
      this.state.height,
      this.state.playerX,
      this.state.playerY,
      dir,
      this.state.totalCores,
      this.state.collectedCores,
      this.state.brokenCrackedWalls,
      this.state.portalsMap,
      this.state.gatesOpen
    );

    if (!result.moved) {
      if (this.onWallHit) {
        this.onWallHit(this.state.playerX, this.state.playerY, dir, true);
      }
      return false;
    }

    // Save snapshot for undo before applying move
    this.state.saveSnapshot();
    this.state.moveCount++;
    this.state.isMoving = true;

    this.animationResult = result;
    this.animationQueue = [
      { x: this.state.playerX, y: this.state.playerY },
      ...result.path
    ];
    this.animatingPathIndex = 0;
    this.currentSegmentProgress = 0;

    if (this.onMoveStart) {
      this.onMoveStart(dir, result);
    }
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }

    return true;
  }

  update(dt) {
    if (!this.state || !this.state.isMoving || this.animationQueue.length < 2) {
      return;
    }

    const p0 = this.animationQueue[this.animatingPathIndex];
    const p1 = this.animationQueue[this.animatingPathIndex + 1];

    // If next segment is a portal jump, teleport instantly without linear interpolation across maze
    if (p1.isPortalExit) {
      this.currentSegmentProgress = 0;
      this.animatingPathIndex++;
      this.state.visualX = p1.x;
      this.state.visualY = p1.y;
      if (this.onPortalWarp) this.onPortalWarp(p0.x, p0.y, p1.x, p1.y);
      if (this.animatingPathIndex >= this.animationQueue.length - 1) {
        this.finishSlide();
      }
      return;
    }

    const progressDelta = dt * this.slideSpeed;
    this.currentSegmentProgress += progressDelta;

    if (this.currentSegmentProgress >= 1.0) {
      this.currentSegmentProgress = 0;
      this.animatingPathIndex++;

      this.state.visualX = p1.x;
      this.state.visualY = p1.y;

      // Switch toggle mid-slide
      if (p1.isSwitch) {
        this.state.gatesOpen = p1.gatesOpen;
        if (this.onSwitchToggle) this.onSwitchToggle(p1.x, p1.y, p1.gatesOpen);
      }

      // Core collection mid-slide
      if (p1.coreCollected) {
        this.state.collectedCores.add(p1.coord);
        const remaining = Math.max(0, this.state.totalCores - this.state.collectedCores.size);
        if (this.onCoreCollect) this.onCoreCollect(p1.x, p1.y, remaining);

        if (this.state.isPortalActive() && this.onPortalActivate) {
          this.onPortalActivate();
        }
      }

      // Hazard contact mid-slide
      if (p1.hitHazard) {
        this.finishHazardDeath(p1.x, p1.y);
        return;
      }

      // End of path
      if (this.animatingPathIndex >= this.animationQueue.length - 1) {
        this.finishSlide();
      }
    } else {
      this.state.visualX = p0.x + (p1.x - p0.x) * this.currentSegmentProgress;
      this.state.visualY = p0.y + (p1.y - p0.y) * this.currentSegmentProgress;
    }
  }

  finishHazardDeath(x, y) {
    this.state.playerX = x;
    this.state.playerY = y;
    this.state.visualX = x;
    this.state.visualY = y;
    this.state.isMoving = false;
    this.state.isDead = true;
    this.state.deathReason = 'HAZARD';
    this.animationQueue = [];

    if (this.onPlayerDeath) {
      this.onPlayerDeath('HAZARD', x, y);
    }
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  finishSlide() {
    const res = this.animationResult;
    this.state.playerX = res.endX;
    this.state.playerY = res.endY;
    this.state.visualX = res.endX;
    this.state.visualY = res.endY;
    this.state.gatesOpen = res.finalGatesOpen;

    res.newlyCollectedCores.forEach(c => this.state.collectedCores.add(c));

    // Handle cracked walls shattering
    if (res.newlyBrokenCracked.length > 0) {
      res.newlyBrokenCracked.forEach(c => this.state.brokenCrackedWalls.add(c));
      if (this.onWallCrack) {
        this.onWallCrack(res.newlyBrokenCracked);
      }
    }

    this.state.isMoving = false;
    this.animationQueue = [];

    // Wall impact if stopped normally
    if (!res.reachedExit && this.onWallHit) {
      this.onWallHit(res.endX, res.endY, null, false);
    }

    // Energy / Max Moves depletion check
    if (
      this.state.maxMoves !== null &&
      this.state.moveCount >= this.state.maxMoves &&
      !res.reachedExit
    ) {
      this.state.isDead = true;
      this.state.deathReason = 'ENERGY_DEPLETED';
      if (this.onPlayerDeath) {
        this.onPlayerDeath('ENERGY_DEPLETED', res.endX, res.endY);
      }
    } else if (res.reachedExit) {
      this.state.isCompleted = true;
      if (this.onLevelComplete) {
        this.onLevelComplete({
          moves: this.state.moveCount,
          par: this.state.par
        });
      }
    }

    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  undo() {
    if (!this.state || this.state.isMoving) return false;
    const success = this.state.undo();
    if (success && this.onStateChange) {
      this.onStateChange(this.state);
    }
    return success;
  }

  restart() {
    if (!this.state || this.state.isMoving) return false;
    const success = this.state.reset();
    if (success && this.onStateChange) {
      this.onStateChange(this.state);
    }
    return success;
  }
}
