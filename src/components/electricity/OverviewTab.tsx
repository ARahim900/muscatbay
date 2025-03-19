
import React from 'react';
import PowerConsumptionCard from './PowerConsumptionCard';
import SystemStatusCard from './SystemStatusCard';
import AlertsCard from './AlertsCard';
import QuickActionsCard from './QuickActionsCard';

const OverviewTab = () => {
  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <PowerConsumptionCard />
        <SystemStatusCard />
        <AlertsCard />
      </div>
      
      <div className="mt-8">
        <QuickActionsCard />
      </div>
    </div>
  );
};

export default OverviewTab;
