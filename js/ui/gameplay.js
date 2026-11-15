import { LevelSolver } from '../levels/level-solver.js';

export class GameplayUI {
  constructor(app) {
    this.app = app;

    this.screen = document.getElementById('screen-gameplay');
    this.hudWorld = document.getElementById('hud-world');
    this.hudLevel = document.getElementById('hud-level');
    this.hudMoves = document.getElementById('hud-moves');
    this.hudPar = document.getElementById('hud-par');

    this.btnBack = document.getElementById('btn-game-back');
    this.btnUndo = document.getElementById('btn-game-undo');
    this.btnRestart = document.getElementById('btn-game-restart');
    this.btnHint = document.getElementById('btn-game-hint');

    this.modalHint = document.getElementById('modal-hint');
    this.hintDirection = document.getElementById('hint-direction');
    this.btnHintClose = document.getElementById('btn-hint-close');

    this.initEvents();
  }

  initEvents() {
    this.btnBack.addEventListener('click', () => {
      this.app.audio.playClick();
      this.app.router.navigate('levels');
    });

    this.btnUndo.addEventListener('click', () => {
      this.app.audio.playClick();
      this.app.engine.undo();
    });

    this.btnRestart.addEventListener('click', () => {
      this.app.audio.playClick();
      this.app.engine.restart();
    });

    this.btnHint.addEventListener('click', () => {
      this.app.audio.playClick();
      this.showHint();
    });

    this.btnHintClose.addEventListener('click', () => {
      this.app.audio.playClick();
      this.modalHint.classList.remove('active');
    });
  }

  showHint() {
    if (!this.app.engine.state) return;

    // Build temporary state for solver
    const curState = this.app.engine.state;
    const tempLevel = {
      width: curState.width,
      height: curState.height,
      grid: curState.grid,
      start: { x: curState.playerX, y: curState.playerY },
      exit: curState.exit
    };

    const solution = LevelSolver.solve(tempLevel);

    if (solution && solution.solved && solution.path.length > 0) {
      const nextMove = solution.path[0];
      this.hintDirection.textContent = nextMove;
      this.modalHint.classList.add('active');
    } else {
      this.hintDirection.textContent = 'NO PATH (TRY RESTART)';
      this.modalHint.classList.add('active');
    }
  }

  updateHUD(state) {
    if (!state) return;

    const level = state.level;
    const worldName = level.world === 'origin' ? 'WORLD 01' : 'WORLD 02';
    const levelNumber = `LEVEL ${String(level.id).padStart(2, '0')}`;

    this.hudWorld.textContent = worldName;
    this.hudLevel.textContent = levelNumber;
    this.hudMoves.textContent = state.moveCount;
    this.hudPar.textContent = state.par;

    // Change move color if exceeding par
    if (state.moveCount > state.par + 2) {
      this.hudMoves.style.color = 'var(--accent-danger)';
    } else if (state.moveCount > state.par) {
      this.hudMoves.style.color = '#F59E0B';
    } else {
      this.hudMoves.style.color = 'var(--accent-primary)';
    }
  }
}
