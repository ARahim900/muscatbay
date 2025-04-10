
import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

interface WaterMeterData {
  meter_label: string;
  account_number: string;
  zone: string;
  type: string;
  parent_meter: string;
  label: string;
  jan_25: number;
  feb_25: number;
  mar_25: number;
  total: number;
}

interface AggregatedData {
  name: string;
  jan_25: number;
  feb_25: number;
  mar_25: number;
  total: number;
}

interface WaterDashboardProps {
  meterData: WaterMeterData[];
  zoneData: AggregatedData[];
  typeData: AggregatedData[];
}

const WaterDashboard: React.FC<WaterDashboardProps> = ({ meterData, zoneData, typeData }) => {
  const [tab, setTab] = useState<'overview' | 'zones' | 'types'>('overview');
  const [selectedMonth, setSelectedMonth] = useState<'jan_25' | 'feb_25' | 'mar_25'>('mar_25');
  
  const months = [
    { value: 'jan_25', label: 'January 2025' },
    { value: 'feb_25', label: 'February 2025' },
    { value: 'mar_25', label: 'March 2025' }
  ];
  
  // Calculate total consumption for the selected month
  const totalConsumption = meterData.reduce((sum, meter) => sum + (meter[selectedMonth] || 0), 0);
  
  // Prepare data for consumption by zone chart
  const zoneChartData = zoneData
    .filter(zone => zone.name !== 'Main Bulk')
    .map(zone => ({
      name: zone.name.replace('Zone_', 'Zone '),
      value: zone[selectedMonth] || 0
    }))
    .sort((a, b) => b.value - a.value);
  
  // Prepare data for consumption by type chart
  const typeChartData = typeData
    .map(type => ({
      name: type.name,
      value: type[selectedMonth] || 0
    }))
    .sort((a, b) => b.value - a.value);
  
  // Prepare data for monthly trend chart
  const monthlyTrendData = [
    { name: 'Jan', consumption: zoneData.reduce((sum, zone) => sum + (zone.jan_25 || 0), 0) },
    { name: 'Feb', consumption: zoneData.reduce((sum, zone) => sum + (zone.feb_25 || 0), 0) },
    { name: 'Mar', consumption: zoneData.reduce((sum, zone) => sum + (zone.mar_25 || 0), 0) }
  ];
  
  // Prepare top 10 consumers for the selected month
  const topConsumers = [...meterData]
    .sort((a, b) => (b[selectedMonth] || 0) - (a[selectedMonth] || 0))
    .slice(0, 10);
  
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16', '#6366f1', '#a855f7'];
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold">Water Consumption Dashboard</h2>
          <p className="text-sm text-gray-500">Data through March 2025</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Month:</span>
          <select 
            className="border-gray-300 rounded-md text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value as any)}
          >
            {months.map(month => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="flex space-x-2 border-b pb-2">
        <button
          className={`px-3 py-2 font-medium text-sm rounded-md ${
            tab === 'overview'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('overview')}
        >
          Overview
        </button>
        <button
          className={`px-3 py-2 font-medium text-sm rounded-md ${
            tab === 'zones'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('zones')}
        >
          By Zone
        </button>
        <button
          className={`px-3 py-2 font-medium text-sm rounded-md ${
            tab === 'types'
              ? 'bg-blue-100 text-blue-700'
              : 'text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setTab('types')}
        >
          By Type
        </button>
      </div>
      
      {tab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-1">Total Consumption</h3>
              <p className="text-3xl font-bold text-blue-600">{totalConsumption.toLocaleString()} m³</p>
              <p className="text-sm text-gray-500">{months.find(m => m.value === selectedMonth)?.label}</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-1">Meters</h3>
              <p className="text-3xl font-bold text-green-600">{meterData.length}</p>
              <p className="text-sm text-gray-500">Active water meters</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-1">Zones</h3>
              <p className="text-3xl font-bold text-orange-600">{zoneData.filter(z => z.name !== 'Main Bulk').length}</p>
              <p className="text-sm text-gray-500">Distribution zones</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Monthly Trend</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} m³`, 'Consumption']} />
                    <Bar dataKey="consumption" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Consumption by Zone</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zoneChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {zoneChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} m³`, 'Consumption']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Top 10 Consumers</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meter
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account #
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consumption (m³)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {topConsumers.map((meter, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {meter.meter_label}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {meter.account_number}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {meter.zone.replace('Zone_', 'Zone ')}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {meter.type}
                        </span>
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-blue-600">
                        {meter[selectedMonth].toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {tab === 'zones' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Consumption by Zone</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={zoneChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={100}
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} m³`, 'Consumption']} />
                    <Bar dataKey="value" name="Consumption" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Zone Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zoneChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {zoneChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} m³`, 'Consumption']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Zone Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Zone
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jan 2025 (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feb 2025 (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mar 2025 (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {zoneData
                    .filter(zone => zone.name !== 'Main Bulk')
                    .sort((a, b) => b[selectedMonth] - a[selectedMonth])
                    .map((zone, index) => {
                      const percentage = (zone[selectedMonth] / totalConsumption) * 100;
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {zone.name.replace('Zone_', 'Zone ')}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {zone.jan_25.toLocaleString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {zone.feb_25.toLocaleString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {zone.mar_25.toLocaleString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {zone.total.toLocaleString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-blue-600 font-medium">
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {tab === 'types' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Consumption by Type</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={typeChartData}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fontSize: 12 }}
                      width={140}
                    />
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} m³`, 'Consumption']} />
                    <Bar dataKey="value" name="Consumption" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-lg font-medium mb-4">Type Distribution</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={typeChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {typeChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${Number(value).toLocaleString()} m³`, 'Consumption']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium mb-4">Usage Type Details</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Jan 2025 (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Feb 2025 (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mar 2025 (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {typeData
                    .sort((a, b) => b[selectedMonth] - a[selectedMonth])
                    .map((type, index) => {
                      const percentage = (type[selectedMonth] / totalConsumption) * 100;
                      return (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                            {type.name}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {type.jan_25.toLocaleString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {type.feb_25.toLocaleString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {type.mar_25.toLocaleString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                            {type.total.toLocaleString()}
                          </td>
                          <td className="px-6 py-2 whitespace-nowrap text-sm text-green-600 font-medium">
                            {percentage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WaterDashboard;
