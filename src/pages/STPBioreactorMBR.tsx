import React, { useState, useEffect, useMemo } from 'react';
import Layout from "@/components/layout/Layout";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ComposedChart, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, AreaChart, Area,
  ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { OperatingParameter, ChartDataPoint } from "@/types/stp";
import { CalendarDays, ChevronDown, Download, FileSpreadsheet, Info, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { STPDailyDetails } from "@/components/stp/STPDailyDetails"; 
import DateFilter from "@/components/stp/DateFilter";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO, startOfMonth, endOfMonth, startOfDay, endOfDay, subMonths, subDays } from 'date-fns';

// Define the STP daily data type based on the Supabase table
interface STPDailyRecord {
  id: string;
  date: string;
  tanker_trips: number;
  expected_volume_tankers: number;
  direct_sewage_mb: number;
  total_influent: number;
  total_water_processed: number;
  tse_to_irrigation: number;
  ph: number;
  bod?: number;
  cod?: number;
  tss?: number;
  nh4_n?: number;
  tn?: number;
  tp?: number;
}

// Define monthly aggregate data
interface STPMonthlyAggregate {
  month: string;
  tankerTrips: number;
  tankerVolume: number;
  directSewage: number;
  totalInfluent: number;
  waterProcessed: number;
  tseIrrigation: number;
  capacity: number;
  utilizationPercentage: number;
  processingEfficiency: number;
}

