
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { BarChart, FilterX, Droplets, PieChart } from 'lucide-react';
import { TypeConsumption, WaterConsumptionData } from '@/types/waterSystem';
import EnhancedKpiCard from './EnhancedKpiCard';
import WaterConsumptionChart from './WaterConsumptionChart';
import { waterColors } from './WaterTheme';
import { getReadingValue } from '@/utils/waterSystemUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface WaterTypeAnalysisProps {
  typeConsumption: TypeConsumption[];
  waterData: WaterConsumptionData[];
  selectedMonth: string;
  selectedType: string;
  onSelectType: (type: string) => void;
  types: string[];
}

const WaterTypeAnalysis: React.FC<WaterTypeAnalysisProps> = ({ 
  typeConsumption,
  waterData,
  selectedMonth,
  selectedType,
  onSelectType,
  types
}) => {
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };
  
  // Get all meters for the selected type
  const typeMeters = waterData.filter(meter => 
    meter.Type === selectedType || selectedType === 'all'
  );
  
  // Group meters by zone for the selected type
  const metersByZone: Record<string, WaterConsumptionData[]> = {};
  typeMeters.forEach(meter => {
    const zone = meter.Zone || 'Unknown';
    if (!metersByZone[zone]) {
      metersByZone[zone] = [];
    }
    metersByZone[zone].push(meter);
  });
  
  // Calculate consumption by zone for the selected type
  const zoneConsumption = Object.entries(metersByZone).map(([zone, meters]) => {
    const consumption = meters.reduce((sum, meter) => {
      return sum + getReadingValue(meter, selectedMonth);
    }, 0);
    
    return { zone, consumption };
  }).sort((a, b) => b.consumption - a.consumption);
  
  // Find the selected type's metrics
  const selectedTypeMetrics = typeConsumption.find(t => t.type === selectedType) || 
    { type: selectedType || 'All Types', consumption: 0, percentage: 0 };
  
  // Format data for charts
  const typeBarData = typeConsumption.map(item => ({
    name: item.type,
    value: item.consumption
  }));
  
  const zoneConsumptionData = zoneConsumption.map(item => ({
    name: item.zone,
    value: item.consumption
  }));
  
  // Calculate total consumption for the filter combination
  const totalConsumption = typeConsumption.reduce((sum, t) => sum + t.consumption, 0);
  const filteredConsumption = selectedType === 'all' ? 
    totalConsumption : (selectedTypeMetrics?.consumption || 0);
  
  // Determine top consumers for this type
  const topMeters = [...typeMeters]
    .sort((a, b) => 
      getReadingValue(b, selectedMonth) - getReadingValue(a, selectedMonth)
    )
    .slice(0, 5);
  
  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">Type Analysis</h2>
        
        <Select value={selectedType} onValueChange={onSelectType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select Type" />
          </SelectTrigger>
          <SelectContent>
            {types.map((type) => (
              <SelectItem key={type} value={type}>
                {type === 'all' ? 'All Types' : type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
        variants={itemVariants}
      >
        <EnhancedKpiCard
          title="Total Consumption"
          value={filteredConsumption.toLocaleString()}
          valueUnit="m³"
          icon={Droplets}
          variant="primary"
          description={selectedType === 'all' ? "All water types" : `${selectedType} consumption`}
        />
        
        <EnhancedKpiCard
          title="Percentage of Total"
          value={selectedType === 'all' ? "100" : (selectedTypeMetrics?.percentage || 0).toFixed(1)}
          valueUnit="%"
          icon={PieChart}
          variant="success"
          description="Share of total water consumption"
        />
        
        <EnhancedKpiCard
          title="Unique Meters"
          value={typeMeters.length.toString()}
          valueUnit="meters"
          icon={FilterX}
          variant="warning"
          description={`Number of ${selectedType === 'all' ? 'all' : selectedType} meters`}
        />
      </motion.div>
      
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        variants={itemVariants}
      >
        <WaterConsumptionChart
          title="Consumption by Type"
          description="Distribution of water across types"
          data={typeBarData}
          type="bar"
          horizontal={true}
        />
        
        <WaterConsumptionChart
          title="Zone Distribution"
          description={`Where ${selectedType === 'all' ? 'water' : selectedType} is consumed`}
          data={zoneConsumptionData}
          type="pie"
          colors={[
            waterColors.chart.blue,
            waterColors.chart.purple,
            waterColors.chart.green,
            waterColors.chart.amber,
            waterColors.chart.red
          ]}
        />
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Consumers</CardTitle>
            <CardDescription>
              Highest consumption meters {selectedType !== 'all' && `for ${selectedType}`}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs">
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Meter Label</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Zone</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Level</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Consumption (m³)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {topMeters.map((meter, index) => (
                    <tr 
                      key={meter.id || index}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{meter['Meter Label'] || '-'}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className="font-normal"
                        >
                          {meter.Zone || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{meter.Type || '-'}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={`font-normal ${
                            meter.Label === 'L1' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                            meter.Label === 'L2' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                            meter.Label === 'L3' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                            meter.Label === 'DC' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
                            ''
                          }`}
                        >
                          {meter.Label || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                        {getReadingValue(meter, selectedMonth).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  
                  {topMeters.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                        No meters found for the selected type
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={itemVariants}>
        <Card className="bg-white shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">All {selectedType === 'all' ? 'Types' : selectedType} Meters</CardTitle>
            <CardDescription>
              Total of {typeMeters.length} meters found
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100 dark:bg-gray-800 text-left text-xs">
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Meter Label</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Zone</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Type</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Level</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap text-right">Consumption (m³)</th>
                    <th className="px-4 py-3 font-medium text-gray-600 dark:text-gray-300 whitespace-nowrap">Parent Meter</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {typeMeters.slice(0, 10).map((meter, index) => (
                    <tr 
                      key={meter.id || index}
                      className="bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{meter['Meter Label'] || '-'}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className="font-normal"
                        >
                          {meter.Zone || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{meter.Type || '-'}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <Badge 
                          variant="outline" 
                          className={`font-normal ${
                            meter.Label === 'L1' ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300' :
                            meter.Label === 'L2' ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' :
                            meter.Label === 'L3' ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300' :
                            meter.Label === 'DC' ? 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300' :
                            ''
                          }`}
                        >
                          {meter.Label || '-'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-right font-medium">
                        {getReadingValue(meter, selectedMonth).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {meter['Parent Meter'] || '-'}
                      </td>
                    </tr>
                  ))}
                  
                  {typeMeters.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No meters found for the selected type
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {typeMeters.length > 10 && (
                <div className="px-4 py-3 text-xs font-semibold text-gray-500 border-t">
                  Showing 10 of {typeMeters.length} entries
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default WaterTypeAnalysis;
