export class MenuUI {
  constructor(app) {
    this.app = app;

    this.screen = document.getElementById('screen-menu');
    this.btnContinue = document.getElementById('btn-menu-continue');
    this.btnLevels = document.getElementById('btn-menu-levels');
    this.btnSettings = document.getElementById('btn-menu-settings');
    this.txtContinue = document.getElementById('txt-menu-continue');
    this.statStars = document.getElementById('menu-stat-stars');
    this.statCompleted = document.getElementById('menu-stat-completed');

    this.initEvents();
  }

  initEvents() {
    this.btnContinue.addEventListener('click', () => {
      this.app.audio.playClick();
      const current = this.app.progress.getCurrentLevel();
      this.app.loadAndStartLevel(current);
    });

    this.btnLevels.addEventListener('click', () => {
      this.app.audio.playClick();
      this.app.router.navigate('levels');
    });

    this.btnSettings.addEventListener('click', () => {
      this.app.audio.playClick();
      this.app.settingsUI.open();
    });
  }

  update() {
    const totalStars = this.app.progress.getTotalStars();
    const completed = this.app.progress.getCompletedCount();
    const current = this.app.progress.getCurrentLevel();

    this.statStars.textContent = `${totalStars} ★`;
    this.statCompleted.textContent = `${completed} / 60`;

    if (current > 1 && current <= 60) {
      this.txtContinue.textContent = `CONTINUE // LEVEL ${String(current).padStart(2, '0')}`;
    } else if (current > 60) {
      this.txtContinue.textContent = 'RETRANSCEND ALL';
    } else {
      this.txtContinue.textContent = 'INITIATE // LEVEL 01';
    }
  }
}
