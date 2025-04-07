
import React, { useState, useEffect } from 'react';
import {
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  LineChart, 
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';
import { 
  DropletIcon, 
  Download, 
  TrendingUp, 
  TrendingDown, 
  CalendarRange,
  Building,
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  AreaChart as AreaChartIcon,
  ChevronLeft,
  Search,
  Filter,
  DropletIcon01
} from 'lucide-react';
import StandardPageLayout from '@/components/layout/StandardPageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Define types
interface WaterMeter {
  id: string;
  label: string;
  location: string;
  zone: string;
  type: string;
  acctNum: string;
}

interface WaterReading {
  meterId: string;
  date: string;
  reading: number;
  consumption: number;
}

interface WaterAccount {
  acctNum: string;
  meterLabel: string;
  zone: string;
  type: string;
  consumption: Record<string, number>;
}

interface WaterReport {
  date: string;
  l2Reading: number;
  l3Sum: number;
  loss: number;
  lossPercent: number;
}

// Mock data
const waterMeters: WaterMeter[] = [
  { id: 'L2-001', label: 'Main Meter', location: 'Main Inlet', zone: 'Master', type: 'Master', acctNum: 'MB-MAIN-001' },
  { id: 'L3-Z3-001', label: 'Zone 3 Meter', location: 'Zone 3 Inlet', zone: 'Zone 3', type: 'Zone', acctNum: 'MB-Z3-001' },
  { id: 'L3-Z5-001', label: 'Zone 5 Meter', location: 'Zone 5 Inlet', zone: 'Zone 5', type: 'Zone', acctNum: 'MB-Z5-001' },
  { id: 'L3-Z8-001', label: 'Zone 8 Meter', location: 'Zone 8 Inlet', zone: 'Zone 8', type: 'Zone', acctNum: 'MB-Z8-001' },
  { id: 'L3-SA-001', label: 'Staff Acc. Meter', location: 'Staff Housing Inlet', zone: 'Staff', type: 'Zone', acctNum: 'MB-SA-001' },
  { id: 'L3-COM-001', label: 'Commercial Meter', location: 'Commercial Zone Inlet', zone: 'Commercial', type: 'Zone', acctNum: 'MB-COM-001' },
  { id: 'L4-Z3-101', label: 'Villa Z3-101', location: 'Zone 3', zone: 'Zone 3', type: 'Villa', acctNum: 'MB-Z3-V101' },
  { id: 'L4-Z3-102', label: 'Villa Z3-102', location: 'Zone 3', zone: 'Zone 3', type: 'Villa', acctNum: 'MB-Z3-V102' },
  { id: 'L4-Z5-101', label: 'Villa Z5-101', location: 'Zone 5', zone: 'Zone 5', type: 'Villa', acctNum: 'MB-Z5-V101' },
  { id: 'L4-Z8-101', label: 'Villa Z8-101', location: 'Zone 8', zone: 'Zone 8', type: 'Villa', acctNum: 'MB-Z8-V101' },
];

const waterAccounts: WaterAccount[] = [
  { 
    acctNum: 'MB-MAIN-001', 
    meterLabel: 'Main Meter', 
    zone: 'Master', 
    type: 'Master',
    consumption: { 'Mar-24': 124500, 'Apr-24': 126800, 'May-24': 135200, 'Jun-24': 145800, 'Jul-24': 152400, 'Aug-24': 158900 } 
  },
  { 
    acctNum: 'MB-Z3-001', 
    meterLabel: 'Zone 3 Meter', 
    zone: 'Zone 3', 
    type: 'Zone',
    consumption: { 'Mar-24': 45200, 'Apr-24': 46500, 'May-24': 49300, 'Jun-24': 53100, 'Jul-24': 55400, 'Aug-24': 58200 } 
  },
  { 
    acctNum: 'MB-Z5-001', 
    meterLabel: 'Zone 5 Meter', 
    zone: 'Zone 5', 
    type: 'Zone',
    consumption: { 'Mar-24': 38700, 'Apr-24': 39400, 'May-24': 42100, 'Jun-24': 45300, 'Jul-24': 47200, 'Aug-24': 49600 } 
  },
  { 
    acctNum: 'MB-Z8-001', 
    meterLabel: 'Zone 8 Meter', 
    zone: 'Zone 8', 
    type: 'Zone',
    consumption: { 'Mar-24': 22300, 'Apr-24': 22800, 'May-24': 24200, 'Jun-24': 26100, 'Jul-24': 27300, 'Aug-24': 28500 } 
  },
  { 
    acctNum: 'MB-SA-001', 
    meterLabel: 'Staff Acc. Meter', 
    zone: 'Staff', 
    type: 'Zone',
    consumption: { 'Mar-24': 8500, 'Apr-24': 8700, 'May-24': 9200, 'Jun-24': 9800, 'Jul-24': 10300, 'Aug-24': 10700 } 
  },
  { 
    acctNum: 'MB-COM-001', 
    meterLabel: 'Commercial Meter', 
    zone: 'Commercial', 
    type: 'Zone',
    consumption: { 'Mar-24': 5300, 'Apr-24': 5400, 'May-24': 5800, 'Jun-24': 6200, 'Jul-24': 6500, 'Aug-24': 6800 } 
  },
];

const waterReports: WaterReport[] = [
  { date: 'Mar-24', l2Reading: 124500, l3Sum: 120000, loss: 4500, lossPercent: 3.6 },
  { date: 'Apr-24', l2Reading: 126800, l3Sum: 122800, loss: 4000, lossPercent: 3.2 },
  { date: 'May-24', l2Reading: 135200, l3Sum: 130600, loss: 4600, lossPercent: 3.4 },
  { date: 'Jun-24', l2Reading: 145800, l3Sum: 140500, loss: 5300, lossPercent: 3.6 },
  { date: 'Jul-24', l2Reading: 152400, l3Sum: 146700, loss: 5700, lossPercent: 3.7 },
  { date: 'Aug-24', l2Reading: 158900, l3Sum: 153800, loss: 5100, lossPercent: 3.2 },
];

const COLORS = ['#68D1CC', '#9D8EB7', '#D4B98C', '#4E4456', '#FF6B6B'];

const WaterSystem = () => {
  const { toast } = useToast();
  const [selectedMonth, setSelectedMonth] = useState<string>("Aug-24");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const allMonths = [
    { value: 'Mar-24', label: 'March 2024' },
    { value: 'Apr-24', label: 'April 2024' },
    { value: 'May-24', label: 'May 2024' },
    { value: 'Jun-24', label: 'June 2024' },
    { value: 'Jul-24', label: 'July 2024' },
    { value: 'Aug-24', label: 'August 2024' },
  ];

  // Filter accounts and calculate zone consumption data
  const getZoneConsumptionData = React.useMemo(() => {
    // Get zone-level accounts only
    const zoneAccounts = waterAccounts.filter(account => account.type === 'Zone');
    
    // Map to data format needed for charts
    return zoneAccounts.map(account => ({
      name: account.zone,
      value: account.consumption[selectedMonth] || 0,
      color: account.zone === 'Zone 3' ? COLORS[0] : 
            account.zone === 'Zone 5' ? COLORS[1] :
            account.zone === 'Zone 8' ? COLORS[2] :
            account.zone === 'Staff' ? COLORS[3] : COLORS[4]
    }));
  }, [selectedMonth]);
  
  // Get current report
  const currentReport = waterReports.find(report => report.date === selectedMonth);
  
  // Get trend data for charts
  const getTrendData = () => {
    return waterReports.map(report => ({
      month: report.date,
      consumption: report.l2Reading,
      loss: report.loss,
      lossPercent: report.lossPercent
    }));
  };
  
  const trendData = getTrendData();
  
  // Calculate water loss status/color
  const getLossStatusColor = (lossPercent: number) => {
    if (lossPercent < 3) return 'text-green-500';
    if (lossPercent < 4) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getLossStatus = (lossPercent: number) => {
    if (lossPercent < 3) return 'Good';
    if (lossPercent < 4) return 'Fair';
    return 'Poor';
  };
  
  const lossPercentColor = currentReport ? getLossStatusColor(currentReport.lossPercent) : 'text-gray-500';
  const lossStatus = currentReport ? getLossStatus(currentReport.lossPercent) : 'Unknown';
  
  const handleMonthChange = (month: string) => {
    setSelectedMonth(month);
    toast({
      title: "Month updated",
      description: `Water system data updated for ${month}`,
    });
  };
  
  const handleExport = () => {
    toast({
      title: "Export started",
      description: "Your data is being exported to Excel",
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <DropletIcon className="w-12 h-12 mx-auto mb-4 text-muscat-teal animate-pulse" />
            <h2 className="text-xl font-medium text-muscat-primary">Loading Water System Dashboard...</h2>
          </div>
        </div>
      </div>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="border-muscat-teal/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-muscat-light">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muscat-primary">Total Consumption</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="text-2xl font-bold text-muscat-dark">
                    {currentReport?.l2Reading.toLocaleString()} m³
                  </div>
                  <p className="text-xs text-muscat-primary/70 mt-1">
                    Main meter reading for {allMonths.find(m => m.value === selectedMonth)?.label}
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-muscat-teal/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-muscat-light">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muscat-primary">Zone Consumption</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="text-2xl font-bold text-muscat-dark">
                    {currentReport?.l3Sum.toLocaleString()} m³
                  </div>
                  <p className="text-xs text-muscat-primary/70 mt-1">
                    Sum of all zone meters
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-muscat-teal/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-muscat-light">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muscat-primary">Water Loss</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className="text-2xl font-bold text-muscat-dark">
                    {currentReport?.loss.toLocaleString()} m³
                  </div>
                  <p className="text-xs text-muscat-primary/70 mt-1">
                    Difference between main meter and zone meters
                  </p>
                </CardContent>
              </Card>
              
              <Card className="border-muscat-teal/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-white to-muscat-light">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-medium text-muscat-primary">Loss Percentage</CardTitle>
                </CardHeader>
                <CardContent className="p-4 pt-1">
                  <div className={`text-2xl font-bold ${lossPercentColor}`}>
                    {currentReport?.lossPercent.toFixed(1)}%
                  </div>
                  <p className="text-xs text-muscat-primary/70 mt-1">
                    Status: <span className={lossPercentColor}>{lossStatus}</span>
                  </p>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-muscat-primary/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardHeader className="bg-muscat-primary text-white rounded-t-lg">
                  <CardTitle>Zone Distribution</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getZoneConsumptionData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {getZoneConsumptionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number) => [`${value.toLocaleString()} m³`, 'Consumption']}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-muscat-primary/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
                <CardHeader className="bg-muscat-primary text-white rounded-t-lg">
                  <CardTitle>Monthly Consumption</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={trendData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis 
                          tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                          label={{ value: 'm³', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip 
                          formatter={(value: number) => [value.toLocaleString() + ' m³', 'Consumption']}
                        />
                        <Legend />
                        <Bar 
                          dataKey="consumption" 
                          fill="#68D1CC" 
                          name="Total Consumption"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="border-muscat-primary/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
              <CardHeader className="bg-muscat-primary text-white rounded-t-lg">
                <CardTitle>Water Loss Trend</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart 
                      data={trendData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="month" />
                      <YAxis 
                        yAxisId="left"
                        tickFormatter={(value) => `${value.toFixed(1)}%`}
                        domain={[0, 5]}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        tickFormatter={(value) => `${(value/1000).toFixed(0)}k`}
                        domain={['dataMin - 1000', 'dataMax + 1000']}
                      />
                      <Tooltip 
                        formatter={(value: number, name) => {
                          if (name === 'lossPercent') return [`${value.toFixed(1)}%`, 'Loss Percentage'];
                          return [`${value.toLocaleString()} m³`, name === 'loss' ? 'Water Loss' : 'Consumption'];
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="lossPercent" 
                        stroke="#FF6B6B" 
                        strokeWidth={2} 
                        yAxisId="left"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Loss Percentage"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="loss" 
                        stroke="#9D8EB7" 
                        strokeWidth={2} 
                        yAxisId="right"
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                        name="Water Loss"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-muscat-primary/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
              <CardHeader className="bg-muscat-primary text-white rounded-t-lg">
                <CardTitle>Monthly Report</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableHeader className="bg-muscat-primary/5 sticky top-0">
                      <TableRow>
                        <TableHead className="font-semibold text-muscat-primary">Month</TableHead>
                        <TableHead className="font-semibold text-muscat-primary">Main Meter (m³)</TableHead>
                        <TableHead className="font-semibold text-muscat-primary">Zones Sum (m³)</TableHead>
                        <TableHead className="font-semibold text-muscat-primary">Water Loss (m³)</TableHead>
                        <TableHead className="font-semibold text-muscat-primary">Loss %</TableHead>
                        <TableHead className="font-semibold text-muscat-primary">Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {waterReports.map((report) => {
                        const statusColor = getLossStatusColor(report.lossPercent);
                        const status = getLossStatus(report.lossPercent);
                        
                        return (
                          <TableRow key={report.date} className="hover:bg-muscat-light transition-colors">
                            <TableCell className="font-medium">{
                              allMonths.find(m => m.value === report.date)?.label || report.date
                            }</TableCell>
                            <TableCell>{report.l2Reading.toLocaleString()}</TableCell>
                            <TableCell>{report.l3Sum.toLocaleString()}</TableCell>
                            <TableCell>{report.loss.toLocaleString()}</TableCell>
                            <TableCell className={statusColor}>{report.lossPercent.toFixed(1)}%</TableCell>
                            <TableCell>
                              <Badge className={`
                                ${status === 'Good' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                                  status === 'Fair' ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 
                                  'bg-red-100 text-red-800 hover:bg-red-200'}
                              `}>
                                {status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        );
        
      case 'meters':
        return (
          <Card className="border-muscat-primary/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
            <CardHeader className="bg-muscat-primary text-white rounded-t-lg">
              <CardTitle>Water Meters</CardTitle>
              <CardDescription className="text-white/80">All water meters in the system</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader className="bg-muscat-primary/5 sticky top-0">
                    <TableRow>
                      <TableHead className="font-semibold text-muscat-primary">Meter ID</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Label</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Location</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Zone</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Type</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Account</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waterMeters.map((meter) => (
                      <TableRow key={meter.id} className="hover:bg-muscat-light transition-colors">
                        <TableCell className="font-medium">{meter.id}</TableCell>
                        <TableCell>{meter.label}</TableCell>
                        <TableCell>{meter.location}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muscat-primary/10 text-muscat-primary border-muscat-primary/20">
                            {meter.zone}
                          </Badge>
                        </TableCell>
                        <TableCell>{meter.type}</TableCell>
                        <TableCell>{meter.acctNum}</TableCell>
                        <TableCell>
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            Active
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        );
        
      case 'accounts':
        return (
          <Card className="border-muscat-primary/20 shadow-md hover:shadow-lg transition-shadow duration-300 bg-white">
            <CardHeader className="bg-muscat-primary text-white rounded-t-lg">
              <CardTitle>Water Accounts</CardTitle>
              <CardDescription className="text-white/80">Water consumption by account</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader className="bg-muscat-primary/5 sticky top-0">
                    <TableRow>
                      <TableHead className="font-semibold text-muscat-primary">Account</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Meter</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Zone</TableHead>
                      <TableHead className="font-semibold text-muscat-primary">Type</TableHead>
                      <TableHead className="font-semibold text-muscat-primary text-right">
                        {allMonths.find(m => m.value === selectedMonth)?.label || selectedMonth} (m³)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {waterAccounts.map((account) => (
                      <TableRow key={account.acctNum} className="hover:bg-muscat-light transition-colors">
                        <TableCell className="font-medium">{account.acctNum}</TableCell>
                        <TableCell>{account.meterLabel}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-muscat-primary/10 text-muscat-primary border-muscat-primary/20">
                            {account.zone}
                          </Badge>
                        </TableCell>
                        <TableCell>{account.type}</TableCell>
                        <TableCell className="text-right">
                          {(account.consumption[selectedMonth] || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        );
        
      default:
        return null;
    }
  };

  return (
    <StandardPageLayout
      title="Water System Dashboard"
      description="Track and analyze water consumption, distribution, and network efficiency"
      icon={<DropletIcon className="h-6 w-6 text-muscat-teal" />}
    >
      <div className="grid grid-cols-1 gap-6">
        {/* Filters Section */}
        <Card className="border-muscat-primary/20 shadow-md bg-white">
          <CardHeader className="pb-2 bg-muscat-primary text-white rounded-t-lg">
            <CardTitle className="text-lg font-medium">Filters & Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 p-6">
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="month" className="font-medium text-muscat-dark">Month</Label>
                <Select
                  value={selectedMonth}
                  onValueChange={handleMonthChange}
                >
                  <SelectTrigger className="w-[180px] border-muscat-primary/30 focus:ring-muscat-primary/20">
                    <SelectValue placeholder="Select Month" />
                  </SelectTrigger>
                  <SelectContent>
                    {allMonths.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="ml-auto">
                <Button onClick={handleExport} className="bg-muscat-teal hover:bg-muscat-teal/90 text-white">
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tabs */}
        <Card className="shadow-md overflow-hidden">
          <Tabs 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="bg-muscat-primary text-white px-6 py-3">
              <TabsList className="grid w-full grid-cols-3 bg-muscat-primary/30">
                <TabsTrigger 
                  value="overview" 
                  className="data-[state=active]:bg-white data-[state=active]:text-muscat-primary"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger 
                  value="meters" 
                  className="data-[state=active]:bg-white data-[state=active]:text-muscat-primary"
                >
                  Meters
                </TabsTrigger>
                <TabsTrigger 
                  value="accounts" 
                  className="data-[state=active]:bg-white data-[state=active]:text-muscat-primary"
                >
                  Accounts
                </TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="overview" className="p-6 m-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
            
            <TabsContent value="meters" className="p-6 m-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key="meters"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
            
            <TabsContent value="accounts" className="p-6 m-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key="accounts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </StandardPageLayout>
  );
};

export default WaterSystem;
