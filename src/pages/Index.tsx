import React from 'react';
import Layout from '@/components/layout/Layout';
import DashboardCard from '@/components/dashboard/DashboardCard';
import StatCard from '@/components/dashboard/StatCard';
import { 
  Droplet, 
  Zap, 
  Factory, 
  FileText, 
  Thermometer, 
  ClipboardCheck, 
  AlertTriangle,
  AreaChart,
  Calendar,
  CheckCircle2,
  Clock,
  Gauge
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const electricityData = [
  { name: 'Jan', usage: 4000 },
  { name: 'Feb', usage: 3000 },
  { name: 'Mar', usage: 2000 },
  { name: 'Apr', usage: 2780 },
  { name: 'May', usage: 1890 },
  { name: 'Jun', usage: 2390 },
  { name: 'Jul', usage: 3490 },
];

const waterData = [
  { name: 'Jan', usage: 2400 },
  { name: 'Feb', usage: 1398 },
  { name: 'Mar', usage: 9800 },
  { name: 'Apr', usage: 3908 },
  { name: 'May', usage: 4800 },
  { name: 'Jun', usage: 3800 },
  { name: 'Jul', usage: 4300 },
];

const Index = () => {
  return (
    <Layout>
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl font-bold text-muscat-primary">Operations Dashboard</h1>
        <p className="text-muscat-primary/60">Overview of your operations and assets</p>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Water Consumption" 
          value="12,456 m³" 
          icon={Droplet} 
          trend={{ value: 5, isPositive: false }}
          color="teal"
          delay={100}
        />
        <StatCard 
          title="Electricity Usage" 
          value="87,123 kWh" 
          icon={Zap} 
          trend={{ value: 8, isPositive: true }}
          color="gold"
          delay={200}
        />
        <StatCard 
          title="STP Efficiency" 
          value="94%" 
          icon={Gauge} 
          trend={{ value: 2, isPositive: true }}
          color="lavender"
          delay={300}
        />
        <StatCard 
          title="Active Contracts" 
          value="18" 
          icon={FileText} 
          description="3 requiring attention"
          color="primary"
          delay={400}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        <DashboardCard delay={500}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Electricity Consumption</h3>
            <button className="text-sm text-muscat-teal hover:underline">View Details</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={electricityData}>
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
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#D4B98C" 
                  strokeWidth={2}
                  dot={{ stroke: '#D4B98C', strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ stroke: '#D4B98C', strokeWidth: 2, r: 6, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
        
        <DashboardCard delay={600}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Water Consumption</h3>
            <button className="text-sm text-muscat-teal hover:underline">View Details</button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={waterData}>
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
                <Line 
                  type="monotone" 
                  dataKey="usage" 
                  stroke="#68D1CC" 
                  strokeWidth={2}
                  dot={{ stroke: '#68D1CC', strokeWidth: 2, r: 4, fill: 'white' }}
                  activeDot={{ stroke: '#68D1CC', strokeWidth: 2, r: 6, fill: 'white' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard delay={700}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">Maintenance Schedule</h3>
          <div className="space-y-4">
            {[
              { title: 'HVAC System Inspection', date: 'Today, 14:00', status: 'upcoming' },
              { title: 'Water Pump Maintenance', date: 'Tomorrow, 10:00', status: 'upcoming' },
              { title: 'STP Filter Replacement', date: 'Jul 28, 9:00', status: 'scheduled' },
              { title: 'Electrical Systems Check', date: 'Jul 30, 13:30', status: 'scheduled' },
            ].map((task, index) => (
              <div key={index} className="flex items-start gap-3 p-3 border rounded-lg border-muscat-primary/5 hover:bg-muscat-light/50 transition-colors">
                <div className={cn(
                  "flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-full",
                  task.status === 'upcoming' ? "bg-muscat-gold/10" : "bg-muscat-lavender/10"
                )}>
                  {task.status === 'upcoming' ? (
                    <Clock className="w-5 h-5 text-muscat-gold" />
                  ) : (
                    <Calendar className="w-5 h-5 text-muscat-lavender" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muscat-primary">{task.title}</h4>
                  <p className="text-xs text-muscat-primary/60">{task.date}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-2 mt-4 text-sm font-medium transition-colors border rounded-md border-muscat-primary/10 text-muscat-primary hover:bg-muscat-light">
            View All Schedules
          </button>
        </DashboardCard>
        
        <DashboardCard delay={800}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">System Status</h3>
          <div className="space-y-4">
            {[
              { name: 'Water Supply System', status: 'operational' },
              { name: 'STP Plant', status: 'operational' },
              { name: 'Main Electrical Grid', status: 'operational' },
              { name: 'Pump Station 2', status: 'warning', message: 'Maintenance needed' },
              { name: 'HVAC System', status: 'warning', message: 'Performance degraded' },
              { name: 'Backup Generators', status: 'operational' },
            ].map((system, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg border-muscat-primary/5 hover:bg-muscat-light/50 transition-colors">
                <div className="flex items-center gap-3">
                  {system.status === 'operational' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : system.status === 'warning' ? (
                    <AlertTriangle className="w-5 h-5 text-amber-500" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  )}
                  <span className="text-sm font-medium text-muscat-primary">{system.name}</span>
                </div>
                {system.message && (
                  <span className="text-xs text-amber-500">{system.message}</span>
                )}
              </div>
            ))}
          </div>
        </DashboardCard>
        
        <DashboardCard delay={900}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">Critical Alerts</h3>
          <div className="space-y-4">
            {[
              { title: 'Contract Renewal Required', description: 'Security services contract expires in 15 days', severity: 'high' },
              { title: 'Water Usage Spike Detected', description: 'Unusual consumption in Zone B detected', severity: 'medium' },
              { title: 'STP Efficiency Dropping', description: '5% decrease in last 24 hours', severity: 'medium' },
              { title: 'Preventative Maintenance Due', description: 'HVAC systems in main building', severity: 'low' },
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
                <h4 className="text-sm font-medium text-muscat-primary">{alert.title}</h4>
                <p className="text-xs text-muscat-primary/60">{alert.description}</p>
              </div>
            ))}
          </div>
          <button className="w-full py-2 mt-4 text-sm font-medium transition-colors border rounded-md border-muscat-primary/10 text-muscat-primary hover:bg-muscat-light">
            View All Alerts
          </button>
        </DashboardCard>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-3">
        <DashboardCard className="lg:col-span-2" delay={1000}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">Upcoming Tasks</h3>
          <div className="overflow-hidden overflow-x-auto">
            <table className="w-full min-w-full">
              <thead>
                <tr className="border-b border-muscat-primary/10">
                  <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Task</th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Assigned To</th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Due Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Priority</th>
                  <th className="px-4 py-3 text-xs font-medium text-left text-muscat-primary/60">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { task: 'Review Q3 Utility Reports', assignee: 'Ahmed M.', dueDate: 'Jul 28, 2023', priority: 'High', status: 'In Progress' },
                  { task: 'Update Emergency Contacts', assignee: 'Sarah K.', dueDate: 'Jul 29, 2023', priority: 'Medium', status: 'Not Started' },
                  { task: 'STP Chemical Inventory', assignee: 'Mohammed A.', dueDate: 'Jul 30, 2023', priority: 'Medium', status: 'In Progress' },
                  { task: 'Contractor Performance Review', assignee: 'Fatima H.', dueDate: 'Aug 2, 2023', priority: 'Low', status: 'Not Started' },
                  { task: 'Security System Upgrade Plan', assignee: 'Ahmed M.', dueDate: 'Aug 5, 2023', priority: 'High', status: 'Not Started' },
                ].map((item, index) => (
                  <tr key={index} className="border-b border-muscat-primary/5 hover:bg-muscat-light/50 transition-colors">
                    <td className="px-4 py-3 text-sm text-muscat-primary">{item.task}</td>
                    <td className="px-4 py-3 text-sm text-muscat-primary">{item.assignee}</td>
                    <td className="px-4 py-3 text-sm text-muscat-primary">{item.dueDate}</td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-block px-2 py-1 text-xs rounded-full",
                        item.priority === 'High' 
                          ? "bg-red-100 text-red-800" 
                          : item.priority === 'Medium'
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      )}>
                        {item.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        "inline-block px-2 py-1 text-xs rounded-full",
                        item.status === 'In Progress' 
                          ? "bg-muscat-primary/10 text-muscat-primary" 
                          : "bg-gray-100 text-gray-800"
                      )}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
        
        <DashboardCard delay={1100}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">Quick Access</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { name: 'Water Reports', icon: Droplet, color: 'bg-muscat-teal/10 text-muscat-teal' },
              { name: 'Energy Analytics', icon: AreaChart, color: 'bg-muscat-gold/10 text-muscat-gold' },
              { name: 'STP Management', icon: Factory, color: 'bg-muscat-primary/10 text-muscat-primary' },
              { name: 'Contract List', icon: FileText, color: 'bg-muscat-lavender/10 text-muscat-lavender' },
              { name: 'Inspection Forms', icon: ClipboardCheck, color: 'bg-green-100 text-green-700' },
              { name: 'Incident Reports', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <button 
                  key={index}
                  className="flex flex-col items-center justify-center p-4 space-y-2 text-center transition-all border rounded-lg border-muscat-primary/5 hover:shadow-md hover:border-muscat-primary/10"
                >
                  <div className={cn("p-3 rounded-full", item.color)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-medium text-muscat-primary">{item.name}</span>
                </button>
              );
            })}
          </div>
        </DashboardCard>
      </div>
    </Layout>
  );
};

export default Index;

import { cn } from '@/lib/utils';
