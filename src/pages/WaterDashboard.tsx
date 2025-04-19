import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, Filter, Calendar, AlertTriangle, Activity, Home, Building, Droplets } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, AreaChart, Area 
} from 'recharts';
import { formatNumber, formatCurrency } from '@/lib/utils';

interface WaterFilter {
  month: string;
  zone: string;
  type: string;
}

interface WaterSystemData {
  levels: {
    L1: number;
    L2: number;
    L3: number;
  };
  zones: Record<string, {
    consumption: number;
    loss: number;
  }>;
  types: Record<string, number>;
  losses: {
    systemLoss: number;
    financialImpact: number;
  };
  monthlyTrends: Record<string, {
    consumption: number;
    loss: number;
  }>;
}

const MOCK_DATA: WaterSystemData = {
  levels: {
    L1: 48234,
    L2: 45400,
    L3: 42800
  },
  zones: {
    'Zone A': { consumption: 12500, loss: 750 },
    'Zone B': { consumption: 9800, loss: 450 },
    'Zone C': { consumption: 15400, loss: 980 },
    'Zone D': { consumption: 10534, loss: 620 }
  },
  types: {
    'Residential': 25400,
    'Commercial': 12300,
    'Irrigation': 8900,
    'Mixed Use': 3400,
    'Main BULK': 48234,
    'Zone Bulk': 45400
  },
  losses: {
    systemLoss: 2834,
    financialImpact: 52941.24
  },
  monthlyTrends: {
    'jan_25': { consumption: 42500, loss: 2500 },
    'feb_25': { consumption: 48234, loss: 2834 },
    'mar_25': { consumption: 45600, loss: 2300 }
  }
};

const useWaterSystem = () => {
  const [waterData, setWaterData] = useState<WaterSystemData>(MOCK_DATA);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<WaterFilter>({
    month: 'feb_25',
    zone: 'all',
    type: 'all'
  });
  
  const availableZones = ['all', 'Zone A', 'Zone B', 'Zone C', 'Zone D'];
  const availableTypes = ['all', 'Residential', 'Commercial', 'Irrigation', 'Mixed Use'];
  
  const updateFilters = (newFilter: Partial<WaterFilter>) => {
    setFilters(prev => ({ ...prev, ...newFilter }));
  };
  
  return {
    waterData,
    loading,
    error,
    filters,
    availableZones,
    availableTypes,
    updateFilters
  };
};

const WaterFilters = ({ 
  filters, 
  availableZones, 
  availableTypes, 
  onFilterChange, 
  onReset 
}: { 
  filters: WaterFilter; 
  availableZones: string[]; 
  availableTypes: string[];
  onFilterChange: (filter: Partial<WaterFilter>) => void;
  onReset: () => void;
}) => {
  return (
    <div className="flex flex-wrap gap-3 py-3">
      <Button variant="outline" size="sm" className="flex items-center gap-1">
        <Filter className="w-4 h-4" />
        <span>Filters</span>
      </Button>
      {availableZones.map(zone => (
        <Button 
          key={zone}
          variant={filters.zone === zone ? "default" : "outline"} 
          size="sm"
          onClick={() => onFilterChange({ zone })}
        >
          {zone === 'all' ? 'All Zones' : zone}
        </Button>
      ))}
    </div>
  );
};

