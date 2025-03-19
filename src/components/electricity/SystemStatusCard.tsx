
import React from 'react';
import MetricCard from './MetricCard';

const SystemStatusCard = () => {
  return (
    <MetricCard
      title="System Status"
      value=""
      description="All systems operational"
      colorClass="bg-gradient-to-r from-green-400 to-emerald-600"
    >
      <div className="flex items-center">
        <div className="h-3 w-3 rounded-full bg-green-500 mr-2 animate-pulse-subtle"></div>
        <span className="text-gray-800 dark:text-gray-200">All systems normal</span>
      </div>
      <div className="mt-3 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
        <div className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all" style={{ width: '94%' }}></div>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">System performance: 94%</p>
    </MetricCard>
  );
};

export default SystemStatusCard;
