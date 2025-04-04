
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Building, Home, FileSpreadsheet } from 'lucide-react';
import ReserveFundCalculator from '@/components/asset-reserve-fund/ReserveFundCalculator';

const ReserveFundCalculatorPage: React.FC = () => {
  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reserve Fund Calculator</h1>
          <p className="text-muted-foreground">Calculate and manage reserve fund contributions for all property types</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Building className="h-4 w-4 mr-2" />
              Total Properties
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">196</div>
            <p className="text-xs text-muted-foreground mt-1">Across all zones</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Home className="h-4 w-4 mr-2" />
              Property Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-muted-foreground mt-1">Villas, apartments, commercial</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Coins className="h-4 w-4 mr-2" />
              Annual Contribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">201,458 OMR</div>
            <p className="text-xs text-muted-foreground mt-1">Total across all properties</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <FileSpreadsheet className="h-4 w-4 mr-2" />
              Last Updated
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">April 2025</div>
            <p className="text-xs text-muted-foreground mt-1">Based on 2025 rates</p>
          </CardContent>
        </Card>
      </div>

      <ReserveFundCalculator />

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Reserve Fund Management Guidelines</CardTitle>
            <CardDescription>Important information about reserve fund calculations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h3 className="font-semibold mb-1">What is the Reserve Fund?</h3>
              <p>The Reserve Fund is established to cover future major repairs and replacements of the common elements in Muscat Bay. It ensures that adequate funds are available for anticipated capital expenditures without the need for special assessments.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">How are contributions calculated?</h3>
              <p>Contributions are calculated based on the Built-Up Area (BUA) of each property and a rate per square meter that varies by zone. The Reserve Fund Study (RFS) established base rates in 2021 with a 0.5% annual escalation.</p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-1">Payment Schedule</h3>
              <p>Reserve Fund contributions are typically collected annually or can be paid quarterly along with service charges. Contact the community management team for payment options.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ReserveFundCalculatorPage;
