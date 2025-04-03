
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import KpiCard from './KpiCard';
import ChartCard from './ChartCard';
import { mockYearlyData, mockZoneBalances, mockAssetCategories, mockUpcomingReplacements } from '@/data/reserveFundData';

interface DashboardProps {
  compactView?: boolean;
  darkMode?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ compactView, darkMode }) => {
  const [selectedYear, setSelectedYear] = useState('2025');
  const [yearsToShow, setYearsToShow] = useState(10);
  const [selectedChart, setSelectedChart] = useState('balance');
  
  const filteredYearlyData = useMemo(() => mockYearlyData.slice(0, yearsToShow), [yearsToShow]);
  
  const currentYearData = useMemo(() => 
    mockYearlyData.find(data => data.year === selectedYear) || mockYearlyData[4], 
    [selectedYear]
  );
  
  const fundingPercentage = 72;
  
  const criticalComponents = useMemo(() => 
    mockUpcomingReplacements.filter(item => 
      parseInt(item.year.toString()) <= parseInt(selectedYear) + 2
    ).length, 
    [selectedYear]
  );
  
  const chartColors = { balance: '#4E4456', contribution: '#6D5D7B', expenditure: '#AD9BBD' };

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
              {mockYearlyData.map(data => (
                <option key={data.year} value={data.year}>{data.year}</option>
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
          value={`OMR ${currentYearData.balance.toLocaleString()}`}
          description="Projected EOY Balance"
          trend="up"
          icon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          compactView={compactView}
          darkMode={darkMode}
        />
        <KpiCard
          title="Annual Contribution"
          value={`OMR ${currentYearData.contribution.toLocaleString()}`}
          description="Projected for the year"
          trend="up"
          icon={
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 11l3-3m0 0l3 3m-3-3v8m0-13a9 9 0 110 18 9 9 0 010-18z" />
            </svg>
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
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
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
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
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
                    <Cell key={`cell-${index}`} fill={entry.expenditure > 100000 ? '#4E4456' : '#AD9BBD'} />
                  ))}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={filteredYearlyData}>
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
                <Line
                  type="monotone"
                  dataKey={selectedChart}
                  name={selectedChart === 'balance' ? 'Reserve Balance' : 'Annual Contribution'}
                  stroke={chartColors[selectedChart]}
                  strokeWidth={2}
                  dot={{ r: 4, strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                />
              </LineChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        {/* Fund Distribution by Zone Chart */}
        <ChartCard title="Fund Distribution by Zone (EOY 2025)" darkMode={darkMode}>
          <div className="flex flex-col md:flex-row items-center justify-center">
            <div className="w-full md:w-1/2">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={mockZoneBalances}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    nameKey="name"
                    label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {mockZoneBalances.map((entry, index) => (
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
                {mockZoneBalances.map((zone, index) => (
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
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Est. Replace Year</th>
                  <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Est. Cost (OMR)</th>
                  <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-wider`}>Status</th>
                </tr>
              </thead>
              <tbody className={`${darkMode ? 'bg-gray-900 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'}`}>
                {mockUpcomingReplacements
                  .sort((a, b) => a.year - b.year)
                  .map((replacement, index) => (
                    <tr key={index} className={`transition-colors ${darkMode ? 'hover:bg-gray-800' : 'hover:bg-gray-50'}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{replacement.component}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{replacement.location}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{replacement.year}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{replacement.cost.toLocaleString()}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${ 
                          replacement.year <= parseInt(selectedYear) + 1 
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                            : replacement.year <= parseInt(selectedYear) + 3 
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        }`}>
                          {replacement.year <= parseInt(selectedYear) + 1 
                            ? 'Critical' 
                            : replacement.year <= parseInt(selectedYear) + 3 
                              ? 'Warning' 
                              : 'Good'}
                        </span>
                      </td>
                    </tr>
                  ))}
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
