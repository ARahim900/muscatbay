import React from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WaterSystemMetrics, ZoneData, TypeData } from '@/types/water';
import { formatNumber } from '@/lib/utils';
import { 
  Droplets, 
  BarChart3, 
  ArrowRight, 
  CircleDollarSign, 
  ArrowUpRight 
} from 'lucide-react';

// Use a color that is defined in your theme
const themeColor = "primary";

const Water: React.FC = () => {
  // Mock data for water system metrics
  const waterMetrics: WaterSystemMetrics = {
    totalConsumption: 48234,
    totalLoss: 2865,
    efficiency: 94.07,
    averageDailyUsage: 1608,
    waterRate: 0.3,
    monthlyCost: 14470
  };

  // Mock data for zone-wise consumption
  const zoneData: ZoneData[] = [
    { name: 'Residential', consumption: 28940, loss: 1736, percentage: 60 },
    { name: 'Commercial', consumption: 12450, loss: 747, percentage: 25 },
    { name: 'Common Areas', consumption: 6844, loss: 382, percentage: 15 }
  ];

  // Mock data for type-wise consumption (example: usage types)
  const typeData: TypeData[] = [
    { name: 'Irrigation', value: 15000, percentage: 31 },
    { name: 'Domestic', value: 25000, percentage: 52 },
    { name: 'Industrial', value: 8234, percentage: 17 }
  ];
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2">Water Management</h1>
      <p className="text-muted-foreground mb-6">
        Track and optimize water consumption across different zones and types
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(waterMetrics.totalConsumption)} m³</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Droplets className="h-4 w-4 inline-block mr-1" />
              {formatNumber(waterMetrics.averageDailyUsage)} m³ daily average
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Water Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(waterMetrics.totalLoss)} m³</div>
            <p className="text-xs text-muted-foreground mt-1">
              {((waterMetrics.totalLoss / waterMetrics.totalConsumption) * 100).toFixed(1)}% of total consumption
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(waterMetrics.monthlyCost)} OMR</div>
            <p className="text-xs text-muted-foreground mt-1">
              <CircleDollarSign className="h-4 w-4 inline-block mr-1" />
              {formatNumber(waterMetrics.waterRate)} OMR per m³
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="zones" className="w-full">
        <TabsList>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="types">Types</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>
        
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Consumption by Zone</CardTitle>
              <CardDescription>
                Water usage distribution across different zones
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-none pl-0">
                {zoneData.map((zone) => (
                  <li key={zone.name} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 mr-2 text-muted-foreground" />
                      {zone.name}
                    </div>
                    <div className="font-medium">
                      {formatNumber(zone.consumption)} m³ ({zone.percentage}%)
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Consumption by Type</CardTitle>
              <CardDescription>
                Water usage distribution by different types of consumption
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-none pl-0">
                {typeData.map((type) => (
                  <li key={type.name} className="flex items-center justify-between py-2">
                    <div className="flex items-center">
                      <Droplets className="h-4 w-4 mr-2 text-muted-foreground" />
                      {type.name}
                    </div>
                    <div className="font-medium">
                      {formatNumber(type.value)} m³ ({type.percentage}%)
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>System Performance</CardTitle>
              <CardDescription>
                Overall water system efficiency and key metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Efficiency</p>
                  <div className="text-2xl font-bold">
                    {formatNumber(waterMetrics.efficiency)}%
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Water Rate</p>
                  <div className="text-2xl font-bold">
                    {formatNumber(waterMetrics.waterRate)} OMR/m³
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Water;
