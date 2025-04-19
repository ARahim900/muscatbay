
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
  ResponsiveContainer
} from 'recharts';
import { Droplets } from 'lucide-react';
import WaterFilters from '@/components/water/WaterFilters';

const WaterZoneAnalysis = () => {
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

  const zoneData = Object.entries(waterData.zones).map(([zone, data]) => ({
    zone,
    consumption: data.consumption,
    loss: data.loss
  }));

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
            <div className="flex items-center">
              <Droplets className="h-6 w-6 mr-2 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-800">Zone Analysis</h1>
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

          {/* Zone Consumption Chart */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Zone Consumption & Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={zoneData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => formatNumber(value)} />
                    <Legend />
                    <Bar dataKey="consumption" fill="#4285F4" name="Consumption" />
                    <Bar dataKey="loss" fill="#EA4335" name="Loss" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Zone Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {zoneData.map((zone) => (
              <Card key={zone.zone}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Zone {zone.zone}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Consumption:</span>
                      <span className="ml-2 font-semibold text-blue-600">
                        {formatNumber(zone.consumption)} m³
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Loss:</span>
                      <span className="ml-2 font-semibold text-red-600">
                        {formatNumber(zone.loss)} m³
                      </span>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Loss Rate:</span>
                      <span className="ml-2 font-semibold text-orange-600">
                        {((zone.loss / (zone.consumption + zone.loss)) * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default WaterZoneAnalysis;
