/**
 * Sign in.
 *
 * Deliberately shows NO operational figures. The web app once rendered
 * confident-looking "live" numbers on its login screen that were fabricated
 * constants; nothing on this screen may imply a reading. The only status shown
 * is whether the app is configured to reach Supabase at all — which is a fact
 * about this build, not about the plant.
 */
import { Link } from 'expo-router';
import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ErrorState } from '~/components/ui/states';
import { Text } from '~/components/ui/text';
import { supabaseConfigError } from '~/adapters/env';
import { useSession } from '~/features/auth/session-provider';
import * as haptics from '~/lib/haptics';

export default function SignInScreen() {
  const { signIn } = useSession();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const configError = supabaseConfigError();

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(email, password);
      haptics.success();
    } catch (caught) {
      haptics.failure();
      setError(caught instanceof Error ? caught.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 32, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center gap-8 px-6">
          <View className="items-center gap-4">
            <View className="h-20 w-20 items-center justify-center rounded-lg bg-primary">
              <Image
                source={require('../../../assets/images/splash-icon.png')}
                style={{ width: 52, height: 52 }}
                resizeMode="contain"
                accessibilityLabel="Muscat Bay"
              />
            </View>
            <View className="items-center gap-1">
              <Text variant="title">Muscat Bay Operations</Text>
              <Text variant="caption">Sign in with your Muscat Bay account</Text>
            </View>
          </View>

          {configError ? (
            <ErrorState title="App is not configured" detail={configError} />
          ) : (
            <View className="gap-4">
              <Input
                label="Email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="you@muscatbay.com"
                returnKeyType="next"
              />
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="current-password"
                textContentType="password"
                placeholder="••••••••"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                error={error}
              />

              <Button
                label="Sign in"
                onPress={() => void submit()}
                loading={busy}
                disabled={!email || !password}
              />

              <Link href="/(auth)/forgot-password" asChild>
                <Text
                  accessibilityRole="link"
                  className="py-2 text-center font-sans-medium text-sm text-ring">
                  Forgot your password?
                </Text>
              </Link>
            </View>
          )}

          <Text variant="caption" className="text-center">
            Read-only operations view. Data comes from the same Supabase project as
            muscatbay.work.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
