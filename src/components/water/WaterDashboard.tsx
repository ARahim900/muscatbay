
import React from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  Droplet, AlertTriangle, TrendingUp, Activity, ArrowRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface WaterDashboardProps {
  summary: any;
  consumptionData: any[];
  waterLossData: any[];
  alerts: any[];
  formatNumber: (num: number) => string;
  formatTimestamp: (timestamp: Date) => string;
  getSeverityColor: (severity: string) => string;
  getChangeColor: (percent: number) => string;
  navigateTo: (view: string) => void;
}

export const WaterDashboard: React.FC<WaterDashboardProps> = ({
  summary,
  consumptionData,
  waterLossData,
  alerts,
  formatNumber,
  formatTimestamp,
  getSeverityColor,
  getChangeColor,
  navigateTo
}) => {
  const latestConsumptionData = consumptionData.length > 0 ? consumptionData[consumptionData.length - 1] : null;
  
  return (
    <>
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Consumption</p>
                <h3 className="text-2xl font-bold mt-2 text-[#4E4456]">{formatNumber(summary.totalConsumption)} m³</h3>
              </div>
              <div className="p-3 rounded-lg bg-[#4E4456]/10">
                <Droplet className="h-5 w-5 text-[#4E4456]" />
              </div>
            </div>
            <div className={`mt-3 text-sm ${getChangeColor(summary.changePercent)}`}>
              {summary.changePercent > 0 ? '↑' : '↓'} {Math.abs(summary.changePercent).toFixed(1)}% from previous month
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Water Loss Rate</p>
                <h3 className="text-2xl font-bold mt-2 bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent">{summary.averageLoss.toFixed(1)}%</h3>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-red-100 to-orange-100">
                <AlertTriangle className="h-5 w-5 text-red-500" />
              </div>
            </div>
            <div className="mt-3 text-sm text-red-600">
              Above target threshold (45%)
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Meters</p>
                <h3 className="text-2xl font-bold mt-2 bg-gradient-to-r from-green-600 to-teal-500 bg-clip-text text-transparent">{summary.activeMeters}</h3>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-100 to-teal-100">
                <Activity className="h-5 w-5 text-green-500" />
              </div>
            </div>
            <div className="mt-3 text-sm text-gray-600">
              {summary.inactiveMeters} inactive/maintenance
            </div>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-gray-500">Active Alerts</p>
                <h3 className="text-2xl font-bold mt-2 bg-gradient-to-r from-amber-600 to-yellow-500 bg-clip-text text-transparent">{summary.alertCount}</h3>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-amber-100 to-yellow-100">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
            </div>
            <div className="mt-3 text-sm text-amber-600">
              {alerts.filter(a => a.severity === 'high' || a.severity === 'critical').length} high priority
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Dashboard Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <Activity className="h-5 w-5 mr-2 text-[#4E4456]" />
              Monthly Consumption
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={consumptionData.slice(-4)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${formatNumber(value)} m³`, 'Consumption']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E2E8F0'
                  }}
                />
                <Legend />
                <defs>
                  <linearGradient id="consumptionFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4E4456" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#6a5f7a" stopOpacity={0.4}/>
                  </linearGradient>
                </defs>
                <Bar 
                  dataKey="total" 
                  name="Total Consumption" 
                  fill="url(#consumptionFill)"
                  radius={[4, 4, 0, 0]} 
                  barSize={40}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-red-500" />
              Water Loss Trend
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={waterLossData.slice(-4)}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [`${value.toFixed(1)}%`, 'Loss Rate']}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    borderRadius: '8px', 
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    border: '1px solid #E2E8F0'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="totalLossPercent" 
                  name="Total Loss" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  activeDot={{ r: 8, fill: '#EF4444', stroke: 'white', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#EF4444', stroke: 'white', strokeWidth: 2 }}
                  animationDuration={1500}
                />
                <Line 
                  type="monotone" 
                  dataKey="stage1LossPercent" 
                  name="Stage 1 Loss" 
                  stroke="#F97316" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: '#F97316', stroke: 'white', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#F97316', stroke: 'white', strokeWidth: 2 }}
                  animationDuration={1500}
                  animationBegin={300}
                />
                <Line 
                  type="monotone" 
                  dataKey="stage2LossPercent" 
                  name="Stage 2 Loss" 
                  stroke="#EAB308" 
                  strokeWidth={2}
                  activeDot={{ r: 6, fill: '#EAB308', stroke: 'white', strokeWidth: 2 }}
                  dot={{ r: 4, fill: '#EAB308', stroke: 'white', strokeWidth: 2 }}
                  animationDuration={1500}
                  animationBegin={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      {/* Latest Alerts and Zone Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
            <button 
              onClick={() => navigateTo('alerts')}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </CardHeader>
          <CardContent className="pt-2">
            {alerts.slice(0, 3).map(alert => (
              <div key={alert.id} className="mb-4 last:mb-0">
                <div className="flex items-start space-x-3">
                  <div className={`p-2 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900 truncate">{alert.title}</p>
                      <span className="text-xs text-gray-500">{formatTimestamp(alert.timestamp)}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{alert.message}</p>
                  </div>
                </div>
              </div>
            ))}
            {alerts.length === 0 && (
              <div className="text-center py-6 text-gray-500">
                <p>No active alerts</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card className="transition-all duration-300 hover:shadow-md">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Zone Distribution</CardTitle>
            <div className="text-sm text-gray-500">Current month</div>
          </CardHeader>
          <CardContent className="pt-2">
            {latestConsumptionData ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={Object.keys(latestConsumptionData)
                      .filter(key => key !== 'month' && key !== 'year' && key !== 'total')
                      .map(zone => ({
                        name: zone,
                        value: latestConsumptionData[zone] || 0
                      }))
                      .filter(item => item.value > 0)
                    }
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {Object.keys(latestConsumptionData)
                      .filter(key => key !== 'month' && key !== 'year' && key !== 'total')
                      .map((zone, index) => {
                        const colors = ['#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE', '#60A5FA', '#3B82F6'];
                        return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                      })
                    }
                  </Pie>
                  <Tooltip formatter={(value) => [`${formatNumber(value)} m³`, 'Consumption']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">No data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};
