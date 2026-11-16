import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

import { LevelSolver } from '../js/levels/level-solver.js';

function Mulberry32(seed) {
  return function() {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// ----------------------------------------------------
// Level Generation Generators
// ----------------------------------------------------

function generateWorld1or2(id, world, name, width, height, minPar, maxPar, config, seed) {
  const { numCores = 0, numCracked = 0, numHazards = 0 } = config;
  const rng = Mulberry32(seed + id * 137);

  for (let attempt = 0; attempt < 8000; attempt++) {
    const grid = Array.from({ length: height }, () => Array(width).fill('.'));

    // Boundary walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          grid[y][x] = '#';
        }
      }
    }

    // Interior walls
    const wallDensity = 0.16 + rng() * 0.10;
    const innerWallsCount = Math.floor(width * height * wallDensity);
    for (let i = 0; i < innerWallsCount; i++) {
      const wx = 1 + Math.floor(rng() * (width - 2));
      const wy = 1 + Math.floor(rng() * (height - 2));
      grid[wy][wx] = '#';
    }

    // Cracked walls (C)
    for (let i = 0; i < numCracked; i++) {
      const cx = 1 + Math.floor(rng() * (width - 2));
      const cy = 1 + Math.floor(rng() * (height - 2));
      if (grid[cy][cx] === '.') grid[cy][cx] = 'C';
    }

    // Hazards (X)
    for (let i = 0; i < numHazards; i++) {
      const hx = 1 + Math.floor(rng() * (width - 2));
      const hy = 1 + Math.floor(rng() * (height - 2));
      if (grid[hy][hx] === '.') grid[hy][hx] = 'X';
    }

    // Open cells
    const openCells = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (grid[y][x] === '.') openCells.push({ x, y });
      }
    }

    if (openCells.length < 5 + numCores) continue;

    // Start
    const sIdx = Math.floor(rng() * openCells.length);
    const start = openCells.splice(sIdx, 1)[0];
    grid[start.y][start.x] = 'S';

    // Exit (distant from Start)
    let bestExitIdx = -1, maxDist = -1;
    for (let i = 0; i < openCells.length; i++) {
      const dist = Math.abs(openCells[i].x - start.x) + Math.abs(openCells[i].y - start.y);
      if (dist > maxDist) { maxDist = dist; bestExitIdx = i; }
    }
    const exit = openCells.splice(bestExitIdx, 1)[0];
    grid[exit.y][exit.x] = 'E';

    // Cores (K)
    for (let k = 0; k < numCores; k++) {
      if (openCells.length === 0) break;
      const kCell = openCells.splice(Math.floor(rng() * openCells.length), 1)[0];
      grid[kCell.y][kCell.x] = 'K';
    }

    const gridStrings = grid.map(r => r.join(''));
    const parsed = { width, height, grid: gridStrings, start, exit };
    const sol = LevelSolver.solve(parsed);

    if (sol && sol.solved && sol.moves >= minPar && sol.moves <= maxPar) {
      return {
        id, world, name, width, height, par: sol.moves, grid: gridStrings, solution: sol
      };
    }
  }
  throw new Error(`Failed to generate valid level ${id} (${name})`);
}

