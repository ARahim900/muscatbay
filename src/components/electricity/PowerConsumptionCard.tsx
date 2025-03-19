
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
    />
  );
};

export default PowerConsumptionCard;
