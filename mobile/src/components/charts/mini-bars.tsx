/**
 * Small categorical bar chart, drawn with `react-native-svg`.
 *
 * Recharts / GSAP / shadcn do not run in React Native, so charts here are hand
 * drawn against the same `--chart-*` palette (BRAND_DESIGN.md §2.9). Deliberate
 * constraints, because a phone chart that tries to be a desktop chart is worse
 * than no chart:
 *   • no animation — an operator glancing at a KPI does not need motion;
 *   • no tooltips — the value is printed under the bar instead;
 *   • an explicit empty state rather than an empty axis, so "no data" can never
 *     be mistaken for "flat".
 */
import { View } from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';

import { Text } from '~/components/ui/text';
import { useTheme } from '~/theme/theme-provider';

export interface BarDatum {
  label: string;
  value: number;
}

export interface MiniBarsProps {
  data: BarDatum[];
  height?: number;
  color: string;
  /** Rendered under the chart, e.g. "kWh per month". */
  caption?: string;
  /** Formats the value shown for the most recent bar. */
  format?: (value: number) => string;
}

export function MiniBars({ data, height = 96, color, caption, format }: MiniBarsProps) {
  const { colors } = useTheme();

  if (data.length === 0) {
    return (
      <View className="items-center justify-center rounded-md border border-dashed border-border py-6">
        <Text variant="caption">No readings to plot</Text>
      </View>
    );
  }

  const max = Math.max(...data.map((d) => d.value), 0);
  const width = 100; // viewBox units — scales to the container via preserveAspectRatio
  const gap = 1.5;
  const barWidth = Math.max((width - gap * (data.length - 1)) / data.length, 0.5);
  const latest = data[data.length - 1];

  return (
    <View className="gap-2">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Baseline — the only axis a bar chart this small earns. */}
        <Line x1={0} y1={height - 0.5} x2={width} y2={height - 0.5} stroke={colors.chartAxis} strokeWidth={0.5} opacity={0.5} />
        {data.map((datum, index) => {
          const barHeight = max > 0 ? Math.max((datum.value / max) * (height - 4), 1) : 1;
          return (
            <Rect
              key={`${datum.label}-${index}`}
              x={index * (barWidth + gap)}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx={0.6}
              fill={color}
              // The most recent period is the one being read; the rest is context.
              opacity={index === data.length - 1 ? 1 : 0.45}
            />
          );
        })}
      </Svg>

      <View className="flex-row items-center justify-between">
        <Text variant="caption">{data[0].label}</Text>
        {caption ? <Text variant="caption">{caption}</Text> : null}
        <Text variant="caption" className="text-foreground">
          {latest.label}
          {format ? ` · ${format(latest.value)}` : ''}
        </Text>
      </View>
    </View>
  );
}
