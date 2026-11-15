export class SettingsUI {
  constructor(app) {
    this.app = app;

    this.modal = document.getElementById('modal-settings');
    this.toggleSound = document.getElementById('toggle-sound');
    this.toggleHaptics = document.getElementById('toggle-haptics');
    this.rowReset = document.getElementById('row-reset-progress');
    this.btnClose = document.getElementById('btn-settings-close');

    this.initEvents();
  }

  initEvents() {
    this.toggleSound.addEventListener('click', () => {
      const current = this.app.progress.getSettings().sound;
      this.app.progress.setSetting('sound', !current);
      this.updateView();
      if (!current) this.app.audio.playClick();
    });

    this.toggleHaptics.addEventListener('click', () => {
      const current = this.app.progress.getSettings().haptics;
      this.app.progress.setSetting('haptics', !current);
      this.updateView();
      this.app.audio.playClick();
    });

    this.rowReset.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all progress and stars?')) {
        this.app.progress.resetAll();
        this.app.audio.playWall();
        this.close();
        this.app.menuUI.update();
        this.app.levelSelectUI.update();
      }
    });

    this.btnClose.addEventListener('click', () => {
      this.app.audio.playClick();
      this.close();
    });
  }

  updateView() {
    const settings = this.app.progress.getSettings();
    if (settings.sound) {
      this.toggleSound.classList.add('active');
    } else {
      this.toggleSound.classList.remove('active');
    }

    if (settings.haptics) {
      this.toggleHaptics.classList.add('active');
    } else {
      this.toggleHaptics.classList.remove('active');
    }
  }

  open() {
    this.updateView();
    this.modal.classList.add('active');
  }

  close() {
    this.modal.classList.remove('active');
  }
}
