export class Router {
  constructor(app) {
    this.app = app;
    this.screens = {
      menu: document.getElementById('screen-menu'),
      levels: document.getElementById('screen-levels'),
      gameplay: document.getElementById('screen-gameplay')
    };
    this.currentScreen = 'menu';
  }

  navigate(screenName) {
    if (!this.screens[screenName]) {
      console.error(`Route '${screenName}' not found`);
      return;
    }

    this.currentScreen = screenName;

    // Toggle active screen classes
    for (const key in this.screens) {
      if (key === screenName) {
        this.screens[key].classList.add('active');
      } else {
        this.screens[key].classList.remove('active');
      }
    }

    // Lifecycle triggers
    if (screenName === 'menu') {
      this.app.menuUI.update();
    } else if (screenName === 'levels') {
      this.app.levelSelectUI.update();
    } else if (screenName === 'gameplay') {
      // Trigger canvas resize and re-center
      this.app.renderer.resize();
      if (this.app.engine.state) {
        this.app.renderer.calculateLayout(this.app.engine.state.width, this.app.engine.state.height);
      }
    }
  }
}
