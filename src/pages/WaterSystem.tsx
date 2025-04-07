
import React, { useState, useEffect } from 'react';
import { Droplets } from 'lucide-react';
import { 
  BarChart, Bar, 
  LineChart, Line,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define interfaces for our data structures
interface KpiCardProps {
  title: string;
  value: number;
  formatter: (num: number) => string;
  color: string;
  icon: string;
  trend?: string; // Making trend optional
}

interface ProgressCardProps {
  value: number;
  max: number;
  label: string;
  color: string;
  percentage?: number; // Making percentage optional
  size?: string;
}

interface TooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// Define types for the data metrics
interface ZoneDetail {
  l2Reading: number;
  l3Sum: number;
  loss: number;
  lossPercent: number;
}

interface MonthlyMetric {
  L1: number;
  L2: number;
  L3: number;
  DC: number;
}

interface LossMetric {
  stage1Loss: number;
  stage2Loss: number;
  totalLoss: number;
  stage1LossPercent: number;
  stage2LossPercent: number;
  totalLossPercent: number;
}

// Colors for charts
const COLORS = {
  primary: '#0072CE',
  secondary: '#6B8E23',
  tertiary: '#B22222',
  quaternary: '#4682B4',
  danger: '#D14343',
  success: '#4CAF50',
  warning: '#FFC107',
  info: '#2196F3',
  light: '#f8f9fa',
  dark: '#343a40',
};

// Sample data
const actualData = {
  monthlyMetrics: {
    'Jan-25': { L1: 19824, L2: 19136, L3: 14805, DC: 2425 },
    'Feb-25': { L1: 18712, L2: 18011, L3: 14255, DC: 2136 },
    'Mar-25': { L1: 20516, L2: 19802, L3: 15488, DC: 2355 },
    'Total': { L1: 59052, L2: 56949, L3: 44548, DC: 6916 }
  },
  lossMetrics: {
    'Jan-25': { 
      stage1Loss: 688, stage2Loss: 1906, totalLoss: 2594,
      stage1LossPercent: 3.47, stage2LossPercent: 9.96, totalLossPercent: 13.08
    },
    'Feb-25': { 
      stage1Loss: 701, stage2Loss: 1620, totalLoss: 2321,
      stage1LossPercent: 3.75, stage2LossPercent: 8.99, totalLossPercent: 12.40
    },
    'Mar-25': { 
      stage1Loss: 714, stage2Loss: 1959, totalLoss: 2673,
      stage1LossPercent: 3.48, stage2LossPercent: 9.89, totalLossPercent: 13.03
    },
    'Total': { 
      stage1Loss: 2103, stage2Loss: 5485, totalLoss: 7588,
      stage1LossPercent: 3.56, stage2LossPercent: 9.62, totalLossPercent: 12.85
    }
  }
};

// KPI Card Component
const KpiCard: React.FC<KpiCardProps> = ({ title, value, formatter, color, icon }) => {
  return (
    <div className={`rounded-xl overflow-hidden shadow-md bg-white`}>
      <div className={`p-4 border-l-4 border-${color}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
            <p className={`text-2xl sm:text-3xl font-bold text-${color}`}>{formatter(value)}</p>
          </div>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-${color}/10 text-${color}`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Progress Card Component
const ProgressCard: React.FC<ProgressCardProps> = ({ value, max, label, color, size = "md" }) => {
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className={`rounded-xl overflow-hidden shadow-md bg-white p-4`}>
      <div className="mb-2 flex justify-between">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-sm text-gray-700 font-medium">{value.toLocaleString()} / {max.toLocaleString()}</p>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div 
          className={`bg-${color} h-3 rounded-full`}
          style={{ width: `${percentage}%` }}
        >
        </div>
      </div>
      <p className={`text-right mt-1 text-${color} font-medium`}>{percentage}%</p>
    </div>
  );
};

// Custom tooltip component for charts
const CustomTooltip: React.FC<TooltipProps> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-2 bg-white/90 backdrop-blur-sm shadow-lg border border-gray-200 rounded-lg">
        <p className="font-medium text-gray-900">{label}</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} style={{ color: entry.color }}>
            {`${entry.name}: ${typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}`}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

// Water System Dashboard component
const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Total');
  const [selectedZone, setSelectedZone] = useState<string>('Zone A');
  const [showParentDetails, setShowParentDetails] = useState<string | null>(null);
  
  // Data manipulations based on selected period
  const currentData = useMemo(() => {
    // Helper functions
    const formatNumber = (num: number) => num.toLocaleString();
    const formatPercent = (num: number) => `${num.toFixed(1)}%`;
    
    // Get loss color based on percentage
    const getLossColor = (lossPercent: number) => {
      if (lossPercent < 0) return 'success';
      if (lossPercent < 10) return 'info';
      if (lossPercent < 25) return 'warning';
      return 'danger';
    };
    
    // Calculate KPIs based on the selected period
    const selectedMetrics = actualData.monthlyMetrics[selectedPeriod];
    const lossMetrics = actualData.lossMetrics[selectedPeriod];
    
    // Dummy zone details
    const zoneDetails: Record<string, ZoneDetail> = {
      'Zone A': { 
        l2Reading: 8500, 
        l3Sum: 7200, 
        loss: 1300, 
        lossPercent: 15.3 
      },
      'Zone B': { 
        l2Reading: 5200, 
        l3Sum: 4900, 
        loss: 300, 
        lossPercent: 5.8 
      },
      'Zone C': { 
        l2Reading: 7800, 
        l3Sum: 8100, 
        loss: -300, 
        lossPercent: -3.8 
      },
      'Zone D': { 
        l2Reading: 6300, 
        l3Sum: 4600, 
        loss: 1700, 
        lossPercent: 27.0 
      },
      'Zone E': { 
        l2Reading: 4100, 
        l3Sum: 3800, 
        loss: 300, 
        lossPercent: 7.3 
      }
    };
    
    // Top loss zones
    const topLossZones = Object.entries(zoneDetails)
      .map(([zone, data]) => ({
        zone,
        lossPercent: data.lossPercent,
        loss: data.loss
      }))
      .filter(z => z.lossPercent > 0)
      .sort((a, b) => b.lossPercent - a.lossPercent)
      .slice(0, 5);
    
    // Consumption data by type
    const typeBreakdown = [
      { type: 'Residential', value: 30750, color: '#4682B4' },
      { type: 'Commercial', value: 8642, color: '#6B8E23' },
      { type: 'Irrigation', value: 12072, color: '#B22222' },
      { type: 'Community', value: 6750, color: '#DAA520' },
      { type: 'Other', value: 3800, color: '#808080' }
    ];
    
    // Monthly consumption
    const monthlyData = [
      { month: 'Jan-25', Supply: selectedMetrics.L1, Consumption: selectedMetrics.L3 + selectedMetrics.DC },
      { month: 'Feb-25', Supply: actualData.monthlyMetrics['Feb-25'].L1, Consumption: actualData.monthlyMetrics['Feb-25'].L3 + actualData.monthlyMetrics['Feb-25'].DC },
      { month: 'Mar-25', Supply: actualData.monthlyMetrics['Mar-25'].L1, Consumption: actualData.monthlyMetrics['Mar-25'].L3 + actualData.monthlyMetrics['Mar-25'].DC }
    ];
    
    // Mock parent data and their consumers
    const parentMeters = {
      'L2-ZA-01': { acctNum: 'L2-ZA-01', meterLabel: 'Zone A Main', type: 'L2', zone: 'Zone A', consumption: 8500 },
      'L2-ZB-01': { acctNum: 'L2-ZB-01', meterLabel: 'Zone B Main', type: 'L2', zone: 'Zone B', consumption: 5200 },
      'L2-ZC-01': { acctNum: 'L2-ZC-01', meterLabel: 'Zone C Main', type: 'L2', zone: 'Zone C', consumption: 7800 },
      'L2-ZD-01': { acctNum: 'L2-ZD-01', meterLabel: 'Zone D Main', type: 'L2', zone: 'Zone D', consumption: 6300 },
      'L2-ZE-01': { acctNum: 'L2-ZE-01', meterLabel: 'Zone E Main', type: 'L2', zone: 'Zone E', consumption: 4100 }
    };
    
    const consumersByParent: Record<string, Array<{acctNum: string, meterLabel: string, type: string, consumption: number}>> = {
      'L2-ZA-01': [
        { acctNum: 'L3-ZA-01', meterLabel: 'Residential Block A', type: 'Residential', consumption: 2430 },
        { acctNum: 'L3-ZA-02', meterLabel: 'Residential Block B', type: 'Residential', consumption: 2180 },
        { acctNum: 'L3-ZA-03', meterLabel: 'Mall', type: 'Commercial', consumption: 1650 },
        { acctNum: 'L3-ZA-04', meterLabel: 'Park Irrigation', type: 'Irrigation', consumption: 940 }
      ],
      'L2-ZB-01': [
        { acctNum: 'L3-ZB-01', meterLabel: 'Residential Block C', type: 'Residential', consumption: 2100 },
        { acctNum: 'L3-ZB-02', meterLabel: 'Office Complex', type: 'Commercial', consumption: 1280 },
        { acctNum: 'L3-ZB-03', meterLabel: 'Community Center', type: 'Community', consumption: 1520 }
      ]
    };
    
    // Return all calculated data
    return {
      kpis: {
        totalSupply: selectedMetrics.L1,
        totalConsumption: selectedMetrics.L3 + selectedMetrics.DC,
        waterLoss: lossMetrics.totalLoss,
        lossPercent: lossMetrics.totalLossPercent,
        stage1LossPercent: lossMetrics.stage1LossPercent,
        stage2LossPercent: lossMetrics.stage2LossPercent,
        totalLossPercent: lossMetrics.totalLossPercent
      },
      zoneDetails,
      topLossZones,
      typeBreakdown,
      monthlyData,
      parentMeters,
      consumersByParent
    };
  }, [selectedPeriod, selectedZone, showParentDetails]);

  // Format helpers
  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercent = (num: number) => `${num.toFixed(1)}%`;
  
  // Get loss color based on percentage
  const getLossColor = (lossPercent: number) => {
    if (lossPercent < 0) return 'success';
    if (lossPercent < 10) return 'info';
    if (lossPercent < 25) return 'warning';
    return 'danger';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <StandardPageLayout
        title="Water System"
        description="Monitor and analyze water distribution and losses"
        icon={<Droplets className="h-6 w-6 text-blue-600" />}
        headerColor="bg-gradient-to-r from-blue-50 to-blue-100"
        actions={
          <div className="flex flex-col md:flex-row gap-2">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Jan-25">January 2025</SelectItem>
                <SelectItem value="Feb-25">February 2025</SelectItem>
                <SelectItem value="Mar-25">March 2025</SelectItem>
                <SelectItem value="Total">Q1 2025 Total</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      >
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-3 w-full max-w-md">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="losses">Loss Analysis</TabsTrigger>
            <TabsTrigger value="consumption">Consumption</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard 
                  title={`Total Supply (${selectedPeriod})`}
                  value={currentData.kpis.totalSupply} 
                  formatter={formatNumber} 
                  color="primary" 
                  icon="💧" 
                />
                <KpiCard 
                  title={`Total Consumption (${selectedPeriod})`}
                  value={currentData.kpis.totalConsumption} 
                  formatter={formatNumber} 
                  color="secondary" 
                  icon="🏠" 
                />
                <KpiCard 
                  title={`Water Loss (${selectedPeriod})`}
                  value={currentData.kpis.waterLoss} 
                  formatter={formatNumber} 
                  color="tertiary" 
                  icon="📉" 
                />
                <KpiCard 
                  title={`NRW % (${selectedPeriod})`}
                  value={currentData.kpis.lossPercent} 
                  formatter={formatPercent} 
                  color={getLossColor(currentData.kpis.lossPercent)} 
                  icon="%" 
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="col-span-1 bg-white rounded-xl shadow-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Loss Breakdown</h3>
                  <div className="space-y-4">
                    <ProgressCard 
                      value={actualData.lossMetrics[selectedPeriod].stage1Loss} 
                      max={currentData.kpis.totalSupply * 0.05} 
                      label="Stage 1 Loss (Target: 5%)" 
                      color="blue-500" 
                    />
                    <ProgressCard 
                      value={actualData.lossMetrics[selectedPeriod].stage2Loss} 
                      max={currentData.kpis.totalSupply * 0.10} 
                      label="Stage 2 Loss (Target: 10%)" 
                      color="purple-500" 
                    />
                    <ProgressCard 
                      value={actualData.lossMetrics[selectedPeriod].totalLoss} 
                      max={currentData.kpis.totalSupply * 0.15} 
                      label="Total NRW (Target: 15%)" 
                      color="red-500" 
                    />
                  </div>
                </div>

                <div className="col-span-2 bg-white rounded-xl shadow-md p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium text-gray-900">Zone Analysis</h3>
                    <Select value={selectedZone} onValueChange={setSelectedZone}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Select Zone" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.keys(currentData.zoneDetails).map((zone) => (
                          <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 font-medium">L2 Reading</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(currentData.zoneDetails[selectedZone].l2Reading)} m³</p>
                      <p className="text-xs text-gray-500 mt-1">Supply meter reading</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500 font-medium">L3 Sum</p>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(currentData.zoneDetails[selectedZone].l3Sum)} m³</p>
                      <p className="text-xs text-gray-500 mt-1">Sum of all consumption</p>
                    </div>
                    <div className={`p-4 rounded-lg ${
                      currentData.zoneDetails[selectedZone].lossPercent < 0 ? 'bg-green-50' :
                      currentData.zoneDetails[selectedZone].lossPercent < 10 ? 'bg-blue-50' :
                      currentData.zoneDetails[selectedZone].lossPercent < 25 ? 'bg-yellow-50' :
                      'bg-red-50'
                    }`}>
                      <p className="text-sm text-gray-500 font-medium">Loss / NRW</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(currentData.zoneDetails[selectedZone].loss)} m³ ({formatPercent(currentData.zoneDetails[selectedZone].lossPercent)})
                      </p>
                      <p className="text-xs text-gray-500 mt-1">Non-revenue water</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-800 mb-2">Distribution Meters</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account #</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meter Label</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {Object.values(currentData.parentMeters)
                            .filter(meter => meter.zone === selectedZone)
                            .map((meter) => (
                              <tr key={meter.acctNum} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{meter.acctNum}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.meterLabel}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.type}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{meter.zone}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(meter.consumption)} m³</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                  <button
                                    onClick={() => setShowParentDetails(meter.acctNum)}
                                    className="text-blue-600 hover:text-blue-800"
                                  >
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Parent Meter Details Modal */}
              {showParentDetails && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                    <div className="px-4 py-5 sm:px-6 border-b">
                      <h3 className="text-lg leading-6 font-medium text-gray-900">
                        {currentData.parentMeters[showParentDetails]?.meterLabel} Details
                      </h3>
                      <p className="mt-1 max-w-2xl text-sm text-gray-500">
                        Account #: {currentData.parentMeters[showParentDetails]?.acctNum}
                      </p>
                    </div>
                    <div className="px-4 py-5 sm:p-6">
                      {/* Child meters section */}
                      <h4 className="text-md font-medium text-gray-700 mb-2">Child Meters</h4>
                      {currentData.consumersByParent[showParentDetails] && currentData.consumersByParent[showParentDetails].length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Account #
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Meter Label
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Type
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Consumption
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {currentData.consumersByParent[showParentDetails].map((child) => (
                                <tr key={child.acctNum} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {child.acctNum}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {child.meterLabel}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {child.type}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatNumber(child.consumption)} m³
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-gray-500">No child meters found</p>
                      )}
                      
                      {/* Total consumption of children */}
                      {currentData.consumersByParent[showParentDetails] && currentData.consumersByParent[showParentDetails].length > 0 && (
                        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                          <div className="flex justify-between">
                            <p className="font-medium text-gray-700">Total Consumption:</p>
                            <p className="font-bold text-gray-900">
                              {formatNumber(
                                currentData.consumersByParent[showParentDetails].reduce(
                                  (sum, child) => sum + child.consumption, 0
                                )
                              )} m³
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse rounded-b-lg">
                      <button
                        type="button"
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        onClick={() => setShowParentDetails(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-800 mb-2">Analysis Notes</h4>
                  {currentData.zoneDetails[selectedZone].lossPercent < -10 ? (
                    <p className="text-sm text-gray-600">
                      This zone shows a significant surplus, with L3 consumption exceeding L2 bulk readings. This could indicate:
                      <ul className="list-disc ml-5 mt-2">
                        <li>Potential metering inaccuracies at the L2 bulk meter</li>
                        <li>Possible cross-zone supply not captured by this zone's bulk meter</li>
                        <li>Data recording or calculation issues</li>
                      </ul>
                    </p>
                  ) : currentData.zoneDetails[selectedZone].lossPercent < 0 ? (
                    <p className="text-sm text-gray-600">
                      This zone shows a small surplus, with L3 consumption slightly exceeding L2 bulk readings. This is generally within acceptable metering tolerances.
                    </p>
                  ) : currentData.zoneDetails[selectedZone].lossPercent < 10 ? (
                    <p className="text-sm text-gray-600">
                      This zone shows excellent performance with very low water losses, well within industry best practices.
                    </p>
                  ) : currentData.zoneDetails[selectedZone].lossPercent < 25 ? (
                    <p className="text-sm text-gray-600">
                      This zone shows moderate water losses that could be improved with targeted interventions.
                    </p>
                  ) : (
                    <p className="text-sm text-gray-600">
                      This zone shows significantly high water losses that require immediate investigation. Possible causes include:
                      <ul className="list-disc ml-5 mt-2">
                        <li>Physical leaks in the distribution network</li>
                        <li>Unauthorized connections or water theft</li>
                        <li>Metering inaccuracies or calibration issues</li>
                        <li>Data recording errors</li>
                      </ul>
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Loss Analysis Tab */}
          {activeTab === 'losses' && (
            <div className="space-y-6 mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <KpiCard 
                  title={`Stage 1 Loss (${selectedPeriod})`}
                  value={currentData.kpis.stage1LossPercent} 
                  formatter={formatPercent} 
                  color={getLossColor(currentData.kpis.stage1LossPercent)} 
                  icon="🔍" 
                />
                <KpiCard 
                  title={`Stage 2 Loss (${selectedPeriod})`}
                  value={currentData.kpis.stage2LossPercent} 
                  formatter={formatPercent} 
                  color={getLossColor(currentData.kpis.stage2LossPercent)} 
                  icon="🔎" 
                />
                <KpiCard 
                  title={`Total Loss (NRW) (${selectedPeriod})`}
                  value={currentData.kpis.totalLossPercent} 
                  formatter={formatPercent} 
                  color={getLossColor(currentData.kpis.totalLossPercent)} 
                  icon="📉" 
                />
              </div>

              <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Loss Breakdown in Volume (m³)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm text-blue-700 font-medium">Stage 1 Loss (Trunk Main)</p>
                    <p className="text-2xl font-bold text-blue-900">
                      {formatNumber(actualData.lossMetrics[selectedPeriod].stage1Loss)} m³
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      Loss between Main Bulk and L2/DC meters
                    </p>
                  </div>
                  <div className="bg-purple-50 rounded-lg p-4">
                    <p className="text-sm text-purple-700 font-medium">Stage 2 Loss (Distribution)</p>
                    <p className="text-2xl font-bold text-purple-900">
                      {formatNumber(actualData.lossMetrics[selectedPeriod].stage2Loss)} m³
                    </p>
                    <p className="text-xs text-purple-600 mt-1">
                      Loss between L2 meters and L3 consumption
                    </p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-4">
                    <p className="text-sm text-red-700 font-medium">Total Loss (NRW)</p>
                    <p className="text-2xl font-bold text-red-900">
                      {formatNumber(actualData.lossMetrics[selectedPeriod].totalLoss)} m³
                    </p>
                    <p className="text-xs text-red-600 mt-1">
                      Total Non-Revenue Water
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl shadow-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Top Water Loss Zones ({selectedPeriod})</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={currentData.topLossZones}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="zone" />
                        <YAxis />
                        <Tooltip 
                          content={<CustomTooltip />}
                          formatter={(value: number) => [
                            `${value.toFixed(2)}%`,
                            'Loss Percentage'
                          ]}
                        />
                        <Legend />
                        <Bar dataKey="lossPercent" name="Loss Percentage (%)" fill={COLORS.danger} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-md p-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Loss Trend (Q1 2025)</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={[
                          { month: 'Jan-25', Stage1: actualData.lossMetrics['Jan-25'].stage1LossPercent, Stage2: actualData.lossMetrics['Jan-25'].stage2LossPercent, Total: actualData.lossMetrics['Jan-25'].totalLossPercent },
                          { month: 'Feb-25', Stage1: actualData.lossMetrics['Feb-25'].stage1LossPercent, Stage2: actualData.lossMetrics['Feb-25'].stage2LossPercent, Total: actualData.lossMetrics['Feb-25'].totalLossPercent },
                          { month: 'Mar-25', Stage1: actualData.lossMetrics['Mar-25'].stage1LossPercent, Stage2: actualData.lossMetrics['Mar-25'].stage2LossPercent, Total: actualData.lossMetrics['Mar-25'].totalLossPercent }
                        ]}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} formatter={(value: number) => `${value.toFixed(2)}%`} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="Stage1" 
                          name="Stage 1 Loss %" 
                          stroke={COLORS.primary} 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Stage2" 
                          name="Stage 2 Loss %" 
                          stroke={COLORS.secondary} 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="Total" 
                          name="Total Loss %" 
                          stroke={COLORS.danger} 
                          activeDot={{ r: 8 }} 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">All Zones Loss Analysis ({selectedPeriod})</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L2 Reading (m³)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">L3 Sum (m³)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss (m³)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss %</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {Object.entries(currentData.zoneDetails)
                        .sort(([, a], [, b]) => b.lossPercent - a.lossPercent)
                        .map(([zone, data]) => (
                          <tr key={zone} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{zone}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(data.l2Reading)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(data.l3Sum)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(data.loss)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercent(data.lossPercent)}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                ${data.lossPercent < 0 ? 'bg-green-100 text-green-800' : 
                                  data.lossPercent < 10 ? 'bg-blue-100 text-blue-800' : 
                                  data.lossPercent < 30 ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'}`}>
                                {data.lossPercent < 0 ? 'Surplus' : 
                                  data.lossPercent < 10 ? 'Excellent' : 
                                  data.lossPercent < 30 ? 'Moderate' : 
                                  'Critical'}
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Consumption Patterns Tab */}
          {activeTab === 'consumption' && (
            <div className="space-y-6 mt-6">
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption by Type ({selectedPeriod})</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={currentData.typeBreakdown}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                          nameKey="type"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                        >
                          {currentData.typeBreakdown.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} formatter={(value: number) => formatNumber(value) + ' m³'} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={currentData.typeBreakdown}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        layout="vertical"
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                        <XAxis type="number" />
                        <YAxis type="category" dataKey="type" width={150} />
                        <Tooltip content={<CustomTooltip />} formatter={(value: number) => formatNumber(value) + ' m³'} />
                        <Legend />
                        <Bar dataKey="value" name="Consumption (m³)" fill={COLORS.secondary} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Monthly Consumption Trend (Q1 2025)</h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={currentData.monthlyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} formatter={(value: number) => formatNumber(value) + ' m³'} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="Consumption" 
                        name="Consumption (m³)" 
                        stroke={COLORS.secondary} 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="Supply" 
                        name="Supply (m³)" 
                        stroke={COLORS.primary} 
                        activeDot={{ r: 8 }} 
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption by Zone ({selectedPeriod})</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(currentData.zoneDetails).map(([zone, data]) => ({
                        zone,
                        consumption: data.l3Sum
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="zone" />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} formatter={(value: number) => formatNumber(value) + ' m³'} />
                      <Legend />
                      <Bar dataKey="consumption" name="Consumption (m³)" fill={COLORS.secondary} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-md p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Consumption Statistics</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Month</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supply (m³)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Consumption (m³)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss (m³)</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loss %</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {['Jan-25', 'Feb-25', 'Mar-25', 'Total'].map((month) => {
                        const supply = actualData.monthlyMetrics[month].L1;
                        const consumption = actualData.monthlyMetrics[month].L3 + actualData.monthlyMetrics[month].DC;
                        const loss = actualData.lossMetrics[month].totalLoss;
                        const lossPercent = actualData.lossMetrics[month].totalLossPercent;
                        
                        return (
                          <tr key={month} className={month === selectedPeriod ? "bg-blue-50" : "hover:bg-gray-50"}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{month}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(supply)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(consumption)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatNumber(loss)}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPercent(lossPercent)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </Tabs>
      </div>
      </StandardPageLayout>
    </div>
  );
};

export default Dashboard;
