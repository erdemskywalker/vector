/**
 * Premium Swipe & Input Manager
 * Supports Touch Swipes, Mouse Drags, and Keyboard Arrows/WASD
 */
export class InputManager {
  constructor(targetElement, onSwipe) {
    this.target = targetElement;
    this.onSwipe = onSwipe;

    this.startX = 0;
    this.startY = 0;
    this.isPointerDown = false;
    this.minSwipeDistance = 25; // Minimum px to count as intentional swipe
    this.enabled = true;

    this.initEvents();
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }

  initEvents() {
    // 1. Touch Events
    this.target.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.target.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.target.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

    // 2. Mouse Events (Desktop Dragging)
    this.target.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', (e) => this.handleMouseUp(e));

    // 3. Keyboard Events (Arrows & WASD)
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
  }

  handleTouchStart(e) {
    if (!this.enabled || e.touches.length === 0) return;
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.isPointerDown = true;
  }

  handleTouchMove(e) {
    // Prevent default screen scrolling
    if (e.cancelable) {
      e.preventDefault();
    }
  }

  handleTouchEnd(e) {
    if (!this.enabled || !this.isPointerDown) return;
    this.isPointerDown = false;

    if (e.changedTouches.length === 0) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - this.startX;
    const dy = touch.clientY - this.startY;

    this.processSwipeVector(dx, dy);
  }

  handleMouseDown(e) {
    if (!this.enabled || e.button !== 0) return;
    this.startX = e.clientX;
    this.startY = e.clientY;
    this.isPointerDown = true;
  }

  handleMouseMove(e) {
    // Optional drag tracking
  }

  handleMouseUp(e) {
    if (!this.enabled || !this.isPointerDown) return;
    this.isPointerDown = false;

    const dx = e.clientX - this.startX;
    const dy = e.clientY - this.startY;

    this.processSwipeVector(dx, dy);
  }

  processSwipeVector(dx, dy) {
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) < this.minSwipeDistance) {
      return; // Gesture too small, ignore
    }

    let direction = null;
    if (absX > absY) {
      // Horizontal dominant
      direction = dx > 0 ? 'RIGHT' : 'LEFT';
    } else {
      // Vertical dominant
      direction = dy > 0 ? 'DOWN' : 'UP';
    }

    if (direction && this.onSwipe) {
      this.onSwipe(direction);
    }
  }

  handleKeyDown(e) {
    if (!this.enabled) return;

    let dir = null;
    switch (e.key) {
      case 'ArrowUp':
      case 'w':
      case 'W':
        dir = 'UP';
        break;
      case 'ArrowDown':
      case 's':
      case 'S':
        dir = 'DOWN';
        break;
      case 'ArrowLeft':
      case 'a':
      case 'A':
        dir = 'LEFT';
        break;
      case 'ArrowRight':
      case 'd':
      case 'D':
        dir = 'RIGHT';
        break;
      default:
        return;
    }

    if (dir) {
      e.preventDefault();
      if (this.onSwipe) {
        this.onSwipe(dir);
      }
    }
  }
}
