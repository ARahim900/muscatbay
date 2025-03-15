
import React, { useState } from 'react';
import Layout from '@/components/layout/Layout';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AirVent, Calendar, Download, Filter, ChevronDown, Plus, Settings, TrendingUp, TrendingDown, Users, Clock, AlertTriangle, Wrench, ThermometerSun, ThermometerSnowflake, CheckCircle, XCircle } from 'lucide-react';

// Define type interfaces for chart data
interface MonthlyTrendDataPoint {
  name: string;
  value: number;
}

interface MaintenanceFrequencyDataPoint {
  name: string;
  value: number;
  color: string;
}

// Sample data for HVAC dashboard
const monthlyTrendData: MonthlyTrendDataPoint[] = [
  { name: 'Jan', value: 250 },
  { name: 'Feb', value: 280 },
  { name: 'Mar', value: 300 },
  { name: 'Apr', value: 450 },
  { name: 'May', value: 380 },
  { name: 'Jun', value: 500 },
  { name: 'Jul', value: 550 },
  { name: 'Aug', value: 620 },
  { name: 'Sep', value: 480 },
  { name: 'Oct', value: 350 },
  { name: 'Nov', value: 300 },
  { name: 'Dec', value: 280 },
];

// Data for maintenance frequency by type
const maintenanceFrequencyData: MaintenanceFrequencyDataPoint[] = [
  { name: 'Preventive', value: 65, color: '#4ade80' },
  { name: 'Reactive', value: 25, color: '#f97316' },
  { name: 'Emergency', value: 10, color: '#ef4444' }
];

// Data for component health
const componentHealthData = [
  { name: 'Chillers', working: 12, maintenance: 2, total: 14 },
  { name: 'AHUs', working: 38, maintenance: 4, total: 42 },
  { name: 'Fans', working: 120, maintenance: 8, total: 128 },
  { name: 'Pumps', working: 28, maintenance: 6, total: 34 },
  { name: 'VAVs', working: 96, maintenance: 4, total: 100 },
];

// Equipment types for filtering
const equipmentTypes = [
  'All', 'Chillers', 'AHUs', 'FCUs', 'Pumps', 'Fans', 'VAVs', 'Dampers', 'Sensors'
];

