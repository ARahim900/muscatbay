
import React, { useEffect, useState, useMemo } from 'react';
import Layout from '@/components/layout/Layout';
import { stpDailyData, stpMonthlyData, formatMonth, calculateEfficiencyStats, formatDate } from '@/utils/stpDataUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, differenceInDays } from 'date-fns';
import { STPDailyData } from '@/types/stp';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  Scatter, ComposedChart, ScatterChart, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  Area, ZAxis 
} from 'recharts';
import { BarChart2, CalendarRange, DropletIcon, FlaskConical, PieChart as PieChartIcon, LineChart as LineChartIcon, Sigma, TrendingUp } from 'lucide-react';

const STPAnalytics = () => {
  const [dateRange, setDateRange] = useState<[Date | undefined, Date | undefined]>([
    new Date(stpDailyData[0].date),
    new Date(stpDailyData[stpDailyData.length - 1].date)
  ]);
  const [comparisonRange, setComparisonRange] = useState<[Date | undefined, Date | undefined]>([undefined, undefined]);
  const [chartType, setChartType] = useState<'volume' | 'efficiency' | 'source' | 'correlation'>('volume');

  useEffect(() => {
    document.title = 'STP Analytics | Muscat Bay Asset Manager';
  }, []);

  const filteredData = useMemo(() => {
    if (!dateRange[0] || !dateRange[1]) return stpDailyData;
    
    return stpDailyData.filter(day => {
      const date = new Date(day.date);
      return date >= dateRange[0]! && date <= dateRange[1]!;
    });
  }, [dateRange]);

  const comparisonData = useMemo(() => {
    if (!comparisonRange[0] || !comparisonRange[1]) return [];
    
    return stpDailyData.filter(day => {
      const date = new Date(day.date);
      return date >= comparisonRange[0]! && date <= comparisonRange[1]!;
    });
  }, [comparisonRange]);

  const statsData = useMemo(() => {
    const currentStats = calculateEfficiencyStats(filteredData);
    const comparisonStats = comparisonRange[0] && comparisonRange[1] ? 
      calculateEfficiencyStats(comparisonData) : null;
    
    return { currentStats, comparisonStats };
  }, [filteredData, comparisonData, comparisonRange]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const getPieData = () => {
    const totalInfluent = filteredData.reduce((sum, day) => sum + day.totalInfluent, 0);
    const totalTankers = filteredData.reduce((sum, day) => sum + day.expectedVolumeTankers, 0);
    const totalDirect = filteredData.reduce((sum, day) => sum + day.directSewageMB, 0);
    const otherSources = totalInfluent - totalTankers - totalDirect;
    
    return [
      { name: 'Tanker Deliveries', value: totalTankers },
      { name: 'Direct Sewage', value: totalDirect },
      { name: 'Other Sources', value: otherSources > 0 ? otherSources : 0 }
    ];
  };

  const getVolumeChartData = () => {
    return filteredData.map(day => ({
      date: formatDate(day.date),
      totalWaterProcessed: day.totalWaterProcessed,
      tseToIrrigation: day.tseToIrrigation,
      totalInfluent: day.totalInfluent,
      efficiency: (day.totalWaterProcessed / day.totalInfluent * 100).toFixed(1)
    }));
  };

  const getCorrelationData = () => {
    return filteredData.map(day => ({
      influent: day.totalInfluent,
      processed: day.totalWaterProcessed,
      tankerVolume: day.expectedVolumeTankers,
      directSewage: day.directSewageMB,
      efficiency: (day.totalWaterProcessed / day.totalInfluent * 100),
      irrigation: day.tseToIrrigation,
      date: formatDate(day.date)
    }));
  };

  const getMonthTotals = () => {
    const monthMap = new Map<string, {
      totalWaterProcessed: number,
      tseToIrrigation: number,
      totalInfluent: number,
      efficiency: number
    }>();
    
    filteredData.forEach(day => {
      const monthYear = day.date.substring(0, 7); // YYYY-MM
      const current = monthMap.get(monthYear) || {
        totalWaterProcessed: 0,
        tseToIrrigation: 0,
        totalInfluent: 0,
        efficiency: 0
      };
      
      current.totalWaterProcessed += day.totalWaterProcessed;
      current.tseToIrrigation += day.tseToIrrigation;
      current.totalInfluent += day.totalInfluent;
      
      monthMap.set(monthYear, current);
    });
    
    // Calculate efficiency for each month
    const result = Array.from(monthMap.entries()).map(([month, data]) => ({
      month: formatMonth(month),
      totalWaterProcessed: data.totalWaterProcessed,
      tseToIrrigation: data.tseToIrrigation,
      totalInfluent: data.totalInfluent,
      efficiency: (data.totalWaterProcessed / data.totalInfluent * 100).toFixed(1)
    }));
    
    return result;
  };

  const renderVolumeChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={getVolumeChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 40 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="date" 
          angle={-45} 
          textAnchor="end" 
          height={70} 
          interval={Math.floor(filteredData.length / 20)}
        />
        <YAxis yAxisId="left" />
        <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
        <Tooltip />
        <Legend />
        <Bar yAxisId="left" dataKey="totalInfluent" name="Total Influent" fill="#8884d8" />
        <Bar yAxisId="left" dataKey="totalWaterProcessed" name="Water Processed" fill="#82ca9d" />
        <Bar yAxisId="left" dataKey="tseToIrrigation" name="TSE to Irrigation" fill="#ffc658" />
        <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Efficiency %" stroke="#ff7300" />
      </ComposedChart>
    </ResponsiveContainer>
  );

  const renderEfficiencyChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={getMonthTotals()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="efficiency" name="Processing Efficiency %" stroke="#ff7300" activeDot={{ r: 8 }} />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderSourcesPieChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <PieChart>
        <Pie
          data={getPieData()}
          cx="50%"
          cy="50%"
          labelLine={true}
          outerRadius={150}
          fill="#8884d8"
          dataKey="value"
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
        >
          {getPieData().map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => [`${value.toLocaleString()} m³`, '']} />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderCorrelationChart = () => (
    <ResponsiveContainer width="100%" height={400}>
      <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          type="number" 
          dataKey="influent" 
          name="Total Influent" 
          unit=" m³" 
        />
        <YAxis 
          type="number" 
          dataKey="processed" 
          name="Water Processed" 
          unit=" m³" 
        />
        <ZAxis type="number" dataKey="efficiency" range={[20, 200]} name="Efficiency" unit="%" />
        <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(value, name) => [
          name === 'Efficiency' ? `${value}%` : `${value} m³`, 
          name
        ]} />
        <Legend />
        <Scatter 
          name="Processing Correlation" 
          data={getCorrelationData()} 
          fill="#8884d8"
          shape="circle"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );

  return (
    <Layout>
      <div className="container mx-auto py-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-muscat-primary flex items-center">
              <FlaskConical className="mr-2 h-6 w-6" />
              STP Analytics & Insights
            </h1>
            <p className="text-gray-500 mt-1">Advanced analytics and trend analysis for the STP plant operations</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Primary Analysis Period</CardTitle>
              <CardDescription>
                Select date range for analysis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {dateRange[0] && dateRange[1] ? (
                      `${format(dateRange[0], 'PPP')} - ${format(dateRange[1], 'PPP')}`
                    ) : (
                      "Select date range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: dateRange[0],
                      to: dateRange[1],
                    }}
                    onSelect={(selected) => {
                      setDateRange([selected?.from, selected?.to]);
                    }}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
              {dateRange[0] && dateRange[1] && (
                <div className="text-xs text-muted-foreground mt-2">
                  Period: {differenceInDays(dateRange[1], dateRange[0])} days
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Comparison Period (Optional)</CardTitle>
              <CardDescription>
                Select another period to compare
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left">
                    <CalendarRange className="mr-2 h-4 w-4" />
                    {comparisonRange[0] && comparisonRange[1] ? (
                      `${format(comparisonRange[0], 'PPP')} - ${format(comparisonRange[1], 'PPP')}`
                    ) : (
                      "Select comparison range"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{
                      from: comparisonRange[0],
                      to: comparisonRange[1],
                    }}
                    onSelect={(selected) => {
                      setComparisonRange([selected?.from, selected?.to]);
                    }}
                    className="rounded-md border"
                  />
                  <div className="p-3 border-t border-border/20">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => setComparisonRange([undefined, undefined])}
                      className="w-full"
                    >
                      Clear
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
              {comparisonRange[0] && comparisonRange[1] && (
                <div className="text-xs text-muted-foreground mt-2">
                  Period: {differenceInDays(comparisonRange[1], comparisonRange[0])} days
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">Summary Statistics</CardTitle>
              <CardDescription>
                Key performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="text-center p-2 rounded-md bg-slate-50">
                  <div className="text-xs text-muted-foreground">Processing Efficiency</div>
                  <div className="text-xl font-bold text-muscat-primary">
                    {(statsData.currentStats?.processingEfficiency || 0) * 100}%
                  </div>
                  {statsData.comparisonStats && (
                    <div className="text-xs text-muted-foreground">
                      vs {(statsData.comparisonStats.processingEfficiency || 0) * 100}%
                    </div>
                  )}
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50">
                  <div className="text-xs text-muted-foreground">Irrigation Usage</div>
                  <div className="text-xl font-bold text-green-600">
                    {(statsData.currentStats?.irrigationUtilization || 0) * 100}%
                  </div>
                  {statsData.comparisonStats && (
                    <div className="text-xs text-muted-foreground">
                      vs {(statsData.comparisonStats.irrigationUtilization || 0) * 100}%
                    </div>
                  )}
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50">
                  <div className="text-xs text-muted-foreground">Avg. Processed</div>
                  <div className="text-xl font-bold text-blue-600">
                    {Math.round(statsData.currentStats?.averageProcessingVolume || 0)} m³
                  </div>
                  {statsData.comparisonStats && (
                    <div className="text-xs text-muted-foreground">
                      vs {Math.round(statsData.comparisonStats.averageProcessingVolume || 0)} m³
                    </div>
                  )}
                </div>
                <div className="text-center p-2 rounded-md bg-slate-50">
                  <div className="text-xs text-muted-foreground">Avg. Influent</div>
                  <div className="text-xl font-bold text-purple-600">
                    {Math.round(statsData.currentStats?.averageInfluentVolume || 0)} m³
                  </div>
                  {statsData.comparisonStats && (
                    <div className="text-xs text-muted-foreground">
                      vs {Math.round(statsData.comparisonStats.averageInfluentVolume || 0)} m³
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <CardTitle>Advanced STP Analytics</CardTitle>
                  <CardDescription>
                    Detailed analytics for the selected time period
                  </CardDescription>
                </div>
                <div className="flex flex-wrap mt-4 sm:mt-0 gap-2">
                  <Button
                    size="sm"
                    variant={chartType === 'volume' ? 'default' : 'outline'}
                    onClick={() => setChartType('volume')}
                  >
                    <BarChart2 className="h-4 w-4 mr-1" />
                    Volumes
                  </Button>
                  <Button
                    size="sm"
                    variant={chartType === 'efficiency' ? 'default' : 'outline'}
                    onClick={() => setChartType('efficiency')}
                  >
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Efficiency
                  </Button>
                  <Button
                    size="sm"
                    variant={chartType === 'source' ? 'default' : 'outline'}
                    onClick={() => setChartType('source')}
                  >
                    <PieChartIcon className="h-4 w-4 mr-1" />
                    Sources
                  </Button>
                  <Button
                    size="sm"
                    variant={chartType === 'correlation' ? 'default' : 'outline'}
                    onClick={() => setChartType('correlation')}
                  >
                    <Sigma className="h-4 w-4 mr-1" />
                    Correlation
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {chartType === 'volume' && renderVolumeChart()}
              {chartType === 'efficiency' && renderEfficiencyChart()}
              {chartType === 'source' && renderSourcesPieChart()}
              {chartType === 'correlation' && renderCorrelationChart()}
            </CardContent>
            <CardFooter className="border-t pt-4">
              <div className="text-sm text-muted-foreground">
                Showing data from {dateRange[0] ? format(dateRange[0], 'PPP') : 'beginning'} to {dateRange[1] ? format(dateRange[1], 'PPP') : 'end'}
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default STPAnalytics;
