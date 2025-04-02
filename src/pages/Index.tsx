
import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { BarChart3, Building2, Calculator, Droplets, FileText, Zap, Package } from 'lucide-react';
import QuickAccessLinks from '@/components/dashboard/QuickAccessLinks';

const Index = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-6">
        <div className="text-center my-8">
          <h1 className="text-3xl font-bold mb-2">Muscat Bay Management Portal</h1>
          <p className="text-muted-foreground">Welcome to the Muscat Bay property management and utilities dashboard</p>
        </div>
        
        <QuickAccessLinks className="mb-6" />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Asset Lifecycle Management</h2>
              <p className="text-center text-muted-foreground mb-4">Track and manage all assets across the property</p>
              <Link to="/alm" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">Access Module</Link>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Property Management</h2>
              <p className="text-center text-muted-foreground mb-4">Manage properties, tenants, and maintenance requests</p>
              <Link to="/property-management" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Access Module</Link>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Financial Visualizer</h2>
              <p className="text-center text-muted-foreground mb-4">Analyze and visualize financial data</p>
              <Link to="/financial-visualizer" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">Access Module</Link>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Electricity System</h2>
              <p className="text-center text-muted-foreground mb-4">Monitor and manage electricity distribution</p>
              <Link to="/electricity-system" className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors">Access Module</Link>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <Droplets className="h-8 w-8 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Water System</h2>
              <p className="text-center text-muted-foreground mb-4">Monitor and manage water distribution</p>
              <Link to="/water-system" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Access Module</Link>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <Calculator className="h-8 w-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Reserve Fund Calculator</h2>
              <p className="text-center text-muted-foreground mb-4">Calculate and manage reserve fund contributions</p>
              <Link to="/reserve-fund-calculator" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Access Module</Link>
            </div>
          </Card>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Muscat Bay Management | Version 1.5.0</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
