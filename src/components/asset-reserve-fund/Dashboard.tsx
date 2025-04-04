
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';
import { rfsFullData, mockYearlyData, mockZoneBalances, mockAssetCategories, mockUpcomingReplacements } from '@/data/reserveFundData';
import { RFSYearData } from '@/data/reserveFundData';
import { Chart, ChartContainer, ChartTooltip } from '@/components/ui/chart';
import { AreaChart, Area } from 'recharts';
import { Calculator, Calendar, ChartPieIcon, AlertTriangle } from 'lucide-react';

interface DashboardProps {
  compactView?: boolean;
  darkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ compactView, darkMode }) => {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [yearsToShow, setYearsToShow] = useState(10);
  const [selectedChart, setSelectedChart] = useState('balance');
  
  // Get available years from the RFS data
  const availableYears = useMemo(() => Object.keys(rfsFullData).sort(), []);
  
  // If the selected year doesn't exist in the data, default to the first available year
  useEffect(() => {
    if (!availableYears.includes(selectedYear) && availableYears.length > 0) {
      setSelectedYear(availableYears[0]);
    }
  }, [selectedYear, availableYears]);
  
  // Get the current year data
  const currentYearData: RFSYearData | undefined = useMemo(() => 
    rfsFullData[selectedYear], 
    [selectedYear]
  );
  
  // Calculate remaining years based on current selection
  const filteredYearlyData = useMemo(() => {
    return mockYearlyData.slice(0, yearsToShow);
  }, [yearsToShow]);
  
  // Calculate funding percentage (simplified calculation)
  const fundingPercentage = useMemo(() => {
    if (!currentYearData) return 0;
    
    // This is a simplified calculation - ideally should be based on actual RFS methodology
    // General formula: Current Balance / Total Replacement Value (not provided in the data)
    // Using 72% as placeholder, based on image
    return 72;
  }, [currentYearData]);
  
  // Calculate critical components (components due within 2 years of selected year)
  const criticalComponents = useMemo(() => {
    if (!currentYearData) return 0;
    
    const selectedYearNum = parseInt(selectedYear);
    return mockUpcomingReplacements.filter(item => {
      return item.year <= selectedYearNum + 2 && item.year >= selectedYearNum;
    }).length;
  }, [selectedYear, currentYearData]);
  
  // Calculate upcoming replacements for the selected year (and possibly next year)
  const upcomingReplacements = useMemo(() => {
    if (!currentYearData) return [];
    
    const selectedYearNum = parseInt(selectedYear);
    return mockUpcomingReplacements
      .filter(item => item.year >= selectedYearNum && item.year <= selectedYearNum + 2)
      .sort((a, b) => a.year - b.year || a.component.localeCompare(b.component));
  }, [selectedYear, currentYearData]);
  
  // Prepare zone balance data for pie chart
  const zoneBalanceData = useMemo(() => {
    if (!currentYearData) return mockZoneBalances;
    
    // Transform the currentYearData zones into the format needed for the pie chart
    const colors = ['#4E4456', '#6D5D7B', '#AD9BBD', '#866E96', '#B6A4C2', '#3A333F'];
    
    return Object.entries(currentYearData.zones).map(([zoneName, zoneData], index) => ({
      name: zoneName,
      value: zoneData.balance,
      color: colors[index % colors.length]
    }));
  }, [currentYearData]);
  
  // Chart colors
  const chartColors = { balance: '#4E4456', contribution: '#6D5D7B', expenditure: '#AD9BBD' };

  if (!currentYearData) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-lg text-gray-500">Loading data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className={`${compactView ? 'text-xl' : 'text-2xl'} font-bold text-[#4E4456] dark:text-[#AD9BBD]`}>
          Reserve Fund Dashboard
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Year:</label>
            <select
              className={`border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 ${ darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300' }`}
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Forecast:</label>
            <select
              className={`border rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 ${ darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'border-gray-300' }`}
              value={yearsToShow}
              onChange={(e) => setYearsToShow(parseInt(e.target.value))}
            >
              <option value={5}>5 Years</option>
              <option value={10}>10 Years</option>
              <option value={20}>20 Years</option>
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Total Reserve Balance"
          value={`OMR ${currentYearData.totalBalance.toLocaleString()}`}
          description="Projected EOY Balance"
          trend="up"
          icon={
            <Calculator className="w-7 h-7" />
          }
          compactView={compactView}
          darkMode={darkMode}
        />
        <KpiCard
          title="Annual Contribution"
          value={`OMR ${currentYearData.totalContribution.toLocaleString()}`}
          description="Projected for the year"
          trend="up"
          icon={
            <Calendar className="w-7 h-7" />
          }
          compactView={compactView}
          darkMode={darkMode}
        />
        <KpiCard
          title="Funding Percentage"
          value={`${fundingPercentage}%`}
          description="Current funding adequacy"
          trend={fundingPercentage >= 70 ? "up" : "down"}
          icon={
            <ChartPieIcon className="w-7 h-7" />
          }
          compactView={compactView}
          darkMode={darkMode}
        />
        <KpiCard
          title="Critical Components"
          value={criticalComponents.toString()}
          description="Requiring replacement soon"
          trend={criticalComponents <= 5 ? "up" : "down"}
          icon={
            <AlertTriangle className="w-7 h-7" />
          }
          compactView={compactView}
          darkMode={darkMode}
        />
      </div>

      {/* Chart and table sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reserve Fund Overview Chart */}
        <ChartCard title="Reserve Fund Overview" darkMode={darkMode}>
          <div className="flex justify-center mb-4">
            <div className="inline-flex rounded-md border border-gray-200 dark:border-gray-700 p-1">
              {['balance', 'contribution', 'expenditure'].map((chart) => (
                <button
                  key={chart}
                  className={`px-3 py-1 text-sm font-medium rounded transition-colors ${ selectedChart === chart ? 'bg-[#4E4456] text-white' : `${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}` }`}
                  onClick={() => setSelectedChart(chart)}
                >
                  {chart.charAt(0).toUpperCase() + chart.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            {selectedChart === 'expenditure' ? (
              <BarChart data={filteredYearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="year" tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }} />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }} />
                <Tooltip
                  formatter={(value) => [`OMR ${value.toLocaleString()}`, 'Expenditure']}
                  labelFormatter={(label) => `Year: ${label}`}
                  contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderColor: darkMode ? '#374151' : '#E5E7EB', borderRadius: '0.5rem' }}
                  itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }}
                  labelStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }}
                />
                <Legend />
                <Bar dataKey="expenditure" name="Expenditure" fill="#AD9BBD" radius={[4, 4, 0, 0]}>
                  {filteredYearlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.year === selectedYear ? '#4E4456' : '#AD9BBD'} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <AreaChart data={filteredYearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#E5E7EB'} />
                <XAxis dataKey="year" tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }} />
                <YAxis tickFormatter={(value) => `${value / 1000}k`} tick={{ fill: darkMode ? '#9CA3AF' : '#4B5563' }} />
                <Tooltip
                  formatter={(value, name) => [`OMR ${value.toLocaleString()}`, name === 'balance' ? 'Balance' : 'Contribution']}
                  labelFormatter={(label) => `Year: ${label}`}
                  contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderColor: darkMode ? '#374151' : '#E5E7EB', borderRadius: '0.5rem' }}
                  itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }}
                  labelStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey={selectedChart}
                  name={selectedChart === 'balance' ? 'Reserve Balance' : 'Annual Contribution'}
                  stroke={chartColors[selectedChart]}
                  fill={`${chartColors[selectedChart]}20`}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        {/* Fund Distribution by Zone Chart */}
        <ChartCard title={`Fund Distribution by Zone (EOY ${selectedYear})`} darkMode={darkMode}>
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="w-full md:w-1/2">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={zoneBalanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {zoneBalanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `OMR ${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderColor: darkMode ? '#374151' : '#E5E7EB', borderRadius: '0.5rem' }}
                    itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }}
                    labelStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 mt-4 md:mt-0">
              <div className="space-y-2">
                {zoneBalanceData.map((zone, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: zone.color }}
                      ></div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{zone.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      OMR {zone.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Asset Categories Chart */}
        <ChartCard title="Asset Categories by Replacement Value" darkMode={darkMode}>
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="w-full md:w-1/2">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={mockAssetCategories}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {mockAssetCategories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `OMR ${value.toLocaleString()}`}
                    contentStyle={{ backgroundColor: darkMode ? '#1F2937' : '#FFFFFF', borderColor: darkMode ? '#374151' : '#E5E7EB', borderRadius: '0.5rem' }}
                    itemStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }}
                    labelStyle={{ color: darkMode ? '#E5E7EB' : '#1F2937' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 mt-4 md:mt-0">
              <div className="space-y-2">
                {mockAssetCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className="w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: category.color }}
                      ></div>
                      <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>{category.name}</span>
                    </div>
                    <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      OMR {(category.value / 1000000).toFixed(1)}M
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ChartCard>

        {/* Upcoming Component Replacements */}
        <ChartCard title="Upcoming Component Replacements" darkMode={darkMode}>
          <div className="overflow-x-auto">
            <table className={`min-w-full divide-y ${darkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              <thead className={darkMode ? 'bg-gray-800' : 'bg-gray-50'}>
                <tr>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Component</th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Location</th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Year</th>
                  <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Est. Cost (OMR)</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-900 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                {upcomingReplacements.map((replacement, index) => {
                  const isCurrentYear = replacement.year === parseInt(selectedYear);
                  
                  return (
                    <tr key={index} className={`transition-colors ${isCurrentYear ? (darkMode ? 'bg-[#4E4456]/20' : 'bg-[#4E4456]/5') : ''} ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${isCurrentYear ? 'text-[#4E4456] dark:text-[#AD9BBD]' : darkMode ? 'text-white' : 'text-gray-900'}`}>{replacement.component}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{replacement.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${isCurrentYear ? 'font-bold' : ''} ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{replacement.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{replacement.cost?.toLocaleString()}</div>
                      </td>
                    </tr>
                  );
                })}
                {upcomingReplacements.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                      No major component replacements scheduled for this period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <button className="px-4 py-2 text-sm bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] text-white rounded-md hover:opacity-90 transition-opacity">
              View All Components
            </button>
          </div>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
