/**
 * Forgot password.
 *
 * Sends the Supabase reset email with an app deep link as the redirect. The
 * confirmation wording never reveals whether the address has an account.
 */
import { useRouter } from 'expo-router';
import { CheckCircle2 } from 'lucide-react-native';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '~/components/ui/button';
import { Card } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Text } from '~/components/ui/text';
import { requestPasswordReset } from '~/adapters/auth';
import * as haptics from '~/lib/haptics';
import { STATUS_COLORS } from '~/theme/tokens';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await requestPasswordReset(email);
      setSent(true);
      haptics.success();
    } catch (caught) {
      haptics.failure();
      setError(caught instanceof Error ? caught.message : 'Could not send the reset email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 24, paddingBottom: 32 }}
        keyboardShouldPersistTaps="handled">
        <View className="flex-1 justify-center gap-6 px-6">
          <View className="gap-1">
            <Text variant="title">Reset your password</Text>
            <Text variant="caption">
              We will email a reset link that opens straight back into this app.
            </Text>
          </View>

          {sent ? (
            <Card className="gap-3">
              <View className="flex-row items-center gap-2">
                <CheckCircle2 size={18} color={STATUS_COLORS.normal} />
                <Text variant="heading">Check your email</Text>
              </View>
              <Text variant="caption">
                If an account exists for {email.trim()}, a reset link is on its way. The link
                expires after one hour.
              </Text>
              <Button label="Back to sign in" variant="ghost" onPress={() => router.back()} />
            </Card>
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
                placeholder="you@muscatbay.com"
                returnKeyType="go"
                onSubmitEditing={() => void submit()}
                error={error}
              />
              <Button
                label="Send reset link"
                onPress={() => void submit()}
                loading={busy}
                disabled={!email}
              />
              <Button label="Back to sign in" variant="ghost" onPress={() => router.back()} />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
