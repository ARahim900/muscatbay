
import React, { useState, useEffect } from 'react';
import { 
  Droplet, LayoutDashboard, PieChart, TrendingUp, BarChart2, AlertTriangle, 
  Settings, Filter, RefreshCw, DownloadCloud, Calendar
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WaterDashboard } from './WaterDashboard';
import { WaterConsumptionAnalysis } from './WaterConsumptionAnalysis';
import { WaterLossAnalysis } from './WaterLossAnalysis';
import { WaterAlerts } from './WaterAlerts';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { waterService } from '@/services/waterService';
import { waterColors } from './WaterTheme';

const WaterSystemModule = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedMonth, setSelectedMonth] = useState('apr_24');
  const [selectedZone, setSelectedZone] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  
  // State for data
  const [meters, setMeters] = useState([]);
  const [zones, setZones] = useState([]);
  const [consumptionData, setConsumptionData] = useState([]);
  const [waterLossData, setWaterLossData] = useState([]);
  const [typeConsumption, setTypeConsumption] = useState([]);
  const [alerts, setAlerts] = useState([]);
  
  // Summary metrics
  const [summary, setSummary] = useState({
    totalConsumption: 0,
    averageLoss: 0,
    changePercent: 0,
    activeMeters: 0,
    inactiveMeters: 0,
    alertCount: 0
  });
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch zones
        const zonesList = await waterService.getZones();
        setZones(['all', ...zonesList]);
        
        // Fetch meters
        const meterData = await waterService.getWaterMeters(selectedMonth);
        setMeters(meterData);
        
        // Fetch consumption data
        const consumptionByMonth = await waterService.getMonthlyConsumption(parseInt(selectedYear));
        setConsumptionData(consumptionByMonth);
        
        // Fetch type data
        const typeData = await waterService.getConsumptionByType(selectedMonth);
        setTypeConsumption(typeData);
        
        // Fetch water loss data
        const lossData = await waterService.getWaterLossData();
        setWaterLossData(lossData);
        
        // Generate mock alerts for demo purposes
        generateMockAlerts();
        
        // Set summary data
        calculateSummary(meterData, lossData);
      } catch (error) {
        console.error("Error fetching water system data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [selectedMonth, selectedYear]);
  
  // Calculate summary statistics
  const calculateSummary = (meterData, lossData) => {
    const latestLossData = lossData.length > 0 ? lossData[lossData.length - 1] : { totalLossPercent: 0 };
    const activeMeters = meterData.filter(m => m.readings[selectedMonth] > 0).length;
    
    const totalConsumption = meterData.reduce((sum, meter) => sum + (meter.readings[selectedMonth] || 0), 0);
    
    // Calculate change percentage (mock for demo)
    const previousMonth = selectedMonth === 'apr_24' ? 'mar_24' : 'feb_24';
    const previousConsumption = 22000; // Mock data
    const changePercent = ((totalConsumption - previousConsumption) / previousConsumption) * 100;
    
    setSummary({
      totalConsumption,
      averageLoss: latestLossData.totalLossPercent,
      changePercent,
      activeMeters,
      inactiveMeters: meterData.length - activeMeters,
      alertCount: alerts.length
    });
  };
  
  // Generate mock alerts for demo
  const generateMockAlerts = () => {
    const mockAlerts = [
      {
        id: 'alert1',
        type: 'consumption',
        severity: 'high',
        title: 'High Consumption',
        message: 'Zone 3A consumption increased by 45% from previous month',
        timestamp: new Date(2024, 3, 15),
        status: 'new'
      },
      {
        id: 'alert2',
        type: 'loss',
        severity: 'critical',
        title: 'Critical Water Loss',
        message: 'System-wide water loss remains above 65% threshold',
        timestamp: new Date(2024, 3, 10),
        status: 'acknowledged'
      },
      {
        id: 'alert3',
        type: 'meter',
        severity: 'medium',
        title: 'Meter Reading Anomaly',
        message: 'Z3-28 Villa shows unusual consumption pattern',
        timestamp: new Date(2024, 3, 5),
        status: 'new'
      },
      {
        id: 'alert4',
        type: 'maintenance',
        severity: 'low',
        title: 'Maintenance Required',
        message: 'Main Bulk Meter scheduled for calibration',
        timestamp: new Date(2024, 3, 1),
        status: 'resolved'
      }
    ];
    
    setAlerts(mockAlerts);
  };
  
  // Format number with commas
  const formatNumber = (num) => {
    if (isNaN(num)) return '0';
    return num.toLocaleString();
  };
  
  // Format timestamp
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Get color based on change percentage
  const getChangeColor = (percent) => {
    if (percent > 10) return 'text-red-600';
    if (percent > 0) return 'text-orange-600';
    if (percent < -10) return 'text-green-600';
    if (percent < 0) return 'text-emerald-600';
    return 'text-gray-600';
  };
  
  // Get color based on severity
  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-amber-600 bg-amber-50';
      case 'low': return 'text-[#4E4456] bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  // Navigate between views
  const navigateTo = (view) => {
    setActiveTab(view);
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#4E4456]"></div>
          <p className="mt-4 text-gray-600">Loading water system data...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
        <div className="flex items-center mb-4 md:mb-0">
          <div className="bg-[#4E4456]/10 p-3 rounded-lg">
            <Droplet className="h-8 w-8 text-[#4E4456]" />
          </div>
          <div className="ml-4">
            <h1 className="text-2xl font-bold text-gray-900">Water Distribution System</h1>
            <p className="text-gray-500">Manage and monitor water consumption and distribution</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center space-x-2">
            <Select defaultValue={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[100px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>
            
            <Select defaultValue={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jan_24">January</SelectItem>
                <SelectItem value="feb_24">February</SelectItem>
                <SelectItem value="mar_24">March</SelectItem>
                <SelectItem value="apr_24">April</SelectItem>
                <SelectItem value="may_24">May</SelectItem>
                <SelectItem value="jun_24">June</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Button variant="outline" size="icon">
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          
          <Button>
            <DownloadCloud className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Main navigation tabs */}
      <Tabs defaultValue="dashboard" value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-2">
          <TabsTrigger value="dashboard" className="flex items-center">
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="consumption" className="flex items-center">
            <BarChart2 className="h-4 w-4 mr-2" />
            Consumption
          </TabsTrigger>
          <TabsTrigger value="loss" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Water Loss
          </TabsTrigger>
          <TabsTrigger value="types" className="flex items-center">
            <PieChart className="h-4 w-4 mr-2" />
            Types
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-2" />
            Alerts
          </TabsTrigger>
        </TabsList>
        
        <Card>
          <CardContent className="p-4 md:p-6">
            <TabsContent value="dashboard" className="mt-0">
              <WaterDashboard 
                summary={summary}
                consumptionData={consumptionData}
                waterLossData={waterLossData}
                alerts={alerts}
                formatNumber={formatNumber}
                formatTimestamp={formatTimestamp}
                getSeverityColor={getSeverityColor}
                getChangeColor={getChangeColor}
                navigateTo={navigateTo}
              />
            </TabsContent>
            
            <TabsContent value="consumption" className="mt-0">
              <WaterConsumptionAnalysis 
                consumptionData={consumptionData}
                selectedZone={selectedZone}
                setSelectedZone={setSelectedZone}
                formatNumber={formatNumber}
              />
            </TabsContent>
            
            <TabsContent value="loss" className="mt-0">
              <WaterLossAnalysis 
                waterLossData={waterLossData}
                formatNumber={formatNumber}
              />
            </TabsContent>
            
            <TabsContent value="types" className="mt-0">
              <p>Usage by type analysis will appear here.</p>
            </TabsContent>
            
            <TabsContent value="alerts" className="mt-0">
              <WaterAlerts 
                alerts={alerts}
                formatTimestamp={formatTimestamp}
                getSeverityColor={getSeverityColor}
              />
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
};

export default WaterSystemModule;