function generateWorld3Quantum(id, name, width, height, minPar, maxPar, config, seed) {
  const { numCores = 1, numCracked = 1, numHazards = 1 } = config;
  const rng = Mulberry32(seed + id * 179);

  for (let attempt = 0; attempt < 8000; attempt++) {
    const grid = Array.from({ length: height }, () => Array(width).fill('.'));

    // Boundary walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          grid[y][x] = '#';
        }
      }
    }

    // Partition wall creating Sector Alpha (left) and Sector Beta (right)
    const splitX = Math.floor(width / 2);
    for (let y = 1; y < height - 1; y++) {
      grid[y][splitX] = '#';
    }

    // Interior walls in Alpha
    const alphaWalls = Math.floor(splitX * height * (0.16 + rng() * 0.08));
    for (let i = 0; i < alphaWalls; i++) {
      const wx = 1 + Math.floor(rng() * (splitX - 1));
      const wy = 1 + Math.floor(rng() * (height - 2));
      grid[wy][wx] = '#';
    }

    // Interior walls in Beta
    const betaWalls = Math.floor((width - splitX) * height * (0.16 + rng() * 0.08));
    for (let i = 0; i < betaWalls; i++) {
      const wx = splitX + 1 + Math.floor(rng() * (width - splitX - 2));
      const wy = 1 + Math.floor(rng() * (height - 2));
      grid[wy][wx] = '#';
    }

    // Cracked walls and Hazards in Alpha and Beta
    for (let i = 0; i < numCracked; i++) {
      const cx = 1 + Math.floor(rng() * (splitX - 1));
      const cy = 1 + Math.floor(rng() * (height - 2));
      if (grid[cy][cx] === '.') grid[cy][cx] = 'C';
    }
    for (let i = 0; i < numHazards; i++) {
      const hx = splitX + 1 + Math.floor(rng() * (width - splitX - 2));
      const hy = 1 + Math.floor(rng() * (height - 2));
      if (grid[hy][hx] === '.') grid[hy][hx] = 'X';
    }

    // Find open cells in Alpha and Beta
    const alphaOpen = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < splitX; x++) {
        if (grid[y][x] === '.') alphaOpen.push({ x, y });
      }
    }
    const betaOpen = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = splitX + 1; x < width - 1; x++) {
        if (grid[y][x] === '.') betaOpen.push({ x, y });
      }
    }

    if (alphaOpen.length < 4 || betaOpen.length < 4) continue;

    // Start in Sector Alpha
    const start = alphaOpen.splice(Math.floor(rng() * alphaOpen.length), 1)[0];
    grid[start.y][start.x] = 'S';

    // Portal T1 in Sector Alpha
    const t1 = alphaOpen.splice(Math.floor(rng() * alphaOpen.length), 1)[0];
    grid[t1.y][t1.x] = 'T';

    // Portal T2 in Sector Beta
    const t2 = betaOpen.splice(Math.floor(rng() * betaOpen.length), 1)[0];
    grid[t2.y][t2.x] = 'T';

    // Exit in Sector Beta! (Physically impossible to reach without portal!)
    const exit = betaOpen.splice(Math.floor(rng() * betaOpen.length), 1)[0];
    grid[exit.y][exit.x] = 'E';

    // Place Cores
    for (let k = 0; k < numCores; k++) {
      const pool = (k % 2 === 0 && alphaOpen.length > 0) ? alphaOpen : betaOpen;
      if (pool.length > 0) {
        const kCell = pool.splice(Math.floor(rng() * pool.length), 1)[0];
        grid[kCell.y][kCell.x] = 'K';
      }
    }

    const gridStrings = grid.map(r => r.join(''));
    const parsed = { width, height, grid: gridStrings, start, exit };
    const sol = LevelSolver.solve(parsed);

    // GUARANTEED: Must use the portal to solve!
    if (sol && sol.solved && sol.portalsUsed > 0 && sol.moves >= minPar && sol.moves <= maxPar) {
      return {
        id, world: 'quantum', name, width, height, par: sol.moves, grid: gridStrings, solution: sol
      };
    }
  }
  throw new Error(`Failed to generate valid Quantum level ${id} (${name})`);
}

