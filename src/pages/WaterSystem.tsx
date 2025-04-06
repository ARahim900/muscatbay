
import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ChartOptions } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { faker } from '@faker-js/faker';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Droplets, FileBarChart, TrendingUp, TrendingDown, BarChart as BarChartIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { parseCSVFromClipboard, saveWaterData } from '@/utils/waterDataUtils';
import { WaterData } from '@/types/water';
import ImportWaterData from '@/components/water/ImportWaterData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const options: ChartOptions<'bar'> = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      grid: {
        display: false,
      },
    },
    y: {
      beginAtZero: true,
      ticks: {
        callback: function(value) {
          // Ensure we're only formatting numbers
          if (typeof value === 'number') {
            return formatter.format(value);
          }
          return value;
        }
      },
      grid: {
        color: 'rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: {
    legend: {
      display: false,
    },
  },
};

const formatter = new Intl.NumberFormat('en-US', {
  style: 'decimal',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const WaterSystem = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [monthlyData, setMonthlyData] = useState<any>({});
  const [consumptionByType, setConsumptionByType] = useState<any[]>([]);
  const [consumptionByZone, setConsumptionByZone] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('feb_25');
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [yearlyConsumption, setYearlyConsumption] = useState(0);
  const [monthlyChange, setMonthlyChange] = useState(0);

  // Add a type guard for monthly data
  const getMonthlyConsumption = (data: any) => {
    return {
      monthly: data?.monthly || 0,
      yearly: data?.yearly || 0
    };
  };

  useEffect(() => {
    fetchWaterData();
  }, []);

  const fetchWaterData = async () => {
    try {
      setLoading(true);
      
      // Fetch water consumption by type
      const { data: typeData, error: typeError } = await supabase
        .from('water_consumption_by_type')
        .select('*');
      
      if (typeError) throw typeError;
      
      // Fetch water consumption by zone
      const { data: zoneData, error: zoneError } = await supabase
        .from('water_consumption_by_zone')
        .select('*');
      
      if (zoneError) throw zoneError;
      
      // Fetch main bulk data for total consumption
      const { data: mainBulkData, error: bulkError } = await supabase
        .from('water_distribution_master')
        .select('*')
        .eq('type', 'Main BULK')
        .single();
      
      if (bulkError && !bulkError.message.includes('No rows found')) {
        throw bulkError;
      }
      
      // Process the data
      if (typeData) {
        setConsumptionByType(typeData);
      }
      
      if (zoneData) {
        setConsumptionByZone(zoneData);
      }
      
      if (mainBulkData) {
        // Ensure we're dealing with numbers
        const currentMonth = Number(mainBulkData[selectedMonth] || 0);
        const previousMonth = selectedMonth === 'feb_25' 
          ? Number(mainBulkData['jan_25'] || 0) 
          : selectedMonth === 'mar_25'
            ? Number(mainBulkData['feb_25'] || 0)
            : Number(mainBulkData['dec_24'] || 0);
        
        setTotalConsumption(currentMonth);
        setYearlyConsumption(Number(mainBulkData.total || 0));
        
        // Calculate monthly change percentage
        if (previousMonth > 0) {
          const change = ((currentMonth - previousMonth) / previousMonth) * 100;
          setMonthlyChange(change);
        }
        
        setMonthlyData({
          monthly: currentMonth,
          yearly: Number(mainBulkData.total || 0),
          previousMonth: previousMonth,
          change: monthlyChange
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching water data:', error);
      toast.error('Failed to load water data');
      setLoading(false);
    }
  };

  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    // Re-fetch data with new month
    fetchWaterData();
  };

  const handleImportData = async (clipboardData: string) => {
    try {
      const parsedData = await parseCSVFromClipboard(
        clipboardData,
        async (transformedData: WaterData[]) => {
          const result = await saveWaterData(transformedData);
          if (result.success) {
            toast.success(result.message);
            fetchWaterData(); // Refresh data after import
          } else {
            toast.error(result.message);
          }
        },
        (errorMessage: string) => {
          toast.error(errorMessage);
        }
      );
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('Failed to import data');
    }
  };

  const formatNumber = (num: number) => {
    return formatter.format(num);
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-4">
          <h1 className="text-2xl font-bold mb-6">Water System Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <Droplets className="h-6 w-6 mr-2 text-blue-600" />
            <h1 className="text-2xl font-bold">Water System Dashboard</h1>
          </div>
          <div className="flex space-x-2">
            <select
              className="border rounded-md p-2"
              value={selectedMonth}
              onChange={(e) => handleMonthChange(e.target.value)}
            >
              <option value="jan_25">January 2025</option>
              <option value="feb_25">February 2025</option>
              <option value="mar_25">March 2025</option>
            </select>
            <Button variant="outline" size="sm">
              <FileBarChart className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{formatNumber(totalConsumption)}</span>
                <span className="ml-2 text-gray-500">m³</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Current Month</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Yearly Consumption</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold">{formatNumber(yearlyConsumption)}</span>
                <span className="ml-2 text-gray-500">m³</span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Last 12 Months</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Monthly Change</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center">
                <span className="text-3xl font-bold">{monthlyChange.toFixed(1)}%</span>
                {monthlyChange > 0 ? (
                  <TrendingUp className="ml-2 h-5 w-5 text-red-500" />
                ) : (
                  <TrendingDown className="ml-2 h-5 w-5 text-green-500" />
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">vs Previous Month</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="by-type">By Type</TabsTrigger>
            <TabsTrigger value="by-zone">By Zone</TabsTrigger>
            <TabsTrigger value="import">Import Data</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="mt-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Consumption Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar 
                      options={options} 
                      data={{
                        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
                        datasets: [
                          {
                            label: 'Consumption (m³)',
                            data: [
                              consumptionByType[0]?.jan_25 || 0,
                              consumptionByType[0]?.feb_25 || 0,
                              consumptionByType[0]?.mar_25 || 0,
                              consumptionByType[0]?.apr_24 || 0,
                              consumptionByType[0]?.may_24 || 0,
                              consumptionByType[0]?.jun_24 || 0,
                              consumptionByType[0]?.jul_24 || 0,
                              consumptionByType[0]?.aug_24 || 0,
                              consumptionByType[0]?.sep_24 || 0,
                              consumptionByType[0]?.oct_24 || 0,
                              consumptionByType[0]?.nov_24 || 0,
                              consumptionByType[0]?.dec_24 || 0,
                            ],
                            backgroundColor: 'rgba(53, 162, 235, 0.5)',
                          },
                        ],
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Consumption by Type</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <Bar 
                      options={{
                        ...options,
                        indexAxis: 'y' as const,
                      }} 
                      data={{
                        labels: consumptionByType.slice(0, 5).map(item => item.type),
                        datasets: [
                          {
                            label: 'Consumption (m³)',
                            data: consumptionByType.slice(0, 5).map(item => item[selectedMonth] || 0),
                            backgroundColor: [
                              'rgba(255, 99, 132, 0.5)',
                              'rgba(54, 162, 235, 0.5)',
                              'rgba(255, 206, 86, 0.5)',
                              'rgba(75, 192, 192, 0.5)',
                              'rgba(153, 102, 255, 0.5)',
                            ],
                          },
                        ],
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="by-type" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Consumption by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jan 25</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feb 25</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mar 25</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consumptionByType.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.type}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.jan_25 || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.feb_25 || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.mar_25 || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.total || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="by-zone" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Consumption by Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jan 25</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feb 25</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mar 25</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {consumptionByZone.map((item, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.zone}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.jan_25 || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.feb_25 || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.mar_25 || 0)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(item.total || 0)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="import" className="mt-4">
            <ImportWaterData />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default WaterSystem;
