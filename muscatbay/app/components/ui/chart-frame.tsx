// components/ui/ChartFrame.tsx
// One Recharts look for the whole app. Wrap every chart in <ChartFrame> and
// spread `chartTheme.*` onto the Recharts primitives.
//
//   <ChartFrame series={2} height="chart">
//     <ResponsiveContainer>
//       <ComposedChart data={rows}>
//         <CartesianGrid {...chartTheme.grid} />
//         <XAxis dataKey="month" {...chartTheme.axis} />
//         <YAxis {...chartTheme.axis} />
//         <Tooltip {...chartTheme.tooltip} />
//         <Bar dataKey="supply" fill={chartTheme.series[2]} {...chartTheme.bar} />
//         <Line dataKey="loss" stroke={chartTheme.loss} {...chartTheme.line} />
//       </ComposedChart>
//     </ResponsiveContainer>
//   </ChartFrame>
'use client';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const v = (name: string) => `var(--color-${name})`;

export const chartTheme = {
  // series order: purple, teal, water blue, amber, violet, sage
  series: [v('chart-1'), v('chart-2'), v('chart-3'), v('chart-4'), v('chart-5'), v('chart-6')],
  loss: v('chart-loss'),
  target: v('warning'),
  grid:  { vertical: false, stroke: v('line'), strokeDasharray: '3 3' } as const,
  axis:  { axisLine: false, tickLine: false, tick: { fill: v('muted'), fontSize: 12 }, tickMargin: 8 } as const,
  bar:   { radius: [3, 3, 0, 0] as [number, number, number, number], maxBarSize: 28 },
  line:  { strokeWidth: 2, dot: false, activeDot: { r: 4, strokeWidth: 0 } } as const,
  area:  { strokeWidth: 2, fillOpacity: 0.15, dot: false } as const,
  tooltip: {
    cursor: { stroke: v('line') },
    contentStyle: {
      background: v('card'), border: `1px solid ${v('line')}`, borderRadius: 'var(--radius-control)',
      boxShadow: 'var(--shadow-card-hover)', fontSize: 12, color: v('fg'), padding: '8px 10px',
    },
    labelStyle: { color: v('muted'), fontSize: 11, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 4 },
    itemStyle: { padding: 0 },
  },
};

type Props = {
  children: ReactNode;
  series: number;                 // number of series — legend is hidden when 1
  legend?: Array<{ label: string; color: string; dashed?: boolean }>;
  height?: 'chart' | 'chart-lg';  // 260px half-width, 320px full-width
  className?: string;
};

export function ChartFrame({ children, series, legend, height = 'chart', className }: Props) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className={cn('w-full', height === 'chart' ? 'h-chart' : 'h-chart-lg')}>{children}</div>
      {series > 1 && legend && (
        <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-caption text-muted">
          {legend.map(l => (
            <li key={l.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className={cn('h-0.5 w-3 rounded-pill', l.dashed && 'border-t border-dashed bg-transparent')}
                style={{ background: l.dashed ? undefined : l.color, borderColor: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// Donut rule: no labels on the ring. Render the legend as a table next to it:
// <ul> rows of  ● Villa ……… 58.9%  using text-caption + tabular-nums.
