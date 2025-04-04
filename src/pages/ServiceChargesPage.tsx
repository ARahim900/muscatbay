
import React from 'react';
import { CreditCard } from 'lucide-react';

const ServiceChargesPage: React.FC = () => {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-start mb-6">
        <CreditCard className="h-8 w-8 mr-2 text-gray-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Charges</h1>
          <p className="text-muted-foreground">Manage service charges for Muscat Bay properties</p>
        </div>
      </div>
      
      <div className="p-12 text-center border rounded-lg">
        <h2 className="text-xl font-medium mb-4">Service Charges Module</h2>
        <p className="text-muted-foreground">This module is currently under development.</p>
        <p className="text-muted-foreground">Full functionality will be available in the next update.</p>
      </div>
    </div>
  );
};

export default ServiceChargesPage;
