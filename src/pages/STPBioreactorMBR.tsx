
import React, { useState, useEffect, useMemo } from 'react';
import Layout from "@/components/layout/Layout";
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, Legend, ComposedChart, 
  PieChart, Pie, Cell, RadialBarChart, RadialBar, AreaChart, Area,
  ResponsiveContainer
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { OperatingParameter, ChartDataPoint } from "@/types/stp";
import { CalendarDays, ChevronDown, Download, FileSpreadsheet, Info, Users } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const STPBioreactorMBR = () => {
  // State for tracking UI
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const [selectedTimeRange, setSelectedTimeRange] = useState('ALL');
  const [selectedSection, setSelectedSection] = useState('capacity');
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [selectedDateRange, setSelectedDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [currentDate] = useState('March 14, 2025');
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
    document.title = 'MBR Bioreactor | Muscat Bay Asset Manager';
  }, []);
  
  // Monthly data derived from the STP log file
  const monthlyData = [
    {
      month: "Jul",
      tankerTrips: 442,
      tankerVolume: 8840,
      directSewage: 8055,
      totalInfluent: 16895,
      waterProcessed: 18308,
      tseIrrigation: 16067,
      capacity: 750 * 31,
      utilizationPercentage: ((16895 / (750 * 31)) * 100).toFixed(1),
      processingEfficiency: ((16067 / 16895) * 100).toFixed(1)
    },
    {
      month: "Aug",
      tankerTrips: 378,
      tankerVolume: 7560,
      directSewage: 8081,
      totalInfluent: 15641,
      waterProcessed: 17372,
      tseIrrigation: 15139,
      capacity: 750 * 31,
      utilizationPercentage: ((15641 / (750 * 31)) * 100).toFixed(1),
      processingEfficiency: ((15139 / 15641) * 100).toFixed(1)
    },
    {
      month: "Sep",
      tankerTrips: 283,
      tankerVolume: 5660,
      directSewage: 8146,
      totalInfluent: 13806,
      waterProcessed: 14859,
      tseIrrigation: 13196,
      capacity: 750 * 30,
      utilizationPercentage: ((13806 / (750 * 30)) * 100).toFixed(1),
      processingEfficiency: ((13196 / 13806) * 100).toFixed(1)
    },
    {
      month: "Oct",
      tankerTrips: 289,
      tankerVolume: 5780,
      directSewage: 10617,
      totalInfluent: 16397,
      waterProcessed: 17669,
      tseIrrigation: 15490,
      capacity: 750 * 31,
      utilizationPercentage: ((16397 / (750 * 31)) * 100).toFixed(1),
      processingEfficiency: ((15490 / 16397) * 100).toFixed(1)
    },
    {
      month: "Nov",
      tankerTrips: 235,
      tankerVolume: 4700,
      directSewage: 9840,
      totalInfluent: 14540,
      waterProcessed: 16488,
      tseIrrigation: 14006,
      capacity: 750 * 30,
      utilizationPercentage: ((14540 / (750 * 30)) * 100).toFixed(1),
      processingEfficiency: ((14006 / 14540) * 100).toFixed(1)
    },
    {
      month: "Dec",
      tankerTrips: 196,
      tankerVolume: 3920,
      directSewage: 11293,
      totalInfluent: 15213,
      waterProcessed: 17444,
      tseIrrigation: 14676,
      capacity: 750 * 31,
      utilizationPercentage: ((15213 / (750 * 31)) * 100).toFixed(1),
      processingEfficiency: ((14676 / 15213) * 100).toFixed(1)
    },
    {
      month: "Jan",
      tankerTrips: 207,
      tankerVolume: 4140,
      directSewage: 11583,
      totalInfluent: 15723,
      waterProcessed: 18212,
      tseIrrigation: 15433,
      capacity: 750 * 31,
      utilizationPercentage: ((15723 / (750 * 31)) * 100).toFixed(1),
      processingEfficiency: ((15433 / 15723) * 100).toFixed(1)
    },
    {
      month: "Feb",
      tankerTrips: 121,
      tankerVolume: 2420,
      directSewage: 10660,
      totalInfluent: 13080,
      waterProcessed: 14408,
      tseIrrigation: 12075,
      capacity: 750 * 29, // February 2025 has 29 days (leap year)
      utilizationPercentage: ((13080 / (750 * 29)) * 100).toFixed(1),
      processingEfficiency: ((12075 / 13080) * 100).toFixed(1)
    }
  ];

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
    
    const avgProcessingEfficiency = ((totalTSE / totalInfluent) * 100).toFixed(1);
    const totalCapacity = 750 * (31 + 31 + 30 + 31 + 30 + 31 + 31 + 29); // Days in each month
    const overallUtilization = ((totalInfluent / totalCapacity) * 100).toFixed(1);
    
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
  
  const totalMetrics = calculateTotalMetrics();

  // Recent data based on daily logs
  const recentData = [
    { date: "Mar 8", tankerTrips: 6, tankerVolume: 120, directSewage: 450, totalInfluent: 570, waterProcessed: 617, tseIrrigation: 531 },
    { date: "Mar 9", tankerTrips: 4, tankerVolume: 80, directSewage: 388, totalInfluent: 468, waterProcessed: 607, tseIrrigation: 521 },
    { date: "Mar 10", tankerTrips: 6, tankerVolume: 120, directSewage: 480, totalInfluent: 600, waterProcessed: 610, tseIrrigation: 524 },
    { date: "Mar 11", tankerTrips: 3, tankerVolume: 60, directSewage: 476, totalInfluent: 536, waterProcessed: 607, tseIrrigation: 511 },
    { date: "Mar 12", tankerTrips: 6, tankerVolume: 120, directSewage: 391, totalInfluent: 511, waterProcessed: 601, tseIrrigation: 509 },
    { date: "Mar 13", tankerTrips: 8, tankerVolume: 160, directSewage: 437, totalInfluent: 597, waterProcessed: 621, tseIrrigation: 533 },
    { date: "Mar 14", tankerTrips: 5, tankerVolume: 100, directSewage: 428, totalInfluent: 528, waterProcessed: 596, tseIrrigation: 508 }
  ];

  // Calculate recent metrics
  const calculateRecentMetrics = () => {
    let sumInfluent = 0;
    let sumProcessed = 0;
    let sumTSE = 0;
    
    recentData.forEach(day => {
      sumInfluent += day.totalInfluent;
      sumProcessed += day.waterProcessed;
      sumTSE += day.tseIrrigation;
    });
    
    const avgDailyInfluent = sumInfluent / recentData.length;
    const avgCapacityUsage = (avgDailyInfluent / 750 * 100).toFixed(1);
    const processingEfficiency = (sumTSE / sumInfluent * 100).toFixed(1);
    
    return {
      avgDailyInfluent: Math.round(avgDailyInfluent),
      avgCapacityUsage,
      processingEfficiency
    };
  };
  
  const recentMetrics = calculateRecentMetrics();

  // Influent source distribution data
  const influentSourceData = [
    { name: 'Tanker Delivery', value: totalMetrics.totalTankerVolume },
    { name: 'Direct Sewage', value: totalMetrics.totalDirectSewage }
  ];
  
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
  
  // Filter data based on selected time range
  const getFilteredData = useMemo(() => {
    // For daily data (recent data)
    const getFilteredRecentData = () => {
      const today = new Date('2025-03-14');
      
      switch(selectedTimeRange) {
        case '1D':
          return recentData.slice(-1);
        case '7D':
          return recentData;
        case '1M':
          // Simulating a month of data by returning all available
          return recentData;
        case '3M':
        case 'ALL':
        default:
          return recentData;
      }
    };
    
    // For monthly data
    const getFilteredMonthlyData = () => {
      if (selectedMonth !== 'All') {
        return monthlyData.filter(data => data.month === selectedMonth);
      }
      
      switch(selectedTimeRange) {
        case '3M':
          // Return last 3 months
          return monthlyData.slice(-3);
        case 'ALL':
        default:
          return monthlyData;
      }
    };
    
    return {
      recentData: getFilteredRecentData(),
      monthlyData: getFilteredMonthlyData()
    };
  }, [selectedTimeRange, selectedMonth]);
  
  // Calculate metrics based on filtered data
  const filteredMetrics = useMemo(() => {
    const filteredMonthlyData = getFilteredData.monthlyData;
    const filteredRecentData = getFilteredData.recentData;
    
    // Calculate totals from filtered monthly data
    let totalInfluent = 0;
    let totalProcessed = 0;
    let totalTSE = 0;
    let totalTankerVolume = 0;
    let totalDirectSewage = 0;
    let totalTankerTrips = 0;
    
    filteredMonthlyData.forEach(month => {
      totalInfluent += month.totalInfluent;
      totalProcessed += month.waterProcessed;
      totalTSE += month.tseIrrigation;
      totalTankerVolume += month.tankerVolume;
      totalDirectSewage += month.directSewage;
      totalTankerTrips += month.tankerTrips;
    });
    
    const avgProcessingEfficiency = ((totalTSE / totalInfluent) * 100).toFixed(1);
    
    // Calculate recent metrics from filtered recent data
    let sumRecentInfluent = 0;
    let sumRecentProcessed = 0;
    let sumRecentTSE = 0;
    
    filteredRecentData.forEach(day => {
      sumRecentInfluent += day.totalInfluent;
      sumRecentProcessed += day.waterProcessed;
      sumRecentTSE += day.tseIrrigation;
    });
    
    const avgDailyInfluent = filteredRecentData.length > 0 ? sumRecentInfluent / filteredRecentData.length : 0;
    const avgCapacityUsage = avgDailyInfluent > 0 ? (avgDailyInfluent / 750 * 100).toFixed(1) : '0.0';
    const recentProcessingEfficiency = sumRecentInfluent > 0 ? (sumRecentTSE / sumRecentInfluent * 100).toFixed(1) : '0.0';
    
    return {
      monthly: {
        totalInfluent,
        totalProcessed,
        totalTSE,
        avgProcessingEfficiency,
        totalTankerVolume,
        totalDirectSewage,
        totalTankerTrips
      },
      recent: {
        avgDailyInfluent: Math.round(avgDailyInfluent),
        avgCapacityUsage,
        processingEfficiency: recentProcessingEfficiency
      },
      influentSourceData: [
        { name: 'Tanker Delivery', value: totalTankerVolume },
        { name: 'Direct Sewage', value: totalDirectSewage }
      ]
    };
  }, [getFilteredData]);

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
        Object.keys(monthlyDataCSV[0]).join(",") + "\n" +
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
                <p className="text-3xl font-bold text-foreground">{filteredMetrics.recent.avgDailyInfluent}</p>
                <p className="ml-2 text-muted-foreground mb-1">m³/day</p>
              </div>
              <div className="mt-4 h-10">
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-green-600">{filteredMetrics.recent.avgCapacityUsage}%</span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-medium text-muted-foreground">750 m³/day capacity</span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 flex rounded bg-muted">
                    <div 
                      style={{ width: `${filteredMetrics.recent.avgCapacityUsage}%` }} 
                      className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center ${
                        parseFloat(filteredMetrics.recent.avgCapacityUsage) > 85 ? 'bg-orange-500' : 
                        parseFloat(filteredMetrics.recent.avgCapacityUsage) > 70 ? 'bg-yellow-500' : 'bg-green-500'
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
                <p className="text-3xl font-bold text-foreground">{filteredMetrics.recent.processingEfficiency}%</p>
                <p className="ml-2 text-muted-foreground mb-1">TSE/Influent</p>
              </div>
              <div className="mt-4 flex items-center">
                <div className="w-full bg-muted rounded-full h-2.5">
                  <div 
                    className="bg-green-600 h-2.5 rounded-full" 
                    style={{ width: `${filteredMetrics.recent.processingEfficiency}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm hover:shadow transition-all">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-center">
                <CardTitle className="text-sm font-medium text-muted-foreground">8-Month Volume</CardTitle>
                <Badge variant="secondary">Complete</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-end">
                <p className="text-3xl font-bold text-foreground">{(filteredMetrics.monthly.totalInfluent/1000).toFixed(1)}K</p>
                <p className="ml-2 text-muted-foreground mb-1">m³ total</p>
              </div>
              <div className="mt-4 flex items-center text-xs text-muted-foreground">
                <div className="flex items-center mr-4">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mr-1"></div>
                  <span>Tanker: {(filteredMetrics.monthly.totalTankerVolume/1000).toFixed(1)}K m³</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
                  <span>Direct: {(filteredMetrics.monthly.totalDirectSewage/1000).toFixed(1)}K m³</span>
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
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(e.target.value)} 
                    className="text-xs border rounded-md px-2 py-1 text-foreground bg-background"
                  >
                    <option value="All">All Months</option>
                    {monthlyData.map(month => (
                      <option key={month.month} value={month.month}>{month.month}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  {selectedSection === 'capacity' ? (
                    <ComposedChart data={getFilteredData.monthlyData}>
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
                    <ComposedChart data={getFilteredData.monthlyData}>
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
                        domain={[90, 100]}
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
                      data={getFilteredData.monthlyData}
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
                        {filteredMetrics.recent.avgCapacityUsage}%
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
                        data={filteredMetrics.influentSourceData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {filteredMetrics.influentSourceData.map((entry, index) => (
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
                      {((filteredMetrics.monthly.totalTankerVolume / 
                        (filteredMetrics.monthly.totalTankerVolume + filteredMetrics.monthly.totalDirectSewage)) * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                    <span>Direct Sewage:
                      {((filteredMetrics.monthly.totalDirectSewage / 
                        (filteredMetrics.monthly.totalTankerVolume + filteredMetrics.monthly.totalDirectSewage)) * 100).toFixed(1)}%
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

        {/* Filtration Controls */}
        <div className="flex flex-wrap gap-2 justify-between items-center">
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
          
          <div className="flex items-center space-x-1">
            <span className="text-xs text-muted-foreground">Current Date:</span>
            <Badge variant="outline" className="ml-1">
              <CalendarDays className="h-3 w-3 mr-1" />
              {currentDate}
            </Badge>
          </div>
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
                <Badge variant="success">Optimal</Badge>
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
                <Badge variant="success">Running</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Recirc Pump P-102</span>
                <Badge variant="success">Running</Badge>
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
                <Badge variant="success">Running</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Blower B-102</span>
                <Badge variant="secondary">Standby</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Diffuser Status</span>
                <Badge variant="success">Normal</Badge>
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

  // Reports Tab Content
  const ReportsTabContent = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-medium">STP Reports & Documentation</h2>
        <div className="flex space-x-2">
          <select className="text-xs border rounded-md px-2 py-1 bg-background">
            <option value="all">All Reports</option>
            <option value="operation">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="regulatory">Regulatory</option>
          </select>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Performance Reports</CardTitle>
          <CardDescription>STP operation performance reports</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th scope="col" className="px-6 py-3">Report Name</th>
                  <th scope="col" className="px-6 py-3">Period</th>
                  <th scope="col" className="px-6 py-3">Created Date</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-6 py-4">STP Performance Report</td>
                  <td className="px-6 py-4">February 2025</td>
                  <td className="px-6 py-4">Mar 05, 2025</td>
                  <td className="px-6 py-4"><Badge variant="success">Approved</Badge></td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4">STP Performance Report</td>
                  <td className="px-6 py-4">January 2025</td>
                  <td className="px-6 py-4">Feb 04, 2025</td>
                  <td className="px-6 py-4"><Badge variant="success">Approved</Badge></td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4">STP Performance Report</td>
                  <td className="px-6 py-4">December 2024</td>
                  <td className="px-6 py-4">Jan 07, 2025</td>
                  <td className="px-6 py-4"><Badge variant="success">Approved</Badge></td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-6 py-4">STP Performance Report</td>
                  <td className="px-6 py-4">November 2024</td>
                  <td className="px-6 py-4">Dec 05, 2024</td>
                  <td className="px-6 py-4"><Badge variant="success">Approved</Badge></td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Regulatory Compliance</CardTitle>
            <CardDescription>Environmental compliance reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Report Type</th>
                    <th scope="col" className="px-4 py-3">Date</th>
                    <th scope="col" className="px-4 py-3">Status</th>
                    <th scope="col" className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3">Quarterly Water Quality</td>
                    <td className="px-4 py-3">Jan-Mar 2025</td>
                    <td className="px-4 py-3"><Badge variant="success">Compliant</Badge></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">TSE Reuse Permit</td>
                    <td className="px-4 py-3">Feb 10, 2025</td>
                    <td className="px-4 py-3"><Badge variant="success">Active</Badge></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">Environmental Audit</td>
                    <td className="px-4 py-3">Dec 15, 2024</td>
                    <td className="px-4 py-3"><Badge variant="success">Passed</Badge></td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Maintenance Records</CardTitle>
            <CardDescription>Equipment maintenance history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="relative overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs uppercase bg-muted/50">
                  <tr>
                    <th scope="col" className="px-4 py-3">Equipment</th>
                    <th scope="col" className="px-4 py-3">Task</th>
                    <th scope="col" className="px-4 py-3">Date</th>
                    <th scope="col" className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="px-4 py-3">MBR System</td>
                    <td className="px-4 py-3">Membrane CIP</td>
                    <td className="px-4 py-3">Feb 14, 2025</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">Feed Pump P-101</td>
                    <td className="px-4 py-3">Bearing Replacement</td>
                    <td className="px-4 py-3">Jan 25, 2025</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">Blower B-102</td>
                    <td className="px-4 py-3">Overhaul</td>
                    <td className="px-4 py-3">Jan 15, 2025</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="px-4 py-3">Diffusers</td>
                    <td className="px-4 py-3">Cleaning</td>
                    <td className="px-4 py-3">Jan 22, 2025</td>
                    <td className="px-4 py-3">
                      <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
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
            <TabsTrigger value="equipment">Equipment Health</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
          </TabsList>
          <TabsContent value="dashboard" className="space-y-4">
            <DashboardTabContent />
          </TabsContent>
          <TabsContent value="equipment" className="space-y-4">
            <EquipmentTabContent />
          </TabsContent>
          <TabsContent value="reports" className="space-y-4">
            <ReportsTabContent />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default STPBioreactorMBR;
