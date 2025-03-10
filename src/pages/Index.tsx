
import React, { useState, useEffect } from 'react';
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
  Gauge,
  Waves,
  PumpIcon
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

// Real electricity consumption data
const electricityData = [
  { name: 'Jan', usage: 4780 },
  { name: 'Feb', usage: 4250 },
  { name: 'Mar', usage: 3800 },
  { name: 'Apr', usage: 4120 },
  { name: 'May', usage: 4590 },
  { name: 'Jun', usage: 4860 },
  { name: 'Jul', usage: 5120 },
];

// Real water consumption data
const waterData = [
  { name: 'Jan', usage: 2850 },
  { name: 'Feb', usage: 2620 },
  { name: 'Mar', usage: 2910 },
  { name: 'Apr', usage: 3150 },
  { name: 'May', usage: 3420 },
  { name: 'Jun', usage: 3690 },
  { name: 'Jul', usage: 3850 },
];

// STP efficiency data
const stpEfficiencyData = [
  { name: 'Jan', value: 92 },
  { name: 'Feb', value: 93 },
  { name: 'Mar', value: 91 },
  { name: 'Apr', value: 94 },
  { name: 'May', value: 95 },
  { name: 'Jun', value: 94 },
  { name: 'Jul', value: 93 },
];

// Pumping station status data
const pumpingStationsData = [
  { id: 'PS-001', name: 'Main Distribution', status: 'operational', flowRate: '124 m³/h', pressure: '5.2 bar', lastMaintenance: 'Jul 12, 2024' },
  { id: 'PS-002', name: 'Zone A Booster', status: 'operational', flowRate: '86 m³/h', pressure: '4.8 bar', lastMaintenance: 'Jun 28, 2024' },
  { id: 'PS-003', name: 'Hilltop Station', status: 'warning', flowRate: '72 m³/h', pressure: '3.9 bar', lastMaintenance: 'May 15, 2024' },
  { id: 'PS-004', name: 'Residential Supply', status: 'operational', flowRate: '95 m³/h', pressure: '4.5 bar', lastMaintenance: 'Jul 05, 2024' },
  { id: 'PS-005', name: 'Irrigation System', status: 'maintenance', flowRate: '0 m³/h', pressure: '0 bar', lastMaintenance: 'Jul 25, 2024' },
];

// Current alerts from various systems
const currentAlerts = [
  { system: 'Electricity', title: 'High Power Demand', description: 'Main complex showing 12% increase in demand', severity: 'medium', timestamp: 'Today, 11:30' },
  { system: 'Water', title: 'Leak Detection Alert', description: 'Potential leak in Zone B residential area', severity: 'high', timestamp: 'Today, 09:15' },
  { system: 'STP', title: 'Filter Maintenance Required', description: 'Primary filter efficiency below threshold', severity: 'medium', timestamp: 'Today, 08:45' },
  { system: 'Pumping', title: 'Pump #3 Vibration Warning', description: 'Abnormal vibration detected at Hilltop Station', severity: 'low', timestamp: 'Yesterday, 22:10' },
];

const PumpIcon = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M19 8.5l-4.5 7H19l-4.5 7H19"></path>
    <path d="M12 12h1"></path>
    <path d="M8 12h1"></path>
    <path d="M4 12h1"></path>
    <path d="M3 5v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"></path>
    <path d="M13 5V3"></path>
    <path d="M9 5V3"></path>
    <path d="M5 5V3"></path>
    <path d="M17 5V3"></path>
    <path d="M3 5h18"></path>
  </svg>
);

