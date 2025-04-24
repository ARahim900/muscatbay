
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { getRandomColor, fetchElectricityData, safeParseNumber } from '@/services/electricityService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#FF6B6B'];

const ElectricitySystem = () => {
  const [electricityData, setElectricityData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const loadElectricityData = async () => {
      try {
        setLoading(true);
        const data = await fetchElectricityData();
        setElectricityData(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load electricity data');
        setLoading(false);
      }
    };
    
    loadElectricityData();
  }, []);
  
  if (loading) {
    return <div>Loading electricity system data...</div>;
  }
  
  if (error) {
    return <div className="text-red-500">{error}</div>;
  }
  
  // Calculate totals
  const totalConsumption = electricityData.reduce((sum, item) => 
    sum + safeParseNumber(item.consumption), 0
  );
  
  const totalCost = electricityData.reduce((sum, item) => 
    sum + safeParseNumber(item.cost), 0
  );
  
  // Prepare data for charts
  const consumptionData = electricityData.map((item) => ({
    name: item.zone,
    value: safeParseNumber(item.consumption),
    color: getRandomColor()
  }));
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Electricity System Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Consumption
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumption.toLocaleString()} kWh</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly usage
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Cost
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCost.toLocaleString()} OMR</div>
            <p className="text-xs text-muted-foreground mt-1">
              Monthly electricity bill
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Daily Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(totalConsumption / 30).toFixed(0)} kWh
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per day (approx.)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cost per kWh
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {totalConsumption > 0 ? (totalCost / totalConsumption).toFixed(3) : '0.000'} OMR
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average rate
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zones</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Consumption by Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={consumptionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {consumptionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} kWh`, 'Consumption']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cost by Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={electricityData.map((item) => ({
                          name: item.zone,
                          value: safeParseNumber(item.cost),
                          color: getRandomColor()
                        }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {electricityData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} OMR`, 'Cost']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="zones">
          <Card>
            <CardHeader>
              <CardTitle>Zone Consumption Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Zone</th>
                      <th className="text-right p-2">Consumption (kWh)</th>
                      <th className="text-right p-2">Cost (OMR)</th>
                      <th className="text-right p-2">% of Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {electricityData.map((zone, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2">{zone.zone}</td>
                        <td className="text-right p-2">{safeParseNumber(zone.consumption).toLocaleString()}</td>
                        <td className="text-right p-2">{safeParseNumber(zone.cost).toLocaleString()}</td>
                        <td className="text-right p-2">
                          {totalConsumption > 0
                            ? ((safeParseNumber(zone.consumption) / totalConsumption) * 100).toFixed(1)
                            : '0.0'}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Trends Coming Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Historical trend data will be available in the next update.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ElectricitySystem;
