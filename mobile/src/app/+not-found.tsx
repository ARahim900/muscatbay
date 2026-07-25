import { Link, Stack } from 'expo-router';
import { View } from 'react-native';

import { Text } from '~/components/ui/text';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center gap-3 bg-background px-8">
        <Text variant="title">This screen does not exist</Text>
        <Text variant="caption" className="text-center">
          The link you followed does not match any screen in Muscat Bay Operations.
        </Text>
        <Link href="/(tabs)" className="py-3">
          <Text className="font-sans-medium text-base text-ring">Go to the dashboard</Text>
        </Link>
      </View>
    </>
  );
}
