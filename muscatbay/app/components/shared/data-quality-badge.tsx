import { cn } from "@/lib/utils";

type DataQualityStatus = 'incomplete' | 'stale' | 'estimated' | 'under-review' | 'anomaly';

interface DataQualityBadgeProps {
  status: DataQualityStatus;
  className?: string;
}

const BADGE_CONFIG: Record<DataQualityStatus, { label: string; classes: string }> = {
  incomplete:     { label: 'Incomplete',    classes: 'bg-mb-warning-light text-mb-warning-text border-mb-warning/40' },
  stale:          { label: 'Stale Data',    classes: 'bg-mb-stale-light   text-mb-stale-text   border-mb-stale/40'   },
  estimated:      { label: 'Estimated',     classes: 'bg-mb-info-light    text-mb-info-text    border-mb-info/40'    },
  'under-review': { label: 'Under Review',  classes: 'bg-primary/10       text-badge-purple-fg border-primary/30'    },
  anomaly:        { label: 'Anomaly',       classes: 'bg-mb-danger-light  text-mb-danger-text  border-mb-danger/40'  },
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
