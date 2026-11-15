import { GameState } from './state.js';
import { DIRECTIONS, calculateSlide } from './movement.js';

export class GameEngine {
  constructor() {
    this.state = null;
    this.animationQueue = [];
    this.animatingPathIndex = 0;
    this.currentSegmentProgress = 0;
    this.slideSpeed = 22; // cells per second for snappy arcade feel

    // Event hooks
    this.onMoveStart = null;
    this.onMoveStep = null;
    this.onKeyCollect = null;
    this.onDoorUnlock = null;
    this.onWallHit = null;
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
    if (!this.state || this.state.isMoving || this.state.isCompleted) {
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
      this.state.keysHeld,
      this.state.collectedKeys,
      this.state.unlockedDoors
    );

    if (!result.moved) {
      // Wall bump feedback
      if (this.onWallHit) {
        this.onWallHit(this.state.playerX, this.state.playerY, dir, true);
      }
      return false;
    }

    // Save state for undo before moving
    this.state.saveSnapshot();
    this.state.moveCount++;
    this.state.isMoving = true;

    // Setup animation path
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

    // dt is in seconds
    const progressDelta = dt * this.slideSpeed;
    this.currentSegmentProgress += progressDelta;

    const p0 = this.animationQueue[this.animatingPathIndex];
    const p1 = this.animationQueue[this.animatingPathIndex + 1];

    if (this.currentSegmentProgress >= 1.0) {
      this.currentSegmentProgress = 0;
      this.animatingPathIndex++;

      // Current reached node
      this.state.visualX = p1.x;
      this.state.visualY = p1.y;

      // Handle item collections mid-slide
      if (p1.keyCollected) {
        this.state.collectedKeys.add(p1.coord);
        this.state.keysHeld++;
        if (this.onKeyCollect) this.onKeyCollect(p1.x, p1.y);
      }
      if (p1.doorUnlocked) {
        this.state.unlockedDoors.add(p1.coord);
        this.state.keysHeld--;
        if (this.onDoorUnlock) this.onDoorUnlock(p1.x, p1.y);
      }

      // Check if finished entire path
      if (this.animatingPathIndex >= this.animationQueue.length - 1) {
        this.finishSlide();
      }
    } else {
      // Interpolate visual position
      this.state.visualX = p0.x + (p1.x - p0.x) * this.currentSegmentProgress;
      this.state.visualY = p0.y + (p1.y - p0.y) * this.currentSegmentProgress;
    }
  }

  finishSlide() {
    const res = this.animationResult;
    this.state.playerX = res.endX;
    this.state.playerY = res.endY;
    this.state.visualX = res.endX;
    this.state.visualY = res.endY;
    this.state.keysHeld = res.finalKeysHeld;

    res.newlyCollectedKeys.forEach(k => this.state.collectedKeys.add(k));
    res.newlyUnlockedDoors.forEach(d => this.state.unlockedDoors.add(d));

    this.state.isMoving = false;
    this.animationQueue = [];

    // Trigger wall hit at the stop point if not exit
    if (!res.reachedExit && this.onWallHit) {
      this.onWallHit(res.endX, res.endY, null, false);
    }

    if (res.reachedExit) {
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
