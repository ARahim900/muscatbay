
import React from 'react';
import MetricCard from './MetricCard';

const PowerConsumptionCard = () => {
  return (
    <MetricCard
      title="Power Consumption"
      value="843.5 kWh"
      description="Current total consumption"
      tagText="Today"
      trend={{ value: "-2.3%", isPositive: false }}
      colorClass="bg-gradient-to-r from-amber-400 to-amber-600"
    >
      <div className="mt-2 flex flex-col">
        <p className="text-sm text-muted-foreground">Daily consumption rate</p>
        <div className="mt-2 w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-gradient-to-r from-amber-300 to-amber-500 rounded-full transition-all" 
            style={{ width: '75%' }}
          ></div>
        </div>
      </div>
    </MetricCard>
  );
};

export default PowerConsumptionCard;
