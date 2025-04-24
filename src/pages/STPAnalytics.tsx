
import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STPDailyData, STPMonthlyData } from '@/types/stp';
import { fetchData } from '@/services/dataService';

// Helper functions for formatting dates
const formatMonth = (month: string): string => {
  const [year, monthNum] = month.split('-');
  const date = new Date(parseInt(year), parseInt(monthNum) - 1);
  return date.toLocaleDateString('default', { month: 'long', year: 'numeric' });
};

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Helper function to calculate efficiency statistics
const calculateEfficiencyStats = (data: STPMonthlyData[]) => {
  const processingEfficiency = data.reduce((sum, record) => 
    sum + (parseFloat(record.processingEfficiency || '0') || 0), 0) / (data.length || 1);
    
  const utilizationPercentage = data.reduce((sum, record) => 
    sum + (parseFloat(record.utilizationPercentage || '0') || 0), 0) / (data.length || 1);
    
  return { processingEfficiency, utilizationPercentage };
};

const STPAnalytics: React.FC = () => {
  const [dailyData, setDailyData] = useState<STPDailyData[]>([]);
  const [monthlyData, setMonthlyData] = useState<STPMonthlyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Mock data fetching function for STP daily data
  const fetchSTPDailyData = async (): Promise<STPDailyData[]> => {
    return [
      {
        date: '2025-03-10',
        tankerTrips: 15,
        expectedVolumeTankers: 75000,
        directSewageMB: 120000,
        totalInfluent: 195000,
        totalWaterProcessed: 185000,
        tseToIrrigation: 175000,
        utilizationPercentage: '89.7%',
        processingEfficiency: '94.9%'
      },
      {
        date: '2025-03-11',
        tankerTrips: 16,
        expectedVolumeTankers: 80000,
        directSewageMB: 125000,
        totalInfluent: 205000,
        totalWaterProcessed: 194000,
        tseToIrrigation: 183000,
        utilizationPercentage: '91.5%',
        processingEfficiency: '94.6%'
      }
    ];
  };

  // Mock data fetching function for STP monthly data
  const fetchSTPMonthlyData = async (): Promise<STPMonthlyData[]> => {
    return [
      {
        month: '2025-01',
        tankerTrips: 450,
        expectedVolumeTankers: 2250000,
        directSewageMB: 3600000,
        totalInfluent: 5850000,
        totalWaterProcessed: 5550000,
        tseToIrrigation: 5250000,
        utilizationPercentage: '89.7%',
        processingEfficiency: '94.9%'
      },
      {
        month: '2025-02',
        tankerTrips: 420,
        expectedVolumeTankers: 2100000,
        directSewageMB: 3400000,
        totalInfluent: 5500000,
        totalWaterProcessed: 5225000,
        tseToIrrigation: 4950000,
        utilizationPercentage: '90.0%',
        processingEfficiency: '95.0%'
      }
    ];
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get daily and monthly data
        const fetchedDailyData = await fetchSTPDailyData();
        const fetchedMonthlyData = await fetchSTPMonthlyData();
        
        // Filter last 30 days
        const last30DaysData = fetchedDailyData;
        
        // Filter last 12 months
        const last12MonthsData = fetchedMonthlyData;
        
        setDailyData(last30DaysData);
        setMonthlyData(last12MonthsData);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load STP analytics data:', err);
        setError('Failed to load STP analytics data');
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-6">STP Analytics</h1>
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Loading STP analytics data...</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center">
                  <div className="animate-pulse flex space-x-4">
                    <div className="rounded-full bg-gray-200 h-12 w-12"></div>
                    <div className="flex-1 space-y-4 py-1">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-semibold mb-6">STP Analytics</h1>
          <Card className="bg-red-50 border-red-200">
            <CardHeader>
              <CardTitle className="text-red-800">Error Loading Data</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-600">{error}</p>
              <button 
                className="mt-4 bg-red-100 hover:bg-red-200 text-red-800 py-2 px-4 rounded"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-semibold mb-6">STP Analytics</h1>
        
        {/* Monthly Performance Overview */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Monthly Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {monthlyData.slice(0, 1).map((month, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-medium text-gray-700">{formatMonth(month.month)}</h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-sm text-gray-500">Processing Efficiency</span>
                      <p className="font-semibold text-lg">{month.processingEfficiency}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Utilization Rate</span>
                      <p className="font-semibold text-lg">{month.utilizationPercentage}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-500">Total Processed</span>
                      <p className="font-semibold text-lg">{(month.totalWaterProcessed / 1000).toFixed(1)} m³</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        {/* Daily Processing Records */}
        <Card>
          <CardHeader>
            <CardTitle>Daily Processing Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanker Trips</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Direct Sewage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Processed</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dailyData.map((record, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{formatDate(record.date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.tankerTrips}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(record.directSewageMB / 1000).toFixed(1)} m³</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{(record.totalWaterProcessed / 1000).toFixed(1)} m³</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.processingEfficiency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default STPAnalytics;
