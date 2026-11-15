/**
 * Tile Definitions and Metadata — VECTOR 2.0
 */
export const TILE_TYPES = {
  EMPTY: '.',
  WALL: '#',
  START: 'S',
  EXIT: 'E',
  CORE: 'K',         // Energy Core (All cores must be collected to activate exit)
  CRACKED: 'C',      // Cracked Wall (Stops cube once, then shatters)
  HAZARD: 'X',       // Laser / Hazard Trap (Instant death on contact)
  ICE: 'I',          // Frictionless Ice (Future)
  TELEPORT: 'T'      // Portal (Future)
};

export const TILE_PROPERTIES = {
  [TILE_TYPES.WALL]: { isSolid: true },
  [TILE_TYPES.CRACKED]: { isSolid: true, isBreakable: true },
  [TILE_TYPES.EMPTY]: { isSolid: false },
  [TILE_TYPES.START]: { isSolid: false },
  [TILE_TYPES.EXIT]: { isSolid: false, isGoal: true },
  [TILE_TYPES.CORE]: { isSolid: false, isCollectible: true },
  [TILE_TYPES.HAZARD]: { isSolid: false, isDeadly: true },
  [TILE_TYPES.ICE]: { isSolid: false, isIce: true },
  [TILE_TYPES.TELEPORT]: { isSolid: false, isPortal: true }
};
