
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircleDollarSign, Zap, BarChart2, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';

interface ElectricityOverviewProps {
  electricityData: any[];
  selectedMonth: string;
  selectedYear: string;
}

const ElectricityOverview: React.FC<ElectricityOverviewProps> = ({ 
  electricityData, 
  selectedMonth,
  selectedYear 
}) => {
  // Add logging to debug the data structure
  console.log("Raw electricity data:", electricityData);
  console.log("Selected Month/Year:", selectedMonth, selectedYear);
  
  // Process the raw data from Airtable
  const processedData = useMemo(() => {
    // Default values for empty or invalid data
    const defaultData = {
      totalConsumption: 0,
      totalCost: 0,
      averageConsumption: 0,
      maxConsumption: 0,
      maxConsumer: 'N/A',
      typeBreakdown: [],
      topConsumers: []
    };

    // Ensure electricityData is a valid array
    if (!electricityData || !Array.isArray(electricityData) || electricityData.length === 0) {
      console.log("No electricity data available");
      return defaultData;
    }

    try {
      // Log the structure of the first record to understand field names
      console.log("Sample record structure:", electricityData[0]);
      
      // Format the column name based on selected month/year
      const monthColumn = `${selectedMonth}-${selectedYear.substring(2)}`;
      console.log("Looking for column:", monthColumn);
      
      let totalConsumption = 0;
      let maxConsumption = 0;
      let maxConsumer = '';
      
      // Map for consumption by type
      const typeMap = new Map<string, number>();
      
      // Calculate totals - safely handle each record
      electricityData.forEach((record: any) => {
        if (!record) return;
        
        // Check if the monthly consumption value exists
        const consumption = record[monthColumn] !== undefined ? 
          (typeof record[monthColumn] === 'string' ? parseFloat(record[monthColumn]) : record[monthColumn]) : 0;
        
        if (!isNaN(consumption)) {
          totalConsumption += consumption;
          
          // Track max consumer
          if (consumption > maxConsumption) {
            maxConsumption = consumption;
            maxConsumer = record['Meter Label'] || 'Unknown';
          }
          
          // Aggregate by type - ensure type is a string
          const type = record['Type'] || 'Unknown';
          const currentTypeConsumption = typeMap.get(type) || 0;
          typeMap.set(type, currentTypeConsumption + consumption);
        }
      });
      
      // Calculate average
      const averageConsumption = electricityData.length > 0 ? totalConsumption / electricityData.length : 0;
      
      // Convert type map to array for charts
      const typeBreakdown = Array.from(typeMap.entries()).map(([type, consumption]) => ({
        name: type,
        value: consumption,
        color: getTypeColor(type)
      }));
      
      // Get top consumers
      const topConsumers = Array.isArray(electricityData) ? 
        [...electricityData]
          .filter(record => record && record[monthColumn] !== undefined)
          .sort((a, b) => {
            const aConsumption = a[monthColumn] !== undefined ? 
              (typeof a[monthColumn] === 'string' ? parseFloat(a[monthColumn]) : a[monthColumn]) : 0;
            const bConsumption = b[monthColumn] !== undefined ? 
              (typeof b[monthColumn] === 'string' ? parseFloat(b[monthColumn]) : b[monthColumn]) : 0;
            
            return bConsumption - aConsumption;
          })
          .slice(0, 5)
          .map(record => ({
            name: record['Meter Label'] || 'Unknown',
            type: record['Type'] || 'Unknown',
            consumption: record[monthColumn] !== undefined ? 
              (typeof record[monthColumn] === 'string' ? parseFloat(record[monthColumn]) : record[monthColumn]) : 0,
            cost: calculateCost(record[monthColumn] !== undefined ? 
              (typeof record[monthColumn] === 'string' ? parseFloat(record[monthColumn]) : record[monthColumn]) : 0)
          }))
        : [];
      
      // Estimate cost (fictional calculation)
      const totalCost = calculateCost(totalConsumption);
      
      return {
        totalConsumption,
        totalCost,
        averageConsumption,
        maxConsumption,
        maxConsumer,
        typeBreakdown,
        topConsumers
      };
    } catch (error) {
      console.error("Error processing electricity data:", error);
      return defaultData; // Return default data structure in case of errors
    }
  }, [electricityData, selectedMonth, selectedYear]);

  // Calculate cost (fictional calculation - 0.025 OMR per kWh)
  const calculateCost = (consumption: number): number => {
    return consumption * 0.025;
  };

  // Function to get type color
  const getTypeColor = (type: string): string => {
    const typeColors: { [key: string]: string } = {
      'Retail': '#3b82f6',  // blue
      'Residential (Villa)': '#10b981', // green
      'Residential (Apart)': '#f59e0b', // amber
      'IRR_Services': '#ef4444', // red
      'MB_Common': '#8b5cf6', // purple
      'Building': '#0ea5e9', // light blue
      'D_Building_Common': '#6366f1' // indigo
    };
    
    return typeColors[type] || '#64748b'; // default color
  };

  return (
    <div className="space-y-8">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/20 dark:to-amber-900/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <Zap className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-amber-600 dark:text-amber-400">Total Consumption</p>
                <h3 className="text-2xl font-bold">{Math.round(processedData.totalConsumption).toLocaleString()} kWh</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                <CircleDollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-green-600 dark:text-green-400">Total Cost</p>
                <h3 className="text-2xl font-bold">{processedData.totalCost.toFixed(2).toLocaleString()} OMR</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <BarChart2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Average Consumption</p>
                <h3 className="text-2xl font-bold">{Math.round(processedData.averageConsumption).toLocaleString()} kWh</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/10 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Highest Consumer</p>
                <h3 className="text-lg font-bold">{processedData.maxConsumer}</h3>
                <p className="text-xs">{Math.round(processedData.maxConsumption).toLocaleString()} kWh</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Type Distribution */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Consumption by Type</CardTitle>
          <CardDescription>Distribution of electricity consumption by type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {processedData.typeBreakdown && processedData.typeBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={processedData.typeBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {processedData.typeBreakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => `${Math.round(value).toLocaleString()} kWh`} 
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
                <p className="text-gray-500">No data available for the selected month</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Top Consumers */}
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Top Consumers</CardTitle>
          <CardDescription>Facilities with highest electricity consumption</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Consumption (kWh)</TableHead>
                <TableHead className="text-right">Cost (OMR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedData.topConsumers && processedData.topConsumers.length > 0 ? (
                processedData.topConsumers.map((consumer: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{consumer.name}</TableCell>
                    <TableCell>{consumer.type}</TableCell>
                    <TableCell className="text-right">{Math.round(consumer.consumption).toLocaleString()}</TableCell>
                    <TableCell className="text-right">{consumer.cost.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-4">No consumption data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default ElectricityOverview;
