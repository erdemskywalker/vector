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

    // Find start and exit if not provided explicitly
    this.start = levelData.start || this.findTile('S');
    this.exit = levelData.exit || this.findTile('E');

    // Logical state
    this.playerX = this.start ? this.start.x : 0;
    this.playerY = this.start ? this.start.y : 0;

    // Visual animated state
    this.visualX = this.playerX;
    this.visualY = this.playerY;

    this.keysHeld = 0;
    this.collectedKeys = new Set();
    this.unlockedDoors = new Set();
    this.moveCount = 0;
    this.isCompleted = false;
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

  saveSnapshot() {
    this.history.push({
      playerX: this.playerX,
      playerY: this.playerY,
      keysHeld: this.keysHeld,
      collectedKeys: new Set(this.collectedKeys),
      unlockedDoors: new Set(this.unlockedDoors),
      moveCount: this.moveCount
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
    this.keysHeld = snapshot.keysHeld;
    this.collectedKeys = snapshot.collectedKeys;
    this.unlockedDoors = snapshot.unlockedDoors;
    this.moveCount = snapshot.moveCount;
    this.isCompleted = false;

    return true;
  }

  reset() {
    if (this.isMoving) return false;

    this.playerX = this.start.x;
    this.playerY = this.start.y;
    this.visualX = this.start.x;
    this.visualY = this.start.y;
    this.keysHeld = 0;
    this.collectedKeys.clear();
    this.unlockedDoors.clear();
    this.moveCount = 0;
    this.isCompleted = false;
    this.history = [];

    return true;
  }
}
