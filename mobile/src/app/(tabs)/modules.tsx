/**
 * Module list.
 *
 * Visibility is filtered by `canAccessModule` from `@/lib/rbac` — the exact
 * predicate the web sidebar uses — so a contractor account sees the same
 * shortened list here as it does on the website, and both mirror the Supabase
 * RLS policies behind them.
 */
import { useRouter } from 'expo-router';
import { ChevronRight, Lock } from 'lucide-react-native';
import { View } from 'react-native';

import { Card, PressableCard } from '~/components/ui/card';
import { Screen } from '~/components/ui/screen';
import { Text } from '~/components/ui/text';
import { useSession } from '~/features/auth/session-provider';
import { MODULES } from '~/lib/modules';
import { useTheme } from '~/theme/theme-provider';

export default function ModulesScreen() {
  const router = useRouter();
  const { canAccess, role } = useSession();
  const { colors } = useTheme();

  const visible = MODULES.filter((m) => canAccess(m.key));
  const hidden = MODULES.length - visible.length;

  return (
    <Screen title="Modules" subtitle={`${visible.length} available for your role`}>
      {visible.map((module) => {
        const Icon = module.icon;
        return (
          <PressableCard
            key={module.key}
            accessibilityLabel={`Open ${module.title}. ${module.blurb}`}
            onPress={() => router.push(`/module/${module.key}`)}
            className="flex-row items-center gap-3.5">
            <View
              style={{ backgroundColor: `${module.accent}22` }}
              className="h-10 w-10 items-center justify-center rounded-md">
              <Icon size={20} color={module.accent} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="heading">{module.title}</Text>
              <Text variant="caption" numberOfLines={2}>
                {module.blurb}
              </Text>
            </View>
            <ChevronRight size={18} color={colors.mutedForeground} />
          </PressableCard>
        );
      })}

      {hidden > 0 ? (
        <Card className="flex-row items-center gap-3">
          <Lock size={16} color={colors.mutedForeground} />
          <Text variant="caption" className="flex-1">
            {hidden} module{hidden > 1 ? 's are' : ' is'} hidden for the “{role}” role. Ask an
            administrator if you need access.
          </Text>
        </Card>
      ) : null}
    </Screen>
  );
}
