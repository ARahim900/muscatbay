/**
 * Push notification registration.
 *
 * Deliberately conservative, because the first delivery target is Expo Go:
 *
 *  • Remote (Expo push) notifications DO NOT work in Expo Go from SDK 53
 *    onwards. Rather than throwing an opaque native error, `registerForPush()`
 *    detects Expo Go and returns a `skipped` result that the Settings screen
 *    renders as a plain sentence. Nothing crashes and nothing is hidden.
 *  • `expo-notifications` is imported dynamically, so the module never loads
 *    during app start-up and cannot affect the Expo Go bundle.
 *  • Registration stores the token in Supabase table `user_push_tokens`. That
 *    table does not exist yet — see mobile/README.md for the DDL. Until it is
 *    created, `registerForPush()` reports the failure honestly instead of
 *    pretending the device is subscribed.
 *
 * There is no notification-driven write path anywhere in this app: a push only
 * ever opens a read-only screen.
 */
import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { EAS_PROJECT_ID } from '~/adapters/env';
import { getSupabaseClient } from '~/adapters/supabase-client';
import { isExpoGo } from '~/lib/runtime';

export type PushRegistrationStatus = 'registered' | 'skipped' | 'denied' | 'error';

export interface PushRegistrationResult {
  status: PushRegistrationStatus;
  /** Always populated for non-`registered` results. Shown verbatim in Settings. */
  detail: string;
  token?: string;
}

/** Set the foreground presentation behaviour. Safe to call in Expo Go. */
export async function configureNotificationHandler(): Promise<void> {
  try {
    const Notifications = await import('expo-notifications');
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('operational-alerts', {
        name: 'Operational alerts',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#A1D1D5',
      });
    }
  } catch (error) {
    console.warn('Notification handler unavailable:', error);
  }
}

export async function registerForPush(userId: string): Promise<PushRegistrationResult> {
  if (isExpoGo) {
    return {
      status: 'skipped',
      detail:
        'Push notifications require a development build. Expo Go cannot receive remote notifications (Expo SDK 53+).',
    };
  }

  if (!Device.isDevice) {
    return {
      status: 'skipped',
      detail: 'Push notifications need a physical device — simulators cannot register.',
    };
  }

  if (!EAS_PROJECT_ID) {
    return {
      status: 'error',
      detail: 'No EAS project id. Run `eas init` in mobile/ so a push token can be issued.',
    };
  }

  try {
    const Notifications = await import('expo-notifications');

    const existing = await Notifications.getPermissionsAsync();
    let granted = existing.status === 'granted';
    if (!granted) {
      const requested = await Notifications.requestPermissionsAsync();
      granted = requested.status === 'granted';
    }
    if (!granted) {
      return {
        status: 'denied',
        detail: 'Notification permission was declined. Enable it in the system Settings app.',
      };
    }

    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId: EAS_PROJECT_ID,
    });
    const token = tokenResponse.data;

    const client = getSupabaseClient();
    if (!client) {
      return { status: 'error', detail: 'Supabase is not configured, so the token was not stored.' };
    }

    const { error } = await client.from('user_push_tokens').upsert(
      {
        user_id: userId,
        expo_push_token: token,
        platform: Platform.OS,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'expo_push_token' },
    );

    if (error) {
      return {
        status: 'error',
        detail: `Device registered with Expo but the token could not be saved: ${error.message}`,
        token,
      };
    }

    return { status: 'registered', detail: 'This device will receive operational alerts.', token };
  } catch (error) {
    return {
      status: 'error',
      detail: error instanceof Error ? error.message : 'Push registration failed.',
    };
  }
}

/** Remove this device's token when the user opts out or signs out. */
export async function unregisterPush(userId: string, token?: string): Promise<void> {
  const client = getSupabaseClient();
  if (!client || !token) return;
  const { error } = await client
    .from('user_push_tokens')
    .delete()
    .eq('user_id', userId)
    .eq('expo_push_token', token);
  if (error) console.warn('Could not remove push token:', error.message);
}
