/**
 * Settings — theme, biometric lock, notifications, sign out.
 *
 * Every capability that behaves differently in Expo Go says so in plain words
 * on this screen rather than failing silently or throwing.
 */
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Pressable, Switch, View } from 'react-native';

import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Screen } from '~/components/ui/screen';
import { Text } from '~/components/ui/text';
import { useSession } from '~/features/auth/session-provider';
import { getCapability, type BiometricCapability } from '~/lib/biometrics';
import { cn } from '~/lib/cn';
import { registerForPush, unregisterPush, type PushRegistrationResult } from '~/lib/push';
import { isExpoGo } from '~/lib/runtime';
import type { ThemePreference } from '~/lib/settings-store';
import { useTheme } from '~/theme/theme-provider';

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export default function SettingsScreen() {
  const { settings, setThemePreference, updateSettings, colors } = useTheme();
  const { user, role, signOut } = useSession();

  const [biometrics, setBiometrics] = useState<BiometricCapability | null>(null);
  const [pushResult, setPushResult] = useState<PushRegistrationResult | null>(null);
  const [pushBusy, setPushBusy] = useState(false);

  useEffect(() => {
    void getCapability().then(setBiometrics);
  }, []);

  const togglePush = async (next: boolean) => {
    setPushBusy(true);
    try {
      if (next && user) {
        const result = await registerForPush(user.id);
        setPushResult(result);
        // Only record the preference as ON when registration actually succeeded.
        updateSettings({ pushEnabled: result.status === 'registered' });
      } else {
        if (user) await unregisterPush(user.id, pushResult?.token);
        setPushResult(null);
        updateSettings({ pushEnabled: false });
      }
    } finally {
      setPushBusy(false);
    }
  };

  return (
    <Screen title="Settings" subtitle={user?.email ?? undefined}>
      {/* ── Account ───────────────────────────────────────────────── */}
      <Card className="gap-1">
        <Text variant="label">Signed in as</Text>
        <Text variant="body" className="font-sans-medium">
          {user?.fullName ?? user?.email ?? 'Unknown user'}
        </Text>
        <Text variant="caption">
          Role: {role} · module visibility follows the same rules as muscatbay.work
        </Text>
      </Card>

      {/* ── Theme ─────────────────────────────────────────────────── */}
      <Card className="gap-3">
        <View className="gap-0.5">
          <Text variant="heading">Appearance</Text>
          <Text variant="caption">
            Dark is the default for control rooms and night shifts; light is fully supported.
          </Text>
        </View>
        <View className="flex-row gap-2">
          {THEME_OPTIONS.map((option) => {
            const active = settings.theme === option.value;
            return (
              <Pressable
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                accessibilityLabel={`${option.label} theme`}
                onPress={() => setThemePreference(option.value)}
                className={cn(
                  'min-h-[44px] flex-1 items-center justify-center rounded-sm border',
                  active ? 'border-ring bg-secondary/20' : 'border-border bg-transparent',
                )}>
                <Text
                  className={cn(
                    'font-sans-medium text-sm',
                    active ? 'text-foreground' : 'text-muted-foreground',
                  )}>
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* ── Biometric lock ────────────────────────────────────────── */}
      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="heading">{biometrics?.label ?? 'Biometric unlock'}</Text>
            <Text variant="caption">
              {biometrics === null
                ? 'Checking this device…'
                : biometrics.available
                  ? 'Require an unlock each time the app returns to the foreground.'
                  : biometrics.hasHardware
                    ? 'No face or fingerprint is enrolled on this device. Enrol one in the system settings to use this.'
                    : 'This device has no biometric hardware.'}
            </Text>
          </View>
          <Switch
            value={settings.biometricLock}
            disabled={!biometrics?.available}
            onValueChange={(next) => updateSettings({ biometricLock: next })}
            trackColor={{ true: colors.secondary, false: colors.border }}
            accessibilityLabel="Require biometric unlock"
          />
        </View>
        {settings.biometricLock ? (
          <Text variant="caption">
            Your device passcode still works as a fallback, so a failed scan can never lock you out
            mid-shift.
          </Text>
        ) : null}
      </Card>

      {/* ── Notifications ─────────────────────────────────────────── */}
      <Card className="gap-3">
        <View className="flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <Text variant="heading">Operational alerts</Text>
            <Text variant="caption">
              Push a notification when a water-loss, contract-expiry or plant-failure condition is
              raised.
            </Text>
          </View>
          <Switch
            value={settings.pushEnabled}
            disabled={pushBusy || isExpoGo}
            onValueChange={(next) => void togglePush(next)}
            trackColor={{ true: colors.secondary, false: colors.border }}
            accessibilityLabel="Receive operational alert notifications"
          />
        </View>

        {isExpoGo ? (
          <View className="rounded-sm border border-status-info/30 bg-status-info/10 p-3">
            <Text variant="caption" className="text-foreground/85">
              Push notifications require a development build. Expo Go cannot receive remote
              notifications (Expo SDK 53+), so this switch is disabled here. Everything else in the
              app works normally.
            </Text>
          </View>
        ) : null}

        {pushResult && pushResult.status !== 'registered' ? (
          <View className="rounded-sm border border-status-warning/30 bg-status-warning/10 p-3">
            <Text variant="caption" className="text-foreground/85">
              {pushResult.detail}
            </Text>
          </View>
        ) : null}
      </Card>

      {/* ── About ─────────────────────────────────────────────────── */}
      <Card className="gap-1">
        <Text variant="label">About</Text>
        <Text variant="caption">
          Muscat Bay Operations {Constants.expoConfig?.version ?? '1.0.0'} ·{' '}
          {isExpoGo ? 'running in Expo Go' : 'native build'}
        </Text>
        <Text variant="caption">
          Read-only. This app identifies and displays operational conditions; it does not create,
          assign or close work.
        </Text>
      </Card>

      <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
    </Screen>
  );
}
