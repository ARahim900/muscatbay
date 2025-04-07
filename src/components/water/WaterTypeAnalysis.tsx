
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { FlaskConical, PercentCircle, TrendingUp, Droplet } from 'lucide-react';
import { TypeConsumption, WaterConsumptionData } from '@/types/waterSystem';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell, PieChart, Pie } from 'recharts';
import EnhancedPieChart from '@/components/ui/enhanced-pie-chart';
import { waterColors } from './WaterTheme';
import { motion } from 'framer-motion';
import { getReadingValue } from '@/utils/waterSystemUtils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import EnhancedKpiCard from './EnhancedKpiCard';

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
  const [chartView, setChartView] = useState<'pie' | 'bar'>('pie');
  
  const getTypeColor = (typeName: string, index: number): string => {
    const typeColors: {[key: string]: string} = {
      'Retail': waterColors.chart.blue,
      'Residential (Villa)': waterColors.chart.green,
      'Residential (Apart)': waterColors.chart.amber,
      'IRR_Servies': waterColors.chart.red,
      'MB_Common': waterColors.chart.purple,
      'Zone Bulk': waterColors.chart.teal,
      'Building': waterColors.chart.lightBlue,
      'D_Building_Common': waterColors.chart.indigo
    };
    
    const colorArray = [
      waterColors.chart.blue,
      waterColors.chart.green,
      waterColors.chart.amber,
      waterColors.chart.red,
      waterColors.chart.purple,
      waterColors.chart.teal,
      waterColors.chart.lightBlue,
      waterColors.chart.indigo
    ];
    
    return typeColors[typeName] || colorArray[index % colorArray.length];
  };
  
  const typeDataForChart = typeConsumption
    .filter(item => item.consumption > 0)
    .map((item, index) => ({
      name: item.type,
      value: item.consumption,
      percentage: item.percentage,
      color: getTypeColor(item.type, index)
    }));
  
  // Get data for the selected type
  const typeMeters = selectedType !== 'all'
    ? waterData.filter(meter => meter.Type === selectedType && (meter.Label === 'L3' || meter.Label === 'DC'))
    : [];
  
  const typeTotal = typeConsumption.find(t => t.type === selectedType)?.consumption || 0;
  const typePercentage = typeConsumption.find(t => t.type === selectedType)?.percentage || 0;
  
  // Calculate active meters count
  const activeMeterCount = typeMeters.filter(meter => 
    selectedMonth === 'all' || getReadingValue(meter, selectedMonth) > 0
  ).length;
  
  // Calculate average consumption per meter
  const avgConsumption = activeMeterCount > 0 
    ? typeTotal / activeMeterCount 
    : 0;
  
  // Prepare meters data for bar chart
  const metersData = typeMeters
    .map(meter => ({
      name: meter['Meter Label'] || `Meter ${meter['Acct #']}`,
      value: selectedMonth === 'all' 
        ? Object.keys(meter)
            .filter(key => /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)-\d{2}$/.test(key))
            .reduce((sum, month) => sum + getReadingValue(meter, month), 0) / 12 // Average monthly consumption
        : getReadingValue(meter, selectedMonth),
      zone: meter.Zone || 'Unknown'
    }))
    .filter(item => item.value > 0)
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 meters
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.3 }
    }
  };
  
  return (
    <motion.div 
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      {/* Type selection and overall statistics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-indigo-500" />
            Water Consumption by Type
          </h2>
          <p className="text-muted-foreground">
            Analysis of water consumption patterns across different usage types
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={selectedType} onValueChange={onSelectType}>
            <SelectTrigger className="w-[200px] bg-white shadow-sm">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type) => (
                <SelectItem key={type} value={type} className="cursor-pointer">
                  {type === 'all' ? 'All Types' : type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex rounded-md overflow-hidden border shadow-sm">
            <button
              className={`px-3 py-2 text-sm font-medium ${
                chartView === 'pie' 
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300'
              }`}
              onClick={() => setChartView('pie')}
            >
              Pie Chart
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium ${
                chartView === 'bar' 
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300'
              }`}
              onClick={() => setChartView('bar')}
            >
              Bar Chart
            </button>
          </div>
        </div>
      </div>
      
      {/* Type statistics cards */}
      {selectedType !== 'all' && (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
          variants={itemVariants}
        >
          <EnhancedKpiCard
            title={`Total ${selectedType} Consumption`}
            value={typeTotal.toLocaleString()}
            valueUnit="m³"
            icon={Droplet}
            variant="primary"
            className="shadow-md border-0 bg-white"
          />
          
          <EnhancedKpiCard
            title="Percentage of Total"
            value={typePercentage.toFixed(1)}
            valueUnit="%"
            icon={PercentCircle}
            variant="secondary"
            className="shadow-md border-0 bg-white"
          />
          
          <EnhancedKpiCard
            title="Active Meters"
            value={activeMeterCount}
            icon={FlaskConical}
            variant="success"
            className="shadow-md border-0 bg-white"
          />
          
          <EnhancedKpiCard
            title="Avg. Consumption per Meter"
            value={avgConsumption.toLocaleString(undefined, { maximumFractionDigits: 1 })}
            valueUnit="m³"
            icon={TrendingUp}
            variant="warning"
            className="shadow-md border-0 bg-white"
          />
        </motion.div>
      )}
      
      {/* Charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-md border-0 rounded-xl">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-100 dark:from-indigo-900/20 dark:to-purple-800/20 border-b pb-4">
              <CardTitle className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">
                Consumption Distribution by Type
              </CardTitle>
              <CardDescription className="text-indigo-600/70 dark:text-indigo-400/70">
                {selectedMonth === 'all' 
                  ? 'Average monthly distribution across all types' 
                  : `Distribution for ${selectedMonth} across all types`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {typeDataForChart.length > 0 ? (
                chartView === 'pie' ? (
                  <EnhancedPieChart
                    data={typeDataForChart}
                    innerRadius={60}
                    outerRadius={130}
                    className="h-[380px] w-full"
                    showLegend
                    valueFormatter={(value) => `${value.toLocaleString()} m³`}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart
                      data={typeDataForChart}
                      margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis 
                        type="number"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                      />
                      <YAxis 
                        type="category"
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 12 }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        width={150}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`${value.toLocaleString()} m³`, 'Consumption']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                          borderRadius: '8px', 
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', 
                          border: '1px solid #e2e8f0' 
                        }}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Consumption (m³)">
                        {typeDataForChart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )
              ) : (
                <div className="h-[380px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">No consumption data available for the selected month</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-md border-0 rounded-xl">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/20 border-b pb-4">
              <CardTitle className="text-lg font-semibold text-blue-800 dark:text-blue-300">
                {selectedType === 'all' ? 'Top Consumers Across All Types' : `Top ${selectedType} Consumers`}
              </CardTitle>
              <CardDescription className="text-blue-600/70 dark:text-blue-400/70">
                {selectedMonth === 'all' 
                  ? 'Average monthly consumption for top meters' 
                  : `Top consumers for ${selectedMonth}`}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {metersData.length > 0 ? (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart
                    data={metersData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis 
                      dataKey="name"
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fill: '#64748b', fontSize: 12 }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickFormatter={(value) => `${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      formatter={(value: any) => [`${value.toLocaleString()} m³`, 'Consumption']}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        borderRadius: '8px', 
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', 
                        border: '1px solid #e2e8f0' 
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="value" 
                      name="Consumption (m³)" 
                      fill={waterColors.chart.blue}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[380px] flex items-center justify-center bg-gray-50 rounded-lg">
                  <p className="text-gray-500">
                    {selectedType === 'all' 
                      ? 'No consumption data available for any type' 
                      : `No ${selectedType} consumption data available`}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default WaterTypeAnalysis;