// Main HVAC Dashboard component
const HVAC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [showPeriodDropdown, setShowPeriodDropdown] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState('All');
  const [showEquipmentDropdown, setShowEquipmentDropdown] = useState(false);
  
  // Format currency
  const formatCurrency = (value: number) => {
    return `OMR ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };
  
  // Calculate KPIs (example values)
  const kpis = {
    energyUsage: 532480, // kWh
    monthlyCost: 42318, // OMR
    incidents: 14,
    resolution: 92, // percentage
    coolingLoad: 3260, // kW
    occupancyRate: 81, // percentage
  };
  
  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white p-4 flex justify-between items-center mb-4 rounded-lg shadow-sm">
          <div className="flex items-center">
            <div className="flex items-center justify-center p-2 w-10 h-10 rounded bg-indigo-600 text-white mr-3">
              <AirVent size={20} />
            </div>
            <h1 className="text-2xl font-bold">Muscat Bay HVAC Management</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Period Selector */}
            <div className="relative">
              <button
                onClick={() => setShowPeriodDropdown(!showPeriodDropdown)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-md"
              >
                <Calendar size={16} className="text-gray-500" />
                <span>Period: {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              
              {showPeriodDropdown && (
                <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1">
                    {['day', 'week', 'month', 'quarter', 'year'].map(period => (
                      <button
                        key={period}
                        onClick={() => {
                          setSelectedPeriod(period);
                          setShowPeriodDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          selectedPeriod === period ? 'bg-indigo-100 text-indigo-900' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {period.charAt(0).toUpperCase() + period.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Equipment Filter */}
            <div className="relative">
              <button
                onClick={() => setShowEquipmentDropdown(!showEquipmentDropdown)}
                className="flex items-center space-x-2 px-3 py-2 border border-gray-200 rounded-md"
              >
                <Filter size={16} className="text-gray-500" />
                <span>Equipment: {selectedEquipment}</span>
                <ChevronDown size={16} className="text-gray-500" />
              </button>
              
              {showEquipmentDropdown && (
                <div className="absolute z-10 mt-1 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                  <div className="py-1 max-h-64 overflow-y-auto">
                    {equipmentTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => {
                          setSelectedEquipment(type);
                          setShowEquipmentDropdown(false);
                        }}
                        className={`block w-full text-left px-4 py-2 text-sm ${
                          selectedEquipment === type ? 'bg-indigo-100 text-indigo-900' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Report Download */}
            <button className="px-3 py-2 bg-indigo-600 text-white rounded-md flex items-center">
              <Download size={16} className="mr-2" />
              <span>Report</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Energy Usage</p>
                <h3 className="text-3xl font-bold mt-1">{kpis.energyUsage.toLocaleString()} kWh</h3>
                <p className="text-sm mt-2 font-medium text-green-600 flex items-center">
                  <TrendingDown className="mr-1" size={16} />
                  <span>4.2% vs. last {selectedPeriod}</span>
                </p>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <ThermometerSun size={24} className="text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Monthly Cost</p>
                <h3 className="text-3xl font-bold mt-1">{formatCurrency(kpis.monthlyCost)}</h3>
                <p className="text-sm mt-2 font-medium text-green-600 flex items-center">
                  <TrendingDown className="mr-1" size={16} />
                  <span>2.8% vs. last {selectedPeriod}</span>
                </p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <Download size={24} className="text-indigo-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Incidents</p>
                <h3 className="text-3xl font-bold mt-1">{kpis.incidents}</h3>
                <p className="text-sm mt-2 font-medium text-green-600 flex items-center">
                  <TrendingDown className="mr-1" size={16} />
                  <span>3 less than last {selectedPeriod}</span>
                </p>
              </div>
              <div className="p-3 bg-orange-50 rounded-full">
                <AlertTriangle size={24} className="text-orange-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolution Rate</p>
                <h3 className="text-3xl font-bold mt-1">{kpis.resolution}%</h3>
                <p className="text-sm mt-2 font-medium text-red-600 flex items-center">
                  <TrendingUp className="mr-1" size={16} />
                  <span>1.2% vs. last {selectedPeriod}</span>
                </p>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <CheckCircle size={24} className="text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Cooling Load</p>
                <h3 className="text-3xl font-bold mt-1">{kpis.coolingLoad} kW</h3>
                <p className="text-sm mt-2 font-medium text-green-600 flex items-center">
                  <TrendingDown className="mr-1" size={16} />
                  <span>5.1% vs. last {selectedPeriod}</span>
                </p>
              </div>
              <div className="p-3 bg-cyan-50 rounded-full">
                <ThermometerSnowflake size={24} className="text-cyan-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-300">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">Occupancy Rate</p>
                <h3 className="text-3xl font-bold mt-1">{kpis.occupancyRate}%</h3>
                <p className="text-sm mt-2 font-medium text-green-600 flex items-center">
                  <TrendingUp className="mr-1" size={16} />
                  <span>2.3% vs. last {selectedPeriod}</span>
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-full">
                <Users size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Energy Consumption Trend */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Energy Consumption Trend</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="Energy (kWh)" stroke="#4f46e5" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Maintenance Distribution */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
            <h2 className="text-lg font-medium mb-4">Maintenance Distribution</h2>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={maintenanceFrequencyData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  >
                    {maintenanceFrequencyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Component Health */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Component Health Overview</h2>
            <button className="text-indigo-600 hover:text-indigo-700 font-medium flex items-center">
              <Settings size={16} className="mr-1" />
              Configure
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Component</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Under Maintenance</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Health</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {componentHealthData.map((component, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{component.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">{component.working}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600">{component.maintenance}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{component.total}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-green-600 h-2.5 rounded-full"
                          style={{ width: `${(component.working / component.total * 100)}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default HVAC;
