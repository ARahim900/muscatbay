/**
 * Haptic feedback.
 *
 * Wrapped so a device without a Taptic Engine (or a simulator) is a no-op
 * rather than an unhandled rejection, and so call sites read as intent
 * ("this failed") rather than as an API ("notificationAsync(Error)").
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const supported = Platform.OS === 'ios' || Platform.OS === 'android';

async function run(fn: () => Promise<void>): Promise<void> {
  if (!supported) return;
  try {
    await fn();
  } catch {
    // Haptics are decoration; never let them surface as an error.
  }
}

/** Row tap, tab change, toggle. */
export function tap(): void {
  void run(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
}

/** Pull-to-refresh completed, data landed. */
export function success(): void {
  void run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
}

/** A fetch failed, or sign-in was rejected. */
export function failure(): void {
  void run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
}

/** Opening something that carries a critical alert. */
export function warn(): void {
  void run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
}
