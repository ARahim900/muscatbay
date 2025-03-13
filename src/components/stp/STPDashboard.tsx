
import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Area, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

interface EquipmentStatus {
  name: string;
  status: string;
  performance: number;
}

interface ParameterCompliance {
  parameter: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  status: string;
}

interface DataPoint {
  id: number;
  month: string;
  year: string;
  avgDailyInfluent: number;
  capacityUtilization: number;
  directSewagePercentage: number;
  tankerPercentage: number;
  treatmentEfficiency: number;
  waterRecoveryRate: number;
  totalInfluent: number;
  totalProcessed: number;
  irrigation: number;
  tankerTrips: number;
  directSewage: number;
  pH: number;
  do: number;
  mlss: number;
  chlorine: number;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

type ValueType = string | number | Array<string | number>;

const STPDashboard = () => {
  // Application primary colors based on #4E4456
  const colors = {
    primary: '#4E4456',
    secondary: '#6A5B76',
    accent1: '#8A6F9D',
    accent2: '#AA93BC',
    accent3: '#C5B6D0',
    chart1: '#7D6B8F',
    chart2: '#A78BBB',
    chart3: '#D0BFDE',
    chart4: '#AC6DAA',
    chart5: '#53B0AE',
    chart6: '#F39C6B',
    success: '#2E7D32',
    warning: '#ED6C02',
    error: '#D32F2F',
    background: '#F8F6FA',
    text: '#2A2A2A',
    lightText: '#767676'
  };

  // Monthly data from analysis
  const fullData: DataPoint[] = [
    {
      id: 1,
      month: "Jul",
      year: "2024",
      avgDailyInfluent: 506.7,
      capacityUtilization: 67.6,
      directSewagePercentage: 47.9, 
      tankerPercentage: 51.7,
      treatmentEfficiency: 88.6,
      waterRecoveryRate: 109.3,
      totalInfluent: 16214,
      totalProcessed: 17716,
      irrigation: 15698,
      tankerTrips: 419,
      directSewage: 7766,
      pH: 7.2,
      do: 2.5,
      mlss: 11800,
      chlorine: 121
    },
    {
      id: 2,
      month: "Aug",
      year: "2024",
      avgDailyInfluent: 515.2,
      capacityUtilization: 68.7,
      directSewagePercentage: 50.0,
      tankerPercentage: 50.0,
      treatmentEfficiency: 88.4,
      waterRecoveryRate: 111.0,
      totalInfluent: 15971,
      totalProcessed: 17725,
      irrigation: 15669,
      tankerTrips: 399,
      directSewage: 7988,
      pH: 7.3,
      do: 2.6,
      mlss: 11900,
      chlorine: 124
    },
    {
      id: 3,
      month: "Sep",
      year: "2024",
      avgDailyInfluent: 510.4,
      capacityUtilization: 68.1,
      directSewagePercentage: 52.9,
      tankerPercentage: 47.0,
      treatmentEfficiency: 88.4,
      waterRecoveryRate: 109.4,
      totalInfluent: 15312,
      totalProcessed: 16752,
      irrigation: 14810,
      tankerTrips: 360,
      directSewage: 8097,
      pH: 7.4,
      do: 2.4,
      mlss: 12100,
      chlorine: 127
    },
    {
      id: 4,
      month: "Oct",
      year: "2024",
      avgDailyInfluent: 561.4,
      capacityUtilization: 74.8,
      directSewagePercentage: 54.1,
      tankerPercentage: 45.9,
      treatmentEfficiency: 87.7,
      waterRecoveryRate: 109.3,
      totalInfluent: 17402,
      totalProcessed: 19028,
      irrigation: 16697,
      tankerTrips: 399,
      directSewage: 9422,
      pH: 7.1,
      do: 2.3,
      mlss: 12000,
      chlorine: 125
    },
    {
      id: 5,
      month: "Nov",
      year: "2024",
      avgDailyInfluent: 556.6,
      capacityUtilization: 74.2,
      directSewagePercentage: 55.6,
      tankerPercentage: 44.4,
      treatmentEfficiency: 87.5,
      waterRecoveryRate: 108.7,
      totalInfluent: 16699,
      totalProcessed: 18154,
      irrigation: 15892,
      tankerTrips: 371,
      directSewage: 9280,
      pH: 7.2,
      do: 2.4,
      mlss: 12200,
      chlorine: 122
    },
    {
      id: 6,
      month: "Dec",
      year: "2024",
      avgDailyInfluent: 563.5,
      capacityUtilization: 75.1,
      directSewagePercentage: 56.3,
      tankerPercentage: 43.7,
      treatmentEfficiency: 87.6,
      waterRecoveryRate: 109.1,
      totalInfluent: 17468,
      totalProcessed: 19054,
      irrigation: 16698,
      tankerTrips: 382,
      directSewage: 9828,
      pH: 7.0,
      do: 2.5,
      mlss: 12100,
      chlorine: 126
    },
    {
      id: 7,
      month: "Jan",
      year: "2025",
      avgDailyInfluent: 580.1,
      capacityUtilization: 77.4,
      directSewagePercentage: 57.0,
      tankerPercentage: 43.0,
      treatmentEfficiency: 87.3,
      waterRecoveryRate: 109.1,
      totalInfluent: 17984,
      totalProcessed: 19623,
      irrigation: 17137,
      tankerTrips: 387,
      directSewage: 10243,
      pH: 7.3,
      do: 2.7,
      mlss: 12300,
      chlorine: 128
    },
    {
      id: 8,
      month: "Feb",
      year: "2025",
      avgDailyInfluent: 560.5,
      capacityUtilization: 74.7,
      directSewagePercentage: 56.0,
      tankerPercentage: 44.0,
      treatmentEfficiency: 87.5,
      waterRecoveryRate: 109.1,
      totalInfluent: 15694,
      totalProcessed: 17122,
      irrigation: 14982,
      tankerTrips: 345,
      directSewage: 8792,
      pH: 7.2,
      do: 2.5,
      mlss: 12000,
      chlorine: 125
    }
  ];
  
  // State for filters
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedYears, setSelectedYears] = useState(['2024', '2025']);
  const [selectedMonths, setSelectedMonths] = useState(fullData.map(item => item.month));
  const [data, setData] = useState(fullData);
  
