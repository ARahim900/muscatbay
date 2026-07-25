/**
 * Connectivity banner.
 *
 * Honest by design: this app is READ-ONLY and has no offline queue, so the
 * banner says what is actually true — figures on screen were fetched when the
 * connection last worked, and nothing will update until it returns. It never
 * implies that anything is being saved for later.
 */
import { CloudOff, WifiOff } from 'lucide-react-native';
import { View } from 'react-native';

import { Text } from '~/components/ui/text';
import { useConnectivity } from '~/hooks/use-connectivity';
import { STATUS_COLORS } from '~/theme/tokens';

export function OfflineBanner() {
  const { online, limited } = useConnectivity();

  // `null` means the probe has not resolved yet — do not accuse the network.
  if (online === null || online) return null;

  const Icon = limited ? CloudOff : WifiOff;
  const detail = limited
    ? 'Connected, but there is no route to the internet. Figures below are from the last successful read.'
    : 'No connection. Figures below are from the last successful read and will not update.';

  return (
    <View
      accessibilityRole="alert"
      className="flex-row items-center gap-2.5 border-b border-status-stale/30 bg-status-stale/10 px-4 py-2.5">
      <Icon size={16} color={STATUS_COLORS.stale} />
      <Text variant="caption" className="flex-1 text-foreground/85">
        {detail}
      </Text>
    </View>
  );
}
