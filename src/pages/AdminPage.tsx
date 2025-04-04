
import React from 'react';
import { Shield } from 'lucide-react';

const AdminPage: React.FC = () => {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-start mb-6">
        <Shield className="h-8 w-8 mr-2 text-red-600" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
          <p className="text-muted-foreground">System administration and management</p>
        </div>
      </div>
      
      <div className="p-12 text-center border rounded-lg">
        <h2 className="text-xl font-medium mb-4">Admin Module</h2>
        <p className="text-muted-foreground">This module is currently under development.</p>
        <p className="text-muted-foreground">Full functionality will be available in the next update.</p>
      </div>
    </div>
  );
};

export default AdminPage;