const WaterDashboard = () => {
  const { 
    waterData, 
    loading, 
    error, 
    filters, 
    availableZones, 
    availableTypes,
    updateFilters 
  } = useWaterSystem();
  
  const [activeTab, setActiveTab] = useState('overview');
  
  const COLORS = [
    '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', 
    '#82CA9D', '#FF6B6B', '#6A7FDB', '#61DAFB', '#FF9AA2'
  ];
  
  const LOSS_COLORS = {
    loss: '#FF6B6B',
    consumption: '#0088FE'
  };
  
  const prepareZoneData = () => {
    if (!waterData?.zones) return [];
    
    return Object.entries(waterData.zones).map(([zone, data]) => ({
      name: zone,
      consumption: data.consumption,
      loss: data.loss
    }));
  };
  
  const prepareTypeData = () => {
    if (!waterData?.types) return [];
    
    return Object.entries(waterData.types)
      .filter(([type]) => type !== 'Main BULK' && type !== 'Zone Bulk')
      .map(([type, value]) => ({
        name: type,
        value
      }));
  };
  
  const prepareLossAnalysisData = () => {
    if (!waterData?.losses) return [];
    
    return [
      { name: 'Consumption', value: waterData.levels.L3 },
      { name: 'System Loss', value: waterData.losses.systemLoss }
    ];
  };
  
  const prepareMonthlyTrendData = () => {
    if (!waterData?.monthlyTrends) return [];
    
    return Object.entries(waterData.monthlyTrends).map(([month, data]) => ({
      name: month.replace('_', '-'),
      consumption: data.consumption,
      loss: data.loss
    }));
  };
  
  const handleFilterChange = (newFilter: Partial<WaterFilter>) => {
    updateFilters(newFilter);
  };

  const handleResetFilters = () => {
    updateFilters({
      month: 'feb_25',
      zone: 'all',
      type: 'all'
    });
  };
  
  useEffect(() => {
    document.title = 'Water Dashboard | Muscat Bay Asset Manager';
  }, []);
  
  const safeFormatNumber = (value: unknown) => {
    const numValue = typeof value === 'string' 
      ? parseFloat(value) 
      : typeof value === 'number' 
        ? value 
        : 0;
    return formatNumber(numValue);
  };

  const calculatePercentage = (part: number, total: number) => {
    if (!total) return "0";
    return (part / total * 100).toFixed(1);
  };
  
  if (loading) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Water Dashboard</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 mb-8" />
          <Skeleton className="h-96" />
        </div>
      </Layout>
    );
  }
  
  if (error) {
    return (
      <Layout>
        <div className="p-6">
          <h1 className="text-2xl font-bold mb-6">Water Dashboard</h1>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            <p className="font-medium">Error loading water data</p>
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    );
  }
  
  const totalConsumption = waterData?.levels.L1 || 0;
  const totalLoss = (waterData?.losses?.systemLoss || 0);
  const lossPercentage = calculatePercentage(totalLoss, totalConsumption);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Droplets className="h-8 w-8 mr-3 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Water Management Dashboard</h1>
              </div>
              <div className="flex items-center space-x-3">
                <Button variant="outline" className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  2024-2025
                </Button>
                <Button variant="outline" className="flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6">
          <WaterFilters 
            filters={filters}
            availableZones={availableZones}
            availableTypes={availableTypes}
            onFilterChange={handleFilterChange}
            onReset={handleResetFilters}
          />
          
          <Tabs 
            defaultValue="overview" 
            value={activeTab}
            onValueChange={setActiveTab}
            className="mt-6"
          >
            <TabsList className="grid grid-cols-4 w-full max-w-md">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="zones">Zones</TabsTrigger>
              <TabsTrigger value="types">Types</TabsTrigger>
              <TabsTrigger value="losses">Losses</TabsTrigger>
            </TabsList>
            
            <div className="mt-2 text-sm text-gray-500">
              Showing: {filters.zone === 'all' ? 'All Zones' : filters.zone} | 
              {filters.type === 'all' ? ' All Types' : ` ${filters.type}`}
            </div>

            <TabsContent value="overview" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Total Consumption</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeFormatNumber(totalConsumption)} m³</div>
                    <p className="text-xs text-gray-500 mt-1">From main bulk meter</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">System Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeFormatNumber(totalLoss)} m³</div>
                    <p className="text-xs text-gray-500 mt-1">{lossPercentage}% of total</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Financial Impact</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{safeFormatNumber(waterData?.losses?.financialImpact || 0)} OMR</div>
                    <p className="text-xs text-gray-500 mt-1">Cost of water loss</p>
                  </CardContent>
                </Card>
                
                <Card className="bg-white">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-gray-500">Zones Count</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{Object.keys(waterData?.zones || {}).length}</div>
                    <p className="text-xs text-gray-500 mt-1">Active zones</p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center p-8 text-gray-500">
                Charts and detailed analysis would appear here - using recharts components
              </div>
            </TabsContent>
            
            <TabsContent value="zones" className="mt-6">
              {/* Zones Tab content */}
            </TabsContent>
            
            <TabsContent value="types" className="mt-6">
              {/* Types Tab content */}
            </TabsContent>
            
            <TabsContent value="losses" className="mt-6">
              {/* Losses Tab content */}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default WaterDashboard;
