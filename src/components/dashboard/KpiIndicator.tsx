
import React from 'react';
import { CheckCircle2, AlertTriangle, InfoIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KpiIndicatorProps {
  title: string;
  value: string;
  status: 'good' | 'warning' | 'info' | 'critical';
  subtext?: string;
  className?: string;
}

const KpiIndicator: React.FC<KpiIndicatorProps> = ({
  title,
  value,
  status,
  subtext,
  className
}) => {
  return (
    <div className={cn(
      "flex flex-col space-y-2 rounded-lg border p-4",
      status === 'good' && "border-green-200 bg-green-50/40",
      status === 'warning' && "border-amber-200 bg-amber-50/40",
      status === 'critical' && "border-red-200 bg-red-50/40",
      status === 'info' && "border-blue-200 bg-blue-50/40",
      className
    )}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        {status === 'good' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
        {status === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-500" />}
        {status === 'critical' && <AlertTriangle className="h-5 w-5 text-red-500" />}
        {status === 'info' && <InfoIcon className="h-5 w-5 text-blue-500" />}
      </div>
      <div>
        <p className="text-xl font-semibold text-muscat-primary">{value}</p>
        {subtext && <p className="text-xs text-muscat-primary/60">{subtext}</p>}
      </div>
    </div>
  );
};

export default KpiIndicator;
