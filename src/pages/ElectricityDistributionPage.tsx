
import React from 'react';
import { Zap } from 'lucide-react';

const ElectricityDistributionPage: React.FC = () => {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-start mb-6">
        <Zap className="h-8 w-8 mr-2 text-amber-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Electricity Distribution</h1>
          <p className="text-muted-foreground">Manage and monitor electricity usage across Muscat Bay</p>
        </div>
      </div>
      
      <div className="p-12 text-center border rounded-lg">
        <h2 className="text-xl font-medium mb-4">Electricity Distribution Module</h2>
        <p className="text-muted-foreground">This module is currently under development.</p>
        <p className="text-muted-foreground">Full functionality will be available in the next update.</p>
      </div>
    </div>
  );
};

export default ElectricityDistributionPage;
