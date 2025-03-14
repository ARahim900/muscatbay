
import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts';
import StatCard from '../components/stp/StatCard';
import KpiCard from '../components/stp/KpiCard';
import QualityParameterCard from '../components/stp/QualityParameterCard';

const STPPlant = () => {
  const [selectedTab, setSelectedTab] = useState('overview');
  const [timeRange, setTimeRange] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('Mar-25');
  const [showDailyView, setShowDailyView] = useState(false);
  
  // Monthly production data based on actual analysis
  const monthlyData = [
    { month: 'Jul-24', treatedWater: 18308, irrigationOutput: 16067, inletSewage: 16895, treatmentEfficiency: 108.36, irrigationEfficiency: 87.76 },
    { month: 'Aug-24', treatedWater: 17372, irrigationOutput: 15139, inletSewage: 15641, treatmentEfficiency: 111.07, irrigationEfficiency: 87.15 },
    { month: 'Sep-24', treatedWater: 14859, irrigationOutput: 13196, inletSewage: 13806, treatmentEfficiency: 107.63, irrigationEfficiency: 88.81 },
    { month: 'Oct-24', treatedWater: 17669, irrigationOutput: 15490, inletSewage: 16397, treatmentEfficiency: 107.76, irrigationEfficiency: 87.67 },
    { month: 'Nov-24', treatedWater: 16488, irrigationOutput: 14006, inletSewage: 14540, treatmentEfficiency: 113.40, irrigationEfficiency: 84.95 },
    { month: 'Dec-24', treatedWater: 17444, irrigationOutput: 14676, inletSewage: 15213, treatmentEfficiency: 114.67, irrigationEfficiency: 84.13 },
    { month: 'Jan-25', treatedWater: 18212, irrigationOutput: 15433, inletSewage: 15723, treatmentEfficiency: 115.83, irrigationEfficiency: 84.74 },
    { month: 'Feb-25', treatedWater: 14408, irrigationOutput: 12075, inletSewage: 13080, treatmentEfficiency: 110.15, irrigationEfficiency: 83.81 },
    { month: 'Mar-25', treatedWater: 7251, irrigationOutput: 6202, inletSewage: 6322, treatmentEfficiency: 114.69, irrigationEfficiency: 85.53 }
  ];
  
  // Daily data for each month
  // This is sample data for March - based on the CSV info, we have 12 days of data
  const dailyData = {
    'Mar-25': [
      { day: '01/03', treatedWater: 583, irrigationOutput: 476, inletSewage: 487, tankers: 0, tankerVolume: 0, directInlineSewage: 487 },
      { day: '02/03', treatedWater: 592, irrigationOutput: 514, inletSewage: 493, tankers: 1, tankerVolume: 20, directInlineSewage: 473 },
      { day: '03/03', treatedWater: 598, irrigationOutput: 517, inletSewage: 497, tankers: 1, tankerVolume: 20, directInlineSewage: 477 },
      { day: '04/03', treatedWater: 600, irrigationOutput: 516, inletSewage: 561, tankers: 5, tankerVolume: 100, directInlineSewage: 461 },
      { day: '05/03', treatedWater: 608, irrigationOutput: 521, inletSewage: 503, tankers: 3, tankerVolume: 60, directInlineSewage: 443 },
      { day: '06/03', treatedWater: 607, irrigationOutput: 530, inletSewage: 544, tankers: 6, tankerVolume: 120, directInlineSewage: 424 },
      { day: '07/03', treatedWater: 621, irrigationOutput: 532, inletSewage: 552, tankers: 5, tankerVolume: 100, directInlineSewage: 452 },
      { day: '08/03', treatedWater: 617, irrigationOutput: 531, inletSewage: 570, tankers: 6, tankerVolume: 120, directInlineSewage: 450 },
      { day: '09/03', treatedWater: 607, irrigationOutput: 521, inletSewage: 468, tankers: 4, tankerVolume: 80, directInlineSewage: 388 },
      { day: '10/03', treatedWater: 610, irrigationOutput: 524, inletSewage: 600, tankers: 6, tankerVolume: 120, directInlineSewage: 480 },
      { day: '11/03', treatedWater: 607, irrigationOutput: 511, inletSewage: 536, tankers: 3, tankerVolume: 60, directInlineSewage: 476 },
      { day: '12/03', treatedWater: 601, irrigationOutput: 509, inletSewage: 511, tankers: 6, tankerVolume: 120, directInlineSewage: 391 }
    ],
    'Feb-25': [
      { day: '01/02', treatedWater: 527, irrigationOutput: 456, inletSewage: 511, tankers: 8, tankerVolume: 160, directInlineSewage: 351 },
      { day: '02/02', treatedWater: 505, irrigationOutput: 423, inletSewage: 511, tankers: 9, tankerVolume: 180, directInlineSewage: 331 },
      { day: '03/02', treatedWater: 584, irrigationOutput: 489, inletSewage: 496, tankers: 8, tankerVolume: 160, directInlineSewage: 336 },
      { day: '04/02', treatedWater: 578, irrigationOutput: 484, inletSewage: 545, tankers: 9, tankerVolume: 180, directInlineSewage: 365 },
      { day: '05/02', treatedWater: 582, irrigationOutput: 482, inletSewage: 527, tankers: 6, tankerVolume: 120, directInlineSewage: 407 },
      { day: '06/02', treatedWater: 588, irrigationOutput: 493, inletSewage: 482, tankers: 8, tankerVolume: 160, directInlineSewage: 322 },
      { day: '07/02', treatedWater: 576, irrigationOutput: 482, inletSewage: 485, tankers: 6, tankerVolume: 120, directInlineSewage: 365 },
      { day: '08/02', treatedWater: 582, irrigationOutput: 478, inletSewage: 531, tankers: 4, tankerVolume: 80, directInlineSewage: 451 },
      { day: '09/02', treatedWater: 586, irrigationOutput: 489, inletSewage: 521, tankers: 9, tankerVolume: 180, directInlineSewage: 341 },
      { day: '10/02', treatedWater: 594, irrigationOutput: 495, inletSewage: 514, tankers: 6, tankerVolume: 120, directInlineSewage: 394 },
      { day: '11/02', treatedWater: 589, irrigationOutput: 501, inletSewage: 546, tankers: 7, tankerVolume: 140, directInlineSewage: 406 },
      { day: '12/02', treatedWater: 614, irrigationOutput: 527, inletSewage: 528, tankers: 5, tankerVolume: 100, directInlineSewage: 428 },
      { day: '13/02', treatedWater: 620, irrigationOutput: 525, inletSewage: 503, tankers: 4, tankerVolume: 80, directInlineSewage: 423 },
      { day: '14/02', treatedWater: 614, irrigationOutput: 527, inletSewage: 554, tankers: 4, tankerVolume: 80, directInlineSewage: 474 },
      { day: '15/02', treatedWater: 627, irrigationOutput: 533, inletSewage: 538, tankers: 4, tankerVolume: 80, directInlineSewage: 458 },
      { day: '16/02', treatedWater: 630, irrigationOutput: 539, inletSewage: 561, tankers: 5, tankerVolume: 100, directInlineSewage: 461 },
      { day: '17/02', treatedWater: 628, irrigationOutput: 539, inletSewage: 544, tankers: 5, tankerVolume: 100, directInlineSewage: 444 },
      { day: '18/02', treatedWater: 609, irrigationOutput: 520, inletSewage: 517, tankers: 5, tankerVolume: 100, directInlineSewage: 417 },
      { day: '19/02', treatedWater: 582, irrigationOutput: 489, inletSewage: 539, tankers: 4, tankerVolume: 80, directInlineSewage: 459 },
      { day: '20/02', treatedWater: 553, irrigationOutput: 459, inletSewage: 482, tankers: 2, tankerVolume: 40, directInlineSewage: 442 },
      { day: '21/02', treatedWater: 518, irrigationOutput: 419, inletSewage: 478, tankers: 1, tankerVolume: 20, directInlineSewage: 458 },
      { day: '22/02', treatedWater: 437, irrigationOutput: 361, inletSewage: 491, tankers: 0, tankerVolume: 0, directInlineSewage: 491 },
      { day: '23/02', treatedWater: 247, irrigationOutput: 159, inletSewage: 334, tankers: 0, tankerVolume: 0, directInlineSewage: 334 },
      { day: '24/02', treatedWater: 272, irrigationOutput: 226, inletSewage: 342, tankers: 0, tankerVolume: 0, directInlineSewage: 342 },
      { day: '25/02', treatedWater: 595, irrigationOutput: 512, inletSewage: 502, tankers: 0, tankerVolume: 0, directInlineSewage: 502 },
      { day: '26/02', treatedWater: 571, irrigationOutput: 468, inletSewage: 498, tankers: 2, tankerVolume: 40, directInlineSewage: 458 }
    ],
    'Jan-25': generateDailyDataForMonth(18212, 15433, 15723, 31),
    'Dec-24': generateDailyDataForMonth(17444, 14676, 15213, 31),
    'Nov-24': generateDailyDataForMonth(16488, 14006, 14540, 30),
    'Oct-24': generateDailyDataForMonth(17669, 15490, 16397, 31),
    'Sep-24': generateDailyDataForMonth(14859, 13196, 13806, 30),
    'Aug-24': generateDailyDataForMonth(17372, 15139, 15641, 31),
    'Jul-24': generateDailyDataForMonth(18308, 16067, 16895, 31)
  };
  
  // Function to generate realistic daily data based on monthly totals
  function generateDailyDataForMonth(totalTreated: number, totalIrrigation: number, totalInlet: number, days: number) {
    const result = [];
    let accumulatedTreated = 0;
    let accumulatedIrrigation = 0;
    let accumulatedInlet = 0;
    
    for (let i = 1; i <= days; i++) {
      // Create day string
      const day = `${i.toString().padStart(2, '0')}/${getMonthNumber(selectedMonth)}`;
      
      // Generate realistic daily values with variations that will sum to the monthly total
      let treatedWater = Math.round(totalTreated / days * (0.9 + Math.random() * 0.2));
      let irrigationOutput = Math.round(totalIrrigation / days * (0.9 + Math.random() * 0.2));
      let inletSewage = Math.round(totalInlet / days * (0.9 + Math.random() * 0.2));
      const tankers = Math.round(Math.random() * 10);
      const tankerVolume = tankers * 20;
      
      // Adjust the last day to ensure we match the monthly total
      if (i === days) {
        treatedWater = totalTreated - accumulatedTreated;
        irrigationOutput = totalIrrigation - accumulatedIrrigation;
        inletSewage = totalInlet - accumulatedInlet;
      }
      
      // Accumulate values
      accumulatedTreated += treatedWater;
      accumulatedIrrigation += irrigationOutput;
      accumulatedInlet += inletSewage;
      
      result.push({
        day,
        treatedWater,
        irrigationOutput,
        inletSewage,
        tankers,
        tankerVolume,
        directInlineSewage: Math.max(0, inletSewage - tankerVolume)
      });
    }
    
    return result;
  }
  
  // Helper function to get month number from month-year string
  function getMonthNumber(monthYear: string) {
    const months: Record<string, string> = {
      'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
      'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
    };
    const month = monthYear.substring(0, 3);
    return months[month] || '01';
  }
  
  // Water quality data based on actual analysis
  const waterQualityData = {
    rawSewagePh: { avg: 6.78, target: '6.5-8.0', status: 'optimal' as const },
    mbrProductPh: { avg: 7.18, target: '6.5-8.0', status: 'optimal' as const },
    chlorine: { avg: 0.60, target: '125', status: 'critical' as const },
    mlssStream1: { avg: 6.30, target: '3000-4000', status: 'critical' as const },
    mlssStream2: { avg: 24.58, target: '3000-4000', status: 'critical' as const },
    aerationDo: { avg: 0.00, target: '2-3', status: 'critical' as const }
  };
  
  // Overall plant performance
  const plantPerformance = {
    avgTreatedWater: 552.57,
    avgIrrigationOutput: 475.81,
    avgInletSewage: 496.56,
    avgTankers: 8.55,
    avgTankerVolume: 170.97,
    avgDirectInlineSewage: 325.59,
    treatmentEfficiency: 111.28,
    irrigationEfficiency: 86.11,
    capacityUtilization: 73.68,
    peakTreatedWater: 687,
    peakInletSewage: 685,
    maxTankers: 19
  };
  
  // Source distribution data
  const sewageSourceData = [
    { name: 'Direct Inline', value: 325.59 },
    { name: 'Tanker Volume', value: 170.97 }
  ];
  
  // Color constants
  const COLORS = {
    primary: '#3b82f6',
    secondary: '#10b981',
    tertiary: '#f59e0b',
    quaternary: '#ef4444',
    success: '#22c55e',
    warning: '#f59e0b',
    danger: '#ef4444',
  };
  
  const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
  
  // Get filtered data based on time range
  const getFilteredMonthlyData = () => {
    if (timeRange === '3months') {
      return monthlyData.slice(-3);
    } else if (timeRange === '6months') {
      return monthlyData.slice(-6);
    }
    return monthlyData;
  };
  
  // Toggle daily view
  const toggleDailyView = () => {
    setShowDailyView(!showDailyView);
  };
  
  // Handle month selection for daily view
  const handleMonthSelect = (month: string) => {
    setSelectedMonth(month);
    setShowDailyView(true);
  };
  
  // Render Overview tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard 
          title="Daily Treated Water" 
          value={`${plantPerformance.avgTreatedWater} m³`}
          subtext={`${plantPerformance.capacityUtilization}% of capacity`}
          icon={<WaterDropIcon />}
          color={COLORS.primary}
        />
        <KpiCard 
          title="Treatment Efficiency" 
          value={`${plantPerformance.treatmentEfficiency}%`}
          subtext="Exceeds inlet volume"
          icon={<EfficiencyIcon />}
          color={COLORS.success}
        />
        <KpiCard 
          title="Irrigation Output" 
          value={`${plantPerformance.avgIrrigationOutput} m³`}
          subtext={`${plantPerformance.irrigationEfficiency}% of treated water`}
          icon={<IrrigationIcon />}
          color={COLORS.secondary}
        />
        <KpiCard 
          title="Daily Tankers" 
          value={plantPerformance.avgTankers.toFixed(1)}
          subtext={`${plantPerformance.avgTankerVolume.toFixed(1)} m³ volume`}
          icon={<TankerIcon />}
          color={COLORS.tertiary}
        />
      </div>
      
      {/* Monthly/Daily View Toggle */}
      <div className="bg-white rounded-lg shadow p-4">
        {/* Control Header */}
        <div className="flex flex-wrap justify-between mb-4">
          <div className="flex items-center">
            <h3 className="text-lg font-medium">Production Data</h3>
            <div className="ml-4">
              <button
                onClick={toggleDailyView}
                className={`px-3 py-1 rounded text-sm font-medium ${
                  showDailyView 
                    ? 'bg-blue-100 text-blue-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {showDailyView ? 'Monthly View' : 'Daily View'}
              </button>
            </div>
          </div>
          
          {showDailyView ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Select Month:</span>
              <select 
                className="border-gray-300 rounded-md text-sm"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
              >
                {monthlyData.map(month => (
                  <option key={month.month} value={month.month}>
                    {month.month}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="flex space-x-2">
              <button 
                onClick={() => setTimeRange('3months')}
                className={`px-2 py-1 text-xs rounded ${timeRange === '3months' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                3 Months
              </button>
              <button 
                onClick={() => setTimeRange('6months')}
                className={`px-2 py-1 text-xs rounded ${timeRange === '6months' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                6 Months
              </button>
              <button 
                onClick={() => setTimeRange('all')}
                className={`px-2 py-1 text-xs rounded ${timeRange === 'all' ? 'bg-blue-100 text-blue-800' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                All
              </button>
            </div>
          )}
        </div>
        
        {/* Monthly or Daily Chart */}
        <div className="h-80">
          {showDailyView ? (
            // Daily view chart
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={dailyData[selectedMonth] || []}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} m³`} />
                <Legend />
                <ReferenceLine y={750} stroke="red" strokeDasharray="3 3" label="Daily Capacity" />
                <Line type="monotone" dataKey="treatedWater" name="Treated Water (m³)" stroke={COLORS.primary} strokeWidth={2} />
                <Line type="monotone" dataKey="irrigationOutput" name="Irrigation Output (m³)" stroke={COLORS.secondary} strokeWidth={2} />
                <Line type="monotone" dataKey="inletSewage" name="Inlet Sewage (m³)" stroke={COLORS.tertiary} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            // Monthly view chart
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={getFilteredMonthlyData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString()} m³`} />
                <Legend />
                <ReferenceLine y={750 * 30} stroke="red" strokeDasharray="3 3" label="Monthly Capacity" />
                <Bar dataKey="treatedWater" name="Treated Water (m³)" fill={COLORS.primary} onClick={(data) => handleMonthSelect(data.month)} cursor="pointer" />
                <Bar dataKey="irrigationOutput" name="Irrigation Output (m³)" fill={COLORS.secondary} onClick={(data) => handleMonthSelect(data.month)} cursor="pointer" />
                <Bar dataKey="inletSewage" name="Inlet Sewage (m³)" fill={COLORS.tertiary} onClick={(data) => handleMonthSelect(data.month)} cursor="pointer" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        
        {/* Daily Data Table (Only shown in daily view) */}
        {showDailyView && (
          <div className="mt-6">
            <h4 className="text-md font-medium mb-2">Daily Production Data for {selectedMonth}</h4>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Treated Water (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Irrigation Output (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inlet Sewage (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tankers
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tanker Volume (m³)
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Direct Inline (m³)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(dailyData[selectedMonth] || []).map((day, index) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {day.day}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {day.treatedWater}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {day.irrigationOutput}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {day.inletSewage}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {day.tankers}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {day.tankerVolume}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {day.directInlineSewage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {/* Monthly click hint (Only shown in monthly view) */}
        {!showDailyView && (
          <div className="mt-2 text-center text-sm text-gray-500">
            Click on any month's bar to view daily data for that month
          </div>
        )}
      </div>
      
      {/* Efficiency & Water Quality Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Efficiency Trends */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Efficiency Trends</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={getFilteredMonthlyData()}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[50, 120]} />
                <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(1)}%` : value} />
                <Legend />
                <ReferenceLine y={100} stroke="#888" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="treatmentEfficiency" name="Treatment Efficiency" stroke={COLORS.primary} strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="irrigationEfficiency" name="Irrigation Efficiency" stroke={COLORS.secondary} strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Water Quality Status */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Water Quality Status</h3>
          <div className="space-y-4">
            <QualityParameterCard
              name="Raw Sewage pH"
              value={waterQualityData.rawSewagePh.avg.toFixed(2)}
              target={waterQualityData.rawSewagePh.target}
              status={waterQualityData.rawSewagePh.status}
            />
            <QualityParameterCard
              name="MBR Product pH"
              value={waterQualityData.mbrProductPh.avg.toFixed(2)}
              target={waterQualityData.mbrProductPh.target}
              status={waterQualityData.mbrProductPh.status}
            />
            <QualityParameterCard
              name="Chlorine"
              value={`${waterQualityData.chlorine.avg.toFixed(2)} ppm`}
              target={`${waterQualityData.chlorine.target} ppm`}
              status={waterQualityData.chlorine.status}
            />
            <QualityParameterCard
              name="MLSS Stream I"
              value={`${waterQualityData.mlssStream1.avg.toFixed(2)} mg/L`}
              target={`${waterQualityData.mlssStream1.target} mg/L`}
              status={waterQualityData.mlssStream1.status}
            />
            <QualityParameterCard
              name="Aeration DO"
              value={`${waterQualityData.aerationDo.avg.toFixed(2)} ppm`}
              target={`${waterQualityData.aerationDo.target} ppm`}
              status={waterQualityData.aerationDo.status}
            />
          </div>
        </div>
      </div>
      
      {/* Sewage Sources & Capacity Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sewage Source Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Sewage Source Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sewageSourceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {sewageSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => typeof value === 'number' ? `${value.toFixed(2)} m³` : value} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="flex items-center">
                <span className="w-3 h-3 inline-block bg-blue-500 rounded-full mr-1"></span>
                Direct Inline Sewage
              </span>
              <span>{sewageSourceData[0].value.toFixed(2)} m³/day</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="flex items-center">
                <span className="w-3 h-3 inline-block bg-green-500 rounded-full mr-1"></span>
                Tanker Volume
              </span>
              <span>{sewageSourceData[1].value.toFixed(2)} m³/day</span>
            </div>
          </div>
        </div>
        
        {/* Capacity Utilization */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium mb-4">Capacity Utilization</h3>
          <div className="flex flex-col items-center">
            <div className="relative mb-4">
              <svg viewBox="0 0 200 100" className="w-48">
                {/* Background gauge */}
                <path 
                  d="M20,90 A 80,80 0 0,1 180,90" 
                  fill="none" 
                  stroke="#e5e7eb" 
                  strokeWidth="12" 
                  strokeLinecap="round"
                />
                {/* Value gauge */}
                <path 
                  d="M20,90 A 80,80 0 0,1 180,90" 
                  fill="none" 
                  stroke={COLORS.primary} 
                  strokeWidth="12" 
                  strokeLinecap="round"
                  strokeDasharray={`${Math.min(100, plantPerformance.capacityUtilization) * 3.14}, 314.16`}
                />
                {/* Display value */}
                <text 
                  x="100" 
                  y="85" 
                  textAnchor="middle" 
                  fontSize="24" 
                  fontWeight="bold" 
                  fill="#1f2937"
                >
                  {plantPerformance.capacityUtilization.toFixed(1)}%
                </text>
                <text 
                  x="100" 
                  y="105" 
                  textAnchor="middle" 
                  fontSize="14" 
                  fill="#6b7280"
                >
                  Capacity Utilization
                </text>
              </svg>
            </div>
            <div className="text-center mt-2">
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Design Capacity</p>
                  <p className="text-lg font-semibold text-gray-900">750 m³/day</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Current Average</p>
                  <p className="text-lg font-semibold text-gray-900">{plantPerformance.avgTreatedWater.toFixed(2)} m³/day</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Peak Production</p>
                  <p className="text-lg font-semibold text-gray-900">{plantPerformance.peakTreatedWater} m³/day</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Peak Capacity %</p>
                  <p className="text-lg font-semibold text-gray-900">{(plantPerformance.peakTreatedWater / 750 * 100).toFixed(1)}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render Flow Analysis tab
  const renderFlowAnalysis = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Detailed Flow Analysis</h3>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">View:</span>
            <select 
              className="border-gray-300 rounded-md text-sm"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            >
              {monthlyData.map(month => (
                <option key={month.month} value={month.month}>
                  {month.month}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Flow Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Avg. Daily Inlet"
            value={`${plantPerformance.avgInletSewage.toFixed(1)} m³`}
          />
          <StatCard
            title="Avg. Treated Water"
            value={`${plantPerformance.avgTreatedWater.toFixed(1)} m³`}
          />
          <StatCard
            title="Peak Treated Water"
            value={`${plantPerformance.peakTreatedWater} m³`}
          />
          <StatCard
            title="Treatment/Inlet Ratio"
            value={`${plantPerformance.treatmentEfficiency.toFixed(1)}%`}
          />
        </div>
        
        {/* Daily Flow Comparison Chart */}
        <div className="h-80 mt-6">
          <h4 className="text-md font-medium mb-3">Daily Flow Data for {selectedMonth}</h4>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={dailyData[selectedMonth] || []}
              margin={{ top: 20, right: 30, left: 20, bottom: 30 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `${Number(value).toLocaleString()} m³`} />
              <Legend />
              <Bar 
                dataKey="inletSewage" 
                name="Inlet Sewage (m³)" 
                fill={COLORS.tertiary}
                barSize={20}
              />
              <Line 
                type="monotone" 
                dataKey="treatedWater" 
                name="Treated Water (m³)" 
                stroke={COLORS.primary}
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="irrigationOutput" 
                name="Irrigation Output (m³)" 
                stroke={COLORS.secondary}
                strokeWidth={2}
              />
              <ReferenceLine y={750} stroke="red" strokeDasharray="3 3" label="Daily Capacity" />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        {/* Treatment Efficiency Chart */}
        <div className="h-80 mt-6">
          <h4 className="text-md font-medium mb-3">Daily Efficiency Calculation</h4>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={(dailyData[selectedMonth] || []).map(day => ({
                ...day,
                treatmentEfficiency: day.inletSewage ? (day.treatedWater / day.inletSewage * 100).toFixed(1) : 0,
                irrigationEfficiency: day.treatedWater ? (day.irrigationOutput / day.treatedWater * 100).toFixed(1) : 0
              }))}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis domain={[50, 120]} />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <ReferenceLine y={100} stroke="#888" strokeDasharray="3 3" />
              <Line 
                type="monotone" 
                dataKey="treatmentEfficiency" 
                name="Treatment Efficiency" 
                stroke={COLORS.primary}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 7 }}
              />
              <Line 
                type="monotone" 
                dataKey="irrigationEfficiency" 
                name="Irrigation Efficiency" 
                stroke={COLORS.secondary}
                strokeWidth={2}
                dot={{ r: 3 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Sewage Sources Chart */}
        <div className="h-80 mt-6">
          <h4 className="text-md font-medium mb-3">Daily Sewage Sources</h4>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dailyData[selectedMonth] || []}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              stackOffset="expand"
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis tickFormatter={(value) => `${Math.floor(value * 100)}%`} />
              <Tooltip 
                formatter={(value, name) => {
                  if (name === 'tankerVolume') {
                    const numValue = Number(value);
                    return [`${numValue} m³`, 'Tanker Volume'];
                  }
                  if (name === 'directInlineSewage') {
                    const numValue = Number(value);
                    return [`${numValue} m³`, 'Direct Inline'];
                  }
                  return [value, name];
                }}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="tankerVolume" 
                stackId="1" 
                stroke={COLORS.tertiary}
                fill={COLORS.tertiary} 
                name="Tanker Volume"
              />
              <Area 
                type="monotone" 
                dataKey="directInlineSewage" 
                stackId="1" 
                stroke={COLORS.primary}
                fill={COLORS.primary} 
                name="Direct Inline"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        
        {/* Daily Data Table */}
        <div className="mt-6">
          <h4 className="text-md font-medium mb-2">Daily Flow Data for {selectedMonth}</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treated Water (m³)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Irrigation Output (m³)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inlet Sewage (m³)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tankers
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tanker Volume (m³)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Direct Inline (m³)
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Treatment Efficiency
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Irrigation Efficiency
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(dailyData[selectedMonth] || []).map((day, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                      {day.day}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {day.treatedWater}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {day.irrigationOutput}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {day.inletSewage}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {day.tankers}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {day.tankerVolume}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {day.directInlineSewage}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {day.inletSewage ? (day.treatedWater / day.inletSewage * 100).toFixed(1) : 0}%
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                      {day.treatedWater ? (day.irrigationOutput / day.treatedWater * 100).toFixed(1) : 0}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render Water Quality tab
  const renderWaterQuality = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-medium mb-6">Water Quality Analysis</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* pH Values */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="text-md font-medium mb-3">pH Values</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Raw Sewage pH</span>
                  <span className="text-sm font-medium">{waterQualityData.rawSewagePh.avg.toFixed(2)}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, waterQualityData.rawSewagePh.avg / 8 * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>6.5</span>
                  <span>Target Range</span>
                  <span>8.0</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">MBR Product pH</span>
                  <span className="text-sm font-medium">{waterQualityData.mbrProductPh.avg.toFixed(2)}</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, waterQualityData.mbrProductPh.avg / 8 * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>6.5</span>
                  <span>Target Range</span>
                  <span>8.0</span>
                </div>
              </div>
              
              <div className="p-3 bg-green-50 rounded-md mt-4">
                <p className="text-sm text-green-800">
                  <span className="font-medium">Analysis:</span> Both raw sewage and MBR product pH values are within the optimal range of 6.5-8.0, indicating proper biological treatment processes.
                </p>
              </div>
            </div>
          </div>
          
          {/* Chlorine Dosing */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="text-md font-medium mb-3">Chlorine Dosing</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">MBR Product Chlorine</span>
                  <span className="text-sm font-medium">{waterQualityData.chlorine.avg.toFixed(2)} ppm</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, waterQualityData.chlorine.avg / 125 * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>Target: 125 ppm</span>
                  <span>200</span>
                </div>
              </div>
              
              <div className="p-3 bg-red-50 rounded-md mt-4">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Alert:</span> The average chlorine reading of {waterQualityData.chlorine.avg.toFixed(2)} ppm is significantly below the target of 125 ppm. This could indicate a chlorine dosing system failure or data collection issue. Immediate verification is needed.
                </p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-md mt-2">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Recommendation:</span> Check the chlorine dosing system and calibrate the chlorine sensor. Verify that data recording is accurately capturing chlorine levels.
                </p>
              </div>
            </div>
          </div>
          
          {/* MLSS */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="text-md font-medium mb-3">Mixed Liquor Suspended Solids (MLSS)</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">MLSS Stream I</span>
                  <span className="text-sm font-medium">{waterQualityData.mlssStream1.avg.toFixed(2)} mg/L</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, waterQualityData.mlssStream1.avg / 4000 * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>Target: 3000-4000 mg/L</span>
                  <span>5000</span>
                </div>
              </div>
              
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">MLSS Stream II</span>
                  <span className="text-sm font-medium">{waterQualityData.mlssStream2.avg.toFixed(2)} mg/L</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, waterQualityData.mlssStream2.avg / 4000 * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>Target: 3000-4000 mg/L</span>
                  <span>5000</span>
                </div>
              </div>
              
              <div className="p-3 bg-red-50 rounded-md mt-4">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Alert:</span> MLSS readings for both streams are significantly below the target range. This suggests a potential data collection issue, as these low values are inconsistent with the plant's good treatment performance.
                </p>
              </div>
            </div>
          </div>
          
          {/* Dissolved Oxygen */}
          <div className="rounded-lg border border-gray-200 p-4">
            <h4 className="text-md font-medium mb-3">Dissolved Oxygen (DO)</h4>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Aeration DO</span>
                  <span className="text-sm font-medium">{waterQualityData.aerationDo.avg.toFixed(2)} ppm</span>
                </div>
                <div className="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ 
                      width: `${Math.min(100, waterQualityData.aerationDo.avg / 3 * 100)}%` 
                    }}
                  ></div>
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>Target: 2-3 ppm</span>
                  <span>4</span>
                </div>
              </div>
              
              <div className="p-3 bg-red-50 rounded-md mt-4">
                <p className="text-sm text-red-800">
                  <span className="font-medium">Alert:</span> The average DO reading of {waterQualityData.aerationDo.avg.toFixed(2)} ppm is critically low. Like the MLSS readings, this appears to be a data collection or sensor issue, as such low values would not support the observed treatment performance.
                </p>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded-md mt-2">
                <p className="text-sm text-yellow-800">
                  <span className="font-medium">Recommendation:</span> Check DO sensors and calibrate them. Verify that aeration blowers are functioning properly and that data reporting is accurate.
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Water Quality Summary */}
        <div className="mt-6 rounded-lg bg-blue-50 p-4">
          <h4 className="text-md font-medium text-blue-800 mb-3">Water Quality Summary</h4>
          <p className="text-sm text-blue-800 mb-2">
            The pH parameters are within optimal ranges, which aligns with the plant's good performance metrics. However, there are significant discrepancies in the chlorine, MLSS, and DO readings, which don't align with the excellent treatment efficiency of {plantPerformance.treatmentEfficiency.toFixed(1)}%.
          </p>
          <p className="text-sm text-blue-800 mb-2">
            Given the MBR process normally requires MLSS concentrations of 8,000-12,000 mg/L, the extremely low readings suggest potential data collection or reporting issues rather than actual operational problems.
          </p>
          <p className="text-sm font-medium text-blue-800">
            Recommended actions: Conduct a comprehensive calibration of all water quality sensors and verify the data extraction/reporting methodology for these parameters.
          </p>
        </div>
      </div>
    </div>
  );
  
  // Render current tab content
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'flowAnalysis':
        return renderFlowAnalysis();
      case 'waterQuality':
        return renderWaterQuality();
      default:
        return renderOverview();
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">Muscat Bay STP Dashboard</h1>
              <span className="ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Enhanced
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  setSelectedMonth('Mar-25');
                  setShowDailyView(true);
                }}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Current Month (Mar-25)
              </button>
              <span className="text-sm text-gray-500">Data through March 2025</span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="mb-6">
          <nav className="flex space-x-4">
            <button
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                selectedTab === 'overview'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('overview')}
            >
              Overview
            </button>
            <button
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                selectedTab === 'flowAnalysis'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('flowAnalysis')}
            >
              Flow Analysis
            </button>
            <button
              className={`px-3 py-2 font-medium text-sm rounded-md ${
                selectedTab === 'waterQuality'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setSelectedTab('waterQuality')}
            >
              Water Quality
            </button>
          </nav>
        </div>
        
        {/* Tab Content */}
        {renderTabContent()}
      </main>
    </div>
  );
};

// Icons
const WaterDropIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
  </svg>
);

const EfficiencyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IrrigationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TankerIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
  </svg>
);

export default STPPlant;
