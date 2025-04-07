
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp as TrendingUpIcon } from 'lucide-react';

const ReserveFundDashboard: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reserve Fund Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Reserve Fund Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">236,500 OMR</div>
            <div className="flex items-center text-green-500 text-sm">
              <TrendingUpIcon className="w-4 h-4 mr-1" /> 8.2% since last quarter
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Annual Contributions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">52,000 OMR</div>
            <div className="flex items-center text-green-500 text-sm">
              <TrendingUpIcon className="w-4 h-4 mr-1" /> 3.5% since last year
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Reserve Fund Dashboard Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <p>This dashboard is under development and will be available soon.</p>
            <p>It will provide detailed information about the reserve fund, including:</p>
            <ul className="list-disc pl-5 mt-2">
              <li>Fund balance history</li>
              <li>Contribution history</li>
              <li>Expenditure tracking</li>
              <li>Future projections</li>
              <li>Reserve adequacy analysis</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReserveFundDashboard;
