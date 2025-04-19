
import React from 'react';
import { useWaterSystem } from '@/hooks/useWaterSystem';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Droplets, BarChart2, PieChart as PieChartIcon, TrendingUp } from 'lucide-react';
import WaterFilters from '@/components/water/WaterFilters';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { ModernDonutChart } from '@/components/ui/modern-donut-chart';
import StatCard from '@/components/dashboard/StatCard';

const WaterDashboard = () => {
  const {
    waterData,
    loading,
    error,
    filters,
    availableZones,
    availableTypes,
    updateFilters
  } = useWaterSystem();
  
  const navigate = useNavigate();

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="p-8">
          <div className="text-red-500">Error: {error}</div>
        </div>
      </Layout>
    );
  }

  if (!waterData) {
    return (
      <Layout>
        <div className="p-8">No data available</div>
      </Layout>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  // Create data for level distribution pie chart
  const levelData = [
    { name: 'Main Bulk (L1)', value: waterData.levels.L1 },
    { name: 'Zone Bulk (L2)', value: waterData.levels.L2 },
    { name: 'Individual (L3)', value: waterData.levels.L3 }
  ];

  // Create data for type distribution chart
  const typeData = Object.entries(waterData.types).map(([type, value]) => ({
    name: type,
    value
  })).sort((a, b) => b.value - a.value);

  // Create data for zone distribution chart
  const zoneData = Object.entries(waterData.zones).map(([zone, data]) => ({
    name: zone,
    consumption: data.consumption,
    loss: data.loss
  }));

  // Monthly trends data
  const monthlyData = Object.entries(waterData.monthlyTrends).map(([month, data]) => ({
    month: month.replace('_', ' ').toUpperCase(),
    consumption: data.consumption,
    loss: data.loss
  }));

  // Calculate loss percentage
  const totalConsumption = waterData.levels.L1;
  const totalLoss = waterData.losses.systemLoss;
  const lossPercentage = (totalLoss / totalConsumption) * 100;

  // Colors for charts
  const COLORS = {
    L1: '#4285F4',  // Blue
    L2: '#34A853',  // Green
    L3: '#FBBC05',  // Yellow/Gold
    loss: '#EA4335', // Red
    residential: '#8E24AA', // Purple
    retail: '#00ACC1', // Cyan
    irrigation: '#7CB342', // Light Green
    common: '#FB8C00', // Orange
  };

  const PIE_COLORS = ['#4285F4', '#34A853', '#FBBC05', '#EA4335', '#8E24AA', '#00ACC1'];

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
            <div className="flex items-center">
              <Droplets className="h-6 w-6 mr-2 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-800">Water Management Dashboard</h1>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          <WaterFilters 
            filters={filters}
            availableZones={availableZones}
            availableTypes={availableTypes}
            onFilterChange={updateFilters}
            onReset={() => updateFilters({
              month: 'feb_25',
              zone: 'all',
              type: 'all'
            })}
          />

          {/* Dashboard Navigation */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button 
              variant="outline" 
              className="bg-blue-50 border-blue-200 hover:bg-blue-100"
              onClick={() => navigate('/water-system')}
            >
              <Droplets className="mr-2 h-4 w-4 text-blue-600" />
              System Overview
            </Button>
            <Button 
              variant="outline" 
              className="bg-green-50 border-green-200 hover:bg-green-100"
              onClick={() => navigate('/water-zone-analysis')}
            >
              <BarChart2 className="mr-2 h-4 w-4 text-green-600" />
              Zone Analysis
            </Button>
            <Button 
              variant="outline" 
              className="bg-purple-50 border-purple-200 hover:bg-purple-100"
              onClick={() => navigate('/water-consumption-types')}
            >
              <PieChartIcon className="mr-2 h-4 w-4 text-purple-600" />
              Consumption by Type
            </Button>
            <Button 
              variant="outline" 
              className="bg-red-50 border-red-200 hover:bg-red-100"
              onClick={() => navigate('/water-loss-analysis')}
            >
              <TrendingUp className="mr-2 h-4 w-4 text-red-600" />
              Loss Analysis
            </Button>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <StatCard
              title="Total Consumption"
              value={formatNumber(totalConsumption) + " m³"}
              icon={Droplets}
              color="primary"
              description={`For ${filters.month.replace('_', ' ').toUpperCase()}`}
            />
            
            <StatCard
              title="Individual Meters (L3)"
              value={formatNumber(waterData.levels.L3) + " m³"}
              icon={Droplets}
              color="teal"
              description={`${((waterData.levels.L3 / totalConsumption) * 100).toFixed(1)}% of total`}
            />
            
            <StatCard
              title="Water Loss"
              value={formatNumber(totalLoss) + " m³"}
              icon={Droplets}
              color="lavender"
              description={`${lossPercentage.toFixed(1)}% loss rate`}
            />
            
            <StatCard
              title="Financial Impact"
              value={formatNumber(waterData.losses.financialImpact) + " OMR"}
              icon={Droplets}
              color="gold"
              description="Based on water rate of 3.5 OMR/m³"
            />
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="overview" className="mb-6">
            <TabsList className="mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="consumption">Consumption</TabsTrigger>
              <TabsTrigger value="loss">Loss Analysis</TabsTrigger>
              <TabsTrigger value="types">Meter Types</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Distribution by Level */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribution by Meter Level</CardTitle>
                    <CardDescription>Consumption breakdown by meter hierarchy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ModernDonutChart
                        data={levelData}
                        title="Meter Level Distribution"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Monthly Trend Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Monthly Consumption & Loss</CardTitle>
                    <CardDescription>Trend over last 12 months</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={monthlyData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 25,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="month" 
                            angle={-45} 
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => formatNumber(value) + " m³"} />
                          <Legend />
                          <Line
                            type="monotone"
                            dataKey="consumption"
                            stroke={COLORS.L1}
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="loss"
                            stroke={COLORS.loss}
                            activeDot={{ r: 8 }}
                            strokeWidth={2}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="consumption">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Zone Consumption Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Consumption by Zone</CardTitle>
                    <CardDescription>Water usage across different zones</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={zoneData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatNumber(value) + " m³"} />
                          <Legend />
                          <Bar dataKey="consumption" name="Consumption" fill={COLORS.L1} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Type Distribution Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Consumption by Type</CardTitle>
                    <CardDescription>Water usage by consumer type</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={typeData}
                            cx="50%"
                            cy="50%"
                            labelLine={true}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          >
                            {typeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => formatNumber(value) + " m³"} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="loss">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Loss By Zone Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Water Loss by Zone</CardTitle>
                    <CardDescription>Volume of water lost in each zone</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={zoneData}
                          margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip formatter={(value) => formatNumber(value) + " m³"} />
                          <Legend />
                          <Bar dataKey="loss" name="Loss" fill={COLORS.loss} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Loss Impact Card */}
                <Card className="bg-gradient-to-br from-red-50 to-pink-50 border-red-200">
                  <CardHeader>
                    <CardTitle className="text-red-700">Financial Impact of Water Loss</CardTitle>
                    <CardDescription className="text-red-600">Based on water rate of 3.5 OMR/m³</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col space-y-4">
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                        <span className="font-medium">Total Loss Value:</span>
                        <span className="text-xl font-bold text-red-600">
                          {formatNumber(waterData.losses.financialImpact)} OMR
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                        <span className="font-medium">Loss Rate:</span>
                        <span className="text-xl font-bold text-red-600">
                          {lossPercentage.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-4 bg-white rounded-lg shadow-sm">
                        <span className="font-medium">Annual Projection:</span>
                        <span className="text-xl font-bold text-red-600">
                          {formatNumber(waterData.losses.financialImpact * 12)} OMR
                        </span>
                      </div>
                      
                      <div className="p-4 bg-white rounded-lg shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium">Potential Savings (10% Reduction):</span>
                          <span className="text-xl font-bold text-green-600">
                            {formatNumber(waterData.losses.financialImpact * 0.1)} OMR
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '10%' }}></div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="types">
              <div className="grid grid-cols-1 gap-6 mb-6">
                {/* Types Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Detailed Consumption by Meter Type</CardTitle>
                    <CardDescription>Breakdown of water usage by consumer category</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={typeData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 70,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45} 
                            textAnchor="end" 
                            height={70}
                          />
                          <YAxis />
                          <Tooltip formatter={(value) => formatNumber(value) + " m³"} />
                          <Legend />
                          <Bar dataKey="value" name="Consumption" fill="#8884d8">
                            {typeData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Detailed Zone Cards */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Zone Performance Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {zoneData.map((zone) => (
                <Card key={zone.name} className="border-l-4" style={{ borderLeftColor: PIE_COLORS[zoneData.indexOf(zone) % PIE_COLORS.length] }}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{zone.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Consumption:</span>
                        <span className="font-medium">{formatNumber(zone.consumption)} m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Loss:</span>
                        <span className="font-medium text-red-600">{formatNumber(zone.loss)} m³</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Loss Rate:</span>
                        <span className="font-medium text-amber-600">
                          {((zone.loss / (zone.consumption + zone.loss)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-500">Financial Impact:</span>
                        <span className="font-medium text-red-600">{formatNumber(zone.loss * 3.5)} OMR</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WaterDashboard;
