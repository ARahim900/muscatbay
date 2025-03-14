
import React from 'react';

interface StatCardProps {
  title: string;
  value: string;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ title, value, subtext }) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4">
    <p className="text-sm font-medium text-gray-500">{title}</p>
    <p className="mt-2 text-xl font-semibold text-gray-900">{value}</p>
    {subtext && <p className="mt-1 text-xs text-gray-500">{subtext}</p>}
  </div>
);