function generateWorld4Nexus(id, name, width, height, minPar, maxPar, config, seed) {
  const { numCores = 2, numCracked = 2, numHazards = 2, withPortal = false } = config;
  const rng = Mulberry32(seed + id * 223);

  for (let attempt = 0; attempt < 8000; attempt++) {
    const grid = Array.from({ length: height }, () => Array(width).fill('.'));

    // Boundary walls
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
          grid[y][x] = '#';
        }
      }
    }

    // Vault wall separating the right 4 columns
    const vaultX = width - 4;
    const gateY = 1 + Math.floor(rng() * (height - 2));

    for (let y = 1; y < height - 1; y++) {
      if (y === gateY) {
        grid[y][vaultX] = 'G'; // The Laser Forcefield Gate!
      } else {
        grid[y][vaultX] = '#';
      }
    }

    // Interior walls in main sector
    const mainWalls = Math.floor(vaultX * height * (0.16 + rng() * 0.08));
    for (let i = 0; i < mainWalls; i++) {
      const wx = 1 + Math.floor(rng() * (vaultX - 1));
      const wy = 1 + Math.floor(rng() * (height - 2));
      grid[wy][wx] = '#';
    }

    // Cracked walls and Hazards in main sector
    for (let i = 0; i < numCracked; i++) {
      const cx = 1 + Math.floor(rng() * (vaultX - 1));
      const cy = 1 + Math.floor(rng() * (height - 2));
      if (grid[cy][cx] === '.') grid[cy][cx] = 'C';
    }
    for (let i = 0; i < numHazards; i++) {
      const hx = 1 + Math.floor(rng() * (vaultX - 1));
      const hy = 1 + Math.floor(rng() * (height - 2));
      if (grid[hy][hx] === '.') grid[hy][hx] = 'X';
    }

    // Collect open cells
    const mainOpen = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < vaultX; x++) {
        if (grid[y][x] === '.') mainOpen.push({ x, y });
      }
    }
    const vaultOpen = [];
    for (let y = 1; y < height - 1; y++) {
      for (let x = vaultX + 1; x < width - 1; x++) {
        if (grid[y][x] === '.') vaultOpen.push({ x, y });
      }
    }

    if (mainOpen.length < 6 || vaultOpen.length < 2) continue;

    // Start in main sector
    const start = mainOpen.splice(Math.floor(rng() * mainOpen.length), 1)[0];
    grid[start.y][start.x] = 'S';

    // Switch P in main sector (remote from Start)
    let bestSwitchIdx = -1, maxSDist = -1;
    for (let i = 0; i < mainOpen.length; i++) {
      const dist = Math.abs(mainOpen[i].x - start.x) + Math.abs(mainOpen[i].y - start.y);
      if (dist > maxSDist) { maxSDist = dist; bestSwitchIdx = i; }
    }
    const sw = mainOpen.splice(bestSwitchIdx, 1)[0];
    grid[sw.y][sw.x] = 'P';

    // Exit inside the Vault! (Guarded by Laser Gate G!)
    const exit = vaultOpen.splice(Math.floor(rng() * vaultOpen.length), 1)[0];
    grid[exit.y][exit.x] = 'E';

    // If portal enabled, place a portal pair
    if (withPortal && mainOpen.length >= 2) {
      const t1 = mainOpen.splice(Math.floor(rng() * mainOpen.length), 1)[0];
      grid[t1.y][t1.x] = 'T';
      const t2 = mainOpen.splice(Math.floor(rng() * mainOpen.length), 1)[0];
      grid[t2.y][t2.x] = 'T';
    }

    // Cores
    for (let k = 0; k < numCores; k++) {
      if (mainOpen.length > 0) {
        const kCell = mainOpen.splice(Math.floor(rng() * mainOpen.length), 1)[0];
        grid[kCell.y][kCell.x] = 'K';
      }
    }

    const gridStrings = grid.map(r => r.join(''));
    const parsed = { width, height, grid: gridStrings, start, exit };
    const sol = LevelSolver.solve(parsed);

    // GUARANTEED: Must toggle Switch P and pass Gate G!
    if (sol && sol.solved && sol.switchesUsed > 0 && sol.gatesPassed > 0 && sol.moves >= minPar && sol.moves <= maxPar) {
      return {
        id, world: 'nexus', name, width, height, par: sol.moves, grid: gridStrings, solution: sol
      };
    }
  }
  throw new Error(`Failed to generate valid Nexus level ${id} (${name})`);
}

// ----------------------------------------------------
// Names
// ----------------------------------------------------
const WORLD1_NAMES = [
  "First Steps", "The Turn", "Corridor", "Pivot", "Crossroad",
  "Fracture I", "Fracture II", "Deflection", "Rebound", "Square Loop",
  "Laser Hazard", "Grid Matrix", "The Blockade", "Reflex", "Echo",
  "Diamond Core", "Shift", "Labyrinth", "Pinball", "Pulse Hazard",
  "Symmetry", "Kinetic Shock", "Centrifuge", "Vector Shift", "Gridlock",
  "Paradox", "Quantum Trap", "Continuum", "Vortex", "The Citadel"
];

const WORLD2_NAMES = [
  "Core Activation", "Dual Resonance", "Keyhole Matrix", "Cipher Core", "Access Port",
  "Vault Lock", "Detour", "Checkpoint X", "Perimeter", "Iron Hazard",
  "Redirection", "Core Ring", "Infiltration", "Firewall X", "Deadbolt",
  "Twin Core Alpha", "Binary Hazard", "Dual Core Beta", "Bastion", "Sanction",
  "Cryptography", "Sequencer", "Overload Trap", "Fortress", "Obsidian Core",
  "Matrix Hazard", "Singularity", "Enigma Gate", "Apex Vector", "Vector Prime"
];

const WORLD3_NAMES = [
  "Warp Initiator", "Folding Space", "Tesseract Drift", "Entanglement I", "Phase Shift",
  "Quantum Leap", "Singularity Gate", "Cosmic String", "Subspace Tunnel", "Event Horizon",
  "Chrono Loop", "Wormhole Matrix", "Flux Core", "Photon Cascade", "Antimatter Corridor",
  "Gravitational Lens", "Hyperplane", "Dark Matter Nexus", "Superposition", "Null Vector",
  "Planck Wall", "Quantum Echo", "Dual Horizon", "Tachyon Burst", "Dimensional Rift",
  "Parallel Axis", "Vortex Chamber", "Relativistic Slip", "Quantum Labyrinth", "Apex Singularity"
];

