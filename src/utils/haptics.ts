/**
 * Haptic Vibration Feedback Utility for AutoCheck Brasil
 * Follows Apple iOS Taptic Engine & Android Haptic Feedback patterns
 * Uses the Web Vibration API with safe fallback guards.
 */

export type HapticPattern = 'selection' | 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  selection: 10,
  light: 15,
  medium: 30,
  heavy: 55,
  success: [20, 60, 25],
  warning: [30, 50, 30],
  error: [45, 65, 45, 65, 55]
};

export function triggerHaptic(pattern: HapticPattern = 'light'): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Check Vibration API availability
  if ('vibrate' in navigator && typeof navigator.vibrate === 'function') {
    try {
      const vibPattern = HAPTIC_PATTERNS[pattern] ?? 15;
      return navigator.vibrate(vibPattern);
    } catch {
      // Ignored silently if browser policy blocks programmatic vibration
      return false;
    }
  }

  return false;
}
