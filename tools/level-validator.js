import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

import { LevelParser } from '../js/levels/level-parser.js';
import { LevelSolver } from '../js/levels/level-solver.js';

function validateAll() {
  console.log('=== VECTOR 2.0 LEVEL INTEGRITY VALIDATOR ===\n');

  const worlds = ['origin', 'keys', 'quantum', 'nexus'];
  let totalChecked = 0;
  let totalErrors = 0;

  worlds.forEach(w => {
    const dir = path.join(rootDir, 'levels', w);
    if (!fs.existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      totalErrors++;
      return;
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json')).sort();
    console.log(`Checking ${files.length} levels in world [${w}]...`);

    files.forEach(f => {
      totalChecked++;
      const filePath = path.join(dir, f);
      const raw = fs.readFileSync(filePath, 'utf-8');

      try {
        const parsed = LevelParser.parse(raw);
        const solution = LevelSolver.solve(parsed);

        if (!solution.solved) {
          console.error(`[FAIL] ${w}/${f}: Unsolvable! Error: ${solution.error}`);
          totalErrors++;
        } else {
          if (parsed.par !== solution.moves) {
            console.warn(`[WARN] ${w}/${f}: Par mismatch! Declared: ${parsed.par}, Optimal: ${solution.moves}`);
          } else {
            const maxStr = parsed.maxMoves !== null ? `Max: ${parsed.maxMoves}` : 'Max: ∞';
            console.log(`[PASS] ${w}/${f} (ID ${parsed.id} "${parsed.name}"): Par ${solution.moves} | ${maxStr} (${solution.path.join('->')})`);
          }
        }
      } catch (err) {
        console.error(`[FAIL] ${w}/${f}: Parser error: ${err.message}`);
        totalErrors++;
      }
    });
  });

  console.log(`\n========================================`);
  console.log(`Total Checked: ${totalChecked}`);
  console.log(`Total Errors:  ${totalErrors}`);
  console.log(`Status:        ${totalErrors === 0 ? 'ALL LEVELS 100% VALID & SOLVABLE' : 'VALIDATION FAILED'}`);
  console.log(`========================================`);

  if (totalErrors > 0) process.exit(1);
}

validateAll();
