
import React from 'react';
import MetricCard from './MetricCard';
import { AlertTriangle } from "lucide-react";

const AlertsCard = () => {
  return (
    <MetricCard
      title="Alerts"
      value=""
      description="System notifications"
      colorClass="bg-gradient-to-r from-amber-300 to-amber-500"
    >
      <div className="flex items-center text-amber-600 dark:text-amber-400 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-900/20 dark:to-amber-800/20 p-3 rounded-lg shadow-sm">
        <AlertTriangle className="h-5 w-5 mr-2 flex-shrink-0" />
        <span>Scheduled maintenance: Tomorrow, 10:00 AM</span>
      </div>
    </MetricCard>
  );
};

export default AlertsCard;