const WORLD4_NAMES = [
  "Protocol Initiate", "Logic Cascade", "Firewall Relay", "Binary Gate", "Cipher Terminal",
  "Grid Override", "Cyber Synapse", "Quantum Keyhole", "Circuit Breaker", "Laser Matrix",
  "Neural Relay", "Security Protocol", "Data Fortress", "Switchboard Alpha", "Optic Barrier",
  "Mainframe Core", "Root Access", "Hyperthreading", "Encryption Layer", "Zero-Day Trap",
  "Subroutine Nexus", "Kernel Panic", "Logic Fortress", "Overdrive Protocol", "Entropy Gate",
  "Master Control", "Quantum Firewall", "Neural Convergence", "Apex Protocol", "Vector Transcendence"
];

function generateAll() {
  const originDir = path.join(rootDir, 'levels', 'origin');
  const keysDir = path.join(rootDir, 'levels', 'keys');
  const quantumDir = path.join(rootDir, 'levels', 'quantum');
  const nexusDir = path.join(rootDir, 'levels', 'nexus');

  fs.mkdirSync(originDir, { recursive: true });
  fs.mkdirSync(keysDir, { recursive: true });
  fs.mkdirSync(quantumDir, { recursive: true });
  fs.mkdirSync(nexusDir, { recursive: true });

  const allLevelsBundle = [];

  console.log('=== GENERATING WORLD 01: ORIGIN MATRIX (Levels 1 to 30) ===');
  for (let i = 0; i < 30; i++) {
    const id = i + 1;
    const name = WORLD1_NAMES[i];
    let w = 7, h = 7, minPar = 3, maxPar = 4;
    let config = { numCores: 0, numCracked: 0, numHazards: 0 };

    if (id === 1) {
      w = 6; h = 6; minPar = 3; maxPar = 3; // Clear 3-move introductory tutorial
    } else if (id <= 5) {
      w = 6; h = 6; minPar = 3; maxPar = 4;
    } else if (id <= 15) {
      w = 7; h = 7; minPar = 4; maxPar = 5;
      config.numCracked = 1;
    } else {
      w = 8; h = 8; minPar = 5; maxPar = 7;
      config.numCracked = 2;
      config.numHazards = 2;
    }

    const lvl = generateWorld1or2(id, 'origin', name, w, h, minPar, maxPar, config, 10000 + id * 31);
    lvl.maxMoves = id <= 5 ? null : id <= 15 ? lvl.par + 3 : lvl.par + 2;

    const fileObj = { id: lvl.id, world: lvl.world, name: lvl.name, width: lvl.width, height: lvl.height, par: lvl.par, maxMoves: lvl.maxMoves, grid: lvl.grid };
    fs.writeFileSync(path.join(originDir, `level-${String(id).padStart(3, '0')}.json`), JSON.stringify(fileObj, null, 2));
    allLevelsBundle.push(fileObj);
    console.log(`[W1] Lvl ${String(id).padStart(3, '0')} "${name}": Par ${lvl.par} | Max: ${lvl.maxMoves || '∞'}`);
  }

  console.log('\n=== GENERATING WORLD 02: RESONANCE CORES (Levels 31 to 60) ===');
  for (let i = 0; i < 30; i++) {
    const id = 31 + i;
    const name = WORLD2_NAMES[i];
    let w = 8, h = 8, minPar = 4, maxPar = 6;
    let config = { numCores: 1, numCracked: 1, numHazards: 1 };

    if (id <= 45) {
      w = 8; h = 8; minPar = 4; maxPar = 6;
      config.numCores = 1;
    } else if (id <= 55) {
      w = 9; h = 9; minPar = 5; maxPar = 7;
      config.numCores = 2;
      config.numCracked = 2;
      config.numHazards = 2;
    } else {
      w = 9; h = 9; minPar = 6; maxPar = 8;
      config.numCores = 2;
      config.numCracked = 2;
      config.numHazards = 2;
    }

    const lvl = generateWorld1or2(id, 'keys', name, w, h, minPar, maxPar, config, 60000 + id * 43);
    lvl.maxMoves = id <= 50 ? lvl.par + 3 : lvl.par + 2;

    const fileObj = { id: lvl.id, world: lvl.world, name: lvl.name, width: lvl.width, height: lvl.height, par: lvl.par, maxMoves: lvl.maxMoves, grid: lvl.grid };
    fs.writeFileSync(path.join(keysDir, `level-${String(id).padStart(3, '0')}.json`), JSON.stringify(fileObj, null, 2));
    allLevelsBundle.push(fileObj);
    console.log(`[W2] Lvl ${String(id).padStart(3, '0')} "${name}": Par ${lvl.par} | Max: ${lvl.maxMoves}`);
  }

  console.log('\n=== GENERATING WORLD 03: QUANTUM WARP (Levels 61 to 90) ===');
  for (let i = 0; i < 30; i++) {
    const id = 61 + i;
    const name = WORLD3_NAMES[i];
    let w = 11, h = 11, minPar = 5, maxPar = 8;
    let config = { numCores: 1, numCracked: 1, numHazards: 1 };

    if (id <= 75) {
      w = 11; h = 11; minPar = 5; maxPar = 7;
      config.numCores = 1;
    } else if (id <= 85) {
      w = 11; h = 11; minPar = 6; maxPar = 8;
      config.numCores = 2;
      config.numHazards = 2;
    } else {
      w = 12; h = 12; minPar = 6; maxPar = 9;
      config.numCores = 2;
      config.numCracked = 2;
      config.numHazards = 2;
    }

    const lvl = generateWorld3Quantum(id, name, w, h, minPar, maxPar, config, 80000 + id * 59);
    lvl.maxMoves = id >= 88 ? lvl.par + 1 : lvl.par + 2;

    const fileObj = { id: lvl.id, world: lvl.world, name: lvl.name, width: lvl.width, height: lvl.height, par: lvl.par, maxMoves: lvl.maxMoves, grid: lvl.grid };
    fs.writeFileSync(path.join(quantumDir, `level-${String(id).padStart(3, '0')}.json`), JSON.stringify(fileObj, null, 2));
    allLevelsBundle.push(fileObj);
    console.log(`[W3] Lvl ${String(id).padStart(3, '0')} "${name}": Par ${lvl.par} | Portals: ${lvl.solution.portalsUsed} | Max: ${lvl.maxMoves}`);
  }

  console.log('\n=== GENERATING WORLD 04: PROTOCOL NEXUS (Levels 91 to 120) ===');
  for (let i = 0; i < 30; i++) {
    const id = 91 + i;
    const name = WORLD4_NAMES[i];
    let w = 13, h = 13, minPar = 6, maxPar = 9;
    let config = { numCores: 2, numCracked: 2, numHazards: 2, withPortal: false };

    if (id <= 105) {
      w = 13; h = 13; minPar = 6; maxPar = 9;
    } else if (id <= 114) {
      w = 13; h = 13; minPar = 7; maxPar = 10;
      config.withPortal = true;
    } else {
      w = 14; h = 14; minPar = 7; maxPar = 11;
      config.withPortal = true;
      config.numCores = 3;
    }

    const lvl = generateWorld4Nexus(id, name, w, h, minPar, maxPar, config, 120000 + id * 67);
    lvl.maxMoves = id >= 115 ? lvl.par + 1 : lvl.par + 2;

    const fileObj = { id: lvl.id, world: lvl.world, name: lvl.name, width: lvl.width, height: lvl.height, par: lvl.par, maxMoves: lvl.maxMoves, grid: lvl.grid };
    fs.writeFileSync(path.join(nexusDir, `level-${String(id).padStart(3, '0')}.json`), JSON.stringify(fileObj, null, 2));
    allLevelsBundle.push(fileObj);
    console.log(`[W4] Lvl ${String(id).padStart(3, '0')} "${name}": Par ${lvl.par} | Switches: ${lvl.solution.switchesUsed} | Gates: ${lvl.solution.gatesPassed} | Max: ${lvl.maxMoves}`);
  }

  // Pre-compiled bundle
  const bundlePath = path.join(rootDir, 'js', 'levels', 'level-data.js');
  const bundleContent = `/**
 * Pre-compiled & Validated 120 Levels Bundle for 100% Offline / WebView / Browser Support
 */
export const BUNDLED_LEVELS = ${JSON.stringify(allLevelsBundle, null, 2)};
`;
  fs.writeFileSync(bundlePath, bundleContent);
  console.log(`\n======================================================`);
  console.log(`Successfully generated, BFS-verified, and saved all 120 levels!`);
  console.log(`World 3: 100% use Portals (T)`);
  console.log(`World 4: 100% use Switches (P) & Laser Gates (G)`);
  console.log(`======================================================`);
}

generateAll();
