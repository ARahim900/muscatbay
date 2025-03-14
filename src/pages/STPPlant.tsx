
import React, { useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, ComposedChart, ReferenceLine
} from 'recharts';
import { StatCard } from '../components/stp/StatCard';
import { KpiCard } from '../components/stp/KpiCard';
import { QualityParameterCard } from '../components/stp/QualityParameterCard';
import { WaterDropIcon, EfficiencyIcon, IrrigationIcon, TankerIcon } from '../components/stp/STPIcons';

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
                  label={({ name, value }) => `${name}: ${value} m³`}
                >
                  {sewageSourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value} m³`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">STP Plant Dashboard</h1>
        <p className="text-gray-600">Daily and monthly performance analysis</p>
      </div>
      
      {renderOverview()}
    </div>
  );
};

export default STPPlant;
