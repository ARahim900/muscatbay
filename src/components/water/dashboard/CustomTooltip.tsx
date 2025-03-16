
import React from 'react';

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  theme: any;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, theme }) => {
  // Helper function to format numbers
  const formatNumber = (num: number, decimals = 0) => {
    if (num === undefined || num === null) return '';
    return num.toLocaleString(undefined, { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };
  
  if (active && payload && payload.length) {
    return (
      <div className={`${theme.cardBg} p-3 border ${theme.border} ${theme.shadow} rounded-md`}>
        <p className={`font-medium ${theme.text}`}>{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)} m³
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default CustomTooltip;