  // Handle year filter changes
  const handleYearChange = (year: string) => {
    const updatedYears = selectedYears.includes(year)
      ? selectedYears.filter(y => y !== year)
      : [...selectedYears, year];
    
    // Ensure at least one year is selected
    if (updatedYears.length > 0) {
      setSelectedYears(updatedYears);
      applyFilters(updatedYears, selectedMonths);
    }
  };
  
  // Handle month filter changes
  const handleMonthChange = (month: string) => {
    const updatedMonths = selectedMonths.includes(month)
      ? selectedMonths.filter(m => m !== month)
      : [...selectedMonths, month];
    
    // Ensure at least one month is selected
    if (updatedMonths.length > 0) {
      setSelectedMonths(updatedMonths);
      applyFilters(selectedYears, updatedMonths);
    }
  };
  
  // Apply both filters
  const applyFilters = (years: string[], months: string[]) => {
    const filteredData = fullData.filter(item => 
      years.includes(item.year) && months.includes(item.month)
    );
    setData(filteredData);
  };
  
  // Handle "Select All" for months
  const handleSelectAllMonths = () => {
    const allMonths = fullData.map(item => item.month)
      .filter((month, index, self) => self.indexOf(month) === index);
    setSelectedMonths(allMonths);
    applyFilters(selectedYears, allMonths);
  };
  
  // Handle "Select All" for years
  const handleSelectAllYears = () => {
    const allYears = fullData.map(item => item.year)
      .filter((year, index, self) => self.indexOf(year) === index);
    setSelectedYears(allYears);
    applyFilters(allYears, selectedMonths);
  };
  
  // Calculate metrics for selected data
  const calculateMetrics = () => {
    const totalInfluent = data.reduce((sum, month) => sum + month.totalInfluent, 0);
    const totalProcessed = data.reduce((sum, month) => sum + month.totalProcessed, 0);
    const totalIrrigation = data.reduce((sum, month) => sum + month.irrigation, 0);
    
    const avgCapacityUtilization = data.reduce((sum, month) => sum + month.capacityUtilization, 0) / data.length;
    const avgTreatmentEfficiency = data.reduce((sum, month) => sum + month.treatmentEfficiency, 0) / data.length;
    
    const avgDirectSewagePercentage = data.reduce((sum, month) => sum + month.directSewagePercentage, 0) / data.length;
    
    return {
      totalInfluent,
      totalProcessed,
      totalIrrigation,
      avgCapacityUtilization,
      avgTreatmentEfficiency,
      avgDirectSewagePercentage,
      monthCount: data.length
    };
  };
  
  const metrics = calculateMetrics();
  
