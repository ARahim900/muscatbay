
import React from 'react';

interface KpiCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon: React.ReactNode;
  color: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({ title, value, subtext, icon, color }) => (
  <div className="bg-white rounded-lg shadow p-4">
    <div className="flex items-start">
      <div className={`rounded-md p-2 bg-opacity-10`} style={{ backgroundColor: `${color}20` }}>
        <div className="w-8 h-8" style={{ color }}>
          {icon}
        </div>
      </div>
      <div className="ml-4">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
        {subtext && <p className="mt-1 text-sm text-gray-500">{subtext}</p>}
      </div>
    </div>
  </div>
);
