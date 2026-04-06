import { cn } from "@/lib/utils";

type DataQualityStatus = 'incomplete' | 'stale' | 'estimated' | 'under-review' | 'anomaly';

interface DataQualityBadgeProps {
  status: DataQualityStatus;
  className?: string;
}

const BADGE_CONFIG: Record<DataQualityStatus, { label: string; classes: string }> = {
  incomplete:     { label: 'Incomplete',    classes: 'text-amber-600  bg-amber-50  border-amber-600/30  dark:bg-amber-900/20  dark:text-amber-400  dark:border-amber-400/30' },
  stale:          { label: 'Stale Data',    classes: 'text-orange-600 bg-orange-50 border-orange-600/30 dark:bg-orange-900/20 dark:text-orange-400 dark:border-orange-400/30' },
  estimated:      { label: 'Estimated',     classes: 'text-blue-600   bg-blue-50   border-blue-600/30   dark:bg-blue-900/20   dark:text-blue-400   dark:border-blue-400/30'  },
  'under-review': { label: 'Under Review',  classes: 'text-purple-600 bg-purple-50 border-purple-600/30 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-400/30' },
  anomaly:        { label: 'Anomaly',       classes: 'text-red-600    bg-red-50    border-red-600/30    dark:bg-red-900/20    dark:text-red-400    dark:border-red-400/30'   },
};

export function DataQualityBadge({ status, className }: DataQualityBadgeProps) {
  const config = BADGE_CONFIG[status];
  return (
    <span
      className={cn(
        'inline-flex items-center text-xs font-medium rounded-full px-2 py-0.5 border',
        config.classes,
        className
      )}
      title={`Data quality: ${config.label}`}
      aria-label={`Data quality status: ${config.label}`}
    >
      {config.label}
    </span>
  );
}
