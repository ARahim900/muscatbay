
import React from 'react';
import { useWaterSystem } from '@/hooks/useWaterSystem';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Droplets, BarChart2 } from 'lucide-react';
import WaterFilters from '@/components/water/WaterFilters';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { ResponsiveBarChart } from '@/components/ui/responsive-chart';

const WaterLossAnalysis = () => {
  const {
    waterData,
    loading,
    error,
    filters,
    availableZones,
    availableTypes,
    updateFilters
  } = useWaterSystem();

  if (loading) return <Layout><div className="p-8">Loading...</div></Layout>;
  if (error) return <Layout><div className="p-8 text-red-500">Error: {error}</div></Layout>;
  if (!waterData) return <Layout><div className="p-8">No data available</div></Layout>;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(Math.round(num));
  };

  const formatCurrency = (amount: number) => {
    return `${formatNumber(amount)} OMR`;
  };

  // Prepare data for zone loss chart
  const zoneLossData = Object.entries(waterData.losses.zoneLosses).map(([zone, loss]) => ({
    zone,
    loss
  }));
  
  // Calculate loss percentage by zone
  const zonePercentageData = zoneLossData.map(item => {
    const zoneTotal = waterData.zones[item.zone]?.consumption || 0;
    const percentage = (item.loss / (zoneTotal + item.loss)) * 100;
    return {
      ...item,
      percentage: isNaN(percentage) ? 0 : percentage
    };
  }).sort((a, b) => b.percentage - a.percentage);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#4CAF50'];

  return (
    <Layout>
      <StandardPageLayout
        title="Water Loss Analysis"
        description="Monitor and analyze water losses across zones and their financial impact"
        icon={<Droplets className="h-6 w-6 text-blue-600" />}
        headerColor="bg-gradient-to-r from-blue-50 to-cyan-50"
      >
        {/* Filters */}
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

        {/* System Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-red-700">Total System Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-red-600">{formatNumber(waterData.losses.systemLoss)}</span>
                <span className="text-gray-500">m³</span>
              </div>
              <p className="text-sm text-red-600 mt-1">
                {((waterData.losses.systemLoss / (waterData.levels.L1)) * 100).toFixed(1)}% of total water supply
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-amber-700">Financial Impact</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-bold text-amber-600">{formatNumber(waterData.losses.financialImpact)}</span>
                <span className="text-gray-500">OMR</span>
              </div>
              <p className="text-sm text-amber-600 mt-1">
                Based on 3.5 OMR per cubic meter rate
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-blue-700">Highest Loss Zone</CardTitle>
            </CardHeader>
            <CardContent>
              {zonePercentageData.length > 0 ? (
                <>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold text-blue-600">{zonePercentageData[0].zone}</span>
                  </div>
                  <p className="text-sm text-blue-600 mt-1">
                    {formatNumber(zonePercentageData[0].loss)} m³ ({zonePercentageData[0].percentage.toFixed(1)}% loss)
                  </p>
                </>
              ) : (
                <p>No zone data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Loss by Zone Chart */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <BarChart2 className="mr-2 h-5 w-5 text-blue-600" />
              Water Loss by Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={zoneLossData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="zone" />
                  <YAxis label={{ value: 'Volume (m³)', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                  <Legend />
                  <Bar dataKey="loss" fill="#FF8042" name="Water Loss (m³)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Loss Percentage by Zone */}
        <Card className="mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center text-xl">
              <BarChart2 className="mr-2 h-5 w-5 text-red-600" />
              Loss Percentage by Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-96">
              <ResponsiveBarChart
                data={zonePercentageData}
                xKey="zone"
                yKey="percentage"
                barColor="#FF4842"
                height={400}
                barRadius={[4, 4, 0, 0]}
                xLabel="Zone"
                yLabel="Loss Percentage (%)"
                yFormatter={(value) => `${value.toFixed(1)}%`}
              />
            </div>
          </CardContent>
        </Card>

        {/* Financial Impact Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Financial Impact by Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={zoneLossData.map(item => ({
                        name: item.zone,
                        value: item.loss * 3.5 // Convert to OMR
                      }))}
                      cx="50%"
                      cy="50%"
                      labelLine={true}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    >
                      {zoneLossData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Loss Details by Zone</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Water Loss (m³)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss %</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Financial Impact</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {zonePercentageData.map((zone) => (
                      <tr key={zone.zone}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone.zone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(zone.loss)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{zone.percentage.toFixed(1)}%</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCurrency(zone.loss * 3.5)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Optimization Opportunities Card */}
        <Card className="border-l-4 border-l-green-500 mb-6">
          <CardHeader className="pb-2">
            <CardTitle className="text-green-700">Optimization Opportunities</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {zonePercentageData.slice(0, 3).map((zone) => (
                <li key={zone.zone} className="flex items-center space-x-2">
                  <span className="w-3 h-3 rounded-full bg-green-500"></span>
                  <span className="text-sm">
                    <strong>{zone.zone}:</strong> Reducing loss by 10% could save approximately 
                    <span className="text-green-600 font-medium ml-1">
                      {formatCurrency(zone.loss * 0.1 * 3.5)} per month
                    </span>
                  </span>
                </li>
              ))}
              <li className="flex items-center space-x-2 mt-4">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                <span className="text-sm">
                  <strong>System-wide:</strong> A 5% reduction in overall losses could save approximately 
                  <span className="text-blue-600 font-medium ml-1">
                    {formatCurrency(waterData.losses.systemLoss * 0.05 * 3.5)} per month
                  </span>
                </span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </StandardPageLayout>
    </Layout>
  );
};

export default WaterLossAnalysis;