const STPBioreactorMBR = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  
  // State for tracking UI
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [selectedTimeRange, setSelectedTimeRange] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('capacity');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [currentDate] = useState(format(new Date(), 'MMMM dd, yyyy'));
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // State for STP data
  const [dailyData, setDailyData] = useState<STPDailyRecord[]>([]);
  const [filteredDailyData, setFilteredDailyData] = useState<STPDailyRecord[]>([]);
  
  useEffect(() => {
    setIsClient(true);
    document.title = 'MBR Bioreactor | Muscat Bay Asset Manager';
    fetchSTPData();
  }, []);
  
  // Fetch data from Supabase
  const fetchSTPData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('stp_daily_data')
        .select('*')
        .order('date', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setDailyData(data);
        setFilteredDailyData(data);
        toast.success('STP data loaded successfully');
      }
    } catch (error) {
      console.error('Error fetching STP data:', error);
      toast.error('Failed to load STP data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Filter data based on selected time range, year, and month
  useEffect(() => {
    if (dailyData.length === 0) return;
    
    const filterData = () => {
      let filtered = [...dailyData];
      const now = new Date();
      let startDate: Date | null = null;
      let endDate: Date | null = null;
      
      // Apply time range filter
      if (selectedTimeRange !== 'ALL') {
        switch(selectedTimeRange) {
          case '1D':
            startDate = startOfDay(now);
            endDate = endOfDay(now);
            break;
          case '7D':
            startDate = startOfDay(subDays(now, 7));
            endDate = endOfDay(now);
            break;
          case '1M':
            startDate = startOfDay(subMonths(now, 1));
            endDate = endOfDay(now);
            break;
          case '3M':
            startDate = startOfDay(subMonths(now, 3));
            endDate = endOfDay(now);
            break;
        }
        
        if (startDate && endDate) {
          filtered = filtered.filter(item => {
            const itemDate = parseISO(item.date);
            return itemDate >= startDate! && itemDate <= endDate!;
          });
        }
      }
      
      // Apply year filter
      if (selectedYear !== 'all') {
        filtered = filtered.filter(item => {
          const itemDate = parseISO(item.date);
          return itemDate.getFullYear().toString() === selectedYear;
        });
      }
      
      // Apply month filter
      if (selectedMonth !== 'all') {
        filtered = filtered.filter(item => {
          const itemDate = parseISO(item.date);
          return (itemDate.getMonth() + 1).toString().padStart(2, '0') === selectedMonth;
        });
      }
      
      setFilteredDailyData(filtered);
    };
    
    filterData();
  }, [dailyData, selectedTimeRange, selectedYear, selectedMonth]);
  
  // Calculate monthly aggregated data
  const monthlyData = useMemo((): STPMonthlyAggregate[] => {
    if (filteredDailyData.length === 0) return [];
    
    const monthGroups: Record<string, STPDailyRecord[]> = {};
    
    // Group data by month
    filteredDailyData.forEach(record => {
      const date = parseISO(record.date);
      const monthKey = format(date, 'yyyy-MM');
      
      if (!monthGroups[monthKey]) {
        monthGroups[monthKey] = [];
      }
      
      monthGroups[monthKey].push(record);
    });
    
    // Calculate monthly aggregates
    return Object.entries(monthGroups).map(([month, records]) => {
      const tankerTrips = records.reduce((sum, record) => sum + (record.tanker_trips || 0), 0);
      const tankerVolume = records.reduce((sum, record) => sum + (record.expected_volume_tankers || 0), 0);
      const directSewage = records.reduce((sum, record) => sum + (record.direct_sewage_mb || 0), 0);
      const totalInfluent = records.reduce((sum, record) => sum + (record.total_influent || 0), 0);
      const waterProcessed = records.reduce((sum, record) => sum + (record.total_water_processed || 0), 0);
      const tseIrrigation = records.reduce((sum, record) => sum + (record.tse_to_irrigation || 0), 0);
      
      // Calculate plant capacity (750 m³/day)
      const capacity = 750 * records.length;
      const utilizationPercentage = capacity > 0 ? (totalInfluent / capacity) * 100 : 0;
      const processingEfficiency = totalInfluent > 0 ? (tseIrrigation / totalInfluent) * 100 : 0;
      
      return {
        month: format(parseISO(`${month}-01`), 'MMM yyyy'),
        tankerTrips,
        tankerVolume,
        directSewage,
        totalInfluent,
        waterProcessed,
        tseIrrigation,
        capacity,
        utilizationPercentage,
        processingEfficiency
      };
    });
  }, [filteredDailyData]);

  // Calculate total metrics across all filtered data
  const totalMetrics = useMemo(() => {
    if (filteredDailyData.length === 0) {
      return {
        totalInfluent: 0,
        totalProcessed: 0,
        totalTSE: 0,
        avgProcessingEfficiency: "0",
        overallUtilization: "0",
        totalTankerVolume: 0,
        totalDirectSewage: 0,
        totalTankerTrips: 0
      };
    }
    
    const totalInfluent = filteredDailyData.reduce((sum, record) => sum + (record.total_influent || 0), 0);
    const totalProcessed = filteredDailyData.reduce((sum, record) => sum + (record.total_water_processed || 0), 0);
    const totalTSE = filteredDailyData.reduce((sum, record) => sum + (record.tse_to_irrigation || 0), 0);
    const totalTankerVolume = filteredDailyData.reduce((sum, record) => sum + (record.expected_volume_tankers || 0), 0);
    const totalDirectSewage = filteredDailyData.reduce((sum, record) => sum + (record.direct_sewage_mb || 0), 0);
    const totalTankerTrips = filteredDailyData.reduce((sum, record) => sum + (record.tanker_trips || 0), 0);
    
    // Calculate total capacity based on number of days
    const totalCapacity = 750 * filteredDailyData.length;
    
    const avgProcessingEfficiency = totalInfluent > 0 ? ((totalTSE / totalInfluent) * 100).toFixed(1) : "0";
    const overallUtilization = totalCapacity > 0 ? ((totalInfluent / totalCapacity) * 100).toFixed(1) : "0";
    
    return {
      totalInfluent,
      totalProcessed,
      totalTSE,
      avgProcessingEfficiency,
      overallUtilization,
      totalTankerVolume,
      totalDirectSewage,
      totalTankerTrips
    };
  }, [filteredDailyData]);

  // Calculate recent metrics (last 7 days or all available data if less)
  const recentMetrics = useMemo(() => {
    if (filteredDailyData.length === 0) {
      return { avgDailyInfluent: 0, avgCapacityUsage: "0", processingEfficiency: "0" };
    }
    
    // Use the most recent 7 days (or fewer if not available)
    const recentData = filteredDailyData.slice(-7);
    
    const sumInfluent = recentData.reduce((sum, day) => sum + (day.total_influent || 0), 0);
    const sumProcessed = recentData.reduce((sum, day) => sum + (day.total_water_processed || 0), 0);
    const sumTSE = recentData.reduce((sum, day) => sum + (day.tse_to_irrigation || 0), 0);
    
    const avgDailyInfluent = sumInfluent / recentData.length;
    const avgCapacityUsage = (avgDailyInfluent / 750 * 100).toFixed(1);
    const processingEfficiency = sumInfluent > 0 ? (sumTSE / sumInfluent * 100).toFixed(1) : "0";
    
    return {
      avgDailyInfluent: Math.round(avgDailyInfluent),
      avgCapacityUsage,
      processingEfficiency
    };
  }, [filteredDailyData]);

  // Influent source distribution data
  const influentSourceData = useMemo(() => [
    { name: 'Tanker Delivery', value: totalMetrics.totalTankerVolume },
    { name: 'Direct Sewage', value: totalMetrics.totalDirectSewage }
  ], [totalMetrics]);
  
  const COLORS = ['#3b82f6', '#10b981'];

  // Operating parameters data (using latest values from data if available)
  const currentParameterData: OperatingParameter[] = useMemo(() => {
    const latestRecord = filteredDailyData.length > 0 ? filteredDailyData[filteredDailyData.length - 1] : null;
    
    return [
      { 
        name: 'pH', 
        value: latestRecord?.ph || 7.2, 
        min: 6.5, 
        max: 8.0, 
        status: 'normal' 
      },
      { 
        name: 'DO', 
        value: 2.4, // Default value as it's not in the data
        min: 2.0, 
        max: 3.0, 
        status: 'normal' 
      },
      { 
        name: 'MLSS', 
        value: 8400, // Default value as it's not in the data
        min: 8000, 
        max: 8600, 
        status: 'normal' 
      },
      { 
        name: 'Cl₂', 
        value: 0.6, // Default value as it's not in the data
        min: 0.5, 
        max: 0.7, 
        status: 'normal' 
      }
    ];
  }, [filteredDailyData]);

  // Plant capacity gauge data
  const capacityGaugeData: ChartDataPoint[] = useMemo(() => [
    {
      name: 'Current',
      value: parseFloat(recentMetrics.avgCapacityUsage),
      fill: parseFloat(recentMetrics.avgCapacityUsage) > 85 ? '#f97316' : 
            parseFloat(recentMetrics.avgCapacityUsage) > 70 ? '#facc15' : '#10b981'
    }
  ], [recentMetrics]);

  // Reset filters
  const resetFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedTimeRange('ALL');
    toast.success('Filters reset to show all data');
  };

  // Export data to CSV
  const exportToCSV = () => {
    try {
      const exportData = filteredDailyData.map(item => ({
        Date: format(parseISO(item.date), 'yyyy-MM-dd'),
        "Tanker Trips": item.tanker_trips,
        "Tanker Volume (m³)": item.expected_volume_tankers,
        "Direct Sewage (m³)": item.direct_sewage_mb,
        "Total Influent (m³)": item.total_influent,
        "Water Processed (m³)": item.total_water_processed,
        "TSE to Irrigation (m³)": item.tse_to_irrigation,
        "pH": item.ph
      }));
      
      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(exportData[0] || {}).join(",") + "\n" +
        exportData.map(row => {
          return Object.values(row).join(",");
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "STP_Data_Export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  // Get period description for the current filtered data
  const getPeriodDescription = () => {
    if (filteredDailyData.length === 0) return "No data";
    
    if (selectedMonth !== 'all' && selectedYear !== 'all') {
      const monthName = new Date(parseInt(selectedYear), parseInt(selectedMonth) - 1, 1)
        .toLocaleString('default', { month: 'long' });
      return `${monthName} ${selectedYear}`;
    } else if (selectedYear !== 'all') {
      return selectedYear;
    } else if (selectedTimeRange !== 'ALL') {
      return `Last ${selectedTimeRange}`;
    } else {
      return "All available data";
    }
  };

  // Main dashboard content
  const DashboardTabContent = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading STP data...</span>
        </div>
      );
    }

    if (filteredDailyData.length === 0 && !isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Info className="h-12 w-12 text-muted-foreground mb-2" />
          <h3 className="text-lg font-medium">No data available for the selected filters</h3>
          <p className="text-muted-foreground">Try adjusting your filter settings or select a different time period.</p>
          <Button variant="outline" className="mt-4" onClick={resetFilters}>
            Reset Filters
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-appear-zoom">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-medium">MBR Performance Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              Showing data for: <span className="font-medium">{getPeriodDescription()}</span>
            </p>
          </div>
          
          <DateFilter
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
            onMonthChange={setSelectedMonth}
            onYearChange={setSelectedYear}
            onResetFilters={resetFilters}
          />
        </div>
        
        {/* Time Range Selector */}
        <div className="flex space-x-1">
          <Button 
            variant={selectedTimeRange === '1D' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedTimeRange('1D')}
          >
            1D
          </Button>
          <Button 
            variant={selectedTimeRange === '7D' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedTimeRange('7D')}
          >
            7D
          </Button>
          <Button 
            variant={selectedTimeRange === '1M' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedTimeRange('1M')}
          >
            1M
          </Button>
          <Button 
            variant={selectedTimeRange === '3M' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedTimeRange('3M')}
          >
            3M
          </Button>
          <Button 
            variant={selectedTimeRange === 'ALL' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setSelectedTimeRange('ALL')}
          >
            All
          </Button>
        </div>

        {/* Key Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white shadow-sm hover:shadow transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-muted-foreground">Daily Influent</CardTitle>
                <Badge variant={parseFloat(recentMetrics.avgCapacityUsage) > parseFloat(totalMetrics.overallUtilization) ? 'default' : 'default'}>
                  {parseFloat(recentMetrics.avgCapacityUsage) > parseFloat(totalMetrics.overallUtilization) ? '+' : '-'}
                  {Math.abs(parseFloat(recentMetrics.avgCapacityUsage) - parseFloat(totalMetrics.overallUtilization)).toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-foreground">{recentMetrics.avgDailyInfluent}</p>
                <p className="ml-2 text-muted-foreground mb-1">m³/day</p>
              </div>
              <div className="mt-4 h-10">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-green-600">{recentMetrics.avgCapacityUsage}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-muted-foreground">750 m³/day capacity</span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 flex rounded bg-muted">
                    <div 
                      style={{ width: `${recentMetrics.avgCapacityUsage}%` }} 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        parseFloat(recentMetrics.avgCapacityUsage) > 85 ? 'bg-orange-500' : 
                        parseFloat(recentMetrics.avgCapacityUsage) > 70 ? 'bg-yellow-500' : 'bg-green-500'
                      }`}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-muted-foreground">Processing Efficiency</CardTitle>
                <Badge variant="secondary">
                  {parseFloat(recentMetrics.processingEfficiency) > 90 ? 'Excellent' : 
                   parseFloat(recentMetrics.processingEfficiency) > 80 ? 'Good' : 'Fair'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-foreground">{recentMetrics.processingEfficiency}%</p>
                <p className="ml-2 text-muted-foreground mb-1">TSE/Influent</p>
              </div>
              <div className="mt-4 flex items-center">
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${recentMetrics.processingEfficiency}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
                <Badge variant="secondary">
                  {filteredDailyData.length} days
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-foreground">{(totalMetrics.totalInfluent/1000).toFixed(1)}K</p>
                <p className="ml-2 text-muted-foreground mb-1">m³ total</p>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <div className="flex items-center mr-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                  <span>Tanker: {(totalMetrics.totalTankerVolume/1000).toFixed(1)}K m³</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                  <span>Direct: {(totalMetrics.totalDirectSewage/1000).toFixed(1)}K m³</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-muted-foreground">Parameter Status</CardTitle>
                <Badge variant="secondary">Normal</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-foreground">100%</p>
                <p className="ml-2 text-muted-foreground mb-1">Compliant</p>
              </div>
              <div className="mt-4 flex justify-between text-xs text-muted-foreground">
                <div>
                  <span className="font-medium text-foreground">pH:</span>
                  <span className="ml-1 text-green-600">{currentParameterData[0].value.toFixed(1)}</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">DO:</span>
                  <span className="ml-1 text-green-600">{currentParameterData[1].value.toFixed(1)}</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">MLSS:</span>
                  <span className="ml-1 text-green-600">{currentParameterData[2].value}</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">Cl₂:</span>
                  <span className="ml-1 text-green-600">{currentParameterData[3].value.toFixed(1)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts & Tables Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Flow Chart */}
          <Card className="bg-white shadow-sm hover:shadow transition-all lg:col-span-2">
            <CardHeader className="pb-0">
              <div className="flex justify-between items-center">
                <CardTitle className="text-base font-medium text-foreground">Flow Analysis</CardTitle>
                <div className="flex space-x-2">
                  <select 
                    value={selectedSection} 
                    onChange={(e) => setSelectedSection(e.target.value)} 
                    className="text-xs border rounded-md px-2 py-1 text-foreground bg-background"
                  >
                    <option value="capacity">Capacity & Utilization</option>
                    <option value="efficiency">Processing Efficiency</option>
                    <option value="sources">Source Distribution</option>
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedSection === 'capacity' ? (
                    <ComposedChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => value >= 1000 ? `${(value/1000)}K` : value} 
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false}
                        domain={[0, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="totalInfluent" name="Total Influent (m³)" fill="#3b82f6" />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="utilizationPercentage" 
                        name="Utilization (%)" 
                        stroke="#f59e0b" 
                        strokeWidth={2} 
                        dot={{ stroke: '#f59e0b', strokeWidth: 2, r: 4 }} 
                      />
                    </ComposedChart>
                  ) : selectedSection === 'efficiency' ? (
                    <ComposedChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false} 
                        tickFormatter={(value) => value >= 1000 ? `${(value/1000)}K` : value} 
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fontSize: 12 }} 
                        axisLine={false} 
                        tickLine={false}
                        domain={[60, 100]}
                        tickFormatter={(value) => `${value}%`}
                      />
                      <RechartsTooltip />
                      <Legend />
                      <Bar yAxisId="left" dataKey="waterProcessed" name="Water Processed (m³)" fill="#3b82f6" />
                      <Bar yAxisId="left" dataKey="tseIrrigation" name="TSE to Irrigation (m³)" fill="#10b981" />
                      <Line 
                        yAxisId="right"
                        type="monotone" 
                        dataKey="processingEfficiency" 
                        name="Efficiency (%)" 
                        stroke="#8b5cf6" 
                        strokeWidth={2} 
                        dot={{ stroke: '#8b5cf6', strokeWidth: 2, r: 4 }} 
                      />
                    </ComposedChart>
                  ) : (
                    <AreaChart 
                      data={monthlyData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => value >= 1000 ? `${(Number(value)/1000)}K` : value} />
                      <RechartsTooltip formatter={(value: any) => [`${value} m³`, '']} />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="directSewage" 
                        name="Direct Sewage" 
                        stackId="1" 
                        stroke="#10b981" 
                        fill="#10b981" 
                      />
                      <Area 
                        type="monotone" 
                        dataKey="tankerVolume" 
                        name="Tanker Volume" 
                        stackId="1" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                      />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Plant Capacity & Influent Source */}
          <Card className="bg-white shadow-sm hover:shadow transition-all">
            <CardHeader>
              <CardTitle className="text-base font-medium text-foreground">Plant Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="60%" 
                      outerRadius="100%" 
                      barSize={10} 
                      data={capacityGaugeData} 
                      startAngle={180} 
                      endAngle={0}
                    >
                      <RadialBar
                        background
                        dataKey="value"
                        cornerRadius={5}
                        fill="#82ca9d"
                      />
                      <text 
                        x="50%" 
                        y="50%" 
                        textAnchor="middle" 
                        dominantBaseline="middle" 
                        className="text-2xl font-bold text-foreground"
                      >
                        {recentMetrics.avgCapacityUsage}%
                      </text>
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
                
                <p className="text-sm text-muted-foreground">Current plant capacity utilization</p>
              </div>
              
              <Separator className="my-4" />
              
              <div>
                <h4 className="text-sm font-medium mb-2">Influent Source Distribution</h4>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={influentSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {influentSourceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto py-6 px-4 sm:px-6">
        <div className="flex flex-col space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">STP MBR Bioreactor</h1>
              <p className="text-muted-foreground">
                Membrane bioreactor operational dashboard
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={exportToCSV}>
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <CalendarDays className="mr-2 h-4 w-4" />
                {currentDate}
              </Button>
            </div>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full sm:w-auto grid-cols-3 mb-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="reports">Daily Reports</TabsTrigger>
              <TabsTrigger value="equipment">Equipment Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard">
              {DashboardTabContent()}
            </TabsContent>
            
            <TabsContent value="reports">
              <STPDailyDetails 
                selectedMonth={selectedMonth}
                showHeader={true}
              />
            </TabsContent>
            
            <TabsContent value="equipment">
              <div className="grid gap-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Equipment Status</h2>
                  <Badge variant="outline" className="px-3 py-1">
                    <span className="flex items-center">
                      <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                      All Systems Operational
                    </span>
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Fine Screens</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Operational</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last maintenance: 2024-03-15</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Anoxic Tanks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Operational</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last maintenance: 2024-02-28</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Aeration Tanks</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Operational</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last maintenance: 2024-03-10</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">MBR Modules</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Operational</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last cleaning: 2024-03-20</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">UV Disinfection</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Operational</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last maintenance: 2024-02-15</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Chlorination System</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm">Operational</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Last refill: 2024-03-25</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default STPBioreactorMBR;

