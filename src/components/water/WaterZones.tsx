
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ZoneMetrics, TypeConsumption, WaterConsumptionData } from '@/types/waterSystem';
import { getReadingValue } from '@/utils/waterSystemUtils';

interface WaterZonesProps {
  zoneMetrics: ZoneMetrics[];
  waterData: WaterConsumptionData[];
  selectedMonth: string;
  selectedZone: string;
  onSelectZone: (zone: string) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#66BCFE'];

const WaterZones: React.FC<WaterZonesProps> = ({
  zoneMetrics,
  waterData,
  selectedMonth,
  selectedZone,
  onSelectZone
}) => {
  // Get zone-specific data
  const zoneData = waterData.filter(item => 
    item.Zone === selectedZone && 
    (item.Label === 'L3' || item.Label === 'DC')
  );
  
  // Calculate consumption by type within the selected zone
  const typeConsumption: Record<string, number> = {};
  
  zoneData.forEach(meter => {
    if (meter.Type) {
      const consumption = getReadingValue(meter, selectedMonth);
      
      if (!typeConsumption[meter.Type]) {
        typeConsumption[meter.Type] = 0;
      }
      
      typeConsumption[meter.Type] += consumption;
    }
  });
  
  const typeConsumptionData = Object.entries(typeConsumption)
    .map(([type, consumption]) => ({
      type,
      consumption
    }))
    .sort((a, b) => b.consumption - a.consumption);
  
  // Get current zone metrics
  const currentZoneMetrics = zoneMetrics.find(zone => zone.zone === selectedZone) || {
    zone: selectedZone,
    bulkSupply: 0,
    individualMeters: 0,
    loss: 0,
    lossPercentage: 0
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Zone Performance</CardTitle>
          <CardDescription>
            Water loss by zone - click a bar to select that zone
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={zoneMetrics}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zone" />
                <YAxis yAxisId="left" label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss %', angle: 90, position: 'insideRight' }} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "lossPercentage") return [`${value.toFixed(1)}%`, 'Loss %'];
                    return [`${value.toLocaleString()} m³`, name];
                  }}
                />
                <Legend />
                <Bar 
                  dataKey="bulkSupply" 
                  name="Bulk Supply" 
                  fill="#0088FE" 
                  yAxisId="left"
                  onClick={(data) => onSelectZone(data.zone)}
                  cursor="pointer"
                />
                <Bar 
                  dataKey="individualMeters" 
                  name="Individual Meters" 
                  fill="#00C49F" 
                  yAxisId="left"
                  onClick={(data) => onSelectZone(data.zone)}
                  cursor="pointer"
                />
                <Bar 
                  dataKey="lossPercentage" 
                  name="Loss %" 
                  fill="#FF8042" 
                  yAxisId="right"
                  onClick={(data) => onSelectZone(data.zone)}
                  cursor="pointer"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Zone {selectedZone} Details</CardTitle>
            <CardDescription>
              Consumption breakdown for {selectedZone}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-700 mb-1">Bulk Supply</div>
                <div className="text-2xl font-bold">{currentZoneMetrics.bulkSupply.toLocaleString()} m³</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-700 mb-1">Individual Meters</div>
                <div className="text-2xl font-bold">{currentZoneMetrics.individualMeters.toLocaleString()} m³</div>
              </div>
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-sm text-amber-700 mb-1">Loss Volume</div>
                <div className="text-2xl font-bold">{currentZoneMetrics.loss.toLocaleString()} m³</div>
              </div>
              <div className={`p-4 rounded-lg ${
                currentZoneMetrics.lossPercentage > 15 ? 'bg-red-50' : 'bg-amber-50'
              }`}>
                <div className={`text-sm mb-1 ${
                  currentZoneMetrics.lossPercentage > 15 ? 'text-red-700' : 'text-amber-700'
                }`}>Loss Percentage</div>
                <div className="text-2xl font-bold">{currentZoneMetrics.lossPercentage.toFixed(1)}%</div>
              </div>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeConsumptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="consumption"
                    nameKey="type"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {typeConsumptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [`${value.toLocaleString()} m³`, 'Consumption']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Zone {selectedZone} Meters</CardTitle>
            <CardDescription>
              Individual water meters in {selectedZone}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted text-left text-muted-foreground text-xs">
                    <th className="p-2 whitespace-nowrap">Meter Label</th>
                    <th className="p-2 whitespace-nowrap">Type</th>
                    <th className="p-2 whitespace-nowrap">Level</th>
                    <th className="p-2 whitespace-nowrap text-right">Consumption (m³)</th>
                  </tr>
                </thead>
                <tbody>
                  {zoneData.length > 0 ? zoneData.map((meter, index) => (
                    <tr 
                      key={meter.id || index}
                      className="border-b border-gray-200 hover:bg-muted/50"
                    >
                      <td className="p-2 whitespace-nowrap">{meter['Meter Label'] || '-'}</td>
                      <td className="p-2 whitespace-nowrap">
                        <Badge variant="outline" className="font-normal">
                          {meter.Type || '-'}
                        </Badge>
                      </td>
                      <td className="p-2 whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={`font-normal ${
                            meter.Label === 'L2' ? 'bg-blue-50 text-blue-700' :
                            meter.Label === 'L3' ? 'bg-green-50 text-green-700' :
                            meter.Label === 'DC' ? 'bg-purple-50 text-purple-700' :
                            ''
                          }`}
                        >
                          {meter.Label || '-'}
                        </Badge>
                      </td>
                      <td className="p-2 whitespace-nowrap text-right">
                        {selectedMonth === 'all' ? 
                          'Multiple months' : 
                          (getReadingValue(meter, selectedMonth) || '-')}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-4 text-center text-muted-foreground">
                        No meters found for this zone
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaterZones;
