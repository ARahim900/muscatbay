/**
 * Biometric lock screen.
 *
 * Only reachable when the user turned the lock on in Settings. It always offers
 * a way out: retry, or sign out entirely. Combined with the device-passcode
 * fallback in `lib/biometrics.ts`, no failure mode leaves an operator holding a
 * phone they cannot get into mid-shift.
 */
import { Lock } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';

import { Button } from '~/components/ui/button';
import { Text } from '~/components/ui/text';
import { useSession } from '~/features/auth/session-provider';
import { getCapability } from '~/lib/biometrics';
import { useTheme } from '~/theme/theme-provider';

export default function LockScreen() {
  const { unlock, signOut, user } = useSession();
  const { colors } = useTheme();
  const [label, setLabel] = useState('Biometric unlock');
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void getCapability().then((c) => setLabel(c.label));
  }, []);

  const attempt = useCallback(async () => {
    setBusy(true);
    setFailed(false);
    const passed = await unlock();
    if (!passed) setFailed(true);
    setBusy(false);
  }, [unlock]);

  // Prompt once as soon as the screen appears.
  useEffect(() => {
    void attempt();
  }, [attempt]);

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background px-8">
      <View className="h-16 w-16 items-center justify-center rounded-lg bg-primary">
        <Lock size={26} color={colors.primaryForeground} />
      </View>

      <View className="items-center gap-2">
        <Text variant="title">Muscat Bay Operations is locked</Text>
        <Text variant="caption" className="text-center">
          {user?.email
            ? `Signed in as ${user.email}. Unlock with ${label} to continue.`
            : `Unlock with ${label} to continue.`}
        </Text>
      </View>

      {failed ? (
        <Text variant="caption" className="text-center text-status-danger">
          Unlock was cancelled or did not match. Try again, or sign out and use your password.
        </Text>
      ) : null}

      <View className="w-full gap-3">
        <Button label={`Unlock with ${label}`} onPress={() => void attempt()} loading={busy} />
        <Button label="Sign out" variant="ghost" onPress={() => void signOut()} />
      </View>
    </View>
  );
}
