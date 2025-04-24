import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Droplets, TrendingDown, Gauge, Filter } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MetricCard } from '@/components/water-system/MetricCard';
import { FilterButton } from '@/components/water-system/FilterButton';
import { CustomTooltip } from '@/components/water-system/CustomTooltip';
import { formatNumber } from "@/lib/utils";
import { themes } from '@/lib/theme-config';
import { waterData } from '@/data/water-data';
import type { WaterMetrics, ZoneData, TypeData, WaterSystemMetrics } from '@/types/water';

// Sample data based on the waterData schema
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function WaterDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [darkMode, setDarkMode] = useState(false);
  const [zoneFilter, setZoneFilter] = useState('All Zones');
  const [typeFilter, setTypeFilter] = useState('All Types');
  const [metrics, setMetrics] = useState<WaterSystemMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const theme = darkMode ? themes.dark : themes.light;

  // Initialize metrics from waterData
  useEffect(() => {
    // This is a simulation of data fetching and processing
    setTimeout(() => {
      // Convert waterData to the metrics format
      const totalConsumption = waterData.total.consumption;
      const totalLoss = waterData.total.loss;
      const lossPercent = (totalLoss / totalConsumption) * 100;
      
      // Create metrics object
      const processedMetrics: WaterSystemMetrics = {
        total: {
          consumption: totalConsumption,
          loss: totalLoss,
          lossPercent: parseFloat(lossPercent.toFixed(1))
        },
        zones: waterData.zones.map(zone => ({
          zone: zone.name,
          consumption: zone.consumption,
          loss: zone.loss,
          lossPercent: parseFloat(((zone.loss / zone.consumption) * 100).toFixed(1))
        })),
        types: [
          { type: 'Residential', value: waterData.zones[0].consumption, percentage: parseFloat(((waterData.zones[0].consumption / totalConsumption) * 100).toFixed(1)) },
          { type: 'Commercial', value: waterData.zones[1].consumption, percentage: parseFloat(((waterData.zones[1].consumption / totalConsumption) * 100).toFixed(1)) },
          { type: 'Landscape', value: waterData.zones[2].consumption, percentage: parseFloat(((waterData.zones[2].consumption / totalConsumption) * 100).toFixed(1)) },
          { type: 'Amenities', value: waterData.zones[3].consumption, percentage: parseFloat(((waterData.zones[3].consumption / totalConsumption) * 100).toFixed(1)) }
        ],
        monthly: {
          'Jan': { consumption: 4100, loss: 246 },
          'Feb': { consumption: 3800, loss: 228 },
          'Mar': { consumption: 4300, loss: 258 },
          'Apr': { consumption: 4500, loss: 270 },
          'May': { consumption: 4800, loss: 288 },
          'Jun': { consumption: 5200, loss: 312 },
          'Jul': { consumption: 5400, loss: 324 },
          'Aug': { consumption: 5200, loss: 312 },
          'Sep': { consumption: 4900, loss: 294 },
          'Oct': { consumption: 4600, loss: 276 },
          'Nov': { consumption: 4200, loss: 252 },
          'Dec': { consumption: 4000, loss: 240 }
        }
      };
      
      setMetrics(processedMetrics);
      setIsLoading(false);
    }, 1000);
  }, []);

  // Process data for charts
  const monthlyData = metrics ? Object.entries(metrics.monthly).map(([month, data]) => ({
    name: month,
    Consumption: data.consumption,
    Loss: data.loss
  })) : [];

  const zoneData = metrics ? metrics.zones.map(zone => ({
    name: zone.zone,
    Consumption: zone.consumption,
    Loss: zone.loss,
    LossPercent: zone.lossPercent
  })) : [];

  const typeData = metrics ? metrics.types.map(type => ({
    name: type.type,
    value: type.value,
    percentage: type.percentage
  })) : [];

  // CSV Export function
  const exportToCSV = () => {
    if (!metrics) return;
    
    const headers = ['Zone', 'Consumption (m³)', 'Loss (m³)', 'Loss Percentage (%)'];
    const rows = metrics.zones.map(zone => [
      zone.zone,
      zone.consumption.toString(),
      zone.loss.toString(),
      zone.lossPercent.toString()
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'water-consumption-by-zone.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format for displaying zone metrics
  const getZoneMetricsDisplay = (data: ZoneData | null) => {
    if (!data || !metrics) return null;
    
    return (
      <div className="text-gray-700 dark:text-gray-300 text-sm mt-3">
        <p>Consumption: {formatNumber(data.consumption)} m³</p>
        <p>Loss: {formatNumber(data.loss)} m³ ({formatNumber(data.lossPercent, 1)}%)</p>
        <p>Portion of Total: {formatNumber((data.consumption / metrics.total.consumption) * 100, 1)}%</p>
      </div>
    );
  };

  if (isLoading || !metrics) {
    return <div className="p-8 flex justify-center items-center h-full">Loading water system metrics...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Droplets size={28} className="text-blue-500" />
            <h1 className="text-3xl font-bold">Water System</h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Monitoring, analysis, and management of water consumption and efficiency
          </p>
        </div>
        
        <div className="flex gap-2">
          <FilterButton 
            onClick={() => {}} 
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            2025 <span className="opacity-75">▼</span>
          </FilterButton>
          <FilterButton 
            onClick={() => {}} 
            className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            April <span className="opacity-75">▼</span>
          </FilterButton>
          <FilterButton 
            onClick={exportToCSV}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            Export
          </FilterButton>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="zones">Zones Analysis</TabsTrigger>
          <TabsTrigger value="types">Types Breakdown</TabsTrigger>
          <TabsTrigger value="loss">Loss Analysis</TabsTrigger>
        </TabsList>
        
        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing: System-wide water metrics for April 2025
          </div>
          
          {/* Metric Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Consumption"
              value={metrics.total.consumption}
              unit="m³"
              trend={3.2}
              icon={<Droplets size={20} className="text-blue-500" />}
              className="border-l-4 border-blue-500"
              lossPercent={0}
              secondaryValue={0}
              secondaryUnit=""
            />
            <MetricCard
              title="System Efficiency"
              value={100 - metrics.total.lossPercent}
              unit="%"
              trend={-0.5}
              icon={<Gauge size={20} className="text-green-500" />}
              className="border-l-4 border-green-500"
              lossPercent={0}
              secondaryValue={0}
              secondaryUnit=""
            />
            <MetricCard
              title="Water Loss"
              value={metrics.total.loss}
              unit="m³"
              trend={1.8}
              icon={<TrendingDown size={20} className="text-red-500" />}
              className="border-l-4 border-red-500"
              lossPercent={0}
              secondaryValue={0}
              secondaryUnit=""
            />
          </div>
          
          {/* Monthly Consumption Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Consumption</CardTitle>
              <CardDescription>Water usage trend over the past 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="Consumption" 
                    stroke="#0088FE" 
                    strokeWidth={2} 
                    dot={{ r: 3 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Loss" 
                    stroke="#FF8042" 
                    strokeWidth={2} 
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          
          {/* Zone Distribution */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Consumption by Zone</CardTitle>
                <CardDescription>Distribution across different areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={zoneData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar dataKey="Consumption" fill="#0088FE" />
                    <Bar dataKey="Loss" fill="#FF8042" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Type Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Consumption by Type</CardTitle>
                <CardDescription>Water usage by category</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center items-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={typeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Other tabs content would go here */}
        <TabsContent value="zones" className="space-y-6">
          <div className="text-sm text-gray-500">
            Showing: Zone-specific water consumption and loss metrics
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Residential Zone"
              value={metrics.zones[0].consumption}
              unit="m³"
              lossPercent={metrics.zones[0].lossPercent}
              trend={2.1}
              icon={<Droplets size={20} className="text-blue-500" />}
              className="border-l-4 border-blue-500"
              secondaryValue={metrics.zones[0].loss}
              secondaryUnit="m³ loss"
            />
            <MetricCard
              title="Commercial Zone"
              value={metrics.zones[1].consumption}
              unit="m³"
              lossPercent={metrics.zones[1].lossPercent}
              trend={-1.2}
              icon={<Droplets size={20} className="text-green-500" />}
              className="border-l-4 border-green-500"
              secondaryValue={metrics.zones[1].loss}
              secondaryUnit="m³ loss"
            />
            <MetricCard
              title="Landscape Zone"
              value={metrics.zones[2].consumption}
              unit="m³"
              lossPercent={metrics.zones[2].lossPercent}
              trend={3.8}
              icon={<Droplets size={20} className="text-amber-500" />}
              className="border-l-4 border-amber-500"
              secondaryValue={metrics.zones[2].loss}
              secondaryUnit="m³ loss"
            />
          </div>
          
          {/* More zone analysis content would go here */}
        </TabsContent>
        
        <TabsContent value="types" className="space-y-6">
          <div className="text-sm text-gray-500">
            Showing: Water consumption by usage type
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Residential"
              value={metrics.types[0].value}
              unit="m³"
              icon={<Droplets size={20} className="text-blue-500" />}
              className="border-l-4 border-blue-500"
              trend={0}
              lossPercent={0}
              secondaryValue={`${metrics.types[0].percentage}% of total`}
              secondaryUnit=""
            />
            <MetricCard
              title="Commercial"
              value={metrics.types[1].value}
              unit="m³"
              icon={<Droplets size={20} className="text-green-500" />}
              className="border-l-4 border-green-500" 
              trend={0}
              lossPercent={0}
              secondaryValue={`${metrics.types[1].percentage}% of total`}
              secondaryUnit=""
            />
          </div>
          
          {/* More type breakdown content would go here */}
        </TabsContent>
        
        <TabsContent value="loss" className="space-y-6">
          <div className="text-sm text-gray-500">
            Showing: Water loss analysis and financial impact
          </div>
          
          {/* Loss analysis content would go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
