import React from 'react';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  ComposedChart, Scatter, ScatterChart, ZAxis, ReferenceLine
} from 'recharts';
import { Zap, Info, TrendingDown, TrendingUp, AlertTriangle, CheckCircle, BarChart3 } from 'lucide-react';

const ElectricityDistribution = () => {
  const [selectedYear, setSelectedYear] = React.useState('2024');
  const [selectedMonth, setSelectedMonth] = React.useState('Jan-24');
  const [selectedZone, setSelectedZone] = React.useState('');
  const [selectedPage, setSelectedPage] = React.useState('overview');

  // Define color scheme
  const primaryColor = '#4E4456';
  const secondaryColor = '#6d5d78';
  const accentColor = '#8b7998';
  const lightColor = '#e0d8e6';
  const dangerColor = '#dc3545';
  const warningColor = '#ffc107';
  const successColor = '#198754';

  // Function to ensure numeric values for calculations
  const ensureNumber = (value: any): number => {
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return typeof value === 'number' ? value : 0;
  };

  // Function to format numbers with commas
  const formatNumber = (num: number) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  // Function to determine status color based on value
  const getStatusColor = (percentage: number) => {
    if (percentage < 10) return successColor;
    if (percentage < 30) return warningColor;
    return dangerColor;
  };

  // This function would replace the problematic calculations
  const calculateMetrics = (data: any) => {
    // Replace problematic calculations with safe numeric operations
    const result1 = ensureNumber(data.value1) * ensureNumber(data.multiplier);
    const result2 = ensureNumber(data.value2) / (ensureNumber(data.value3) * ensureNumber(data.value4));
    return { result1, result2 };
  };

  // Mock data for demonstration
  const mockData = {
    value1: "100",
    value2: "200",
    value3: "2",
    value4: "4",
    multiplier: "1.5"
  };

  // Calculate metrics safely
  const { result1, result2 } = calculateMetrics(mockData);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex items-center">
                <Zap className="h-6 w-6 mr-2 text-yellow-500" />
                <h1 className="text-2xl font-bold text-gray-800">Muscat Bay Electricity Distribution Dashboard</h1>
              </div>
              <div className="mt-4 md:mt-0">
                <div className="flex items-center space-x-4">
                  {/* Year Selector */}
                  <select 
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                  
                  {/* Month Selector */}
                  <select 
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option value="Jan-24">January 2024</option>
                    <option value="Feb-24">February 2024</option>
                    {/* Add more months as needed */}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="bg-gray-100 border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto py-2 scrollbar-none">
              <button
                onClick={() => setSelectedPage('overview')}
                className={`px-4 py-2 mr-2 font-medium rounded-lg transition-all duration-200 ${selectedPage === 'overview' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Overview
              </button>
              <button
                onClick={() => setSelectedPage('zone-analysis')}
                className={`px-4 py-2 mr-2 font-medium rounded-lg transition-all duration-200 ${selectedPage === 'zone-analysis' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Zone Analysis
              </button>
              <button
                onClick={() => setSelectedPage('consumption')}
                className={`px-4 py-2 mr-2 font-medium rounded-lg transition-all duration-200 ${selectedPage === 'consumption' ? 'bg-white shadow text-primary' : 'text-gray-600 hover:bg-gray-200'}`}
              >
                Consumption
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
          {/* Example Card with Safe Calculations */}
          <Card className="bg-white shadow-md hover:shadow-lg transition-shadow duration-300">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 pb-2">
              <CardTitle className="text-lg font-bold text-gray-700 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-primary" />
                Sample Metrics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-center mt-4 animate-fade-in" style={{ color: primaryColor }}>
                Result 1: {formatNumber(result1)}
              </div>
              <div className="text-3xl font-bold text-center mt-4 animate-fade-in" style={{ color: secondaryColor }}>
                Result 2: {formatNumber(result2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-gray-200 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-gray-500 text-sm">
                © 2025 Muscat Bay Electricity Management System
              </div>
              <div className="text-gray-500 text-sm mt-2 md:mt-0 flex items-center">
                <Info className="h-4 w-4 mr-1" />
                Last updated: {new Date().toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ElectricityDistribution;