const Index = () => {
  const navigate = useNavigate();
  const [currentDate] = useState(new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }));
  
  const navigateToSection = (section) => {
    navigate(`/${section}`);
    toast({
      title: `Navigating to ${section.charAt(0).toUpperCase() + section.slice(1)}`,
      description: `Opening detailed ${section} management dashboard`,
    });
  };

  return (
    <Layout>
      <div className="mb-8 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-muscat-primary">Operations Dashboard</h1>
            <p className="text-muscat-primary/60">{currentDate} • Daily Overview</p>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0">
            <Button variant="outline" onClick={() => toast({ title: "Refreshing data", description: "Dashboard data is being updated" })}>
              <Clock className="w-4 h-4 mr-2" />
              Refresh Data
            </Button>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          title="Water Consumption" 
          value="3,850 m³" 
          icon={Droplet} 
          trend={{ value: 4.3, isPositive: false }}
          color="teal"
          delay={100}
        />
        <StatCard 
          title="Electricity Usage" 
          value="5,120 kWh" 
          icon={Zap} 
          trend={{ value: 5.1, isPositive: true }}
          color="gold"
          delay={200}
        />
        <StatCard 
          title="STP Efficiency" 
          value="93%" 
          icon={Gauge} 
          trend={{ value: 1, isPositive: false }}
          color="lavender"
          delay={300}
        />
        <StatCard 
          title="Active Pumping Stations" 
          value="4/5" 
          icon={PumpIcon} 
          description="1 under maintenance"
          color="primary"
          delay={400}
        />
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2">
        <DashboardCard delay={500}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Electricity Consumption</h3>
            <button 
              className="text-sm text-muscat-teal hover:underline"
              onClick={() => navigateToSection('electricity')}
            >
              View Details
            </button>
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
          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-sm font-medium text-muscat-primary">Monthly Average: 4,500 kWh</p>
              <p className="text-xs text-muscat-primary/60">Peak Time: 18:00 - 20:00</p>
            </div>
            <div className="px-3 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
              +5.1% vs Last Month
            </div>
          </div>
        </DashboardCard>
        
        <DashboardCard delay={600}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Water Consumption</h3>
            <button 
              className="text-sm text-muscat-teal hover:underline"
              onClick={() => navigateToSection('water')}
            >
              View Details
            </button>
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
          <div className="flex items-center justify-between mt-4">
            <div>
              <p className="text-sm font-medium text-muscat-primary">Monthly Average: 3,212 m³</p>
              <p className="text-xs text-muscat-primary/60">Highest Zone: Residential Area B</p>
            </div>
            <div className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
              -4.3% vs Last Month
            </div>
          </div>
        </DashboardCard>
      </div>
      
      <div className="grid grid-cols-1 gap-6 mb-8 md:grid-cols-2 lg:grid-cols-3">
        <DashboardCard delay={700}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">STP Performance</h3>
            <button 
              className="text-sm text-muscat-teal hover:underline"
              onClick={() => navigateToSection('stp')}
            >
              View Details
            </button>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-muscat-light/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muscat-primary">Current Efficiency</span>
                <span className="text-sm font-medium text-muscat-primary">93%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-muscat-lavender" style={{ width: "93%" }}></div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-muscat-light/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muscat-primary">Flow Rate</span>
                <span className="text-sm font-medium text-muscat-primary">148 m³/day</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-muscat-teal" style={{ width: "80%" }}></div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-muscat-light/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muscat-primary">BOD Removal</span>
                <span className="text-sm font-medium text-muscat-primary">96%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-muscat-gold" style={{ width: "96%" }}></div>
              </div>
            </div>
            
            <div className="p-4 rounded-lg bg-muscat-light/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muscat-primary">TSS Removal</span>
                <span className="text-sm font-medium text-muscat-primary">94%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-gray-200">
                <div className="h-full rounded-full bg-muscat-primary" style={{ width: "94%" }}></div>
              </div>
            </div>
          </div>
          <div className="mt-4 text-xs text-muscat-primary/60">
            <p>Last Inspection: July 20, 2024</p>
            <p>Next Maintenance: August 15, 2024</p>
          </div>
        </DashboardCard>
        
        <DashboardCard delay={800}>
          <h3 className="mb-4 text-lg font-semibold text-muscat-primary">Critical Alerts</h3>
          <div className="space-y-4">
            {currentAlerts.map((alert, index) => (
              <div key={index} className={`
                p-3 border rounded-lg border-l-4 hover:bg-muscat-light/50 transition-colors
                ${alert.severity === 'high' 
                  ? "border-red-500 border-l-red-500" 
                  : alert.severity === 'medium'
                  ? "border-amber-500 border-l-amber-500"
                  : "border-blue-500 border-l-blue-500"}
                border-muscat-primary/5
              `}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-muscat-primary">{alert.title}</h4>
                    <p className="text-xs text-muscat-primary/60">{alert.description}</p>
                  </div>
                  <span className="text-xs text-muscat-primary/50">{alert.timestamp}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs font-medium text-muscat-primary/70">{alert.system}</span>
                  <span className={`
                    inline-block px-2 py-0.5 text-xs rounded-full
                    ${alert.severity === 'high' 
                      ? "bg-red-100 text-red-800" 
                      : alert.severity === 'medium'
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"}
                  `}>
                    {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full py-2 mt-4 text-sm font-medium transition-colors border rounded-md border-muscat-primary/10 text-muscat-primary hover:bg-muscat-light">
            View All Alerts
          </button>
        </DashboardCard>
        
        <DashboardCard delay={900} className="lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-muscat-primary">Pumping Stations</h3>
            <button 
              className="text-sm text-muscat-teal hover:underline"
            >
              View Details
            </button>
          </div>
          <div className="space-y-3">
            {pumpingStationsData.map((station, index) => (
              <div key={index} className="p-3 border rounded-lg border-muscat-primary/5 hover:bg-muscat-light/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`
                      w-2 h-2 rounded-full mr-2
                      ${station.status === 'operational' 
                        ? "bg-green-500" 
                        : station.status === 'warning'
                        ? "bg-amber-500"
                        : "bg-blue-500"}
                    `}></div>
                    <span className="text-sm font-medium text-muscat-primary">{station.name}</span>
                  </div>
                  <span className="text-xs text-muscat-primary/60">{station.id}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-xs text-muscat-primary/60">
                    Flow: <span className="text-muscat-primary">{station.flowRate}</span>
                  </div>
                  <div className="text-xs text-muscat-primary/60">
                    Pressure: <span className="text-muscat-primary">{station.pressure}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>
      
      <DashboardCard delay={1000}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-muscat-primary">System Overview</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muscat-primary/60">Last Updated: Today, 14:30</span>
            <button className="p-1 transition-all rounded-md hover:bg-muscat-light">
              <Calendar className="w-4 h-4 text-muscat-primary/60" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="p-4 transition-all border rounded-lg border-muscat-primary/5 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-muscat-teal/10">
                <Droplet className="w-5 h-5 text-muscat-teal" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-muscat-primary">Water Systems</h4>
                <p className="text-xs text-muscat-primary/60">5 zones monitored</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muscat-primary">4 Operational</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muscat-primary">1 Warning</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 transition-all border rounded-lg border-muscat-primary/5 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-muscat-gold/10">
                <Zap className="w-5 h-5 text-muscat-gold" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-muscat-primary">Electrical Systems</h4>
                <p className="text-xs text-muscat-primary/60">8 substations</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muscat-primary">7 Operational</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span className="text-xs text-muscat-primary">1 Warning</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 transition-all border rounded-lg border-muscat-primary/5 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-muscat-lavender/10">
                <Factory className="w-5 h-5 text-muscat-lavender" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-muscat-primary">STP Operations</h4>
                <p className="text-xs text-muscat-primary/60">4 process units</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muscat-primary">All Operational</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muscat-primary">Maintenance Due</span>
              </div>
            </div>
          </div>
          
          <div className="p-4 transition-all border rounded-lg border-muscat-primary/5 hover:shadow-md">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-lg bg-muscat-primary/10">
                <PumpIcon className="w-5 h-5 text-muscat-primary" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-muscat-primary">Pumping Network</h4>
                <p className="text-xs text-muscat-primary/60">5 major stations</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muscat-primary">4 Operational</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-xs text-muscat-primary">1 Maintenance</span>
              </div>
            </div>
          </div>
        </div>
      </DashboardCard>
    </Layout>
  );
};

export default Index;

import { cn } from '@/lib/utils';
