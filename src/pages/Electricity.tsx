import React from 'react';
import Layout from '@/components/layout/Layout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import StatCard from '@/components/dashboard/StatCard';
import { 
  Zap, 
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  CircleDot,
  Clock,
  FilterX,
  LocateFixed,
  PieChart,
  Search,
  SlidersHorizontal,
  ThermometerSun,
  Waves
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { cn } from '@/lib/utils';

// Sample data for charts
const hourlyConsumptionData = [
  { time: '00:00', consumption: 120 },
  { time: '01:00', consumption: 110 },
  { time: '02:00', consumption: 100 },
  { time: '03:00', consumption: 90 },
  { time: '04:00', consumption: 95 },
  { time: '05:00', consumption: 110 },
  { time: '06:00', consumption: 150 },
  { time: '07:00', consumption: 190 },
  { time: '08:00', consumption: 250 },
  { time: '09:00', consumption: 300 },
  { time: '10:00', consumption: 320 },
  { time: '11:00', consumption: 350 },
  { time: '12:00', consumption: 370 },
  { time: '13:00', consumption: 390 },
  { time: '14:00', consumption: 380 },
  { time: '15:00', consumption: 370 },
  { time: '16:00', consumption: 360 },
  { time: '17:00', consumption: 380 },
  { time: '18:00', consumption: 410 },
  { time: '19:00', consumption: 430 },
  { time: '20:00', consumption: 420 },
  { time: '21:00', consumption: 400 },
  { time: '22:00', consumption: 300 },
  { time: '23:00', consumption: 200 },
];

const usageBreakdownData = [
  { name: 'HVAC', value: 45 },
  { name: 'Lighting', value: 20 },
  { name: 'Water Heating', value: 15 },
  { name: 'Equipment', value: 10 },
  { name: 'Other', value: 10 },
];

const COLORS = ['#68D1CC', '#9D8EB7', '#D4B98C', '#4E4456', '#AAAAAA'];

const energyComparisonData = [
  { month: 'Jan', current: 4000, previous: 3000 },
  { month: 'Feb', current: 3500, previous: 2800 },
  { month: 'Mar', current: 3200, previous: 3100 },
  { month: 'Apr', current: 3800, previous: 3600 },
  { month: 'May', current: 4200, previous: 3800 },
  { month: 'Jun', current: 4500, previous: 4100 },
  { month: 'Jul', current: 4300, previous: 4200 },
];

const Electricity = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-2 mb-8 md:flex-row md:items-center md:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-muscat-primary">Electricity Management</h1>
          <p className="text-muscat-primary/60">Monitor and optimize power consumption and distribution</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Zap className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Current Demand" 
          value="342 kW" 
          icon={Zap} 
          trend={{ value: 8.3, isPositive: true }}
          color="gold"
          delay={100}
        />
        <StatCard 
          title="Today's Usage" 
          value="5,241 kWh" 
          icon={ThermometerSun} 
          trend={{ value: 3.2, isPositive: false }}
          color="lavender"
          delay={200}
        />
        <StatCard 
          title="Peak Demand" 
          value="523 kW" 
          icon={Waves} 
          description="Recorded at 18:30"
          color="teal"
          delay={300}
        />
        <StatCard 
          title="Power Factor" 
          value="0.97" 
          icon={PieChart} 
          trend={{ value: 1.2, isPositive: true }}
          color="primary"
          delay={400}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2" delay={500}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Real-Time Electricity Consumption</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center px-2 py-1 text-xs rounded-md bg-muscat-light text-muscat-primary">
                <Clock className="w-3 h-3 mr-1" />
                Auto-refresh: 5m
              </div>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourlyConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="time" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value} kW`, 'Consumption']}
                  labelFormatter={(label) => `Time: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="consumption" 
                  stroke="#D4B98C" 
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ stroke: '#D4B98C', strokeWidth: 2, r: 6, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
        
        <DashboardCard delay={600}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">Energy Usage Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPieChart>
                <Pie
                  data={usageBreakdownData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {usageBreakdownData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  formatter={(value) => [`${value}%`, 'Percentage']}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4 sm:grid-cols-3">
            {usageBreakdownData.map((item, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <span className="text-xs text-muscat-primary">{item.name}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2" delay={700}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Monthly Comparison</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muscat-primary/60">Current vs Previous Year</span>
              <button className="p-1 transition-all rounded-md hover:bg-muscat-light">
                <Calendar className="w-4 h-4 text-muscat-primary/60" />
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={energyComparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Bar dataKey="current" name="Current Year" fill="#68D1CC" radius={[4, 4, 0, 0]} />
                <Bar dataKey="previous" name="Previous Year" fill="#D4B98C" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
        
        <DashboardCard delay={800}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">Electricity Alerts</h3>
          <div className="space-y-4">
            {[
              { title: 'High Power Demand', location: 'Main Building', time: '15 mins ago', severity: 'high' },
              { title: 'Power Quality Issue', location: 'Zone C Substation', time: '1 hour ago', severity: 'medium' },
              { title: 'Generator Test', location: 'Backup System', time: 'Tomorrow', severity: 'low' },
              { title: 'Voltage Fluctuation', location: 'Commercial Zone', time: '2 hours ago', severity: 'medium' },
            ].map((alert, index) => (
              <div key={index} className={cn(
                "p-3 border rounded-lg border-l-4 hover:bg-muscat-light/50 transition-colors",
                alert.severity === 'high' 
                  ? "border-red-500 border-l-red-500" 
                  : alert.severity === 'medium'
                  ? "border-amber-500 border-l-amber-500"
                  : "border-blue-500 border-l-blue-500",
                "border-muscat-primary/5"
              )}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-muscat-primary">{alert.title}</h4>
                    <div className="flex items-center mt-1 space-x-2">
                      <LocateFixed className="w-3 h-3 text-muscat-primary/60" />
                      <p className="text-xs text-muscat-primary/60">{alert.location}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muscat-primary/50">{alert.time}</span>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <span className={cn(
                    "inline-block px-2 py-0.5 text-xs rounded-full",
                    alert.severity === 'high' 
                      ? "bg-red-100 text-red-800" 
                      : alert.severity === 'medium'
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"
                  )}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                  <button className="text-xs text-muscat-teal hover:underline">
                    Resolve
                  </button>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
      
      <DashboardCard delay={900}>
        <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-muscat-primary">Distribution Substations</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muscat-primary/50" />
              <input
                type="text"
                placeholder="Search substations..."
                className="w-full sm:w-64 py-2 pl-10 pr-4 text-sm transition-all border rounded-md focus:outline-none focus:ring-2 focus:ring-muscat-primary/20 border-muscat-primary/10"
              />
            </div>
            <button className="flex items-center justify-center px-3 py-2 text-sm transition-all border rounded-md border-muscat-primary/10 text-muscat-primary hover:bg-muscat-light">
              <FilterX className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
        <div className="overflow-hidden overflow-x-auto">
          <table className="w-full min-w-full">
            <thead>
              <tr className="border-b border-muscat-primary/10">
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Substation ID</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Location</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Load (kW)</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Capacity Utilization</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Last Maintenance</th>
                <th className="px-4 py-3 text-xs font-medium text-right text-muscat-primary/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'SUB-001', location: 'Main Complex', load: 215, utilization: 72, status: 'Active', maintenance: 'Mar 05, 2023' },
                { id: 'SUB-002', location: 'Residential Zone A', load: 157, utilization: 52, status: 'Active', maintenance: 'Apr 12, 2023' },
                { id: 'SUB-003', location: 'Residential Zone B', load: 189, utilization: 63, status: 'Active', maintenance: 'Feb 28, 2023' },
                { id: 'SUB-004', location: 'Commercial Zone', load: 245, utilization: 82, status: 'Warning', maintenance: 'Jan 15, 2023' },
                { id: 'SUB-005', location: 'Leisure Facilities', load: 132, utilization: 44, status: 'Maintenance', maintenance: 'May 20, 2023' },
              ].map((substation, index) => (
                <tr key={index} className="border-b border-muscat-primary/5 hover:bg-muscat-light/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-muscat-primary">{substation.id}</td>
                  <td className="px-4 py-3 text-sm text-muscat-primary">{substation.location}</td>
                  <td className="px-4 py-3 text-sm text-muscat-primary">{substation.load} kW</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 rounded-full">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            substation.utilization > 80 ? "bg-red-500" :
                            substation.utilization > 60 ? "bg-amber-500" : "bg-green-500"
                          )}
                          style={{ width: `${substation.utilization}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-muscat-primary">{substation.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 text-xs rounded-full",
                      substation.status === 'Active' 
                        ? "bg-green-100 text-green-800" 
                        : substation.status === 'Warning'
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    )}>
                      {substation.status === 'Active' && <Check className="w-3 h-3 mr-1" />}
                      {substation.status === 'Warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {substation.status === 'Maintenance' && <SlidersHorizontal className="w-3 h-3 mr-1" />}
                      {substation.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muscat-primary">{substation.maintenance}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="text-sm text-muscat-teal hover:underline">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-muscat-primary/60">Showing 5 of 12 substations</p>
          <div className="flex items-center gap-2">
            <button className="px-3 py-1 text-sm transition-all border rounded-md border-muscat-primary/10 text-muscat-primary hover:bg-muscat-light">
              Previous
            </button>
            <button className="px-3 py-1 text-sm transition-all border rounded-md bg-muscat-primary text-white hover:bg-opacity-90">
              Next
            </button>
          </div>
        </div>
      </DashboardCard>
    </Layout>
  );
};

export default Electricity;
