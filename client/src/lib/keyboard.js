import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Universal Mobile Keyboard & Viewport Manager for Jeevan.
 * Supports Capacitor Native (Android & iOS) + Web/PWA VisualViewport.
 *
 * Prevents full-page squishing and unpleasant layout jumps by:
 * 1. Setting CSS custom variables: --keyboard-height, --keyboard-inset-bottom, --is-keyboard-visible
 * 2. Keeping main background panels and cards visually stable
 * 3. Smoothly anchoring the active focused input and action control above the keyboard
 */

class KeyboardManager {
  constructor() {
    this.isInitialized = false;
    this.listeners = new Set();
    this.currentHeight = 0;
    this.isVisible = false;
    this.activeFocusedElement = null;
    this.originalScrollPos = null;
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Default CSS variables
    this.updateCssVariables(0, false);

    if (Capacitor.isNativePlatform()) {
      this.initCapacitorListeners();
    } else {
      this.initWebVisualViewportListeners();
    }

    // Attach global focus / blur monitoring for input anchoring
    this.initFocusMonitoring();
  }

  initCapacitorListeners() {
    try {
      Keyboard.addListener('keyboardWillShow', (info) => {
        const height = info.keyboardHeight || 0;
        this.handleKeyboardChange(height, true);
      });

      Keyboard.addListener('keyboardDidShow', (info) => {
        const height = info.keyboardHeight || 0;
        this.handleKeyboardChange(height, true);
        this.anchorActiveElement(height);
      });

      Keyboard.addListener('keyboardWillHide', () => {
        this.handleKeyboardChange(0, false);
      });

      Keyboard.addListener('keyboardDidHide', () => {
        this.handleKeyboardChange(0, false);
        this.restoreScrollPosition();
      });
    } catch (err) {
      console.warn('[KeyboardManager] Capacitor Keyboard plugin error, falling back to visualViewport:', err);
      this.initWebVisualViewportListeners();
    }
  }

  initWebVisualViewportListeners() {
    if (!window.visualViewport) return;

    let previousHeight = window.visualViewport.height;

    const checkViewport = () => {
      const vv = window.visualViewport;
      if (!vv) return;

      const windowHeight = window.innerHeight;
      const keyboardHeight = Math.max(0, Math.round(windowHeight - vv.height));

      // Virtual keyboard typically takes at least 120px on mobile
      const isVisible = keyboardHeight > 120;

      if (isVisible) {
        this.handleKeyboardChange(keyboardHeight, true);
        this.anchorActiveElement(keyboardHeight);
      } else {
        this.handleKeyboardChange(0, false);
        this.restoreScrollPosition();
      }

      previousHeight = vv.height;
    };

    window.visualViewport.addEventListener('resize', checkViewport, { passive: true });
    window.visualViewport.addEventListener('scroll', checkViewport, { passive: true });
  }

  initFocusMonitoring() {
    document.addEventListener(
      'focusin',
      (e) => {
        const target = e.target;
        if (this.isTextInput(target)) {
          this.activeFocusedElement = target;
          if (this.isVisible && this.currentHeight > 0) {
            // Give short tick for layout to settle, then anchor
            setTimeout(() => this.anchorActiveElement(this.currentHeight), 80);
          }
        }
      },
      { passive: true }
    );

    document.addEventListener(
      'focusout',
      () => {
        // Clear active element if focus left inputs
        setTimeout(() => {
          if (!this.isTextInput(document.activeElement)) {
            this.activeFocusedElement = null;
          }
        }, 100);
      },
      { passive: true }
    );
  }

  isTextInput(el) {
    if (!el || !(el instanceof HTMLElement)) return false;
    const tagName = el.tagName.toLowerCase();
    if (tagName === 'textarea') return true;
    if (tagName === 'input') {
      const type = (el.getAttribute('type') || 'text').toLowerCase();
      return !['checkbox', 'radio', 'range', 'color', 'file', 'button', 'submit'].includes(type);
    }
    return el.isContentEditable;
  }

  handleKeyboardChange(height, isVisible) {
    this.currentHeight = height;
    this.isVisible = isVisible;

    this.updateCssVariables(height, isVisible);

    // Notify listeners
    this.listeners.forEach((listener) => {
      try {
        listener({ isVisible, height });
      } catch (e) {
        console.error('[KeyboardManager] listener error:', e);
      }
    });
  }

  updateCssVariables(height, isVisible) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.style.setProperty('--keyboard-height', `${height}px`);
    root.style.setProperty('--keyboard-inset-bottom', `${height}px`);
    root.style.setProperty('--is-keyboard-visible', isVisible ? '1' : '0');

    if (isVisible) {
      document.body.classList.add('keyboard-open');
    } else {
      document.body.classList.remove('keyboard-open');
    }
  }

  /**
   * Gently anchors the active focused element and its action container
   * into the safe area above the keyboard without shifting the outer page card.
   */
  anchorActiveElement(keyboardHeight) {
    const el = this.activeFocusedElement;
    if (!el || !document.body.contains(el)) return;

    try {
      const rect = el.getBoundingClientRect();
      const viewportHeight = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      const safeBottomBoundary = viewportHeight - (Capacitor.isNativePlatform() ? keyboardHeight : 0);

      // Desired clearance above keyboard
      const targetPadding = 28;

      if (rect.bottom > safeBottomBoundary - targetPadding) {
        // Find nearest scrollable parent container
        const scrollContainer = this.findScrollableContainer(el);

        if (scrollContainer && scrollContainer !== document.body && scrollContainer !== document.documentElement) {
          const overflow = rect.bottom - (safeBottomBoundary - targetPadding);
          scrollContainer.scrollBy({
            top: overflow,
            behavior: 'smooth',
          });
        } else {
          // If in modal or standalone card, perform subtle nearest scroll
          el.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
            inline: 'nearest',
          });
        }
      }
    } catch {
      // Ignore scroll adjustment errors
    }
  }

  restoreScrollPosition() {
    // Layout smoothly settles back down
  }

  findScrollableContainer(el) {
    let parent = el.parentElement;
    while (parent && parent !== document.body && parent !== document.documentElement) {
      const style = window.getComputedStyle(parent);
      const overflowY = style.overflowY;
      if (['auto', 'scroll'].includes(overflowY) && parent.scrollHeight > parent.clientHeight) {
        return parent;
      }
      parent = parent.parentElement;
    }
    return null;
  }

  addListener(fn) {
    this.listeners.add(fn);
    // Immediately inform subscriber of current state
    fn({ isVisible: this.isVisible, height: this.currentHeight });
    return () => this.listeners.delete(fn);
  }

  removeListener(fn) {
    this.listeners.delete(fn);
  }

  getState() {
    return {
      isVisible: this.isVisible,
      height: this.currentHeight,
    };
  }

  /**
   * Dismiss the software keyboard programmatically.
   */
  async dismiss() {
    if (Capacitor.isNativePlatform()) {
      try {
        await Keyboard.hide();
      } catch {}
    } else if (document.activeElement && this.isTextInput(document.activeElement)) {
      document.activeElement.blur();
    }
  }
}

export const keyboardManager = new KeyboardManager();
