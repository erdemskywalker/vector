import { TILE_TYPES } from './tiles.js';

export class CollisionSystem {
  constructor(width, height) {
    this.width = width;
    this.height = height;
  }

  isOutOfBounds(x, y) {
    return x < 0 || x >= this.width || y < 0 || y >= this.height;
  }

  canPass(tile, coordKey, keysHeld, collectedKeys, unlockedDoors) {
    if (tile === TILE_TYPES.WALL) return false;

    if (tile === TILE_TYPES.DOOR) {
      const isUnlocked = unlockedDoors.has(coordKey);
      if (isUnlocked) return true;
      return keysHeld > 0;
    }

    return true;
  }
}
