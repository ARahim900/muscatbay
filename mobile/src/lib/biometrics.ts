/**
 * Biometric app unlock (Face ID / Touch ID / fingerprint).
 *
 * Rules this module enforces:
 *  • The toggle can only be turned on when the device actually has enrolled
 *    biometrics — otherwise it would arm a lock the user cannot open.
 *  • `authenticate()` allows the device passcode as a fallback, so a failed
 *    face scan or a wet finger never locks an operator out mid-shift.
 *  • Everything degrades to "unlocked" if the hardware is missing. This is a
 *    convenience lock on a read-only app, not a second authentication factor;
 *    the real boundary is the Supabase session and its RLS policies.
 *
 * Works in Expo Go — expo-local-authentication is bundled in the Expo Go client.
 */
import * as LocalAuthentication from 'expo-local-authentication';

export interface BiometricCapability {
  /** Device has biometric hardware. */
  hasHardware: boolean;
  /** User has enrolled a face or fingerprint. */
  isEnrolled: boolean;
  /** "Face ID", "Fingerprint", "Iris" — for the settings label. */
  label: string;
  /** Safe to offer the toggle. */
  available: boolean;
}

const UNAVAILABLE: BiometricCapability = {
  hasHardware: false,
  isEnrolled: false,
  label: 'Biometric unlock',
  available: false,
};

function describe(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) return 'Face ID';
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) return 'Fingerprint';
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) return 'Iris';
  return 'Biometric unlock';
}

export async function getCapability(): Promise<BiometricCapability> {
  try {
    const [hasHardware, isEnrolled, types] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
      LocalAuthentication.supportedAuthenticationTypesAsync(),
    ]);
    return {
      hasHardware,
      isEnrolled,
      label: describe(types),
      available: hasHardware && isEnrolled,
    };
  } catch {
    return UNAVAILABLE;
  }
}

/**
 * Prompt for biometric unlock.
 *
 * Returns `true` on success AND when biometrics are unavailable — an app that
 * cannot verify must not become an app that cannot be opened.
 */
export async function authenticate(reason = 'Unlock Muscat Bay Operations'): Promise<boolean> {
  try {
    const capability = await getCapability();
    if (!capability.available) return true;

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: reason,
      // Device passcode fallback — the escape hatch that prevents lockout.
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });
    return result.success;
  } catch {
    return true;
  }
}
