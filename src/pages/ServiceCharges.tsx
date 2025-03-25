
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calculator, BarChart3, FileCog, Receipt } from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import ServiceChargeCalculator from '@/components/service-charges/ServiceChargeCalculator';
import ServiceChargeOverview from '@/components/service-charges/ServiceChargeOverview';
import ServiceChargeExpenses from '@/components/service-charges/ServiceChargeExpenses';
import { OperatingExpense, ReserveFundRate } from '@/types/expenses';

const ServiceCharges: React.FC = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Sample data - zone definitions
  const zones = [
    { id: 'zone03', name: 'Zone 03 - Residential Area (Zaha)' },
    { id: 'zone05', name: 'Zone 05 - Residential Area (Nameer)' },
    { id: 'zone08', name: 'Zone 08 - Residential Area (Wajd)' },
    { id: 'commercial', name: 'Commercial Area' },
    { id: 'staff', name: 'Staff Accommodation' }
  ];

  // Sample properties data
  const propertiesData = [
    { id: 'Z3_050_1', name: 'Z3 050(1) - 2 Bedroom Premium Apartment', zone: 'zone03', size: 199.13, type: 'apartment', hasLift: true, typeName: 'Apartment (With Lift)' },
    { id: 'Z3_057_5', name: 'Z3 057(5) - 3 Bedroom Zaha Apartment', zone: 'zone03', size: 355.07, type: 'apartment', hasLift: true, typeName: 'Apartment (With Lift)' },
    { id: 'Z3_019', name: 'Z3 019 - 3 Bedroom Zaha Villa', zone: 'zone03', size: 357.12, type: 'villa', hasLift: false, typeName: 'Villa (Without Lift)' },
    { id: 'Z5_008', name: 'Z5 008 - 4 Bedroom Nameer Villa', zone: 'zone05', size: 497.62, type: 'villa', hasLift: false, typeName: 'Villa (Without Lift)' },
    { id: 'Z5_007', name: 'Z5 007 - 3 Bedroom Nameer Villa', zone: 'zone05', size: 426.78, type: 'villa', hasLift: false, typeName: 'Villa (Without Lift)' },
    { id: 'Z8_007', name: 'Z8 007 - 5 Bedroom Wajd Villa', zone: 'zone08', size: 750.35, type: 'villa', hasLift: false, typeName: 'Villa (Without Lift)' },
    { id: 'Z3_059_1B', name: 'Z3 059(1B) - 1 Bedroom Apartment', zone: 'zone03', size: 79.09, type: 'apartment', hasLift: true, typeName: 'Apartment (With Lift)' },
    { id: 'C_01', name: 'Commercial Unit 01', zone: 'commercial', size: 250, type: 'shop', hasLift: false, typeName: 'Commercial Space' },
    { id: 'S_01', name: 'Staff Accommodation 01', zone: 'staff', size: 85, type: 'studio', hasLift: false, typeName: 'Studio Apartment' }
  ];
  
  // Operating expense data
  const operatingExpenses: OperatingExpense[] = [
    { category: 'Facility Management', supplier: 'Kalhat', annual: 386409.72, allocation: 'All Units' },
    { category: 'STP O&M', supplier: 'OWATCO', annual: 37245.40, allocation: 'All Units' },
    { category: 'Lift Maintenance', supplier: 'KONE Assarain LLC', annual: 12127.50, allocation: 'With Lift Only' },
    { category: 'Pest Control', supplier: 'Muna Noor', annual: 16800.00, allocation: 'All Units' },
    { category: 'Chillers & BMS', supplier: 'Gulf Expert', annual: 9240.00, allocation: 'All Units' },
    { category: 'Fire Systems', supplier: 'Bahwan Engineering', annual: 8925.00, allocation: 'All Units' },
    { category: 'Water Consumption', supplier: 'Utility Provider', annual: 50000.00, allocation: 'All Units' },
    { category: 'Electricity', supplier: 'Utility Provider', annual: 35000.00, allocation: 'All Units' },
    { category: 'Other Expenses', supplier: 'Various', annual: 11252.38, allocation: 'All Units' }
  ];
  
  // Reserve fund rates by zone
  const reserveFundRates: ReserveFundRate[] = [
    { zone: 'zone03', zoneName: 'Zone 03 - Residential Area (Zaha)', rate: 0.40, effectiveDate: '2023-01-01', notes: 'Standard rate for apartments' },
    { zone: 'zone05', zoneName: 'Zone 05 - Residential Area (Nameer)', rate: 0.50, effectiveDate: '2023-01-01', notes: 'Premium villas rate' },
    { zone: 'zone08', zoneName: 'Zone 08 - Residential Area (Wajd)', rate: 0.60, effectiveDate: '2023-01-01', notes: 'Luxury villas rate' },
    { zone: 'commercial', zoneName: 'Commercial Area', rate: 0.70, effectiveDate: '2023-01-01', notes: 'Commercial properties' },
    { zone: 'staff', zoneName: 'Staff Accommodation', rate: 0.30, effectiveDate: '2023-01-01', notes: 'Reduced rate for staff' }
  ];

  return (
    <StandardPageLayout
      title="Service Charges"
      icon={<Calculator className="h-8 w-8 text-primary" />}
      description="Calculate and manage service charges for Muscat Bay properties"
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-md mb-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="calculator" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculator</span>
          </TabsTrigger>
          <TabsTrigger value="expenses" className="flex items-center gap-2">
            <FileCog className="h-4 w-4" />
            <span className="hidden sm:inline">Expenses</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ServiceChargeOverview 
            zones={zones}
            operatingExpenses={operatingExpenses}
            reserveFundRates={reserveFundRates}
            properties={propertiesData}
          />
        </TabsContent>

        <TabsContent value="calculator" className="space-y-4">
          <ServiceChargeCalculator 
            zones={zones}
            operatingExpenses={operatingExpenses}
            reserveFundRates={reserveFundRates}
            properties={propertiesData}
          />
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <ServiceChargeExpenses 
            operatingExpenses={operatingExpenses}
            reserveFundRates={reserveFundRates}
          />
        </TabsContent>
      </Tabs>
    </StandardPageLayout>
  );
};

export default ServiceCharges;
