
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
import { CalendarDays, ChevronDown, Download, FileSpreadsheet, Info, Users } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchParams } from "react-router-dom";
import { STPDailyDetails } from "@/components/stp/STPDailyDetails"; 
import DateFilter from "@/components/stp/DateFilter";
import { 
  STPDailyRecord, 
  calculateMonthlyAggregates, 
  filterDataByYearMonth, 
  processData 
} from "@/utils/stpDailyData";

const STPBioreactorMBR = () => {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'dashboard';
  
  // State for tracking UI
  const [selectedTab, setSelectedTab] = useState(initialTab);
  const [selectedTimeRange, setSelectedTimeRange] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('capacity');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [currentDate] = useState('March 14, 2025');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    document.title = 'MBR Bioreactor | Muscat Bay Asset Manager';
  }, []);
  
  // Handle data filtering
  const [filteredDailyData, setFilteredDailyData] = useState<STPDailyRecord[]>([]);
  
  useEffect(() => {
    const data = processData([], selectedTimeRange, selectedYear, selectedMonth);
    setFilteredDailyData(data);
  }, [selectedYear, selectedMonth, selectedTimeRange]);
  
  // Calculate monthly aggregated data
  const monthlyData = useMemo(() => {
    return calculateMonthlyAggregates(filteredDailyData);
  }, [filteredDailyData]);

  // Calculate total metrics across all months
  const calculateTotalMetrics = () => {
    let totalInfluent = 0;
    let totalProcessed = 0;
    let totalTSE = 0;
    let totalTankerVolume = 0;
    let totalDirectSewage = 0;
    let totalTankerTrips = 0;
    
    monthlyData.forEach(month => {
      totalInfluent += month.totalInfluent;
      totalProcessed += month.waterProcessed;
      totalTSE += month.tseIrrigation;
      totalTankerVolume += month.tankerVolume;
      totalDirectSewage += month.directSewage;
      totalTankerTrips += month.tankerTrips;
    });
    
    const avgProcessingEfficiency = totalInfluent > 0 ? ((totalTSE / totalInfluent) * 100).toFixed(1) : "0";
    const totalCapacity = monthlyData.reduce((sum, month) => sum + month.capacity, 0);
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
  };
  
  const totalMetrics = useMemo(() => calculateTotalMetrics(), [monthlyData]);

  // Calculate recent metrics
  const calculateRecentMetrics = () => {
    if (filteredDailyData.length === 0) return { avgDailyInfluent: 0, avgCapacityUsage: "0", processingEfficiency: "0" };
    
    let sumInfluent = 0;
    let sumProcessed = 0;
    let sumTSE = 0;
    
    // Use the most recent 7 days (or fewer if not available)
    const recentData = filteredDailyData.slice(-7);
    
    recentData.forEach(day => {
      sumInfluent += day.totalInfluent;
      sumProcessed += day.totalWaterProcessed;
      sumTSE += day.tseToIrrigation;
    });
    
    const avgDailyInfluent = sumInfluent / recentData.length;
    const avgCapacityUsage = (avgDailyInfluent / 750 * 100).toFixed(1);
    const processingEfficiency = sumInfluent > 0 ? (sumTSE / sumInfluent * 100).toFixed(1) : "0";
    
    return {
      avgDailyInfluent: Math.round(avgDailyInfluent),
      avgCapacityUsage,
      processingEfficiency
    };
  };
  
  const recentMetrics = useMemo(() => calculateRecentMetrics(), [filteredDailyData]);

  // Influent source distribution data
  const influentSourceData = useMemo(() => [
    { name: 'Tanker Delivery', value: totalMetrics.totalTankerVolume },
    { name: 'Direct Sewage', value: totalMetrics.totalDirectSewage }
  ], [totalMetrics]);
  
  const COLORS = ['#3b82f6', '#10b981'];

  // Operating parameters data
  const currentParameterData: OperatingParameter[] = [
    { name: 'pH', value: 7.2, min: 6.5, max: 8.0, status: 'normal' },
    { name: 'DO', value: 2.4, min: 2.0, max: 3.0, status: 'normal' },
    { name: 'MLSS', value: 8400, min: 8000, max: 8600, status: 'normal' },
    { name: 'Cl₂', value: 0.6, min: 0.5, max: 0.7, status: 'normal' }
  ];

  // Plant capacity gauge data
  const capacityGaugeData: ChartDataPoint[] = [
    {
      name: 'Current',
      value: parseFloat(recentMetrics.avgCapacityUsage),
      fill: parseFloat(recentMetrics.avgCapacityUsage) > 85 ? '#f97316' : 
            parseFloat(recentMetrics.avgCapacityUsage) > 70 ? '#facc15' : '#10b981'
    }
  ];
  
  // Effect to update date range based on selected time range
  useEffect(() => {
    const today = new Date('2025-03-14');
    let start, end;
    
    switch(selectedTimeRange) {
      case '1D':
        start = new Date(today);
        end = new Date(today);
        break;
      case '7D':
        end = new Date(today);
        start = new Date(today);
        start.setDate(start.getDate() - 6);
        break;
      case '1M':
        end = new Date(today);
        start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        break;
      case '3M':
        end = new Date(today);
        start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        break;
      case 'ALL':
      default:
        // Use all available data
        start = null;
        end = null;
        break;
    }
    
    setSelectedDateRange({ start, end });
  }, [selectedTimeRange]);

  // Reset filters
  const resetFilters = () => {
    setSelectedMonth('all');
    setSelectedYear('all');
    setSelectedTimeRange('ALL');
  };

  // Export data to CSV
  const exportToCSV = () => {
    try {
      const monthlyDataCSV = monthlyData.map(item => ({
        Month: item.month,
        "Tanker Trips": item.tankerTrips,
        "Tanker Volume (m³)": item.tankerVolume,
        "Direct Sewage (m³)": item.directSewage,
        "Total Influent (m³)": item.totalInfluent,
        "Water Processed (m³)": item.waterProcessed,
        "TSE to Irrigation (m³)": item.tseIrrigation,
        "Utilization (%)": item.utilizationPercentage,
        "Processing Efficiency (%)": item.processingEfficiency
      }));
      
      const csvContent = "data:text/csv;charset=utf-8," + 
        Object.keys(monthlyDataCSV[0] || {}).join(",") + "\n" +
        monthlyDataCSV.map(row => {
          return Object.values(row).join(",");
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "STP_Monthly_Data.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Data exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("Failed to export data");
    }
  };

  // Main dashboard content
  const DashboardTabContent = () => {
    if (!isClient) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-white">
              <CardHeader className="pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded mb-4"></div>
                <div className="h-2 w-full bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
          <div className="col-span-1 md:col-span-2 h-64 bg-gray-100 rounded-xl"></div>
          <div className="col-span-1 h-64 bg-gray-100 rounded-xl"></div>
        </div>
      );
    }

    return (
      <div className="space-y-6 animate-appear-zoom">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <h2 className="text-lg font-medium">MBR Performance Dashboard</h2>
          
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
                <Badge variant="secondary">Excellent</Badge>
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
                <Badge variant="secondary">Complete</Badge>
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
                  <span className="ml-1 text-green-600">7.2</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">DO:</span>
                  <span className="ml-1 text-green-600">2.4</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">MLSS:</span>
                  <span className="ml-1 text-green-600">8400</span>
                </div>
                <div>
                  <span className="font-medium text-foreground">Cl₂:</span>
                  <span className="ml-1 text-green-600">0.6</span>
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
                      <RechartsTooltip formatter={(value: any) => `${(Number(value)/1000).toFixed(1)}K m³`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                    <span>Tanker Delivery: 
                      {((totalMetrics.totalTankerVolume / 
                        (totalMetrics.totalTankerVolume + totalMetrics.totalDirectSewage)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span>Direct Sewage:
                      {((totalMetrics.totalDirectSewage / 
                        (totalMetrics.totalTankerVolume + totalMetrics.totalDirectSewage)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-0">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex items-center justify-center" 
                onClick={exportToCSV}
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Current Date Info */}
        <div className="flex items-center justify-end">
          <span className="text-xs text-muted-foreground">Current Date:</span>
          <Badge variant="outline" className="ml-1">
            <CalendarDays className="h-3 w-3 mr-1" />
            {currentDate}
          </Badge>
        </div>
      </div>
    );
  };

  // Equipment Health Tab Content
  const EquipmentTabContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h2 className="text-lg font-medium">Equipment Status & Maintenance</h2>
        <Button variant="outline" size="sm">
          <FileSpreadsheet className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MBR System Health</CardTitle>
            <CardDescription>Membrane bioreactor operational status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm">Membrane Condition</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Optimal</Badge>
              </div>
              <div className="w-full bg-muted rounded-full h-2.5 mt-2">
                <div className="bg-green-600 h-2.5 rounded-full" style={{ width: '92%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Last Cleaning: 14 Feb 2025</span>
                <span>Next Due: 14 May 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pump Systems</CardTitle>
            <CardDescription>Feed and circulation pumps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Feed Pump P-101</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Running</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Recirc Pump P-102</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Running</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Waste Pump P-103</span>
                <Badge variant="secondary">Standby</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Backwash Pump P-104</span>
                <Badge variant="secondary">Standby</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aeration System</CardTitle>
            <CardDescription>Blowers and diffusers status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Blower B-101</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Running</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Blower B-102</span>
                <Badge variant="secondary">Standby</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Diffuser Status</span>
                <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-200">Normal</Badge>
              </div>
              <div className="mt-4 text-xs text-muted-foreground">
                <span>Diffuser cleaning last performed: 22 Jan 2025</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Maintenance Schedule</CardTitle>
          <CardDescription>Upcoming maintenance tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Task</th>
                  <th scope="col" className="px-6 py-3">Equipment</th>
                  <th scope="col" className="px-6 py-3">Due Date</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Assigned To</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-6 py-4">Membrane CIP Cleaning</td>
                  <td className="px-6 py-4">MBR System</td>
                  <td className="px-6 py-4">14 May 2025</td>
                  <td className="px-6 py-4"><Badge variant="secondary">Scheduled</Badge></td>
                  <td className="px-6 py-4">Maintenance Team</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4">Pump P-101 Inspection</td>
                  <td className="px-6 py-4">Feed Pump</td>
                  <td className="px-6 py-4">30 Mar 2025</td>
                  <td className="px-6 py-4"><Badge variant="secondary">Scheduled</Badge></td>
                  <td className="px-6 py-4">John D.</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4">Diffuser Cleaning</td>
                  <td className="px-6 py-4">Aeration System</td>
                  <td className="px-6 py-4">22 Apr 2025</td>
                  <td className="px-6 py-4"><Badge variant="secondary">Scheduled</Badge></td>
                  <td className="px-6 py-4">Maintenance Team</td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4">Blower B-102 Inspection</td>
                  <td className="px-6 py-4">Aeration Blower</td>
                  <td className="px-6 py-4">15 Mar 2025</td>
                  <td className="px-6 py-4"><Badge variant="default">In Progress</Badge></td>
                  <td className="px-6 py-4">Sarah K.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Reports Tab Content - Replace with actual daily details component
  const ReportsTabContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">STP Daily Performance Data</h2>
      </div>
      
      <STPDailyDetails selectedMonth={selectedMonth} showHeader={false} />
    </div>
  );

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">STP Bioreactor (MBR)</h1>
            <p className="text-muted-foreground">
              Membrane Bioreactor system monitoring and management
            </p>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={exportToCSV}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button 
              variant="default" 
              size="sm"
            >
              <Users className="mr-2 h-4 w-4" />
              Assign Task
            </Button>
          </div>
        </div>
        
        <Tabs defaultValue="dashboard" value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="reports">Daily Reports</TabsTrigger>
            <TabsTrigger value="equipment">Equipment Health</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-4">
            <DashboardTabContent />
          </TabsContent>
          <TabsContent value="reports" className="space-y-4">
            <ReportsTabContent />
          </TabsContent>
          <TabsContent value="equipment" className="space-y-4">
            <EquipmentTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default STPBioreactorMBR;
