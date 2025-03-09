
import React from 'react';
import Layout from '@/components/layout/Layout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import StatCard from '@/components/dashboard/StatCard';
import { 
  Droplet, 
  AlertTriangle, 
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  CircleDot,
  FilterX,
  GaugeCircle,
  LocateFixed,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';

// Sample data for charts
const dailyConsumptionData = [
  { name: '00:00', value: 540 },
  { name: '03:00', value: 290 },
  { name: '06:00', value: 380 },
  { name: '09:00', value: 700 },
  { name: '12:00', value: 850 },
  { name: '15:00', value: 770 },
  { name: '18:00', value: 900 },
  { name: '21:00', value: 650 },
];

const monthlyConsumptionData = [
  { name: 'Jan', residential: 4000, commercial: 2400 },
  { name: 'Feb', residential: 3000, commercial: 1398 },
  { name: 'Mar', residential: 2000, commercial: 9800 },
  { name: 'Apr', residential: 2780, commercial: 3908 },
  { name: 'May', residential: 1890, commercial: 4800 },
  { name: 'Jun', residential: 2390, commercial: 3800 },
  { name: 'Jul', residential: 3490, commercial: 4300 },
];

const Water = () => {
  return (
    <Layout>
      <div className="flex flex-col gap-2 mb-8 md:flex-row md:items-center md:justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-muscat-primary">Water Management</h1>
          <p className="text-muscat-primary/60">Monitor and manage water consumption and distribution</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary">
            <Droplet className="w-4 h-4 mr-2" />
            Generate Report
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Today's Consumption" 
          value="3,241 m³" 
          icon={Droplet} 
          trend={{ value: 5.3, isPositive: false }}
          color="teal"
          delay={100}
        />
        <StatCard 
          title="Monthly Usage" 
          value="85,630 m³" 
          icon={GaugeCircle} 
          trend={{ value: 2.1, isPositive: true }}
          color="lavender"
          delay={200}
        />
        <StatCard 
          title="Active Meters" 
          value="128" 
          icon={CircleDot} 
          description="96% reporting correctly"
          color="gold"
          delay={300}
        />
        <StatCard 
          title="Alerts" 
          value="3" 
          icon={AlertTriangle} 
          description="1 high priority"
          color="primary"
          delay={400}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2" delay={500}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Water Consumption Trend</h3>
            <div className="flex items-center space-x-2">
              <button className="p-1 text-sm transition-all rounded-md text-muscat-primary/60 hover:bg-muscat-light hover:text-muscat-primary">
                Daily
              </button>
              <button className="p-1 text-sm transition-all rounded-md text-muscat-primary bg-muscat-light">
                Weekly
              </button>
              <button className="p-1 text-sm transition-all rounded-md text-muscat-primary/60 hover:bg-muscat-light hover:text-muscat-primary">
                Monthly
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyConsumptionData}>
                <defs>
                  <linearGradient id="colorPv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#68D1CC" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#68D1CC" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white',
                    borderColor: '#E5E7EB',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#68D1CC" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorPv)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
        
        <DashboardCard delay={600}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">Active Alerts</h3>
          <div className="space-y-4">
            {[
              { title: 'Unusual Water Usage', location: 'Residential Zone B', time: '30 mins ago', severity: 'high' },
              { title: 'Flow Meter Error', location: 'Main Distribution', time: '2 hours ago', severity: 'medium' },
              { title: 'Scheduled Maintenance', location: 'Water Treatment', time: 'Tomorrow', severity: 'low' },
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
            <button className="w-full py-2 mt-2 text-sm font-medium transition-colors border rounded-md border-muscat-primary/10 text-muscat-primary hover:bg-muscat-light">
              View All Alerts
            </button>
          </div>
        </DashboardCard>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <DashboardCard delay={700}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Consumption by Zone</h3>
            <button className="p-1 transition-all rounded-md hover:bg-muscat-light">
              <SlidersHorizontal className="w-4 h-4 text-muscat-primary/60" />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Residential Zone A', value: '1,240 m³', change: 5, isPositive: false },
              { name: 'Residential Zone B', value: '1,873 m³', change: 12, isPositive: true },
              { name: 'Commercial Zone', value: '2,105 m³', change: 3, isPositive: false },
              { name: 'Leisure Facilities', value: '956 m³', change: 8, isPositive: false },
              { name: 'Hotel & Hospitality', value: '1,456 m³', change: 2, isPositive: true },
            ].map((zone, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg border-muscat-primary/5 hover:bg-muscat-light/50 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-2 h-2 rounded-full bg-muscat-teal"></div>
                  <span className="text-sm font-medium text-muscat-primary">{zone.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-muscat-primary">{zone.value}</span>
                  <span className={cn(
                    "flex items-center text-xs",
                    zone.isPositive ? "text-green-500" : "text-red-500"
                  )}>
                    {zone.isPositive ? (
                      <ArrowUp className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDown className="w-3 h-3 mr-1" />
                    )}
                    {zone.change}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
        
        <DashboardCard className="lg:col-span-2" delay={800}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Monthly Water Usage</h3>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muscat-primary/60">2023</span>
              <button className="p-1 transition-all rounded-md hover:bg-muscat-light">
                <Calendar className="w-4 h-4 text-muscat-primary/60" />
              </button>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9CA3AF" />
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
                <Bar dataKey="residential" fill="#68D1CC" radius={[4, 4, 0, 0]} />
                <Bar dataKey="commercial" fill="#9D8EB7" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>
      
      <DashboardCard delay={900}>
        <div className="flex flex-col gap-4 mb-4 md:flex-row md:items-center md:justify-between">
          <h3 className="text-lg font-semibold text-muscat-primary">Water Meters</h3>
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muscat-primary/50" />
              <input
                type="text"
                placeholder="Search meters..."
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
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Meter ID</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Location</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Type</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Last Reading</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Last Maintenance</th>
                <th className="px-4 py-3 text-xs font-medium text-right text-muscat-primary/60">Actions</th>
              </tr>
            </thead>
            <tbody>
              {[
                { id: 'WM-1035', location: 'Residential Zone A', type: 'Digital', reading: '1,245 m³', status: 'Active', maintenance: 'Mar 15, 2023' },
                { id: 'WM-1042', location: 'Commercial Zone', type: 'Digital', reading: '2,567 m³', status: 'Active', maintenance: 'Apr 22, 2023' },
                { id: 'WM-1067', location: 'Hotel & Hospitality', type: 'Smart', reading: '3,890 m³', status: 'Active', maintenance: 'May 10, 2023' },
                { id: 'WM-1078', location: 'Leisure Facilities', type: 'Smart', reading: '1,578 m³', status: 'Warning', maintenance: 'Feb 28, 2023' },
                { id: 'WM-1089', location: 'Residential Zone B', type: 'Digital', reading: '2,134 m³', status: 'Maintenance', maintenance: 'Jan 15, 2023' },
              ].map((meter, index) => (
                <tr key={index} className="border-b border-muscat-primary/5 hover:bg-muscat-light/50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-muscat-primary">{meter.id}</td>
                  <td className="px-4 py-3 text-sm text-muscat-primary">{meter.location}</td>
                  <td className="px-4 py-3 text-sm text-muscat-primary">{meter.type}</td>
                  <td className="px-4 py-3 text-sm text-muscat-primary">{meter.reading}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 text-xs rounded-full",
                      meter.status === 'Active' 
                        ? "bg-green-100 text-green-800" 
                        : meter.status === 'Warning'
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    )}>
                      {meter.status === 'Active' && <Check className="w-3 h-3 mr-1" />}
                      {meter.status === 'Warning' && <AlertTriangle className="w-3 h-3 mr-1" />}
                      {meter.status === 'Maintenance' && <SlidersHorizontal className="w-3 h-3 mr-1" />}
                      {meter.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muscat-primary">{meter.maintenance}</td>
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
          <p className="text-sm text-muscat-primary/60">Showing 5 of 128 meters</p>
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

export default Water;
