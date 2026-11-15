import { LevelParser } from './level-parser.js';
import { LevelSolver } from './level-solver.js';

export class LevelValidator {
  /**
   * Performs full structural and solvability validation.
   * @param {Object|string} rawLevel
   * @param {number} minMovesAllowed - Reject levels with moves below this
   * @returns {{ valid: boolean, errors: string[], solution?: { moves: number, path: string[] } }}
   */
  static validate(rawLevel, minMovesAllowed = 2) {
    const errors = [];
    let parsed = null;

    try {
      parsed = LevelParser.parse(rawLevel);
    } catch (err) {
      return {
        valid: false,
        errors: [`Structural parsing failed: ${err.message}`]
      };
    }

    // 1. Check if start equals exit
    if (parsed.start.x === parsed.exit.x && parsed.start.y === parsed.exit.y) {
      errors.push('Start position and Exit position cannot be identical.');
    }

    // 2. Check door-to-key ratio
    if (parsed.doors.length > parsed.keys.length) {
      errors.push(`Level contains ${parsed.doors.length} doors but only ${parsed.keys.length} keys.`);
    }

    // 3. Solve using BFS
    const solution = LevelSolver.solve(parsed);

    if (!solution.solved) {
      errors.push(`Level is unsolvable: ${solution.error || 'No path to exit'}`);
    } else {
      if (solution.moves < minMovesAllowed) {
        errors.push(`Level is too trivial: solvable in only ${solution.moves} moves (minimum required: ${minMovesAllowed})`);
      }

      // Par sanity check: par should match minimum moves
      if (parsed.par !== solution.moves) {
        // Can either report warning or adjust
        parsed.par = solution.moves;
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
      parsed: parsed,
      solution: solution.solved ? { moves: solution.moves, path: solution.path } : null
    };
  }
}
