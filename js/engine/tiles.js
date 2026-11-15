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
  TELEPORT: 'T',     // Quantum Warp Portal (Transports cube and preserves momentum)
  SWITCH: 'P',       // Pressure Switch / Toggle (Toggles laser forcefield gates on/off)
  GATE: 'G',         // Laser Forcefield Gate (Impassable when closed, passable when open)
  ICE: 'I'           // Frictionless Ice (Future)
};

export const TILE_PROPERTIES = {
  [TILE_TYPES.WALL]: { isSolid: true },
  [TILE_TYPES.CRACKED]: { isSolid: true, isBreakable: true },
  [TILE_TYPES.EMPTY]: { isSolid: false },
  [TILE_TYPES.START]: { isSolid: false },
  [TILE_TYPES.EXIT]: { isSolid: false, isGoal: true },
  [TILE_TYPES.CORE]: { isSolid: false, isCollectible: true },
  [TILE_TYPES.HAZARD]: { isSolid: false, isDeadly: true },
  [TILE_TYPES.TELEPORT]: { isSolid: false, isPortal: true },
  [TILE_TYPES.SWITCH]: { isSolid: false, isSwitch: true },
  [TILE_TYPES.GATE]: { isSolid: true, isGate: true },
  [TILE_TYPES.ICE]: { isSolid: false, isIce: true }
};
