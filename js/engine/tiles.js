/**
 * Tile Definitions and Metadata
 */
export const TILE_TYPES = {
  EMPTY: '.',
  WALL: '#',
  START: 'S',
  EXIT: 'E',
  KEY: 'K',
  DOOR: 'D',
  ICE: 'I',
  TELEPORT: 'T'
};

export const TILE_PROPERTIES = {
  [TILE_TYPES.WALL]: { isSolid: true, blocksLight: true },
  [TILE_TYPES.EMPTY]: { isSolid: false },
  [TILE_TYPES.START]: { isSolid: false },
  [TILE_TYPES.EXIT]: { isSolid: false, isGoal: true },
  [TILE_TYPES.KEY]: { isSolid: false, isCollectible: true },
  [TILE_TYPES.DOOR]: { isSolid: true, isDoor: true },
  [TILE_TYPES.ICE]: { isSolid: false, isIce: true },
  [TILE_TYPES.TELEPORT]: { isSolid: false, isPortal: true }
};

export function isSolid(tile, keysHeld = 0, isDoorUnlocked = false) {
  if (tile === TILE_TYPES.WALL) return true;
  if (tile === TILE_TYPES.DOOR) {
    if (isDoorUnlocked) return false;
    return keysHeld <= 0;
  }
  return false;
}
