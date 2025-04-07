
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Droplets, AlertCircle, TrendingDown, PieChart as PieChartIcon } from 'lucide-react';
import { LevelMetrics, ZoneMetrics, TypeConsumption, MonthlyConsumption, WaterConsumptionData } from '@/types/waterSystem';
import WaterKpiCard from './WaterKpiCard';

interface WaterOverviewProps {
  levelMetrics: LevelMetrics;
  zoneMetrics: ZoneMetrics[];
  typeConsumption: TypeConsumption[];
  monthlyTrends: MonthlyConsumption[];
  selectedMonth: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#66BCFE'];

const WaterOverview: React.FC<WaterOverviewProps> = ({
  levelMetrics,
  zoneMetrics,
  typeConsumption,
  monthlyTrends,
  selectedMonth
}) => {
  const displayMonth = selectedMonth === 'all' ? 'All Months' : selectedMonth;
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <WaterKpiCard
          title="Total Consumption"
          value={`${levelMetrics.l3Volume.toLocaleString()} m³`}
          description={selectedMonth === 'all' ? 'Across All Months' : selectedMonth}
          icon={Droplets}
          color="primary"
        />
        
        <WaterKpiCard
          title="Total Loss (NRW)"
          value={`${levelMetrics.totalLoss.toLocaleString()} m³`}
          description={`${levelMetrics.totalLossPercentage.toFixed(1)}% of supply`}
          icon={AlertCircle}
          color={levelMetrics.totalLossPercentage > 15 ? "danger" : "warning"}
        />
        
        <WaterKpiCard
          title="Stage 1 Loss"
          value={`${levelMetrics.stage1Loss.toLocaleString()} m³`}
          description={`${levelMetrics.stage1LossPercentage.toFixed(1)}% of L1 supply`}
          icon={TrendingDown}
          color={levelMetrics.stage1LossPercentage > 10 ? "danger" : "warning"}
        />
        
        <WaterKpiCard
          title="Stage 2 Loss"
          value={`${levelMetrics.stage2Loss.toLocaleString()} m³`}
          description={`${levelMetrics.stage2LossPercentage.toFixed(1)}% of L2 volume`}
          icon={TrendingDown}
          color={levelMetrics.stage2LossPercentage > 10 ? "danger" : "warning"}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Water Consumption by Type</CardTitle>
            <CardDescription>
              Distribution of consumption across usage types
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeConsumption}
                    cx="50%"
                    cy="50%"
                    labelLine={true}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="consumption"
                    nameKey="type"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {typeConsumption.map((entry, index) => (
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
            <CardTitle>Zone Loss Analysis</CardTitle>
            <CardDescription>
              Water loss percentage by zone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={zoneMetrics}
                  layout="vertical"
                  margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" label={{ value: 'Loss %', position: 'insideBottom', offset: -5 }} />
                  <YAxis dataKey="zone" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "lossPercentage") return [`${value.toFixed(1)}%`, 'Loss Percentage'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="lossPercentage" 
                    name="Loss %" 
                    fill="#FF8042" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {monthlyTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Water Consumption & Loss Trends</CardTitle>
            <CardDescription>
              Monthly trends in consumption and losses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrends}
                  margin={{ top: 10, right: 30, left: 0, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="month" 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                  />
                  <YAxis yAxisId="left" label={{ value: 'm³', angle: -90, position: 'insideLeft' }} />
                  <YAxis yAxisId="right" orientation="right" label={{ value: 'Loss %', angle: 90, position: 'insideRight' }} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === "lossPercentage") return [`${value.toFixed(1)}%`, 'Loss %'];
                      return [`${value.toLocaleString()} m³`, name];
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="l1Supply" 
                    name="L1 Supply" 
                    stroke="#8884d8" 
                    fill="#8884d8" 
                    fillOpacity={0.2} 
                    yAxisId="left"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="l3Volume" 
                    name="L3 Consumption" 
                    stroke="#00C49F" 
                    fill="#00C49F" 
                    fillOpacity={0.2} 
                    yAxisId="left"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="loss" 
                    name="Loss Volume" 
                    stroke="#FF8042" 
                    fill="#FF8042" 
                    fillOpacity={0.2} 
                    yAxisId="left"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="lossPercentage" 
                    name="Loss %" 
                    stroke="#FF0000" 
                    fill="#FF0000" 
                    fillOpacity={0.2} 
                    yAxisId="right"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WaterOverview;
