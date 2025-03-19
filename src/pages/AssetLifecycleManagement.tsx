
import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { 
  Calendar, ChevronDown, ChevronUp, AlertTriangle, Clock, DollarSign, 
  CheckCircle, Zap, FileText, Settings, Building, Search, Filter
} from 'lucide-react';
import Layout from '../components/layout/Layout';

// Type definitions for the data structures
interface AssetCategory {
  name: string;
  value: number;
  color: string;
}

interface MaintenanceForecast {
  year: string;
  cost: number;
}

interface AssetCondition {
  name: string;
  value: number;
  color: string;
}

interface CriticalAsset {
  id: number;
  name: string;
  location: string;
  cost: number;
  lifeExpectancy: number;
  nextScheduled: number;
  criticality: string;
}

interface MaintenanceTask {
  id: number;
  asset: string;
  zone: string;
  date: string;
  type: string;
  estimatedCost: number;
}

interface ReserveFund {
  zone: string;
  contribution: number;
  minimumBalance: number;
}

interface FinancialData {
  year: string;
  income: number;
  expense: number;
  balance: number;
}

// Main component
const AssetLifecycleManagement = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  // Sample data for dashboard
  const assetCategoriesData: AssetCategory[] = [
    { name: 'Architectural', value: 500, color: '#8884d8' },
    { name: 'Mechanical', value: 400, color: '#82ca9d' },
    { name: 'Electrical', value: 350, color: '#ffc658' },
    { name: 'External Works', value: 650, color: '#ff8042' },
    { name: 'Infrastructure', value: 200, color: '#0088fe' }
  ];

  const maintenanceForecastData: MaintenanceForecast[] = [
    { year: '2023', cost: 75000 },
    { year: '2024', cost: 120000 },
    { year: '2025', cost: 90000 },
    { year: '2026', cost: 210000 },
    { year: '2027', cost: 180000 },
    { year: '2028', cost: 320000 },
    { year: '2029', cost: 450000 },
    { year: '2030', cost: 250000 }
  ];

  const assetConditionData: AssetCondition[] = [
    { name: 'Excellent', value: 65, color: '#4CAF50' },
    { name: 'Good', value: 20, color: '#2196F3' },
    { name: 'Fair', value: 10, color: '#FFC107' },
    { name: 'Poor', value: 5, color: '#F44336' }
  ];

  const criticalAssetsData: CriticalAsset[] = [
    { id: 1, name: 'Chillers (Type 1)', location: 'Staff Accommodation', cost: 65625, lifeExpectancy: 20, nextScheduled: 2041, criticality: 'High' },
    { id: 2, name: 'Fire Pumps', location: 'Zone 3 (Al Zaha)', cost: 12060, lifeExpectancy: 15, nextScheduled: 2036, criticality: 'High' },
    { id: 3, name: 'Elevators', location: 'Typical Buildings', cost: 4870, lifeExpectancy: 18, nextScheduled: 2039, criticality: 'High' },
    { id: 4, name: 'STP Components', location: 'Master Community', cost: 54580, lifeExpectancy: 10, nextScheduled: 2031, criticality: 'High' },
    { id: 5, name: 'Main Distribution Boards', location: 'Staff Accommodation', cost: 9160, lifeExpectancy: 20, nextScheduled: 2041, criticality: 'High' }
  ];

  const upcomingMaintenanceData: MaintenanceTask[] = [
    { id: 1, asset: 'Road Markings', zone: 'Master Community', date: '2023-12-15', type: 'Repaint', estimatedCost: 10500 },
    { id: 2, asset: 'Fire Extinguishers', zone: 'Zone 5 (Al Nameer)', date: '2023-12-20', type: 'Replace', estimatedCost: 1200 },
    { id: 3, asset: 'Irrigation Pumps', zone: 'Zone 8 (Al Wajd)', date: '2024-01-10', type: 'Service', estimatedCost: 800 },
    { id: 4, asset: 'Ground Floor Parking', zone: 'Typical Buildings', date: '2024-01-15', type: 'Epoxy Repairs', estimatedCost: 1500 },
    { id: 5, asset: 'Lagoon Water Pumps', zone: 'Master Community', date: '2024-01-20', type: 'Maintenance', estimatedCost: 2200 }
  ];

  const reserveFundData: ReserveFund[] = [
    { zone: 'Typical Buildings (per building)', contribution: 2447, minimumBalance: 2000 },
    { zone: 'Zone 3 (Al Zaha)', contribution: 13624, minimumBalance: 8655 },
    { zone: 'Zone 5 (Al Nameer)', contribution: 17914, minimumBalance: 11327 },
    { zone: 'Zone 8 (Al Wajd)', contribution: 7281, minimumBalance: 4661 },
    { zone: 'Staff Accommodation & CF', contribution: 52636, minimumBalance: 103180 },
    { zone: 'Master Community', contribution: 166360, minimumBalance: 150000 }
  ];

  const financialForecastData: FinancialData[] = [
    { year: '2021', income: 260262, expense: 0, balance: 260262 },
    { year: '2022', income: 261563, expense: 9490, balance: 512335 },
    { year: '2023', income: 262871, expense: 0, balance: 775206 },
    { year: '2024', income: 264185, expense: 28210, balance: 1011181 },
    { year: '2025', income: 265506, expense: 65591, balance: 1211096 },
    { year: '2026', income: 266834, expense: 70819, balance: 1407111 },
    { year: '2027', income: 268168, expense: 42592, balance: 1632687 },
    { year: '2028', income: 269509, expense: 248833, balance: 1653363 },
    { year: '2029', income: 270856, expense: 161579, balance: 1762640 },
    { year: '2030', income: 272211, expense: 109033, balance: 1925818 },
    { year: '2031', income: 273572, expense: 67919, balance: 2131471 },
    { year: '2032', income: 274940, expense: 175944, balance: 2230467 },
    { year: '2033', income: 276314, expense: 263986, balance: 2242795 },
    { year: '2034', income: 277696, expense: 160821, balance: 2359670 },
    { year: '2035', income: 279084, expense: 290901, balance: 2347853 },
    { year: '2036', income: 280480, expense: 98272, balance: 2530061 },
    { year: '2037', income: 281882, expense: 273462, balance: 2538481 },
    { year: '2038', income: 283292, expense: 85191, balance: 2736582 },
    { year: '2039', income: 284708, expense: 327035, balance: 2694255 },
    { year: '2040', income: 286132, expense: 269492, balance: 2710895 }
  ];

  const toggleCard = (id: number) => {
    if (expandedCard === id) {
      setExpandedCard(null);
    } else {
      setExpandedCard(id);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-0">Asset Lifecycle Management</h1>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">Muscat Bay Community</span>
              <span className="px-3 py-1 rounded-full text-xs sm:text-sm font-medium bg-green-100 text-green-800">Live Data</span>
            </div>
          </div>
        </header>

        {/* Navigation Tabs */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
          <div className="border-b border-gray-200 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-8 whitespace-nowrap">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'overview'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'assets'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Asset Inventory
              </button>
              <button
                onClick={() => setActiveTab('maintenance')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'maintenance'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Maintenance
              </button>
              <button
                onClick={() => setActiveTab('financial')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'financial'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Financial Planning
              </button>
              <button
                onClick={() => setActiveTab('reports')}
                className={`px-3 py-2 text-sm font-medium ${
                  activeTab === 'reports'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reports
              </button>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500">Total Assets</h3>
                      <span className="text-xl sm:text-3xl font-bold">2,100+</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-green-500 font-medium">100%</span>
                    <span className="text-gray-500 text-sm"> properly documented</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-green-100 text-green-600">
                      <DollarSign className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500">Reserve Fund</h3>
                      <span className="text-xl sm:text-3xl font-bold">OMR 260,262</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-green-500 font-medium">+0.5%</span>
                    <span className="text-gray-500 text-sm"> annual growth rate</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-red-100 text-red-600">
                      <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500">Critical Assets</h3>
                      <span className="text-xl sm:text-3xl font-bold">5</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-red-500 font-medium">High priority</span>
                    <span className="text-gray-500 text-sm"> requiring monitoring</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <div className="flex items-center">
                    <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                      <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                    </div>
                    <div className="ml-4">
                      <h3 className="text-xs sm:text-sm font-medium text-gray-500">Upcoming Maintenance</h3>
                      <span className="text-xl sm:text-3xl font-bold">5</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-yellow-500 font-medium">Next 30 days</span>
                    <span className="text-gray-500 text-sm"> scheduled tasks</span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Asset Categories</h3>
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={assetCategoriesData}
                        margin={{ 
                          top: 10, 
                          right: 10, 
                          left: 0, 
                          bottom: 20 
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="name" 
                          tick={{ fontSize: 12 }}
                          angle={-45}
                          textAnchor="end"
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip 
                          contentStyle={{ fontSize: '12px' }}
                          formatter={(value) => [`${value}`, 'Number of Assets']}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                        <Bar dataKey="value" name="Number of Assets">
                          {assetCategoriesData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Asset Condition Distribution</h3>
                  <div className="h-72 sm:h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={assetConditionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => {
                            // Simplified labels for mobile
                            const isMobile = window.innerWidth < 640;
                            return isMobile ? 
                              `${(percent * 100).toFixed(0)}%` : 
                              `${name} ${(percent * 100).toFixed(0)}%`;
                          }}
                        >
                          {assetConditionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value) => `${value}%`} 
                          contentStyle={{ fontSize: '12px' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Maintenance Forecast Chart */}
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Maintenance Forecast (2023-2030)</h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={maintenanceForecastData}
                      margin={{ 
                        top: 10, 
                        right: 10, 
                        left: 0, 
                        bottom: 20 
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => {
                          const isMobile = window.innerWidth < 768;
                          return isMobile ? 
                            `${Math.floor(value / 1000)}k` : 
                            `OMR ${value.toLocaleString()}`;
                        }}
                      />
                      <Tooltip 
                        formatter={(value) => [`OMR ${value.toLocaleString()}`, 'Projected Cost']} 
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                      <Line type="monotone" dataKey="cost" name="Projected Cost" stroke="#8884d8" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Two Lists Row */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Critical Assets</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {criticalAssetsData.map((asset) => (
                      <div key={asset.id} className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{asset.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-500">{asset.location}</p>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            {asset.criticality}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap text-xs sm:text-sm gap-2 sm:gap-4">
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span>{asset.lifeExpectancy} years</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span>OMR {asset.cost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                    <h3 className="text-base sm:text-lg font-medium text-gray-900">Upcoming Maintenance</h3>
                  </div>
                  <div className="divide-y divide-gray-200">
                    {upcomingMaintenanceData.map((task) => (
                      <div key={task.id} className="px-4 py-3 sm:px-6 sm:py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-sm font-medium text-gray-900">{task.asset}</h4>
                            <p className="text-xs sm:text-sm text-gray-500">{task.zone}</p>
                          </div>
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            {task.type}
                          </span>
                        </div>
                        <div className="mt-2 flex flex-wrap text-xs sm:text-sm gap-2 sm:gap-4">
                          <div className="flex items-center text-gray-500">
                            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span>{new Date(task.date).toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                            <span>OMR {task.estimatedCost.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Reserve Fund Allocation</h3>
                </div>
                <div className="px-4 py-3 sm:px-6 sm:py-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Contribution (OMR)</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Minimum Balance (OMR)</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reserveFundData.map((item, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-normal sm:whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">{item.zone}</td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-500">{item.contribution.toLocaleString()}</td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right text-gray-500">{item.minimumBalance.toLocaleString()}</td>
                          <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-right">
                            <button className="text-blue-600 hover:text-blue-900">View Details</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">20-Year Financial Forecast</h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={financialForecastData}
                      margin={{ 
                        top: 10, 
                        right: 10, 
                        left: 0, 
                        bottom: 20 
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="year" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(value) => {
                          const isMobile = window.innerWidth < 768;
                          return isMobile ? 
                            `${Math.floor(value / 1000)}k` : 
                            `${Math.floor(value / 1000)}k`;
                        }}
                      />
                      <Tooltip 
                        formatter={(value) => [`OMR ${value.toLocaleString()}`, '']} 
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                      <Line type="monotone" dataKey="income" name="Annual Contribution" stroke="#4CAF50" strokeWidth={2} />
                      <Line type="monotone" dataKey="expense" name="Annual Expenditure" stroke="#F44336" strokeWidth={2} />
                      <Line type="monotone" dataKey="balance" name="Reserve Balance" stroke="#2196F3" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Financial Parameters</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500">Contribution Growth Rate</h4>
                    <p className="text-xl sm:text-2xl font-bold">0.5%</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500">Inflation Rate</h4>
                    <p className="text-xl sm:text-2xl font-bold">0.5%</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500">Interest Rate</h4>
                    <p className="text-xl sm:text-2xl font-bold">1.5%</p>
                  </div>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-xs sm:text-sm font-medium text-gray-500">Contingency</h4>
                    <p className="text-xl sm:text-2xl font-bold">5.0%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Maintenance Calendar</h3>
                </div>
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col space-y-4">
                    {upcomingMaintenanceData.map((task) => (
                      <div 
                        key={task.id}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <div 
                          className="px-3 py-2 sm:px-4 sm:py-3 bg-gray-50 flex justify-between items-center cursor-pointer"
                          onClick={() => toggleCard(task.id)}
                        >
                          <div className="flex items-center">
                            {task.type === 'Replace' ? (
                              <div className="p-1.5 sm:p-2 rounded-full bg-red-100 text-red-600 mr-2 sm:mr-3">
                                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                            ) : task.type === 'Service' ? (
                              <div className="p-1.5 sm:p-2 rounded-full bg-blue-100 text-blue-600 mr-2 sm:mr-3">
                                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                            ) : (
                              <div className="p-1.5 sm:p-2 rounded-full bg-yellow-100 text-yellow-600 mr-2 sm:mr-3">
                                <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                              </div>
                            )}
                            <div>
                              <h4 className="text-xs sm:text-sm font-medium text-gray-900">{task.asset}</h4>
                              <div className="flex items-center text-xs text-gray-500">
                                <Calendar className="h-3 w-3 mr-1" />
                                <span>{new Date(task.date).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-800 mr-2 hidden sm:inline-block">
                              {task.zone}
                            </span>
                            {expandedCard === task.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </div>
                        {expandedCard === task.id && (
                          <div className="px-3 py-2 sm:px-4 sm:py-3 border-t border-gray-200">
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                              <div>
                                <dt className="text-xs text-gray-500">Maintenance Type</dt>
                                <dd className="text-xs sm:text-sm font-medium text-gray-900">{task.type}</dd>
                              </div>
                              <div>
                                <dt className="text-xs text-gray-500">Estimated Cost</dt>
                                <dd className="text-xs sm:text-sm font-medium text-gray-900">OMR {task.estimatedCost.toLocaleString()}</dd>
                              </div>
                              <div className="sm:col-span-2">
                                <dt className="text-xs text-gray-500">Description</dt>
                                <dd className="text-xs sm:text-sm text-gray-900">
                                  Scheduled {task.type.toLowerCase()} of {task.asset} in {task.zone} according to 
                                  the asset lifecycle management plan. This task ensures operational reliability
                                  and extends asset lifespan.
                                </dd>
                              </div>
                              <div className="sm:col-span-2 mt-2">
                                <button className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                  <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Mark as Complete
                                </button>
                              </div>
                            </dl>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Maintenance By Category</h3>
                <div className="h-72 sm:h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Preventive', value: 65, color: '#4CAF50' },
                          { name: 'Corrective', value: 20, color: '#FFC107' },
                          { name: 'Replacement', value: 15, color: '#F44336' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => {
                          // Simplified labels for mobile
                          const isMobile = window.innerWidth < 640;
                          return isMobile ? 
                            `${(percent * 100).toFixed(0)}%` : 
                            `${name} ${(percent * 100).toFixed(0)}%`;
                        }}
                      >
                        {[
                          { name: 'Preventive', value: 65, color: '#4CAF50' },
                          { name: 'Corrective', value: 20, color: '#FFC107' },
                          { name: 'Replacement', value: 15, color: '#F44336' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => `${value}%`} 
                        contentStyle={{ fontSize: '12px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'assets' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">Asset Inventory</h3>
                  <div className="flex flex-col sm:flex-row gap-2 sm:space-x-2">
                    <div className="relative">
                      <input
                        type="text"
                        className="w-full focus:ring-blue-500 focus:border-blue-500 block pl-9 pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-md text-sm"
                        placeholder="Search assets..."
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-gray-400" />
                      </div>
                    </div>
                    <select className="focus:ring-blue-500 focus:border-blue-500 py-1.5 sm:py-2 px-3 border border-gray-300 bg-white rounded-md text-sm">
                      <option>All Categories</option>
                      <option>Architectural</option>
                      <option>Mechanical</option>
                      <option>Electrical</option>
                      <option>External Works</option>
                      <option>Infrastructure</option>
                    </select>
                    <select className="focus:ring-blue-500 focus:border-blue-500 py-1.5 sm:py-2 px-3 border border-gray-300 bg-white rounded-md text-sm">
                      <option>All Locations</option>
                      <option>Typical Buildings</option>
                      <option>Zone 3 (Al Zaha)</option>
                      <option>Zone 5 (Al Nameer)</option>
                      <option>Zone 8 (Al Wajd)</option>
                      <option>Staff Accommodation</option>
                      <option>Master Community</option>
                    </select>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Name</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Condition</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Install Date</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Life Expectancy</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Replacement Cost</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Chillers (Type 1)</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Mechanical</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Staff Accommodation</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2021-01-15</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">20 years</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">OMR 65,625</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Fire Pumps</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Mechanical</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Zone 3 (Al Zaha)</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2021-02-20</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">15 years</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">OMR 12,060</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Elevators</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Mechanical</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Typical Buildings</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2021-03-10</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">18 years</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">OMR 4,870</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">STP Components</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Infrastructure</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Master Community</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2021-02-05</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">10 years</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">OMR 54,580</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Main Distribution Boards</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Electrical</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Staff Accommodation</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                        </td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2021-01-30</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">20 years</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">OMR 9,160</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900">View</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="px-3 py-2 sm:px-6 sm:py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-gray-200">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-700">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">2,100+</span> assets
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                      <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        1
                      </a>
                      <a href="#" className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        2
                      </a>
                      <a href="#" className="relative hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        3
                      </a>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        ...
                      </span>
                      <a href="#" className="relative hidden sm:inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
                        10
                      </a>
                      <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Available Reports</h3>
                  <ul className="divide-y divide-gray-200">
                    <li className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-shrink-0 mr-0 sm:mr-3 mb-2 sm:mb-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Asset Lifecycle Summary Report</p>
                        <p className="text-xs sm:text-sm text-gray-500">Overview of all assets with lifecycle information</p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <button className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Download
                        </button>
                      </div>
                    </li>
                    <li className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-shrink-0 mr-0 sm:mr-3 mb-2 sm:mb-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Maintenance Forecast Report</p>
                        <p className="text-xs sm:text-sm text-gray-500">20-year projection of maintenance activities</p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <button className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Download
                        </button>
                      </div>
                    </li>
                    <li className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-shrink-0 mr-0 sm:mr-3 mb-2 sm:mb-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Reserve Fund Analysis</p>
                        <p className="text-xs sm:text-sm text-gray-500">Detailed financial projections for asset replacements</p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <button className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Download
                        </button>
                      </div>
                    </li>
                    <li className="py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center">
                      <div className="flex-shrink-0 mr-0 sm:mr-3 mb-2 sm:mb-0">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Critical Assets Report</p>
                        <p className="text-xs sm:text-sm text-gray-500">Focus on high-criticality assets requiring special attention</p>
                      </div>
                      <div className="mt-2 sm:mt-0">
                        <button className="inline-flex items-center px-2 py-1 sm:px-3 sm:py-1 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                          Download
                        </button>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Generate Custom Report</h3>
                  <form className="space-y-3 sm:space-y-4">
                    <div>
                      <label htmlFor="report-type" className="block text-xs sm:text-sm font-medium text-gray-700">Report Type</label>
                      <select id="report-type" className="mt-1 block w-full py-1.5 sm:py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm">
                        <option>Asset Lifecycle Report</option>
                        <option>Maintenance Schedule</option>
                        <option>Financial Projection</option>
                        <option>Asset Condition Assessment</option>
                        <option>Risk Analysis</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="asset-category" className="block text-xs sm:text-sm font-medium text-gray-700">Asset Category</label>
                      <select id="asset-category" className="mt-1 block w-full py-1.5 sm:py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm">
                        <option>All Categories</option>
                        <option>Architectural</option>
                        <option>Mechanical</option>
                        <option>Electrical</option>
                        <option>External Works</option>
                        <option>Infrastructure</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="location" className="block text-xs sm:text-sm font-medium text-gray-700">Location</label>
                      <select id="location" className="mt-1 block w-full py-1.5 sm:py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm">
                        <option>All Locations</option>
                        <option>Typical Buildings</option>
                        <option>Zone 3 (Al Zaha)</option>
                        <option>Zone 5 (Al Nameer)</option>
                        <option>Zone 8 (Al Wajd)</option>
                        <option>Staff Accommodation</option>
                        <option>Master Community</option>
                      </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      <div>
                        <label htmlFor="start-date" className="block text-xs sm:text-sm font-medium text-gray-700">Start Date</label>
                        <input type="date" id="start-date" className="mt-1 block w-full py-1.5 sm:py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm" />
                      </div>
                      <div>
                        <label htmlFor="end-date" className="block text-xs sm:text-sm font-medium text-gray-700">End Date</label>
                        <input type="date" id="end-date" className="mt-1 block w-full py-1.5 sm:py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm" />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="format" className="block text-xs sm:text-sm font-medium text-gray-700">Format</label>
                      <select id="format" className="mt-1 block w-full py-1.5 sm:py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-xs sm:text-sm">
                        <option>PDF</option>
                        <option>Excel</option>
                        <option>CSV</option>
                      </select>
                    </div>
                    <div className="pt-1 sm:pt-2">
                      <button type="submit" className="w-full flex justify-center py-1.5 sm:py-2 px-4 border border-transparent rounded-md shadow-sm text-xs sm:text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                        Generate Report
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Recent Reports</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report Name</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated On</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Generated By</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Format</th>
                        <th className="px-3 py-2 sm:px-6 sm:py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Muscat Bay ALM Monthly Summary</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2023-11-01</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">System</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">PDF</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-blue-600 hover:text-blue-900">Download</button>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Critical Assets Status Report</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2023-10-15</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Ahmed Hassan</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Excel</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-blue-600 hover:text-blue-900">Download</button>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Maintenance Schedule Q4 2023</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2023-10-01</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Sarah Johnson</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">PDF</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-blue-600 hover:text-blue-900">Download</button>
                        </td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm font-medium text-gray-900">Reserve Fund Analysis 2023</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">2023-09-15</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">Mohammed Al-Balushi</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">PDF</td>
                        <td className="px-3 py-2 sm:px-6 sm:py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                          <button className="text-blue-600 hover:text-blue-900">Download</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </Layout>
  );
};

export default AssetLifecycleManagement;
