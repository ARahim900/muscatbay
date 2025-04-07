
import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircleDollarSign, Droplet, BarChart2, TrendingUp, PercentCircle } from 'lucide-react';
import { LevelMetrics, ZoneMetrics, TypeConsumption, MonthlyConsumption } from '@/types/waterSystem';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend,
  Pie,
  PieChart,
  Cell,
  Sector
} from 'recharts';
import { waterColors } from './WaterTheme';
import EnhancedKpiCard from './EnhancedKpiCard';
import EnhancedPieChart from '@/components/ui/enhanced-pie-chart';

interface WaterOverviewProps {
  levelMetrics: LevelMetrics;
  zoneMetrics: ZoneMetrics[];
  typeConsumption: TypeConsumption[];
  monthlyTrends: MonthlyConsumption[];
  selectedMonth: string;
}

const WaterOverview: React.FC<WaterOverviewProps> = ({ 
  levelMetrics,
  zoneMetrics,
  typeConsumption,
  monthlyTrends,
  selectedMonth
}) => {
  // Format monthly trends data for the area chart - fixing the date parsing issue
  const monthlyTrendData = useMemo(() => {
    return monthlyTrends.map(trend => {
      // Extract just the month abbreviation from the month string (e.g., "Jan" from "Jan-25")
      const monthAbbr = trend.month.split('-')[0] || trend.month;
      
      return {
        month: monthAbbr,
        'Bulk Supply': trend.l1Supply || 0,
        'Consumption': trend.l3Volume || 0,
        'Loss': trend.loss || 0
      };
    });
  }, [monthlyTrends]);
  
  // Prepare zone data for the pie chart
  const zoneDataForChart = useMemo(() => {
    return zoneMetrics
      .filter(zone => zone.bulkSupply > 0) // Filter out zones with zero supply
      .map(zone => ({
        name: zone.zone,
        value: zone.bulkSupply || 0,
        color: getZoneColor(zone.zone)
      }));
  }, [zoneMetrics]);
  
  // Prepare type consumption data for the pie chart
  const typeConsumptionData = useMemo(() => {
    return typeConsumption
      .filter(item => item.consumption > 0) // Filter out types with zero consumption
      .map(item => ({
        name: item.type,
        value: item.consumption || 0,
        color: getTypeColor(item.type, typeConsumption.indexOf(item))
      }));
  }, [typeConsumption]);
  
  // Function to get zone color
  function getZoneColor(zoneName: string): string {
    const zoneColors: {[key: string]: string} = {
      'Zone_01_(FM)': waterColors.chart.green,
      'Zone_03_(A)': waterColors.chart.teal,
      'Zone_03_(B)': waterColors.chart.amber,
      'Zone_05': waterColors.chart.blue,
      'Zone_08': waterColors.chart.red,
      'Zone_SC': waterColors.chart.purple,
      'Zone_VS': waterColors.chart.indigo,
      'Direct Connection': waterColors.chart.lightBlue,
      'Main Bulk': waterColors.chart.blue
    };
    
    return zoneColors[zoneName] || waterColors.chart.blue;
  }
  
  // Function to get type color
  function getTypeColor(typeName: string, index: number): string {
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
  }
  
  const hasData = levelMetrics.l1Supply > 0 || levelMetrics.l2Volume > 0 || levelMetrics.l3Volume > 0;
  
  // Custom tooltip formatter for the area chart
  const tooltipFormatter = (value: number) => {
    return `${value.toLocaleString()} m³`;
  };
  
  return (
    <div className="space-y-8">
      {/* Level Metrics - Enhanced cards with more elegant styling */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <EnhancedKpiCard
          title="Bulk Supply (L1)"
          value={levelMetrics.l1Supply.toLocaleString()}
          valueUnit="m³"
          icon={Droplet}
          variant="primary"
          description="Total water supplied to the system"
          className="transform transition-all duration-300 hover:shadow-lg"
        />
        
        <EnhancedKpiCard
          title="Zone Distribution (L2)"
          value={levelMetrics.l2Volume.toLocaleString()}
          valueUnit="m³"
          icon={BarChart2}
          variant="secondary"
          description="Water distributed to zones"
          className="transform transition-all duration-300 hover:shadow-lg"
        />
        
        <EnhancedKpiCard
          title="Total Consumption (L3)"
          value={levelMetrics.l3Volume.toLocaleString()}
          valueUnit="m³"
          icon={CircleDollarSign}
          variant="success"
          description="Total water consumed by end-users"
          className="transform transition-all duration-300 hover:shadow-lg"
        />
        
        <EnhancedKpiCard
          title="Total Water Loss"
          value={levelMetrics.totalLoss.toLocaleString()}
          valueUnit="m³"
          subValue={levelMetrics.totalLossPercentage.toFixed(1)}
          subValueUnit="% of bulk supply"
          icon={PercentCircle}
          variant={levelMetrics.totalLossPercentage > 20 ? "danger" : 
                  levelMetrics.totalLossPercentage > 15 ? "warning" : "neutral"}
          className="transform transition-all duration-300 hover:shadow-lg"
        />
      </div>
      
      {/* Monthly Trends Chart */}
      <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-md border-0 rounded-xl">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-b pb-4">
          <CardTitle className="text-lg font-semibold text-blue-800 dark:text-blue-300">Monthly Water Trends</CardTitle>
          <CardDescription className="text-blue-600/70 dark:text-blue-400/70">
            Trends in bulk supply, consumption, and loss over time
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {hasData ? (
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart 
                data={monthlyTrendData}
                margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
              >
                <defs>
                  <linearGradient id="colorBulkSupply" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={waterColors.chart.blue} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={waterColors.chart.blue} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={waterColors.chart.green} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={waterColors.chart.green} stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={waterColors.chart.red} stopOpacity={0.8}/>
                    <stop offset="95%" stopColor={waterColors.chart.red} stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fill: '#64748b', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(value) => value === 0 ? '0' : `${(value / 1000).toFixed(1)}k`}
                />
                <Tooltip 
                  formatter={tooltipFormatter}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', border: '1px solid #e2e8f0' }}
                  labelStyle={{ fontWeight: 'bold', color: '#334155', marginBottom: '5px', borderBottom: '1px solid #e2e8f0', paddingBottom: '4px' }}
                />
                <Legend 
                  verticalAlign="top" 
                  height={36}
                  wrapperStyle={{ paddingTop: '20px', fontSize: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Bulk Supply" 
                  stroke={waterColors.chart.blue} 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorBulkSupply)" 
                  activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Consumption" 
                  stroke={waterColors.chart.green} 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorConsumption)" 
                  activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="Loss" 
                  stroke={waterColors.chart.red} 
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorLoss)" 
                  activeDot={{ r: 6, strokeWidth: 1, stroke: '#fff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[350px] flex items-center justify-center bg-gray-50 rounded-lg">
              <p className="text-gray-500">No data available for the selected month</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Zone Distribution Chart */}
        <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-md border-0 rounded-xl">
          <CardHeader className="bg-gradient-to-r from-green-50 to-teal-100 dark:from-green-900/20 dark:to-teal-800/20 border-b pb-4">
            <CardTitle className="text-lg font-semibold text-teal-800 dark:text-teal-300">Zone Distribution</CardTitle>
            <CardDescription className="text-teal-600/70 dark:text-teal-400/70">
              Distribution of water supply across different zones
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {hasData && zoneDataForChart.length > 0 ? (
              <EnhancedPieChart
                data={zoneDataForChart}
                innerRadius={0}
                outerRadius={130}
                className="h-[380px] w-full"
                showLegend
                valueFormatter={(value) => `${value.toLocaleString()} m³`}
                tooltipFormatter={(value, name) => (
                  <div className="text-sm">
                    <div className="font-medium">{name}</div>
                    <div>{value.toLocaleString()} m³</div>
                    <div className="text-xs text-gray-500">
                      {((value / levelMetrics.l1Supply) * 100).toFixed(1)}% of total supply
                    </div>
                  </div>
                )}
              />
            ) : (
              <div className="h-[380px] flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">No zone data available for the selected month</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Type Consumption Chart */}
        <Card className="overflow-hidden bg-white dark:bg-gray-800 shadow-md border-0 rounded-xl">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-100 dark:from-purple-900/20 dark:to-indigo-800/20 border-b pb-4">
            <CardTitle className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">Consumption by Type</CardTitle>
            <CardDescription className="text-indigo-600/70 dark:text-indigo-400/70">
              Distribution of water consumption by different types
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {hasData && typeConsumptionData.length > 0 ? (
              <EnhancedPieChart
                data={typeConsumptionData}
                innerRadius={0}
                outerRadius={130}
                className="h-[380px] w-full"
                showLegend
                valueFormatter={(value) => `${value.toLocaleString()} m³`}
                tooltipFormatter={(value, name) => (
                  <div className="text-sm">
                    <div className="font-medium">{name}</div>
                    <div>{value.toLocaleString()} m³</div>
                    <div className="text-xs text-gray-500">
                      {((value / levelMetrics.l3Volume) * 100).toFixed(1)}% of total consumption
                    </div>
                  </div>
                )}
              />
            ) : (
              <div className="h-[380px] flex items-center justify-center bg-gray-50 rounded-lg">
                <p className="text-gray-500">No type data available for the selected month</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WaterOverview;
