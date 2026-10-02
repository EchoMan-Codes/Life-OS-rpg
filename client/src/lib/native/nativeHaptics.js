import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';

/**
 * Universal Haptics Service for Jeevan.
 * Uses native iOS/Android hardware haptics via Capacitor,
 * with graceful fallback to browser navigator.vibrate.
 */
export async function triggerHaptic(type = 'light') {
  try {
    if (Capacitor.isNativePlatform()) {
      switch (type) {
        case 'medium':
          await Haptics.impact({ style: ImpactStyle.Medium });
          break;
        case 'heavy':
          await Haptics.impact({ style: ImpactStyle.Heavy });
          break;
        case 'success':
          await Haptics.notification({ type: NotificationType.Success });
          break;
        case 'warning':
          await Haptics.notification({ type: NotificationType.Warning });
          break;
        case 'error':
          await Haptics.notification({ type: NotificationType.Error });
          break;
        case 'selection':
          await Haptics.selectionStart();
          await Haptics.selectionEnd();
          break;
        case 'light':
        default:
          await Haptics.impact({ style: ImpactStyle.Light });
          break;
      }
    } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
      // Browser fallback
      if (type === 'success') {
        navigator.vibrate([30, 50, 30]);
      } else if (type === 'heavy' || type === 'error') {
        navigator.vibrate(60);
      } else {
        navigator.vibrate(20);
      }
    }
  } catch {
    // Haptics unavailable or permission denied; fail silently
  }
}