  // Get unique years and months for filters
  const uniqueYears = [...new Set(fullData.map(item => item.year))];
  const uniqueMonths = [...new Set(fullData.map(item => item.month))];
  
  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-2 bg-white border border-gray-200 rounded shadow-md">
          <p className="font-semibold text-sm">{`${label}`}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}${entry.unit || ''}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Equipment status calculation
  const calculateEquipmentStatus = () => {
    // Based on performance metrics, determine equipment status
    const mlssStatus = metrics.avgTreatmentEfficiency > 87.5 ? 'Optimal' : 'Requires Check';
    const blowerStatus = metrics.avgTreatmentEfficiency > 87 ? 'Operational' : 'Maintenance Recommended';
    const pumpStatus = metrics.avgCapacityUtilization < 75 ? 'Normal Operation' : 'Monitor Performance';
    const mbrStatus = metrics.avgTreatmentEfficiency > 87 ? 'Good Condition' : 'Check for Fouling';
    
    return [
      { name: 'MBR Membranes', status: mbrStatus, performance: metrics.avgTreatmentEfficiency > 88 ? 100 : metrics.avgTreatmentEfficiency > 87 ? 80 : 60 },
      { name: 'Aeration Blowers', status: blowerStatus, performance: metrics.avgTreatmentEfficiency > 88 ? 95 : metrics.avgTreatmentEfficiency > 87 ? 85 : 70 },
      { name: 'MLSS Control', status: mlssStatus, performance: metrics.avgTreatmentEfficiency > 88 ? 98 : metrics.avgTreatmentEfficiency > 87 ? 88 : 75 },
      { name: 'Raw Sewage Pumps', status: pumpStatus, performance: metrics.avgCapacityUtilization < 70 ? 95 : metrics.avgCapacityUtilization < 75 ? 90 : 85 },
      { name: 'Chlorination System', status: 'Operational', performance: 92 }
    ];
  };
  
  const equipmentStatus = calculateEquipmentStatus();
  
  // Process Parameter Compliance
  const parameterCompliance: ParameterCompliance[] = [
    { parameter: 'pH', value: 7.2, min: 6.5, max: 8.0, unit: '', status: 'Compliant' },
    { parameter: 'DO', value: 2.5, min: 2.0, max: 3.0, unit: 'ppm', status: 'Compliant' },
    { parameter: 'MLSS', value: 12000, min: 10000, max: 14000, unit: 'mg/L', status: 'Compliant' },
    { parameter: 'Chlorine', value: 125, min: 100, max: 150, unit: 'ppm', status: 'Compliant' },
    { parameter: 'Treatment Efficiency', value: metrics.avgTreatmentEfficiency, min: 85, max: 100, unit: '%', status: 'Compliant' }
  ];
  
  return (
    <div className="bg-gray-50 text-gray-800 min-h-screen" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header className="p-4" style={{ backgroundColor: colors.primary }}>
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Muscat Bay STP Dashboard</h1>
            <p className="text-white text-opacity-80 text-sm">Sewage Treatment Plant Performance Monitoring</p>
          </div>
          <div className="flex items-center mt-3 md:mt-0">
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 mr-2 text-white text-sm">
              <span className="font-medium">Plant Capacity:</span> 750 m³/day
            </div>
            <div className="bg-white bg-opacity-20 rounded-lg px-3 py-1 text-white text-sm">
              <span className="font-medium">Last Updated:</span> {data.length > 0 ? `${data[data.length-1].month} ${data[data.length-1].year}` : 'N/A'}
            </div>
          </div>
        </div>
      </header>
      
      {/* Filters Section */}
      <div className="p-4 bg-white shadow-sm border-b border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
          {/* Year Filter */}
          <div className="flex flex-col min-w-[200px]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Filter by Year</label>
              <button 
                onClick={handleSelectAllYears}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueYears.map(year => (
                <button
                  key={year}
                  onClick={() => handleYearChange(year)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedYears.includes(year)
                      ? `bg-${colors.primary} text-white`
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ backgroundColor: selectedYears.includes(year) ? colors.primary : '' }}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>
          
          {/* Month Filter */}
          <div className="flex flex-col min-w-[300px]">
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-gray-700">Filter by Month</label>
              <button 
                onClick={handleSelectAllMonths} 
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Select All
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {uniqueMonths.map(month => (
                <button
                  key={month}
                  onClick={() => handleMonthChange(month)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    selectedMonths.includes(month)
                      ? ''
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                  style={{ backgroundColor: selectedMonths.includes(month) ? colors.accent1 : '' , color: selectedMonths.includes(month) ? 'white' : ''}}
                >
                  {month}
                </button>
              ))}
            </div>
          </div>
          
          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-2 min-w-[200px]">
            <p className="text-xs text-gray-600">Showing data for:</p>
            <p className="text-sm font-medium">{metrics.monthCount} months selected</p>
            <p className="text-xs text-gray-600 mt-1">Total inflow processed:</p>
            <p className="text-sm font-medium">{Math.round(metrics.totalInfluent).toLocaleString()} m³</p>
          </div>
        </div>
      </div>
      
      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 bg-white shadow-sm overflow-x-auto">
        <button 
          className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'overview' ? `border-${colors.primary} text-${colors.primary}` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          style={{ borderColor: activeTab === 'overview' ? colors.primary : 'transparent', color: activeTab === 'overview' ? colors.primary : '' }}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'performance' ? `border-${colors.primary} text-${colors.primary}` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          style={{ borderColor: activeTab === 'performance' ? colors.primary : 'transparent', color: activeTab === 'performance' ? colors.primary : '' }}
          onClick={() => setActiveTab('performance')}
        >
          Performance Metrics
        </button>
        <button 
          className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'equipment' ? `border-${colors.primary} text-${colors.primary}` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          style={{ borderColor: activeTab === 'equipment' ? colors.primary : 'transparent', color: activeTab === 'equipment' ? colors.primary : '' }}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment Status
        </button>
        <button 
          className={`py-3 px-4 text-sm font-medium border-b-2 ${activeTab === 'compliance' ? `border-${colors.primary} text-${colors.primary}` : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          style={{ borderColor: activeTab === 'compliance' ? colors.primary : 'transparent', color: activeTab === 'compliance' ? colors.primary : '' }}
          onClick={() => setActiveTab('compliance')}
        >
          Compliance & Reports
        </button>
      </div>
      
      {/* Content Area */}
      <div className="p-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: `${colors.accent3}30` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.accent1 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Capacity Utilization</p>
                  <p className="text-xl font-bold" style={{ color: colors.primary }}>{metrics.avgCapacityUtilization.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">of 750 m³/day maximum</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: `${colors.chart5}30` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.chart5 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Treatment Efficiency</p>
                  <p className="text-xl font-bold" style={{ color: colors.primary }}>{metrics.avgTreatmentEfficiency.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">average across selected period</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: `${colors.chart6}30` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.chart6 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Water Processed</p>
                  <p className="text-xl font-bold" style={{ color: colors.primary }}>{Math.round(metrics.totalProcessed).toLocaleString()} m³</p>
                  <p className="text-xs text-gray-500">during selected period</p>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex items-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: `${colors.chart4}30` }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: colors.chart4 }}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Direct Sewage Percentage</p>
                  <p className="text-xl font-bold" style={{ color: colors.primary }}>{metrics.avgDirectSewagePercentage.toFixed(1)}%</p>
                  <p className="text-xs text-gray-500">of total influent</p>
                </div>
              </div>
            </div>
            
            {/* Main Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Capacity Utilization Trend */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Capacity Utilization Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value, index) => `${value} ${data[index]?.year || ''}`}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        domain={[0, 100]} 
                        label={{ value: 'Capacity %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' } }} 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        domain={[0, 750]} 
                        label={{ value: 'Inflow (m³/day)', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' } }} 
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar 
                        yAxisId="left" 
                        dataKey="capacityUtilization" 
                        name="Capacity Utilization %" 
                        fill={colors.accent1}
                        unit="%"
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="avgDailyInfluent" 
                        name="Avg Daily Inflow" 
                        stroke={colors.chart6} 
                        dot={{ stroke: colors.chart6, strokeWidth: 2, r: 4 }}
                        unit=" m³"
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey={() => 750} 
                        name="Plant Capacity" 
                        stroke="red" 
                        strokeDasharray="5 5"
                        dot={false}
                        unit=" m³"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2">* Target: maintain below 80% of capacity for operational flexibility</p>
              </div>
              
              {/* Influent Source Distribution */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Influent Source Distribution</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} stackOffset="expand" layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} tick={{ fontSize: 12 }} />
                      <YAxis 
                        dataKey="month" 
                        type="category" 
                        scale="band" 
                        tickFormatter={(value, index) => `${value} ${data[index]?.year || ''}`}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar 
                        dataKey="tankerPercentage" 
                        name="Tanker Sewage" 
                        stackId="a" 
                        fill={colors.chart2}
                        unit="%"
                      />
                      <Bar 
                        dataKey="directSewagePercentage" 
                        name="Direct Sewage" 
                        stackId="a" 
                        fill={colors.chart5}
                        unit="%"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2">* Gradually increasing direct sewage contribution as property occupancy increases</p>
              </div>
              
              {/* Efficiency Trend */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Efficiency & Sewage Type Trend</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value, index) => `${value} ${data[index]?.year || ''}`}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        orientation="left"
                        domain={[85, 90]}
                        label={{ value: 'Efficiency %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[40, 60]}
                        label={{ value: 'Direct Sewage %', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="treatmentEfficiency" 
                        name="Treatment Efficiency" 
                        stroke={colors.chart4} 
                        dot={{ r: 3 }}
                        unit="%"
                      />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="directSewagePercentage" 
                        name="Direct Sewage Contribution" 
                        stroke={colors.chart5} 
                        dot={{ r: 3 }}
                        unit="%"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2">* The slight decline in efficiency correlates with increasing direct sewage percentage</p>
              </div>
              
              {/* Water Balance */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Water Balance Analysis</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value, index) => `${value} ${data[index]?.year || ''}`}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        domain={[80, 120]}
                        label={{ value: 'Ratio %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Line 
                        type="monotone" 
                        dataKey="waterRecoveryRate" 
                        name="Processed/Influent" 
                        stroke={colors.chart1} 
                        dot={{ r: 3 }}
                        unit="%"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="treatmentEfficiency" 
                        name="Irrigation/Processed" 
                        stroke={colors.chart6} 
                        dot={{ r: 3 }}
                        unit="%"
                      />
                      <Line 
                        type="monotone" 
                        dataKey={() => 100} 
                        name="Ideal Balance" 
                        stroke="#999" 
                        strokeDasharray="5 5"
                        dot={false}
                        unit="%"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2">* Process consistently shows water recovery {'>'}100%, suggesting measurement discrepancies</p>
              </div>
            </div>
            
            {/* Process Parameters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Key Process Parameters</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Average Value</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Normal Range</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">pH</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">7.2</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">6.5 - 8.0</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Normal</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Dissolved Oxygen</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2.5 ppm</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">2.0 - 3.0 ppm</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Normal</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">MLSS</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">12,000 mg/L</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10,000 - 14,000 mg/L</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Normal</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Chlorine Dosing</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">125 ppm</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">100 - 150 ppm</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Normal</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Treatment Efficiency</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{metrics.avgTreatmentEfficiency.toFixed(1)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">≥ 85%</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Normal</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Equipment Status Tab */}
        {activeTab === 'equipment' && (
          <div className="space-y-6">
            {/* Equipment Status Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {equipmentStatus.map((equipment, index) => (
                <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-semibold" style={{ color: colors.primary }}>{equipment.name}</h3>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      equipment.status === 'Optimal' || equipment.status === 'Operational' || equipment.status === 'Normal Operation' || equipment.status === 'Good Condition' 
                        ? 'bg-green-100 text-green-800' 
                        : equipment.status === 'Requires Check' || equipment.status === 'Monitor Performance' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                    }`}>
                      {equipment.status}
                    </div>
                  </div>
                  <div className="mt-3 h-6 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full"
                      style={{ 
                        width: `${equipment.performance}%`,
                        backgroundColor: equipment.performance >= 90 ? colors.success :
                                        equipment.performance >= 75 ? colors.chart5 :
                                        colors.warning
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-1 text-xs text-gray-500">
                    <span>0%</span>
                    <span>{equipment.performance}% Performance</span>
                    <span>100%</span>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Equipment Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* MBR Performance */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>MBR Performance Indicators</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="month" 
                        tickFormatter={(value, index) => `${value} ${data[index]?.year || ''}`}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="left"
                        orientation="left"
                        domain={[85, 90]}
                        label={{ value: 'Treatment Efficiency %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        domain={[11000, 13000]}
                        label={{ value: 'MLSS (mg/L)', angle: -90, position: 'insideRight', style: { textAnchor: 'middle', fontSize: '12px', fill: '#666' } }}
                        tick={{ fontSize: 12 }}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar 
                        yAxisId="right"
                        dataKey="mlss" 
                        name="MLSS" 
                        fill={colors.chart2}
                        unit=" mg/L"
                      />
                      <Line 
                        yAxisId="left"
                        type="monotone" 
                        dataKey="treatmentEfficiency" 
                        name="Treatment Efficiency" 
                        stroke={colors.chart4} 
                        dot={{ r: 3 }}
                        unit="%"
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2">* MBR performance shows slight efficiency decline despite stable MLSS levels</p>
              </div>
              
              {/* Equipment Status Radar */}
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Equipment Performance Map</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart outerRadius={90} data={equipmentStatus}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Radar
                        name="Equipment Performance"
                        dataKey="performance"
                        stroke={colors.accent1}
                        fill={colors.accent1}
                        fillOpacity={0.5}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500 mt-2">* Radar chart shows relative performance of key equipment systems</p>
              </div>
            </div>
            
            {/* Maintenance Schedule */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Recommended Maintenance Schedule</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance Task</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Frequency</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Done</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Due</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">MBR Membranes</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Inspection & Cleaning</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Quarterly</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dec 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">Medium</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Aeration Blowers</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Performance Check</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Monthly</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Feb 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Flow Meters</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Calibration</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Quarterly</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Nov 2024</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">High</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Chlorination System</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Dosing Check</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Weekly</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Raw Sewage Pumps</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Performance Check</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Monthly</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Feb 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Mar 2025</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">Low</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        {/* Compliance & Reports Tab */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {/* Compliance Status */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Regulatory Compliance Status</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Parameter</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Value</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Limit/Requirement</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Standard</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parameterCompliance.map((param, index) => (
                      <tr key={index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{param.parameter}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{typeof param.value === 'number' ? param.value.toFixed(1) : param.value}{param.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{param.min} - {param.max}{param.unit}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">ISO 14001, Local Standards</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">{param.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {/* Recommendations */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold mb-4" style={{ color: colors.primary }}>Recommendations & Action Items</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium mb-2">Process Optimization</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Monitor increasing flow trends; develop capacity management plan if trend continues</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Adjust operations for higher direct sewage proportion (may require aeration adjustment)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Investigate slight treatment efficiency decline; consider membrane cleaning schedule</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-blue-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700">Review energy consumption of blowers as flows increase</span>
                    </li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Maintenance Schedule</h4>
                  <ul className="space-y-2">
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-red-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700"><span className="font-medium">Urgent:</span> Flow meter calibration for all systems</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700"><span className="font-medium">Q1 2025:</span> Full membrane inspection and potential cleaning</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-yellow-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700"><span className="font-medium">Q1 2025:</span> Blower performance assessment (all three SEM.4.1 TRCB.GCA units)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700"><span className="font-medium">Monthly:</span> MLSS concentration verification (target ~12,000 mg/L)</span>
                    </li>
                    <li className="flex items-start">
                      <div className="h-5 w-5 mt-0.5 mr-2 flex-shrink-0 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="h-3.5 w-3.5 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <span className="text-sm text-gray-700"><span className="font-medium">Monthly:</span> Chlorine dosing system calibration check</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            
            {/* Reports Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-3" style={{ color: colors.primary }}>ISO 14001 Compliance</h3>
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3 bg-green-100">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Audit: January 2025</p>
                    <p className="text-sm text-gray-500">Status: Compliant</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Environmental Management System
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Resource Efficiency
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Pollution Prevention
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Energy Monitoring (Action required)
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-3" style={{ color: colors.primary }}>WHO Guidelines Compliance</h3>
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3 bg-green-100">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Assessment: February 2025</p>
                    <p className="text-sm text-gray-500">Status: Compliant</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Effluent Quality Standards
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Disinfection Requirements
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Water Reuse Guidelines
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Health & Safety Standards
                  </li>
                </ul>
              </div>
              
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold mb-3" style={{ color: colors.primary }}>Local Regulatory Compliance</h3>
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full flex items-center justify-center mr-3 bg-green-100">
                    <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">Last Inspection: February 2025</p>
                    <p className="text-sm text-gray-500">Status: Fully Compliant</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Operating Permit Requirements
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Effluent Quality Standards
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Monitoring & Reporting
                  </li>
                  <li className="flex items-start">
                    <svg className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Odor Control Requirements
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer */}
      <footer className="p-4 mt-6 text-center text-xs text-gray-500 border-t border-gray-200">
        <p>Muscat Bay STP Performance Dashboard | Data Period: Jul 2024 - Feb 2025 | Last Updated: Mar 2025</p>
        <p className="mt-1">Plant Capacity: 750 m³/day | Membrane Bioreactor (MBR) Technology</p>
      </footer>
    </div>
  );
};

export default STPDashboard;
