export class ResultsUI {
  constructor(app) {
    this.app = app;

    this.modal = document.getElementById('modal-complete');
    this.subtitle = document.getElementById('result-subtitle');
    this.statMoves = document.getElementById('result-moves');
    this.statPar = document.getElementById('result-par');

    this.star1 = document.getElementById('star-1');
    this.star2 = document.getElementById('star-2');
    this.star3 = document.getElementById('star-3');

    this.btnRetry = document.getElementById('btn-result-retry');
    this.btnNext = document.getElementById('btn-result-next');

    this.initEvents();
  }

  initEvents() {
    this.btnRetry.addEventListener('click', () => {
      this.app.audio.playClick();
      this.close();
      this.app.engine.restart();
    });

    this.btnNext.addEventListener('click', () => {
      this.app.audio.playClick();
      this.close();

      const currentLvl = this.app.engine.state.level.id;
      const nextLvl = currentLvl + 1;

      // Pacing: Return to Level Select to display unlock animation & stars count
      this.app.ads.checkAndShowLevelInterstitial(() => {
        if (nextLvl <= 60) {
          this.app.levelSelectUI.highlightUnlock(nextLvl);
        }
        this.app.router.navigate('levels');
      });
    });
  }

  show(moves, par, stars) {
    this.statMoves.textContent = moves;
    this.statPar.textContent = par;

    // Reset star animations
    [this.star1, this.star2, this.star3].forEach(s => {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    if (stars === 3) {
      this.subtitle.textContent = 'PERFECT EXECUTION';
    } else if (stars === 2) {
      this.subtitle.textContent = 'SECTOR SECURED';
    } else {
      this.subtitle.textContent = 'SECTOR CLEARED';
    }

    setTimeout(() => {
      if (stars >= 1) {
        this.star1.style.display = 'block';
        this.star1.classList.add('active');
      }
    }, 100);

    setTimeout(() => {
      if (stars >= 2) {
        this.star2.style.display = 'block';
        this.star2.classList.add('active');
      }
    }, 280);

    setTimeout(() => {
      if (stars >= 3) {
        this.star3.style.display = 'block';
        this.star3.classList.add('active');
      }
    }, 460);

    this.modal.classList.add('active');
  }

  close() {
    this.modal.classList.remove('active');
  }
}
