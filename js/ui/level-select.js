export class LevelSelectUI {
  constructor(app) {
    this.app = app;

    this.screen = document.getElementById('screen-levels');
    this.btnBack = document.getElementById('btn-levels-back');
    this.tabOrigin = document.getElementById('tab-world-origin');
    this.tabKeys = document.getElementById('tab-world-keys');
    this.tabQuantum = document.getElementById('tab-world-quantum');
    this.tabNexus = document.getElementById('tab-world-nexus');
    this.gridContainer = document.getElementById('level-grid-container');
    this.starTotalEl = document.getElementById('levels-star-total');

    this.activeWorld = 'origin';
    this.unlockedLevelId = null;

    this.initEvents();
  }

  initEvents() {
    this.btnBack.addEventListener('click', () => {
      this.app.audio.playClick();
      this.app.router.navigate('menu');
    });

    if (this.tabOrigin) {
      this.tabOrigin.addEventListener('click', () => {
        this.app.audio.playClick();
        this.setWorld('origin');
      });
    }

    if (this.tabKeys) {
      this.tabKeys.addEventListener('click', () => {
        this.app.audio.playClick();
        this.setWorld('keys');
      });
    }

    if (this.tabQuantum) {
      this.tabQuantum.addEventListener('click', () => {
        this.app.audio.playClick();
        this.setWorld('quantum');
      });
    }

    if (this.tabNexus) {
      this.tabNexus.addEventListener('click', () => {
        this.app.audio.playClick();
        this.setWorld('nexus');
      });
    }
  }

  highlightUnlock(levelId) {
    this.unlockedLevelId = levelId;
    const targetWorld = levelId > 90 ? 'nexus' : levelId > 60 ? 'quantum' : levelId > 30 ? 'keys' : 'origin';
    this.setWorld(targetWorld);
  }

  setWorld(worldName) {
    this.activeWorld = worldName;
    const tabs = [
      { name: 'origin', el: this.tabOrigin },
      { name: 'keys', el: this.tabKeys },
      { name: 'quantum', el: this.tabQuantum },
      { name: 'nexus', el: this.tabNexus }
    ];

    tabs.forEach(t => {
      if (t.el) {
        if (t.name === worldName) {
          t.el.classList.add('active');
        } else {
          t.el.classList.remove('active');
        }
      }
    });

    this.renderGrid();
  }

  renderGrid() {
    this.gridContainer.innerHTML = '';
    const levels = this.app.levelManager.getWorldList(this.activeWorld);
    const currentLvl = this.app.progress.getCurrentLevel();
    const totalStars = this.app.progress.getTotalStars();

    if (this.starTotalEl) {
      this.starTotalEl.textContent = totalStars;
    }

    levels.forEach(lvl => {
      const stats = this.app.progress.getLevelStats(lvl.id);
      const isUnlocked = this.app.progress.isLevelUnlocked(lvl.id);
      const isCurrent = lvl.id === currentLvl;
      const isJustUnlocked = lvl.id === this.unlockedLevelId;

      const card = document.createElement('div');
      card.className = `level-card ${isUnlocked ? '' : 'locked'} ${stats.completed ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isJustUnlocked ? 'just-unlocked' : ''}`;

      if (isUnlocked) {
        card.innerHTML = `
          <span class="level-num">${String(lvl.id).padStart(2, '0')}</span>
          <div class="level-stars">
            ${stats.stars >= 1 ? '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' : ''}
            ${stats.stars >= 2 ? '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' : ''}
            ${stats.stars >= 3 ? '<svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>' : ''}
          </div>
        `;

        card.addEventListener('click', () => {
          this.app.audio.playClick();
          this.app.loadAndStartLevel(lvl.id);
        });
      } else {
        card.innerHTML = `
          <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        `;
      }

      this.gridContainer.appendChild(card);
    });

    // Reset just-unlocked highlight after rendering
    this.unlockedLevelId = null;
  }

  update() {
    this.renderGrid();
  }
}
