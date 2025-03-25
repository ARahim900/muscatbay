
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calculator, BarChart2, FileText, Settings, PieChart } from 'lucide-react';
import { OperatingExpenseDisplay, ReserveFundRate } from '@/types/expenses';
import ServiceChargeCalculator from '@/components/service-charges/ServiceChargeCalculator';
import ServiceChargeOverview from '@/components/service-charges/ServiceChargeOverview';
import ServiceChargeExpenses from '@/components/service-charges/ServiceChargeExpenses';
import { getMockExpenseDisplayData } from '@/utils/expenseUtils';

const ServiceCharges: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  // Sample data for service charge calculations
  const operatingExpenses: OperatingExpenseDisplay[] = getMockExpenseDisplayData();

  // Reserve fund rates
  const reserveFundRates: ReserveFundRate[] = [
    { zone: 'zone03', zoneName: 'Zone 03 - Residential Area (Zaha)', rate: 0.40, effectiveDate: '2024-01-01' },
    { zone: 'zone05', zoneName: 'Zone 05 - Residential Area (Nameer)', rate: 0.50, effectiveDate: '2024-01-01' },
    { zone: 'zone08', zoneName: 'Zone 08 - Residential Area (Wajd)', rate: 0.60, effectiveDate: '2024-01-01' },
    { zone: 'commercial', zoneName: 'Commercial Area', rate: 0.70, effectiveDate: '2024-01-01' },
    { zone: 'staff', zoneName: 'Staff Accommodation', rate: 0.30, effectiveDate: '2024-01-01' }
  ];

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Service Charges</h1>
          <p className="text-muted-foreground">Manage and calculate service charges for all properties</p>
        </div>
      </div>

      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:w-[600px]">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart2 className="h-4 w-4" />
            <span>Overview</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span>Calculator</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <PieChart className="h-4 w-4" />
            <span>Expenses</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ServiceChargeOverview expenses={operatingExpenses} reserveFundRates={reserveFundRates} />
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <ServiceChargeCalculator expenses={operatingExpenses} reserveFundRates={reserveFundRates} />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ServiceChargeExpenses expenses={operatingExpenses} reserveFundRates={reserveFundRates} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Service Charge Settings</CardTitle>
              <CardDescription>Configure service charge parameters and policies</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Settings panel content will be implemented here.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ServiceCharges;
