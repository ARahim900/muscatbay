
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CircleDollarSign, PackageCheck, PercentCircle, TrendingUp } from 'lucide-react';
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { waterColors } from './WaterTheme';
import EnhancedKpiCard from './EnhancedKpiCard';

interface WaterOverviewProps {
  levelMetrics: LevelMetrics;
  zoneMetrics: ZoneMetrics[];
  typeConsumption: TypeConsumption[];
  monthlyTrends: MonthlyConsumption[];
  selectedMonth: string;
}

// Define a type for the chart data
interface ChartData {
  name: string;
  value: number;
  consumption?: number;
  loss?: number;
  lossPercentage?: number;
}

const WaterOverview: React.FC<WaterOverviewProps> = ({ 
  levelMetrics,
  zoneMetrics,
  typeConsumption,
  monthlyTrends,
  selectedMonth
}) => {
  // Format monthly trends data for the area chart - fixing the date parsing issue
  const monthlyTrendData = monthlyTrends.map(trend => {
    // Extract just the month abbreviation from the month string (e.g., "Jan" from "Jan-25")
    const monthAbbr = trend.month.split('-')[0] || trend.month;
    
    return {
      month: monthAbbr,
      'Bulk Supply': trend.l1Supply || 0,
      'Consumption': trend.l3Volume || 0,
      'Loss': trend.loss || 0
    };
  });
  
  // Prepare zone data for the pie chart
  const zoneDataForChart = zoneMetrics.map(zone => ({
    name: zone.zone,
    value: zone.bulkSupply || 0,
    consumption: zone.individualMeters || 0,
    loss: zone.loss || 0,
    lossPercentage: zone.lossPercentage || 0
  }));
  
  // Prepare type consumption data for the pie chart
  const typeConsumptionData = typeConsumption.map(item => ({
    name: item.type,
    value: item.consumption || 0
  }));
  
  // Define colors for the pie chart
  const pieColors = [
    waterColors.chart.blue,
    waterColors.chart.green,
    waterColors.chart.amber,
    waterColors.chart.red,
    waterColors.chart.purple,
    waterColors.chart.teal
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Level Metrics */}
      <EnhancedKpiCard
        title="Bulk Supply (L1)"
        value={levelMetrics.l1Supply.toLocaleString()}
        valueUnit="m³"
        icon={TrendingUp}
        variant="primary"
        description="Total water supplied to the system"
      />
      
      <EnhancedKpiCard
        title="Total Consumption (L3)"
        value={levelMetrics.l3Volume.toLocaleString()}
        valueUnit="m³"
        icon={PackageCheck}
        variant="success"
        description="Total water consumed by end-users"
      />
      
      <EnhancedKpiCard
        title="Total Water Loss"
        value={levelMetrics.totalLoss.toLocaleString()}
        valueUnit="m³"
        subValue={levelMetrics.totalLossPercentage.toFixed(1)}
        subValueUnit="% of bulk supply"
        icon={PercentCircle}
        variant={levelMetrics.totalLossPercentage > 15 ? "danger" : "warning"}
      />
      
      {/* Monthly Trends Chart */}
      <Card className="col-span-2 bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Monthly Water Trends</CardTitle>
          <CardDescription>
            Trends in bulk supply, consumption, and loss over the past months
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={monthlyTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="Bulk Supply" stroke={waterColors.chart.blue} fill={waterColors.chart.blue} />
              <Area type="monotone" dataKey="Consumption" stroke={waterColors.chart.green} fill={waterColors.chart.green} />
              <Area type="monotone" dataKey="Loss" stroke={waterColors.chart.red} fill={waterColors.chart.red} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Zone Distribution Chart */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Zone Distribution</CardTitle>
          <CardDescription>
            Distribution of water supply across different zones
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                dataKey="value"
                isAnimationActive={false}
                data={zoneDataForChart}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {
                  zoneDataForChart.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))
                }
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Type Consumption Chart */}
      <Card className="bg-white shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Consumption by Type</CardTitle>
          <CardDescription>
            Distribution of water consumption by different types
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                dataKey="value"
                isAnimationActive={false}
                data={typeConsumptionData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                label
              >
                {
                  typeConsumptionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                  ))
                }
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default WaterOverview;
