
import React, { useState, useEffect, useMemo } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { motion } from 'framer-motion';
import { ChevronDown, ChevronUp, BarChart2, PieChart as PieChartIcon, 
  AlertTriangle, Home, Droplet, FileText, Settings, TrendingUp,
  RefreshCw, FileDown } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { useAirtableData } from '@/hooks/useAirtableData';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { WATER_TABLE_ID } from '@/services/api/airtableService';
import { WaterConsumptionData } from '@/types/waterSystem';
import { transformWaterData, getReadingValue, getAvailableMonths } from '@/utils/waterSystemUtils';

// Type definitions for our metrics data structure
interface ZoneMetric {
  bulkMeter: string;
  bulkReading: number;
  l3Sum: number;
  meterCount: number;
  loss: number;
  lossPercent: string;
}

interface MetricsByMonth {
  l1Supply: number;
  l2Volume: number;
  l3Volume: number;
  stage1Loss: number;
  stage2Loss: number;
  totalLoss: number;
  stage1LossPercent: string;
  stage2LossPercent: string;
  totalLossPercent: string;
}

interface Metrics {
  byMonth: {
    [key: string]: MetricsByMonth;
  };
  zoneMetrics: {
    [key: string]: ZoneMetric;
  };
  typeConsumption: {
    [key: string]: number;
  };
  zoneTypeConsumption: {
    [key: string]: {
      [key: string]: number;
    };
  };
}

interface ChartData {
  trendData: any[];
  lossTrendData: any[];
  consumptionByTypeData: any[];
  zoneLossData: any[];
}

// Define interface for Zone Loss Data
interface ZoneLossDataItem {
  zone: string;
  bulkReading: number;
  l3Sum: number;
  loss: number;
  lossPercent: number;
}

