
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: number | string;
  unit?: string;
  subValue?: number | string;
  subUnit?: string;
  icon: LucideIcon;
  color: string;
  percentage?: number;
  theme: any;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  unit, 
  subValue, 
  subUnit, 
  icon: Icon, 
  color, 
  percentage, 
  theme 
}) => {
  // Helper function to format numbers
  const formatNumber = (num: number | string, decimals = 0) => {
    if (num === undefined || num === null) return '';
    if (typeof num === 'string') return num;
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  return (
    <div className={`${theme.cardBg} rounded-lg ${theme.shadow} p-6 flex flex-col h-36 relative overflow-hidden transition-colors duration-300`}>
      <div className="absolute left-0 top-0 h-full w-1 bg-opacity-70" style={{ backgroundColor: color }}></div>
      <div className="flex justify-between items-start">
        <div className={`text-sm font-medium ${theme.textSecondary}`}>{title}</div>
        <div className="p-2 rounded-full bg-opacity-20" style={{ backgroundColor: `${color}30` }}>
          <Icon size={18} color={color} />
        </div>
      </div>
      <div className="mt-2 flex items-baseline">
        <div className={`text-3xl font-semibold ${theme.text}`}>{formatNumber(value)}</div>
        {unit && <div className={`ml-1 text-sm ${theme.textSecondary}`}>{unit}</div>}
      </div>
      {subValue !== undefined && (
        <div className={`mt-1 text-sm ${theme.textSecondary}`}>
          {formatNumber(subValue, subUnit === "OMR" ? 2 : 0)} {subUnit || ''}
          {percentage !== undefined && (
            <span className={`ml-2 ${percentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {percentage >= 0 ? '+' : ''}{percentage}%
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default MetricCard;
