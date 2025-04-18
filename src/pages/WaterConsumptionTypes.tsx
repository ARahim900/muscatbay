import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, LineChart, Line, Cell } from 'recharts';
import Layout from '@/components/layout/Layout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { FileBarChart, Droplets } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImportWaterData from '@/components/water/ImportWaterData';
import { ModernDonutChart } from '@/components/ui/modern-donut-chart';

interface WaterData {
  name: string;
  value: number;
  percentage: string;
  [key: string]: any;
}

const WaterConsumptionTypes = () => {
  const [selectedMonth, setSelectedMonth] = useState('feb_25');
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [typeData, setTypeData] = useState<WaterData[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalConsumption, setTotalConsumption] = useState(0);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);

  // Color palette for different meter types
  const COLORS: Record<string, string> = {
    'Retail': '#4285F4', // Bright blue
    'Zone Bulk': '#00C49F',
    'Residential (Villa)': '#FFED00',
    'Residential (Apart)': '#A142F4', // Purple
    'IRR_Servies': '#FBBC05', // Yellow/Gold
    'MB_Common': '#EA4335', // Red
    'Building': '#B8860B',
    'D_Building_Bulk': '#5570F6', // Indigo
    'D_Building_Common': '#FF64B4', // Pink
    'Main BULK': '#ff5252'
  };

  // Mapping of database column names to display names
  const monthMapping: Record<string, string> = {
    'jan_24': 'Jan-24', 'feb_24': 'Feb-24', 'mar_24': 'Mar-24', 'apr_24': 'Apr-24',
    'may_24': 'May-24', 'jun_24': 'Jun-24', 'jul_24': 'Jul-24', 'aug_24': 'Aug-24',
    'sep_24': 'Sep-24', 'oct_24': 'Oct-24', 'nov_24': 'Nov-24', 'dec_24': 'Dec-24',
    'jan_25': 'Jan-25', 'feb_25': 'Feb-25'
  };

  // Reverse mapping for display purposes
  const displayToDbMonth: Record<string, string> = Object.entries(monthMapping).reduce(
    (acc, [db, display]) => ({...acc, [display]: db}), 
    {} as Record<string, string>
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        await fetchMonthlyData();
        setLoading(false);
      } catch (error) {
        console.error('Error processing data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  const fetchMonthlyData = async () => {
    try {
      // Fetch consumption data by type
      const { data: typeConsumptionData, error: typeError } = await supabase
        .from('water_consumption_by_type')
        .select('*');
      
      if (typeError) {
        console.error('Error fetching type data:', typeError);
        return;
      }

      console.log("Fetched type consumption data:", typeConsumptionData);

      // Filter out unwanted types and save available types
      const filteredTypes = typeConsumptionData?.filter(item => 
        item.type !== 'Main BULK' && item.type !== 'Zone Bulk'
      ) || [];
      
      const types = filteredTypes.map(item => item.type);
      setAvailableTypes(types);

      // Fetch main bulk data for total consumption
      const { data: mainBulkData, error: bulkError } = await supabase
        .from('water_distribution_master')
        .select('*')
        .eq('type', 'Main BULK')
        .single();
      
      if (bulkError) {
        console.error('Error fetching main bulk data:', bulkError);
      } else if (mainBulkData) {
        setTotalConsumption(mainBulkData[selectedMonth] || 0);
      }

      // Prepare monthly trend data
      const months = Object.keys(monthMapping);
      
      const monthlyResult = months.map(month => {
        const monthData: Record<string, any> = { 
          month: monthMapping[month] 
        };
        
        filteredTypes.forEach(typeItem => {
          monthData[typeItem.type] = typeItem[month] || 0;
        });
        
        return monthData;
      });
      
      setMonthlyData(monthlyResult);
      
      // Prepare data for the selected month
      updateTypeDataForMonth(selectedMonth, filteredTypes, mainBulkData);
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error;
    }
  };
  
  const updateTypeDataForMonth = (month: string, typeData: any[], mainBulkData: any) => {
    if (!typeData?.length) return;
    
    let totalForMonth = 0;
    typeData.forEach(item => {
      totalForMonth += Number(item[month] || 0);
    });
    
    const updatedTypeData = typeData.map(item => ({
      name: item.type,
      value: Number(item[month] || 0),
      percentage: ((Number(item[month] || 0) / totalForMonth) * 100).toFixed(1)
    })).sort((a, b) => b.value - a.value);
    
    setTypeData(updatedTypeData);
    
    if (mainBulkData) {
      setTotalConsumption(mainBulkData[month] || 0);
    }
  };

  const handleMonthChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMonth = e.target.value;
    setSelectedMonth(newMonth);
    
    // Fetch main bulk data for the new month
    const { data: mainBulkData, error: bulkError } = await supabase
      .from('water_distribution_master')
      .select('*')
      .eq('type', 'Main BULK')
      .single();
    
    if (bulkError) {
      console.error('Error fetching main bulk data:', bulkError);
    }
    
    // Fetch type data for the new month
    const { data: typeConsumptionData, error: typeError } = await supabase
      .from('water_consumption_by_type')
      .select('*');
    
    if (typeError) {
      console.error('Error fetching type data:', typeError);
      return;
    }
    
    // Update the type data for the new month
    const filteredTypes = typeConsumptionData?.filter(item => 
      item.type !== 'Main BULK' && item.type !== 'Zone Bulk'
    ) || [];
    
    updateTypeDataForMonth(newMonth, filteredTypes, mainBulkData);
  };
  
  const handleTypeSelection = (type: string) => {
    setSelectedTypes(prevSelectedTypes => {
      if (prevSelectedTypes.includes(type)) {
        return prevSelectedTypes.filter(t => t !== type);
      } else {
        return [...prevSelectedTypes, type];
      }
    });
  };
  
  const clearTypeSelection = () => {
    setSelectedTypes([]);
  };

  const formatNumber = (num: number) => {
    return num ? num.toLocaleString() : '0';
  };

  // Filter out Main BULK for some charts to focus on actual consumption types
  const filteredTypeData = typeData.filter(item => item.name !== 'Main BULK');
  
  // Apply selected type filters if any are selected
  const typeDataToDisplay = selectedTypes.length > 0 
    ? filteredTypeData.filter(item => selectedTypes.includes(item.name))
    : filteredTypeData;
  
  // Get the types sorted by total consumption for consistent coloring
  const typesByConsumption = [...filteredTypeData]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .map(item => item.name);
    
  // Get only selected types for charts if any are selected
  const typesToShow = selectedTypes.length > 0 ? selectedTypes : typesByConsumption;

  useEffect(() => {
    document.title = 'Water Consumption by Type | Muscat Bay Asset Manager';
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="p-8">
          <h1 className="text-2xl font-semibold text-gray-800 mb-6">Water Consumption by Type</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Skeleton className="h-80" />
            <Skeleton className="h-80" />
          </div>
          <Skeleton className="h-96 mb-6" />
          <Skeleton className="h-96 mb-6" />
          <Skeleton className="h-64" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 flex justify-between items-center">
            <div className="flex items-center">
              <Droplets className="h-6 w-6 mr-2 text-blue-600" />
              <h1 className="text-2xl font-semibold text-gray-800">Muscat Bay Water Consumption By Type</h1>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={handleMonthChange}
                className="border border-gray-300 rounded-md p-2 bg-white text-gray-700"
              >
                {Object.entries(monthMapping).map(([dbMonth, displayMonth]) => (
                  <option key={dbMonth} value={dbMonth}>{displayMonth}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        {/* Type Selector */}
        <div className="bg-white shadow mt-4">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-700">Filter by Meter Type</h2>
                {selectedTypes.length > 0 && (
                  <Button 
                    variant="ghost" 
                    onClick={clearTypeSelection}
                    className="h-8"
                  >
                    Clear All
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTypes.map(type => (
                  <Button
                    key={type}
                    onClick={() => handleTypeSelection(type)}
                    variant={selectedTypes.includes(type) ? "default" : "outline"}
                    className={`h-8 px-3 py-1 rounded text-sm flex items-center ${selectedTypes.includes(type) ? 'bg-indigo-100 border border-indigo-400' : 'bg-gray-100 border border-gray-300'}`}
                  >
                    <span 
                      className="w-3 h-3 rounded-full mr-2" 
                      style={{ backgroundColor: COLORS[type] || '#888' }}
                    ></span>
                    {type}
                    {selectedTypes.includes(type) && (
                      <span className="ml-2">✓</span>
                    )}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
          {/* Main Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Total Consumption Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Total Consumption (Main Bulk)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-indigo-600">{formatNumber(totalConsumption)}</span>
                  <span className="ml-2 text-gray-500">m³</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">For {monthMapping[selectedMonth]}</p>
              </CardContent>
            </Card>

            {/* Highest Consumer Type Card */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Top Consumer Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-green-600">
                    {typeDataToDisplay.length > 0 ? typeDataToDisplay[0].name : '-'}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {typeDataToDisplay.length > 0 ? 
                    `${formatNumber(typeDataToDisplay[0].value || 0)} m³ (${typeDataToDisplay[0].percentage}% of consumption)` : 
                    ''}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Consumption By Type Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-gray-700">Consumption by Type ({monthMapping[selectedMonth]})</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={typeDataToDisplay}
                      margin={{ top: 5, right: 30, left: 20, bottom: 70 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={80} />
                      <YAxis label={{ value: 'Consumption (m³)', angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value: number) => [`${formatNumber(value)} m³`, 'Consumption']} />
                      <Bar dataKey="value">
                        {typeDataToDisplay.map((entry) => (
                          <Cell key={entry.name} fill={COLORS[entry.name] || '#8884d8'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <ModernDonutChart
              title="Consumption Distribution"
              data={typeDataToDisplay.map(item => ({
                name: item.name,
                value: item.value
              }))}
              className="h-[500px]"
            />
          </div>

          {/* Monthly Trends */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-gray-700">Consumption Trend by Type (Jan-24 to Feb-25)</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis label={{ value: 'Consumption (m³)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number) => [`${formatNumber(value)} m³`, 'Consumption']} />
                    <Legend />
                    {typesToShow.map((type) => (
                      <Line 
                        type="monotone" 
                        dataKey={type} 
                        key={type}
                        stroke={COLORS[type]} 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Stacked Area Chart for Overall Composition */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium text-gray-700">Consumption Composition Over Time</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={monthlyData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 30 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
                    <YAxis label={{ value: 'Consumption (m³)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value: number) => [`${formatNumber(value)} m³`, 'Consumption']} />
                    <Legend />
                    {typesToShow.map((type) => (
                      <Area 
                        type="monotone" 
                        dataKey={type} 
                        key={type}
                        stackId="1"
                        stroke={COLORS[type]} 
                        fill={COLORS[type]} 
                      />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Consumption Table */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex justify-between items-center">
                <span>Consumption by Type Details ({monthMapping[selectedMonth]})</span>
                <Button variant="outline" size="sm" className="flex items-center ml-4">
                  <FileBarChart className="h-4 w-4 mr-2" />
                  Export Data
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value (m³)</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {typeDataToDisplay.map((type) => (
                      <tr key={type.name}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            <span 
                              className="w-3 h-3 rounded-full mr-2" 
                              style={{ backgroundColor: COLORS[type.name] || '#888' }}
                            ></span>
                            {type.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(type.value || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{type.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          {/* Import Data Section */}
          <ImportWaterData />
        </div>
      </div>
    </Layout>
  );
};

export default WaterConsumptionTypes;
