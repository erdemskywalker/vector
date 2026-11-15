import assert from 'assert';
import { GameEngine } from '../js/engine/engine.js';
import { LevelParser } from '../js/levels/level-parser.js';
import { LevelValidator } from '../js/levels/level-validator.js';
import { LevelSolver } from '../js/levels/level-solver.js';
import { ProgressManager } from '../js/systems/progress.js';

console.log('=== VECTOR 2.0 TEST SUITE ===\n');

// Mock localStorage for Node test environment
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; }
};

let testsPassed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`[PASS] ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`[FAIL] ${name}:`, err.message);
    process.exit(1);
  }
}

// 1. Core Mechanics: Inactive exit cannot be used until Cores collected
test('Core Mechanic: Exit inactive until Energy Core is collected', () => {
  const level = {
    id: 101,
    world: 'test',
    width: 7,
    height: 5,
    par: 3,
    grid: [
      "#######",
      "#S.E..#", // Exit at (3,1), wall at (6,1)
      "#.....#",
      "#...K.#", // Core at (4,3)
      "#######"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  assert.strictEqual(engine.state.isPortalActive(), false);

  // Swipe RIGHT: passes over inactive Exit at (3,1) and slides all the way to wall (5,1) without completing level!
  engine.move('RIGHT');
  engine.finishSlide();

  assert.strictEqual(engine.state.playerX, 5);
  assert.strictEqual(engine.state.playerY, 1);
  assert.strictEqual(engine.state.isCompleted, false);

  // Now move DOWN to (5,3), then LEFT to collect Core at (4,3)
  engine.move('DOWN');
  engine.finishSlide();
  engine.move('LEFT');
  engine.finishSlide();

  assert.strictEqual(engine.state.collectedCores.size, 1);
  assert.strictEqual(engine.state.isPortalActive(), true); // Portal is now active!
});

// 2. Cracked Wall Shattering
test('Mechanics: Cracked wall stops cube once, then breaks permanently', () => {
  const level = {
    id: 102,
    world: 'test',
    width: 6,
    height: 5,
    par: 2,
    grid: [
      "######",
      "#S.C.#", // Cracked wall at (3,1), empty at (4,1), wall at (5,1)
      "#....#",
      "#...E#",
      "######"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  // Move 1: Swipe RIGHT. Cube stops at (2,1) against cracked wall at (3,1).
  engine.move('RIGHT');
  engine.finishSlide();

  assert.strictEqual(engine.state.playerX, 2);
  assert.strictEqual(engine.state.playerY, 1);
  assert.strictEqual(engine.state.brokenCrackedWalls.has('3,1'), true); // Cracked wall is now broken!

  // Move 2: Swipe DOWN to (2,3), then UP back to (2,1)
  engine.move('DOWN');
  engine.finishSlide();
  engine.move('UP');
  engine.finishSlide();

  // Move 4: Swipe RIGHT again. Because (3,1) is broken, cube slides straight through to (4,1)!
  engine.move('RIGHT');
  engine.finishSlide();

  assert.strictEqual(engine.state.playerX, 4);
  assert.strictEqual(engine.state.playerY, 1);
});

// 3. Laser Hazard Instant Death
test('Mechanics: Contact with Laser Hazard (X) causes instant failure', () => {
  const level = {
    id: 103,
    world: 'test',
    width: 6,
    height: 5,
    par: 1,
    grid: [
      "######",
      "#S.X.#", // Hazard at (3,1)
      "#....#",
      "#...E#",
      "######"
    ]
  };

  const engine = new GameEngine();
  let deathTriggered = false;
  engine.onPlayerDeath = (reason) => {
    deathTriggered = true;
    assert.strictEqual(reason, 'HAZARD');
  };
  engine.loadLevel(level);

  engine.move('RIGHT');
  // Slide enters hazard
  engine.finishHazardDeath(3, 1);

  assert.strictEqual(engine.state.isDead, true);
  assert.strictEqual(engine.state.deathReason, 'HAZARD');
  assert.strictEqual(deathTriggered, true);
});

// 4. Energy / Max Moves Depletion
test('Difficulty: Move limit exhaustion triggers Energy Depleted', () => {
  const level = {
    id: 104,
    world: 'test',
    width: 6,
    height: 6,
    par: 2,
    maxMoves: 2, // Only 2 moves allowed!
    grid: [
      "######",
      "#S...#",
      "#....#",
      "#....#",
      "#...E#",
      "######"
    ]
  };

  const engine = new GameEngine();
  let energyDepleted = false;
  engine.onPlayerDeath = (reason) => {
    if (reason === 'ENERGY_DEPLETED') energyDepleted = true;
  };
  engine.loadLevel(level);

  assert.strictEqual(engine.state.maxMoves, 2);

  // Move 1
  engine.move('RIGHT');
  engine.finishSlide();
  assert.strictEqual(engine.state.isDead, false);

  // Move 2: wasteful move (doesn't reach exit)
  engine.move('LEFT');
  engine.finishSlide();

  // Hit limit without reaching exit
  assert.strictEqual(engine.state.isDead, true);
  assert.strictEqual(engine.state.deathReason, 'ENERGY_DEPLETED');
  assert.strictEqual(energyDepleted, true);
});

// 5. Undo & Restart with new mechanics
test('State Management: Undo restores cracked walls and death state', () => {
  const level = {
    id: 105,
    world: 'test',
    width: 6,
    height: 5,
    par: 2,
    maxMoves: 1,
    grid: [
      "######",
      "#S.C.#",
      "#....#",
      "#...E#",
      "######"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  // Move 1: break cracked wall and deplete energy
  engine.move('RIGHT');
  engine.finishSlide();

  assert.strictEqual(engine.state.isDead, true);
  assert.strictEqual(engine.state.brokenCrackedWalls.has('3,1'), true);

  // Undo restores life and un-breaks wall
  const undone = engine.undo();
  assert.strictEqual(undone, true);
  assert.strictEqual(engine.state.isDead, false);
  assert.strictEqual(engine.state.moveCount, 0);
  assert.strictEqual(engine.state.brokenCrackedWalls.size, 0);
});

// 6. Progression Persistence & Unlocks
test('Progression: Stars, unlocking, and persistence', () => {
  const pm = new ProgressManager();
  pm.resetAll();

  assert.strictEqual(pm.isLevelUnlocked(1), true);
  assert.strictEqual(pm.isLevelUnlocked(2), false);

  const res = pm.recordCompletion(1, 3, 3);
  assert.strictEqual(res.stars, 3);
  assert.strictEqual(pm.isLevelUnlocked(2), true);
  assert.strictEqual(pm.getTotalStars(), 3);
});

// 7. Quantum Warp Portal Momentum
test('Quantum Warp: Teleport preserves slide direction and momentum', () => {
  const level = {
    id: 106,
    world: 'quantum',
    width: 9,
    height: 5,
    par: 1,
    grid: [
      "#########",
      "#S.T.T.E#", // T1 at (3,1), T2 at (5,1), E at (7,1)
      "#.......#",
      "#.......#",
      "#########"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  // Swipe RIGHT: enters T1 at (3,1), warps to T2 at (5,1), continues RIGHT directly into Exit at (7,1)
  engine.move('RIGHT');
  engine.finishSlide();

  assert.strictEqual(engine.state.isCompleted, true);
  assert.strictEqual(engine.state.playerX, 7);
  assert.strictEqual(engine.state.playerY, 1);
});

// 8. Logic Pressure Switch & Laser Gate Toggle
test('Logic Protocol: Switch toggles laser forcefield gate between solid and open', () => {
  const level = {
    id: 107,
    world: 'nexus',
    width: 7,
    height: 7,
    par: 3,
    grid: [
      "#######",
      "#S...P#", // Switch at (5,1)
      "#.....#",
      "#..G.E#", // Closed gate at (3,3), Exit at (5,3)
      "#.....#",
      "#.....#",
      "#######"
    ]
  };

  const engine = new GameEngine();
  engine.loadLevel(level);

  assert.strictEqual(engine.state.gatesOpen, false);

  // Attempting to move across closed gate:
  // If cube was at (1,3) sliding RIGHT, G would block it at (2,3).
  // But moving to Switch at (5,1):
  engine.move('RIGHT');
  engine.finishSlide();

  // Stepped on P at (5,1) -> gates are now open!
  assert.strictEqual(engine.state.gatesOpen, true);
  assert.strictEqual(engine.state.playerX, 5);
  assert.strictEqual(engine.state.playerY, 1);

  // Move DOWN to (5,3) which is E
  engine.move('DOWN');
  engine.finishSlide();
  assert.strictEqual(engine.state.isCompleted, true);
});

console.log(`\n========================================`);
console.log(`All ${testsPassed} automated test cases PASSED!`);
console.log(`========================================`);