// Main Water System Component
const WaterSystem = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Mar-25');
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [lastUpdated, setLastUpdated] = useState<Date | undefined>(undefined);
  
  // Fetch water data
  const {
    data: waterData,
    isLoading,
    error,
    refetch
  } = useAirtableData<WaterConsumptionData>(WATER_TABLE_ID, {
    useFallback: true
  });

  // Transform data to our desired format
  const transformedData = useMemo(() => {
    if (!waterData) return [];
    return transformWaterData(waterData);
  }, [waterData]);

  // Set default zones and types
  useEffect(() => {
    if (transformedData.length > 0) {
      // Set default selected zone
      const zones = Array.from(new Set(transformedData
        .filter(row => row.Zone && row.Label === 'L2')
        .map(row => row.Zone)
      ));
      
      if (zones.length > 0 && !selectedZone) {
        setSelectedZone(zones[0]);
      }
      
      // Set default selected type
      const types = Array.from(new Set(transformedData
        .filter(row => row.Type && row.Type !== 'Zone Bulk' && row.Type !== 'Main BULK')
        .map(row => row.Type)
      ));
      
      if (types.length > 0 && !selectedType) {
        setSelectedType(types[0]);
      }
    }
  }, [transformedData, selectedZone, selectedType]);

  // Available months
  const availableMonths = useMemo(() => {
    return getAvailableMonths(transformedData).filter(month => 
      month !== 'all' && /^[A-Za-z]+-\d{2}$/.test(month)
    );
  }, [transformedData]);

  useEffect(() => {
    if (availableMonths.length > 0 && !availableMonths.includes(selectedPeriod)) {
      setSelectedPeriod(availableMonths[availableMonths.length - 1]);
    }
  }, [availableMonths, selectedPeriod]);

  // Handle manual refresh
  const handleManualFetch = async () => {
    toast.info('Refreshing water data...');
    try {
      await refetch();
      setLastUpdated(new Date());
      toast.success('Water data refreshed successfully');
    } catch (err) {
      toast.error(`Failed to refresh data: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  // Handle export data
  const handleExportData = () => {
    if (!transformedData || transformedData.length === 0) {
      toast.error('No data to export');
      return;
    }
    
    try {
      // Create CSV header 
      const headers = ["Meter Label", "Zone", "Type", "Level", `${selectedPeriod} (m³)`, "Parent Meter"];
      
      // Generate CSV rows
      const csvRows = transformedData.map(record => [
        record['Meter Label'] || '-', 
        record.Zone || '-', 
        record.Type || '-', 
        record.Label || '-', 
        getReadingValue(record, selectedPeriod) || '-', 
        record['Parent Meter'] || '-'
      ]);
      
      // Combine header and rows
      const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `water-consumption-${selectedPeriod}.csv`);
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  // Calculate metrics based on current data and filters
  const metrics = useMemo<Metrics | null>(() => {
    if (!transformedData.length) return null;
    
    const months = availableMonths;
    const result: any = { byMonth: {} };
    
    months.forEach(month => {
      // Get L1 meter reading
      const l1Meter = transformedData.find(row => row.Label === 'L1');
      const l1Supply = l1Meter ? getReadingValue(l1Meter, month) : 0;
      
      // Calculate Total L2 Volume
      let l2Volume = transformedData
        .filter(row => row.Label === 'L2')
        .reduce((sum, row) => sum + getReadingValue(row, month), 0);
      
      // Add DC meters connected to L1
      if (l1Meter) {
        l2Volume += transformedData
          .filter(row => row.Label === 'DC' && row['Parent Meter'] === l1Meter['Meter Label'])
          .reduce((sum, row) => sum + getReadingValue(row, month), 0);
      }
      
      // Calculate Total L3 Volume (excluding anomaly meter)
      const l3Volume = transformedData
        .filter(row => 
          (row.Label === 'L3' && row['Acct #'] !== '4300322') || 
          row.Label === 'DC'
        )
        .reduce((sum, row) => sum + getReadingValue(row, month), 0);
      
      // Calculate losses
      const stage1Loss = l1Supply - l2Volume;
      const stage2Loss = l2Volume - l3Volume;
      const totalLoss = l1Supply - l3Volume;
      
      result.byMonth[month] = {
        l1Supply,
        l2Volume,
        l3Volume,
        stage1Loss,
        stage2Loss,
        totalLoss,
        stage1LossPercent: l1Supply > 0 ? ((stage1Loss / l1Supply) * 100).toFixed(2) : '0',
        stage2LossPercent: l2Volume > 0 ? ((stage2Loss / l2Volume) * 100).toFixed(2) : '0',
        totalLossPercent: l1Supply > 0 ? ((totalLoss / l1Supply) * 100).toFixed(2) : '0'
      };
    });
    
    // Calculate zone metrics for the selected period
    result.zoneMetrics = {};
    
    // Map zones to bulk meters
    const zoneToBulkMap: Record<string, any> = {};
    transformedData.filter(row => row.Label === 'L2').forEach(bulkMeter => {
      const zone = bulkMeter.Zone;
      if (zone) {
        zoneToBulkMap[zone] = bulkMeter;
      }
    });
    
    Object.keys(zoneToBulkMap).forEach(zone => {
      const bulkMeter = zoneToBulkMap[zone];
      const bulkReading = getReadingValue(bulkMeter, selectedPeriod);
      
      // Sum L3 meters in this zone (excluding anomaly meter)
      const l3Meters = transformedData.filter(row => 
        row.Label === 'L3' && 
        row.Zone === zone && 
        row['Acct #'] !== '4300322'
      );
      
      const l3Sum = l3Meters.reduce((sum, row) => sum + getReadingValue(row, selectedPeriod), 0);
      const meterCount = l3Meters.length;
      
      const loss = bulkReading - l3Sum;
      const lossPercent = bulkReading > 0 ? (loss / bulkReading * 100) : 0;
      
      result.zoneMetrics[zone] = {
        bulkMeter: bulkMeter['Meter Label'],
        bulkReading,
        l3Sum,
        meterCount,
        loss,
        lossPercent: lossPercent.toFixed(2)
      };
    });
    
    // Calculate consumption by type
    result.typeConsumption = {};
    const types = Array.from(new Set(transformedData.map(row => row.Type)));
    
    types.forEach(type => {
      if (type && type !== 'Zone Bulk' && type !== 'Main BULK') {
        result.typeConsumption[type] = transformedData
          .filter(row => row.Type === type && row['Acct #'] !== '4300322')
          .reduce((sum, row) => sum + getReadingValue(row, selectedPeriod), 0);
      }
    });
    
    // Calculate consumption by type for each zone
    result.zoneTypeConsumption = {};
    
    Object.keys(zoneToBulkMap).forEach(zone => {
      const typeConsumption: Record<string, number> = {};
      
      types.forEach(type => {
        if (type && type !== 'Zone Bulk' && type !== 'Main BULK') {
          const consumption = transformedData
            .filter(row => row.Zone === zone && row.Type === type && row['Acct #'] !== '4300322')
            .reduce((sum, row) => sum + getReadingValue(row, selectedPeriod), 0);
          
          if (consumption > 0) {
            typeConsumption[type] = consumption;
          }
        }
      });
      
      result.zoneTypeConsumption[zone] = typeConsumption;
    });
    
    return result;
  }, [transformedData, selectedPeriod, availableMonths]);

  // Prepare data for charts
  const chartData = useMemo<ChartData | null>(() => {
    if (!metrics || !availableMonths || availableMonths.length < 3) return null;
    
    // Use only the last 3 months for trend data or all available months
    const months = availableMonths.slice(-3);
    
    // Monthly trend data
    const trendData = months.map(month => ({ 
      name: month, 
      L1_Supply: metrics.byMonth[month].l1Supply, 
      L3_Consumption: metrics.byMonth[month].l3Volume 
    }));
    
    // Loss trend data
    const lossTrendData = months.map(month => ({ 
      name: month, 
      'Stage 1 Loss': metrics.byMonth[month].stage1Loss, 
      'Stage 2 Loss': metrics.byMonth[month].stage2Loss, 
      'Total Loss': metrics.byMonth[month].totalLoss 
    }));
    
    // Consumption by type chart data
    const consumptionByTypeData = Object.entries(metrics.typeConsumption)
      .filter(([_, value]) => value > 0)
      .map(([type, value]) => ({ name: type, value }));
    
    // Zone loss chart data
    const zoneLossData = Object.entries(metrics.zoneMetrics)
      .map(([zone, data]) => ({
        name: zone.replace('Zone_', '').replace('_(', ' ').replace(')', ''),
        value: parseFloat(data.lossPercent)
      }))
      .sort((a, b) => b.value - a.value);
    
    return {
      trendData,
      lossTrendData,
      consumptionByTypeData,
      zoneLossData
    };
  }, [metrics, availableMonths]);

  // Loading state
  if (isLoading) {
    return <Layout>
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="text-center">
          <RefreshCw className="h-10 w-10 mx-auto mb-4 text-blue-500 animate-spin" />
          <p className="text-lg text-muted-foreground">Loading water system data...</p>
        </div>
      </div>
    </Layout>;
  }
  
  // Error state
  if (error) {
    return <Layout>
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <AlertTriangle className="w-12 h-12 mb-4 text-red-500" />
          <h2 className="text-2xl font-bold mb-2">Error Loading Data</h2>
          <p className="mb-4">{error.message}</p>
          <Button variant="outline" onClick={handleManualFetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    </Layout>;
  }

  // If no data
  if (!transformedData || transformedData.length === 0) {
    return <Layout>
      <div className="container mx-auto p-4">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-amber-500">
          <AlertTriangle className="w-12 h-12 mb-4 text-amber-500" />
          <h2 className="text-2xl font-bold mb-2">No Data Available</h2>
          <p className="mb-4">No water consumption data available. Make sure your data source contains records.</p>
          <Button variant="outline" onClick={handleManualFetch}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>
    </Layout>;
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-3xl font-bold text-blue-800 flex items-center"
            >
              <Droplet className="mr-2 h-8 w-8 text-blue-500" />
              Muscat Bay Water System
            </motion.h1>
            
            <div className="flex flex-wrap items-center gap-3">
              {/* Period Selector */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                  <SelectTrigger className="w-[160px] bg-white/90 shadow-sm">
                    <SelectValue placeholder="Select Period" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableMonths.map(month => (
                      <SelectItem key={month} value={month}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </motion.div>
              
              <Button variant="outline" size="icon" onClick={handleExportData} title="Export Data" className="bg-white/90 shadow-sm">
                <FileDown className="h-4 w-4" />
              </Button>
              
              <Button variant="outline" size="icon" onClick={handleManualFetch} title="Refresh Data" className="bg-white/90 shadow-sm">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>
        
        {/* Navigation */}
        <nav className="bg-white shadow-sm border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex space-x-8">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('dashboard')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'dashboard' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Home className="w-5 h-5 mr-1" />
                  Dashboard
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('zones')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'zones' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <PieChartIcon className="w-5 h-5 mr-1" />
                  Zone Details
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('types')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'types' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <BarChart2 className="w-5 h-5 mr-1" />
                  Type Analysis
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('losses')}
                  className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                    activeTab === 'losses' 
                      ? 'border-blue-500 text-blue-600' 
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <TrendingUp className="w-5 h-5 mr-1" />
                  Loss Analysis
                </motion.button>
              </div>
            </div>
          </div>
        </nav>
        
        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Dashboard */}
          {activeTab === 'dashboard' && metrics && chartData && (
            <DashboardView metrics={metrics} selectedPeriod={selectedPeriod} chartData={chartData} />
          )}
          
          {/* Zone Details */}
          {activeTab === 'zones' && metrics && (
            <ZoneView 
              metrics={metrics} 
              selectedPeriod={selectedPeriod} 
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              data={transformedData}
            />
          )}
          
          {/* Type Analysis */}
          {activeTab === 'types' && metrics && (
            <TypeView 
              metrics={metrics} 
              selectedPeriod={selectedPeriod}
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              chartData={chartData}
              data={transformedData}
            />
          )}
          
          {/* Loss Analysis */}
          {activeTab === 'losses' && metrics && chartData && (
            <LossView 
              metrics={metrics} 
              selectedPeriod={selectedPeriod}
              chartData={chartData}
            />
          )}
        </main>
      </div>
    </Layout>
  );
};

// Dashboard View Component
const DashboardView: React.FC<{metrics: Metrics, selectedPeriod: string, chartData: ChartData}> = ({ metrics, selectedPeriod, chartData }) => {
  const currentMetrics = metrics.byMonth[selectedPeriod];
  
  // Custom gradient colors for KPI cards
  const kpiGradients = [
    'from-blue-400 to-blue-600',
    'from-teal-400 to-teal-600',
    'from-purple-400 to-purple-600',
    'from-indigo-400 to-indigo-600'
  ];
  
  // Custom colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Dashboard Overview</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <motion.div 
          whileHover={{ y: -5 }}
          className={`bg-gradient-to-r ${kpiGradients[0]} rounded-lg shadow-lg p-6 text-white`}
        >
          <h3 className="text-sm font-medium mb-1 opacity-90">Total L1 Supply</h3>
          <p className="text-3xl font-bold">{currentMetrics.l1Supply.toLocaleString()} m³</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className={`bg-gradient-to-r ${kpiGradients[1]} rounded-lg shadow-lg p-6 text-white`}
        >
          <h3 className="text-sm font-medium mb-1 opacity-90">Total L3 Consumption</h3>
          <p className="text-3xl font-bold">{currentMetrics.l3Volume.toLocaleString()} m³</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className={`bg-gradient-to-r ${kpiGradients[2]} rounded-lg shadow-lg p-6 text-white`}
        >
          <h3 className="text-sm font-medium mb-1 opacity-90">Total Water Loss</h3>
          <p className="text-3xl font-bold">{currentMetrics.totalLoss.toLocaleString()} m³</p>
        </motion.div>
        
        <motion.div 
          whileHover={{ y: -5 }}
          className={`bg-gradient-to-r ${kpiGradients[3]} rounded-lg shadow-lg p-6 text-white`}
        >
          <h3 className="text-sm font-medium mb-1 opacity-90">Loss Percentage</h3>
          <p className="text-3xl font-bold">{currentMetrics.totalLossPercent}%</p>
        </motion.div>
      </div>
      
      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Consumption Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Water Supply vs Consumption Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.trendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value.toLocaleString()} m³`, null]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="L1_Supply" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="L3_Consumption" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        {/* Consumption By Type Pie Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Consumption by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData.consumptionByTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                >
                  {chartData.consumptionByTypeData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${value.toLocaleString()} m³`, null]}
                  contentStyle={{ borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Loss Zones Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Top Loss Zones (%)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData.zoneLossData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} />
                <YAxis dataKey="name" type="category" width={100} />
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(2)}%`, null]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#8884d8"
                  radius={[0, 4, 4, 0]}
                >
                  {chartData.zoneLossData.map((entry: any, index: number) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.value > 20 ? '#ef4444' : '#10b981'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        {/* Loss Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Loss Trend Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.lossTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value.toLocaleString()} m³`, null]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Stage 1 Loss" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Stage 2 Loss" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Total Loss" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// Zone View Component
const ZoneView: React.FC<{
  metrics: Metrics, 
  selectedPeriod: string, 
  selectedZone: string, 
  setSelectedZone: (zone: string) => void, 
  data: WaterConsumptionData[]
}> = ({ metrics, selectedPeriod, selectedZone, setSelectedZone, data }) => {
  // Get all available zones
  const zones = Object.keys(metrics.zoneMetrics);
  
  // Get the selected zone metrics
  const zoneMetric = metrics.zoneMetrics[selectedZone];
  
  // Get type consumption data for the selected zone
  const zoneTypeData = metrics.zoneTypeConsumption[selectedZone];
  
  // Transform to chart format
  const pieData = zoneTypeData ? Object.entries(zoneTypeData)
    .map(([type, value]) => ({ name: type, value })) : [];
  
  // Custom colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  
  // Get meters for the selected zone
  const zoneMeterData = data.filter((row: any) => 
    row.Zone === selectedZone && 
    row.Label === 'L3' && 
    row['Acct #'] !== '4300322'
  ).map((meter: any) => ({
    meterLabel: meter['Meter Label'],
    accountNumber: meter['Acct #'],
    type: meter.Type,
    consumption: getReadingValue(meter, selectedPeriod)
  })).sort((a: any, b: any) => b.consumption - a.consumption);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Zone Details</h2>
        
        {/* Zone Selector */}
        <div className="mt-3 md:mt-0">
          <Select value={selectedZone} onValueChange={setSelectedZone}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Zone" />
            </SelectTrigger>
            <SelectContent>
              {zones.map(zone => (
                <SelectItem key={zone} value={zone}>
                  {zone.replace('Zone_', 'Zone ').replace('_(', ' ').replace(')', '')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {zoneMetric && (
        <>
          {/* Zone KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gradient-to-r from-blue-400 to-blue-600 rounded-lg shadow-lg p-6 text-white"
            >
              <h3 className="text-sm font-medium mb-1 opacity-90">Bulk Meter Reading</h3>
              <p className="text-3xl font-bold">{zoneMetric.bulkReading.toLocaleString()} m³</p>
              <p className="text-xs mt-2 opacity-80">{zoneMetric.bulkMeter}</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gradient-to-r from-teal-400 to-teal-600 rounded-lg shadow-lg p-6 text-white"
            >
              <h3 className="text-sm font-medium mb-1 opacity-90">L3 Consumption</h3>
              <p className="text-3xl font-bold">{zoneMetric.l3Sum.toLocaleString()} m³</p>
              <p className="text-xs mt-2 opacity-80">{zoneMetric.meterCount} meters</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className="bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg shadow-lg p-6 text-white"
            >
              <h3 className="text-sm font-medium mb-1 opacity-90">Zone Loss</h3>
              <p className="text-3xl font-bold">{zoneMetric.loss.toLocaleString()} m³</p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -5 }}
              className={`bg-gradient-to-r rounded-lg shadow-lg p-6 text-white
                ${parseFloat(zoneMetric.lossPercent) > 20 ? 'from-red-400 to-red-600' : 'from-indigo-400 to-indigo-600'}`}
            >
              <h3 className="text-sm font-medium mb-1 opacity-90">Loss Percentage</h3>
              <p className="text-3xl font-bold">{zoneMetric.lossPercent}%</p>
              <p className="text-xs mt-2 opacity-80">
                {parseFloat(zoneMetric.lossPercent) > 20 ? 'High loss - investigate' : 'Normal range'}
              </p>
            </motion.div>
          </div>
          
          {/* Zone Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Consumption By Type Pie Chart */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Consumption by Type in {selectedZone.replace('Zone_', 'Zone ').replace('_(', ' ').replace(')', '')}
              </h3>
              {pieData.length > 0 ? (
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }: any) => `${name}: ${(percent * 100).toFixed(1)}%`}
                      >
                        {pieData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: any) => [`${value.toLocaleString()} m³`, null]}
                        contentStyle={{ borderRadius: '8px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-80 flex items-center justify-center">
                  <p className="text-gray-500">No consumption data available for this zone</p>
                </div>
              )}
            </motion.div>
            
            {/* Top Meters in Zone */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Top Consumption Meters
              </h3>
              <div className="h-80 overflow-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Meter Label
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Consumption (m³)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {zoneMeterData.slice(0, 20).map((meter: any, index: number) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                          {meter.meterLabel}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          {meter.type}
                        </td>
                        <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                          {meter.consumption.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {zoneMeterData.length === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                          No meter data available for this zone
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
          
          {/* All Meters Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              All Meters in {selectedZone.replace('Zone_', 'Zone ').replace('_(', ' ').replace(')', '')}
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meter Label
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Account Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Consumption (m³)
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {zoneMeterData.map((meter: any, index: number) => (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                        {meter.meterLabel}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {meter.accountNumber}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {meter.type}
                      </td>
                      <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                        {meter.consumption.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                  {zoneMeterData.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No meter data available for this zone
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

// Type View Component
const TypeView: React.FC<{
  metrics: Metrics,
  selectedPeriod: string,
  selectedType: string,
  setSelectedType: (type: string) => void,
  chartData: ChartData | null,
  data: WaterConsumptionData[]
}> = ({ metrics, selectedPeriod, selectedType, setSelectedType, data }) => {
  // Get all available types (excluding bulk meters)
  const types = Object.keys(metrics.typeConsumption).filter(
    (type: string) => type !== 'Zone Bulk' && type !== 'Main BULK'
  );
  
  // Get consumption data by zone for the selected type
  const typeByZoneData: any[] = [];
  
  Object.entries(metrics.zoneTypeConsumption).forEach(([zone, typeData]: [string, any]) => {
    if (typeData[selectedType]) {
      typeByZoneData.push({
        name: zone.replace('Zone_', '').replace('_(', ' ').replace(')', ''),
        value: typeData[selectedType]
      });
    }
  });
  
  typeByZoneData.sort((a, b) => b.value - a.value);
  
  // Get all meters of the selected type
  const typeMeters = data.filter((row: any) => 
    row.Type === selectedType && 
    row['Acct #'] !== '4300322'
  ).map((meter: any) => ({
    meterLabel: meter['Meter Label'],
    zone: meter.Zone,
    accountNumber: meter['Acct #'],
    consumption: getReadingValue(meter, selectedPeriod)
  })).sort((a: any, b: any) => b.consumption - a.consumption);
  
  // Calculate total consumption for this type
  const totalTypeConsumption = metrics.typeConsumption[selectedType] || 0;
  
  // Monthly trend data for this type
  const monthlyTrendData = Object.keys(metrics.byMonth).map((month: string) => { 
    const consumption = data
      .filter((row: any) => row.Type === selectedType && row['Acct #'] !== '4300322')
      .reduce((sum: number, row: any) => sum + getReadingValue(row, month), 0);
    
    return {
      name: month,
      consumption
    };
  });
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Type Analysis</h2>
        
        {/* Type Selector */}
        <div className="mt-3 md:mt-0">
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((type: string) => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Type KPI Card */}
      <motion.div 
        whileHover={{ y: -5 }}
        className="bg-gradient-to-r from-indigo-400 to-indigo-600 rounded-lg shadow-lg p-6 text-white mb-8"
      >
        <h3 className="text-sm font-medium mb-1 opacity-90">Total {selectedType} Consumption</h3>
        <p className="text-3xl font-bold">{totalTypeConsumption.toLocaleString()} m³</p>
        <p className="text-xs mt-2 opacity-80">{typeMeters.length} meters</p>
      </motion.div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedType} Consumption Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value.toLocaleString()} m³`, 'Consumption']}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="consumption" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        {/* By Zone Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {selectedType} Consumption by Zone
          </h3>
          {typeByZoneData.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={typeByZoneData}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={100} />
                  <Tooltip 
                    formatter={(value: any) => [`${value.toLocaleString()} m³`, null]}
                    contentStyle={{ borderRadius: '8px' }}
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#8884d8"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center">
              <p className="text-gray-500">No zone data available for this type</p>
            </div>
          )}
        </motion.div>
      </div>
      
      {/* Top Meters Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Top {selectedType} Meters
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Meter Label
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Account Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Consumption (m³)
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {typeMeters.slice(0, 50).map((meter: any, index: number) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {meter.meterLabel}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                    {meter.zone ? meter.zone.replace('Zone_', 'Zone ').replace('_(', ' ').replace(')', '') : '-'}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                    {meter.accountNumber}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                    {meter.consumption.toLocaleString()}
                  </td>
                </tr>
              ))}
              {typeMeters.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No meter data available for this type
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Loss View Component
const LossView: React.FC<{
  metrics: Metrics, 
  selectedPeriod: string, 
  chartData: ChartData
}> = ({ metrics, selectedPeriod, chartData }) => {
  const currentMetrics = metrics.byMonth[selectedPeriod];
  
  // Prepare zone loss data
  const zoneLossData: ZoneLossDataItem[] = Object.entries(metrics.zoneMetrics)
    .map(([zone, data]: [string, ZoneMetric]) => ({
      zone: zone.replace('Zone_', 'Zone ').replace('_(', ' ').replace(')', ''),
      bulkReading: data.bulkReading,
      l3Sum: data.l3Sum,
      loss: data.loss,
      lossPercent: parseFloat(data.lossPercent)
    }))
    .sort((a, b) => b.lossPercent - a.lossPercent);
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Loss Analysis</h2>
      
      {/* Loss Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Stage 1 Loss Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className={`rounded-lg shadow-lg p-6 text-white bg-gradient-to-r ${
            parseFloat(currentMetrics.stage1LossPercent) > 15 
              ? 'from-red-400 to-red-600' 
              : 'from-yellow-400 to-yellow-600'
          }`}
        >
          <h3 className="text-lg font-semibold mb-2">Stage 1 Loss (Trunk Main)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-90">Volume</p>
              <p className="text-2xl font-bold">{currentMetrics.stage1Loss.toLocaleString()} m³</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Percentage</p>
              <p className="text-2xl font-bold">{currentMetrics.stage1LossPercent}%</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm opacity-90">Formula: L1 Supply - Total L2 Volume</p>
            <p className="text-sm opacity-90">
              {currentMetrics.l1Supply.toLocaleString()} - {currentMetrics.l2Volume.toLocaleString()} = {currentMetrics.stage1Loss.toLocaleString()}
            </p>
          </div>
        </motion.div>
        
        {/* Stage 2 Loss Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className={`rounded-lg shadow-lg p-6 text-white bg-gradient-to-r ${
            parseFloat(currentMetrics.stage2LossPercent) > 15 
              ? 'from-red-400 to-red-600' 
              : 'from-purple-400 to-purple-600'
          }`}
        >
          <h3 className="text-lg font-semibold mb-2">Stage 2 Loss (Distribution)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-90">Volume</p>
              <p className="text-2xl font-bold">{currentMetrics.stage2Loss.toLocaleString()} m³</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Percentage</p>
              <p className="text-2xl font-bold">{currentMetrics.stage2LossPercent}%</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm opacity-90">Formula: Total L2 Volume - Total L3 Volume</p>
            <p className="text-sm opacity-90">
              {currentMetrics.l2Volume.toLocaleString()} - {currentMetrics.l3Volume.toLocaleString()} = {currentMetrics.stage2Loss.toLocaleString()}
            </p>
          </div>
        </motion.div>
        
        {/* Total Loss Card */}
        <motion.div 
          whileHover={{ y: -5 }}
          className={`rounded-lg shadow-lg p-6 text-white bg-gradient-to-r ${
            parseFloat(currentMetrics.totalLossPercent) > 20 
              ? 'from-red-400 to-red-600' 
              : 'from-blue-400 to-blue-600'
          }`}
        >
          <h3 className="text-lg font-semibold mb-2">Total Loss (NRW)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm opacity-90">Volume</p>
              <p className="text-2xl font-bold">{currentMetrics.totalLoss.toLocaleString()} m³</p>
            </div>
            <div>
              <p className="text-sm opacity-90">Percentage</p>
              <p className="text-2xl font-bold">{currentMetrics.totalLossPercent}%</p>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-sm opacity-90">Formula: L1 Supply - Total L3 Volume</p>
            <p className="text-sm opacity-90">
              {currentMetrics.l1Supply.toLocaleString()} - {currentMetrics.l3Volume.toLocaleString()} = {currentMetrics.totalLoss.toLocaleString()}
            </p>
          </div>
        </motion.div>
      </div>
      
      {/* Loss Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Loss Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Loss Trend Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData.lossTrendData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [`${value.toLocaleString()} m³`, null]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Stage 1 Loss" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Stage 2 Loss" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Total Loss" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
        
        {/* Loss Percentage Trend */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Loss Percentage Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={Object.keys(metrics.byMonth).map((month) => ({ 
                  name: month, 
                  'Stage 1 Loss %': parseFloat(metrics.byMonth[month].stage1LossPercent), 
                  'Stage 2 Loss %': parseFloat(metrics.byMonth[month].stage2LossPercent),
                  'Total Loss %': parseFloat(metrics.byMonth[month].totalLossPercent)
                }))}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" />
                <YAxis domain={[-20, 40]}/>
                <Tooltip 
                  formatter={(value: any) => [`${value.toFixed(2)}%`, null]}
                  contentStyle={{ borderRadius: '8px' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="Stage 1 Loss %" 
                  stroke="#f59e0b" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Stage 2 Loss %" 
                  stroke="#8b5cf6" 
                  strokeWidth={2} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Total Loss %" 
                  stroke="#ef4444" 
                  strokeWidth={3}
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
      
      {/* Zone Loss Table */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-white rounded-lg shadow-md p-6"
      >
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Zone Loss Analysis
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Zone
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bulk Reading (m³)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  L3 Consumption (m³)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loss (m³)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Loss Percentage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {zoneLossData.map((zone, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                    {zone.zone}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                    {zone.bulkReading.toLocaleString()}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                    {zone.l3Sum.toLocaleString()}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                    {zone.loss.toLocaleString()}
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-500">
                    {zone.lossPercent.toFixed(2)}%
                  </td>
                  <td className="px-6 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      zone.lossPercent > 20 
                        ? 'bg-red-100 text-red-800' 
                        : zone.lossPercent > 10
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {zone.lossPercent > 20 
                        ? 'High Loss' 
                        : zone.lossPercent > 10
                          ? 'Moderate'
                          : 'Normal'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WaterSystem;
