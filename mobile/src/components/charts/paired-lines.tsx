/**
 * Two-series line chart (e.g. STP inlet vs TSE for irrigation), drawn with
 * `react-native-svg`.
 *
 * Series are distinguished by colour AND by a labelled legend with a distinct
 * dash pattern, so the chart still reads for a colour-blind operator.
 */
import { View } from 'react-native';
import Svg, { Line, Polyline } from 'react-native-svg';

import { Text } from '~/components/ui/text';
import { useTheme } from '~/theme/theme-provider';

export interface LineSeries {
  name: string;
  color: string;
  values: number[];
  /** Dashed series read differently in greyscale. */
  dashed?: boolean;
}

export interface PairedLinesProps {
  series: LineSeries[];
  height?: number;
  caption?: string;
}

export function PairedLines({ series, height = 110, caption }: PairedLinesProps) {
  const { colors } = useTheme();
  const populated = series.filter((s) => s.values.length > 1);

  if (populated.length === 0) {
    return (
      <View className="items-center justify-center rounded-md border border-dashed border-border py-6">
        <Text variant="caption">Not enough logged days to plot a trend</Text>
      </View>
    );
  }

  const width = 100;
  const max = Math.max(...populated.flatMap((s) => s.values), 0);
  const pad = 3;
  const plotHeight = height - pad * 2;

  const toPoints = (values: number[]): string =>
    values
      .map((value, index) => {
        const x = (index / (values.length - 1)) * width;
        const y = pad + plotHeight - (max > 0 ? (value / max) * plotHeight : 0);
        return `${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');

  return (
    <View className="gap-2">
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <Line
          x1={0}
          y1={height - pad}
          x2={width}
          y2={height - pad}
          stroke={colors.chartAxis}
          strokeWidth={0.4}
          opacity={0.5}
        />
        {populated.map((s) => (
          <Polyline
            key={s.name}
            points={toPoints(s.values)}
            fill="none"
            stroke={s.color}
            strokeWidth={1.4}
            strokeLinejoin="round"
            strokeLinecap="round"
            strokeDasharray={s.dashed ? '3,2' : undefined}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </Svg>

      <View className="flex-row flex-wrap items-center gap-x-4 gap-y-1">
        {populated.map((s) => (
          <View key={s.name} className="flex-row items-center gap-1.5">
            <View
              style={{ backgroundColor: s.color, opacity: s.dashed ? 0.7 : 1 }}
              className="h-0.5 w-4 rounded-full"
            />
            <Text variant="caption">
              {s.name}
              {s.dashed ? ' (dashed)' : ''}
            </Text>
          </View>
        ))}
      </View>

      {caption ? <Text variant="caption">{caption}</Text> : null}
    </View>
  );
}
