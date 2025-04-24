
import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  WaterSystemMetrics, 
  ZoneData, 
  TypeData 
} from '@/types/water';
import { formatNumber } from '@/lib/utils';

// Import color theme configuration if it exists
import { themeConfig } from '@/lib/theme-config';

// Mock data for the page
const waterMetrics: WaterSystemMetrics = {
  totalConsumption: 48234,
  totalLoss: 2511,
  efficiency: 94.8,
  averageDailyUsage: 1608,
  waterRate: 2.5,
  monthlyCost: 4250
};

const zoneData: ZoneData[] = [
  { name: 'Zone A', consumption: 12543, loss: 780, percentage: 26 },
  { name: 'Zone B', consumption: 18320, loss: 1150, percentage: 38 },
  { name: 'Zone C', consumption: 9871, loss: 401, percentage: 20.5 },
  { name: 'Zone D', consumption: 7500, loss: 180, percentage: 15.5 }
];

const typeData: TypeData[] = [
  { name: 'Residential', value: 23100, percentage: 47.9 },
  { name: 'Commercial', value: 14500, percentage: 30.1 },
  { name: 'Landscape', value: 8400, percentage: 17.4 },
  { name: 'Common Areas', value: 2234, percentage: 4.6 }
];

// Define colors to use in the UI
const colors = {
  primary: '#0077cc',
  teal: '#14b8a6',
  lavender: '#8b5cf6',
  gold: '#f59e0b',
};

const WaterPage: React.FC = () => {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Water System</h1>
          <p className="text-muted-foreground">
            Monitor and manage water consumption and efficiency
          </p>
        </div>
        <div className="flex items-center mt-4 md:mt-0">
          <select 
            className="border rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            defaultValue="feb-2023"
          >
            <option value="jan-2023">January 2023</option>
            <option value="feb-2023">February 2023</option>
            <option value="mar-2023">March 2023</option>
          </select>
        </div>
      </div>

      {/* Key metrics section */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Total Consumption</CardTitle>
            <CardDescription>Monthly water usage across all zones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(waterMetrics.totalConsumption)} m³</div>
            <p className="text-sm text-muted-foreground mt-2">
              Average daily: {formatNumber(waterMetrics.averageDailyUsage)} m³
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">System Efficiency</CardTitle>
            <CardDescription>Water delivered vs water lost</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(waterMetrics.efficiency, 1)}%</div>
            <p className="text-sm text-muted-foreground mt-2">
              Total loss: {formatNumber(waterMetrics.totalLoss)} m³
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Water Cost</CardTitle>
            <CardDescription>Total monthly expenditure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatNumber(waterMetrics.monthlyCost)} OMR</div>
            <p className="text-sm text-muted-foreground mt-2">
              Rate: {waterMetrics.waterRate} OMR/m³
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Zones section */}
      <Card>
        <CardHeader>
          <CardTitle>Consumption by Zone</CardTitle>
          <CardDescription>
            Distribution of water usage across different zones
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {zoneData.map((zone) => (
              <div key={zone.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{zone.name}</div>
                  <div>{formatNumber(zone.consumption)} m³</div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${zone.percentage}%`, 
                      backgroundColor: colors.primary 
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(zone.percentage, 1)}% of total • Loss: {formatNumber(zone.loss)} m³
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Types section */}
      <Card>
        <CardHeader>
          <CardTitle>Consumption by Type</CardTitle>
          <CardDescription>
            Water usage breakdown by property type
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            {typeData.map((type, index) => (
              <div key={type.name} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="font-medium">{type.name}</div>
                  <div>{formatNumber(type.value)} m³</div>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full" 
                    style={{ 
                      width: `${type.percentage}%`,
                      backgroundColor: index === 0 ? colors.teal : 
                                       index === 1 ? colors.lavender :
                                       index === 2 ? colors.gold : 
                                       colors.primary
                    }}
                  />
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(type.percentage, 1)}% of total
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterPage;
