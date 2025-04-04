
import React from 'react';
import Dashboard from '@/components/asset-reserve-fund/Dashboard';
import { Building2 } from 'lucide-react';

const AssetReserveFund = () => {
  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <div className="flex items-center justify-between border-b pb-4">
        <div className="flex items-center gap-2">
          <Building2 className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-3xl font-bold">Asset Reserve Fund Management</h1>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <div className="text-sm text-muted-foreground">
          <p>
            The Asset Reserve Fund page allows you to look up annual reserve fund contributions for all Muscat Bay properties. 
            Reserve fund calculations are based on the 2021 Land Sterling Reserve Fund Study and adjusted for 2025 rates.
          </p>
        </div>
        
        <Dashboard />
      </div>
    </div>
  );
};

export default AssetReserveFund;
