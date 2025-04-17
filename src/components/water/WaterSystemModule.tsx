
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Cell, AreaChart, Area, ComposedChart, Scatter 
} from 'recharts';
import { 
  Droplet, AlertTriangle, TrendingUp, MapPin, FileText, 
  Filter, Activity, Calendar, RefreshCw, Search, Download,
  ChevronDown, ArrowRight, Plus, Settings, Clock, BarChart2, Check,
  LayoutDashboard, Bell, Wrench
} from 'lucide-react';
import { waterService } from '@/services/waterService';
import { WaterDashboard } from './WaterDashboard';
import { WaterConsumptionAnalysis } from './WaterConsumptionAnalysis';
import { WaterLossAnalysis } from './WaterLossAnalysis';
import { MeterManagement } from './MeterManagement';
import { WaterAlerts } from './WaterAlerts';
import { MeterDetails } from './MeterDetails';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const WaterSystemModule = () => {
  // State hooks for module functionality
  const [selectedView, setSelectedView] = useState('dashboard');
  const [selectedZone, setSelectedZone] = useState('all');
  const [selectedMeter, setSelectedMeter] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('apr_24');
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState<any>({});
  const [zones, setZones] = useState([]);
  const [meters, setMeters] = useState([]);
  const [consumptionData, setConsumptionData] = useState([]);
  const [waterLossData, setWaterLossData] = useState([]);
  const [meterDetails, setMeterDetails] = useState(null);
  
  // Theme colors
  const themeColors = {
    primary: '#4E4456',
    primaryLight: '#6a5f7a',
    primaryDark: '#3a3340',
    secondary: '#63B3ED',
    accent: '#805AD5',
    success: '#48BB78',
    warning: '#F6AD55',
    danger: '#F56565',
    background: '#F7FAFC',
    card: '#FFFFFF',
    text: '#2D3748',
    textLight: '#718096',
    border: '#E2E8F0'
  };
  
  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch zones
        const zonesData = await waterService.getZones();
        
        // Fetch meters
        const metersData = await waterService.getWaterMeters(selectedPeriod);
        
        // Fetch consumption data
        const consumptionByZone = await waterService.getMonthlyConsumption(2024);
        
        // Fetch water loss data
        const lossData = await waterService.getWaterLossData();
        
        // If a meter is selected, fetch its details
        let meterData = null;
        if (selectedMeter) {
          meterData = await waterService.getMeterDetails(selectedMeter);
        }
        
        // Mock alerts for now
        const mockAlerts = [
          { id: 'alert1', type: 'consumption', severity: 'high', title: 'High Consumption', message: 'Zone 3A consumption increased by 45% from March to April', timestamp: new Date('2024-04-15T09:30:00'), status: 'new' },
          { id: 'alert2', type: 'loss', severity: 'critical', title: 'Critical Water Loss', message: 'System-wide water loss remains above 65% threshold', timestamp: new Date('2024-04-10T14:15:00'), status: 'acknowledged' },
          { id: 'alert3', type: 'meter', severity: 'medium', title: 'Meter Reading Anomaly', message: 'Z3-28 Villa shows unusual consumption pattern', timestamp: new Date('2024-04-05T11:20:00'), status: 'new' },
          { id: 'alert4', type: 'maintenance', severity: 'low', title: 'Maintenance Required', message: 'Main Bulk Meter scheduled for calibration', timestamp: new Date('2024-04-01T16:45:00'), status: 'new' },
        ];
        
        // Calculate summary metrics
        const latestLossData = lossData.length > 0 ? lossData[lossData.length - 1] : null;
        const summaryData = {
          totalConsumption: latestLossData?.totalConsumption || 0,
          previousPeriodConsumption: lossData.length > 1 ? lossData[lossData.length - 2].totalConsumption : 0,
          changePercent: latestLossData && lossData.length > 1 
            ? ((latestLossData.totalConsumption - lossData[lossData.length - 2].totalConsumption) / 
               lossData[lossData.length - 2].totalConsumption * 100)
            : 0,
          activeMeters: metersData.filter(m => m.readings[selectedPeriod] > 0).length,
          inactiveMeters: metersData.filter(m => !m.readings[selectedPeriod]).length,
          alertCount: mockAlerts.length,
          averageLoss: latestLossData?.totalLossPercent || 0,
          topConsumer: {
            label: metersData.reduce((top, meter) => 
              (!top || (meter.readings[selectedPeriod] > top.readings[selectedPeriod])) 
                ? meter 
                : top, 
              null
            )?.meterLabel || 'Unknown',
            consumption: metersData.reduce((max, meter) => 
              Math.max(max, meter.readings[selectedPeriod] || 0), 
              0
            ),
            percent: metersData.reduce((max, meter) => 
              Math.max(max, meter.readings[selectedPeriod] || 0), 
              0
            ) / (latestLossData?.totalConsumption || 1) * 100
          }
        };
        
        // Update state with loaded data
        setZones(zonesData);
        setMeters(metersData);
        setConsumptionData(consumptionByZone);
        setWaterLossData(lossData);
        setAlerts(mockAlerts);
        setSummary(summaryData);
        setMeterDetails(meterData);
      } catch (error) {
        console.error('Error loading water system data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [selectedPeriod, selectedMeter]);
  
  // Handle meter selection
  const handleMeterSelect = (meterId: string) => {
    setSelectedMeter(meterId);
    setSelectedView('meterDetails');
  };
  
  // Navigation functions
  const navigateTo = (view: string) => {
    setSelectedView(view);
    if (view !== 'meterDetails') {
      setSelectedMeter(null);
    }
  };
  
  // Format timestamp for alerts
  const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  // Get colors for severity
  const getSeverityColor = (severity: string): string => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50/80';
      case 'high': return 'text-orange-600 bg-orange-50/80';
      case 'medium': return 'text-amber-600 bg-amber-50/80';
      case 'low': return 'text-[#4E4456] bg-purple-50/80';
      default: return 'text-gray-600 bg-gray-50/80';
    }
  };
  
  // Format number with commas
  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };
  
  // Calculate color based on change percentage
  const getChangeColor = (percent: number): string => {
    if (percent > 10) return 'text-red-600';
    if (percent > 0) return 'text-orange-600';
    if (percent < -10) return 'text-green-600';
    if (percent < 0) return 'text-emerald-600';
    return 'text-gray-600';
  };

  // Render content based on selected view
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div className="mb-4 md:mb-0">
            <h1 className="text-2xl font-bold text-[#4E4456]">Water System</h1>
            <p className="text-gray-600 mt-1">Monitoring and management of Muscat Bay water distribution network</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" className="h-9 gap-1" onClick={() => setShowFilters(!showFilters)}>
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            
            <Button variant="outline" className="h-9 gap-1">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Apr 2024</span>
            </Button>
            
            <Button variant="outline" className="h-9 gap-1">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            
            <Button variant="default" className="h-9 gap-1" onClick={() => window.location.reload()}>
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh</span>
            </Button>
          </div>
        </div>
      </div>
      
      {/* Navigation Tabs */}
      <Tabs defaultValue="dashboard" value={selectedView} onValueChange={navigateTo} className="mb-6">
        <TabsList className="grid grid-cols-3 md:grid-cols-6 gap-1">
          <TabsTrigger value="dashboard" className="flex items-center gap-1.5">
            <LayoutDashboard className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="consumption" className="flex items-center gap-1.5">
            <Droplet className="h-4 w-4" />
            <span className="hidden sm:inline">Consumption</span>
          </TabsTrigger>
          <TabsTrigger value="waterLoss" className="flex items-center gap-1.5">
            <TrendingUp className="h-4 w-4" />
            <span className="hidden sm:inline">Water Loss</span>
          </TabsTrigger>
          <TabsTrigger value="meters" className="flex items-center gap-1.5">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Meters</span>
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center gap-1.5">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-1.5">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Tab Content */}
        <TabsContent value="dashboard">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-[300px] w-full rounded-xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-[250px] w-full rounded-xl" />
                <Skeleton className="h-[250px] w-full rounded-xl" />
              </div>
            </div>
          ) : (
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
          )}
        </TabsContent>
        
        <TabsContent value="consumption">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : (
            <WaterConsumptionAnalysis 
              consumptionData={consumptionData}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              formatNumber={formatNumber}
            />
          )}
        </TabsContent>
        
        <TabsContent value="waterLoss">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : (
            <WaterLossAnalysis 
              waterLossData={waterLossData}
              formatNumber={formatNumber}
            />
          )}
        </TabsContent>
        
        <TabsContent value="meters">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : (
            <MeterManagement 
              meters={meters}
              selectedZone={selectedZone}
              setSelectedZone={setSelectedZone}
              handleMeterSelect={handleMeterSelect}
              zones={zones}
              formatNumber={formatNumber}
            />
          )}
        </TabsContent>
        
        <TabsContent value="alerts">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : (
            <WaterAlerts 
              alerts={alerts}
              formatTimestamp={formatTimestamp}
              getSeverityColor={getSeverityColor}
            />
          )}
        </TabsContent>
        
        <TabsContent value="meterDetails">
          {isLoading ? (
            <Skeleton className="h-[500px] w-full rounded-xl" />
          ) : (
            <MeterDetails 
              meter={meterDetails}
              formatNumber={formatNumber}
              goBack={() => navigateTo('meters')}
            />
          )}
        </TabsContent>
        
        <TabsContent value="settings">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Water System Settings</h2>
            <p className="text-gray-600 mb-4">Configure system parameters, alerts, and monitoring thresholds.</p>
            <div className="grid gap-4">
              <div>
                <h3 className="text-lg font-medium mb-2">Alert Thresholds</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Water Loss Warning (%)</label>
                    <Input type="number" defaultValue="45" className="max-w-xs" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Water Loss Critical (%)</label>
                    <Input type="number" defaultValue="65" className="max-w-xs" />
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Data Collection</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reading Frequency</label>
                    <select className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2">
                      <option>Daily</option>
                      <option>Weekly</option>
                      <option selected>Monthly</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Data Retention Period</label>
                    <select className="w-full max-w-xs rounded-md border border-gray-300 px-3 py-2">
                      <option>6 months</option>
                      <option selected>1 year</option>
                      <option>2 years</option>
                      <option>5 years</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <Button variant="default" className="mr-2">
                  <Check className="h-4 w-4 mr-2" />
                  Save Settings
                </Button>
                <Button variant="outline">
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WaterSystemModule;
