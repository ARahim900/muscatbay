
import React, { useMemo, useState } from 'react';
import { getDailyDataForMonth, formatMonth, formatDate, findMetricExtremes, calculateEfficiencyStats } from '@/utils/stpDataUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart, Scatter } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from 'date-fns';
import { CalendarIcon, TrendingUp, TrendingDown, BarChart2, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';

interface STPDailyDetailsProps {
  selectedMonth: string;
}

type ChartType = 'line' | 'bar' | 'area' | 'composed';
type MetricType = 'totalWaterProcessed' | 'tseToIrrigation' | 'directSewageMB' | 'expectedVolumeTankers' | 'tankerTrips';

export const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ selectedMonth }) => {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [selectedMetrics, setSelectedMetrics] = useState<MetricType[]>(['totalWaterProcessed', 'tseToIrrigation']);
  const [dateRange, setDateRange] = useState<[Date | undefined, Date | undefined]>([undefined, undefined]);
  const [searchText, setSearchText] = useState('');
  
  const dailyData = useMemo(() => getDailyDataForMonth(selectedMonth), [selectedMonth]);
  
  const filteredData = useMemo(() => {
    let filtered = [...dailyData];
    
    // Apply date range filter if both dates are selected
    if (dateRange[0] && dateRange[1]) {
      filtered = filtered.filter(item => {
        const date = new Date(item.date);
        return date >= dateRange[0]! && date <= dateRange[1]!;
      });
    }
    
    // Apply search filter
    if (searchText) {
      filtered = filtered.filter(item => 
        item.date.includes(searchText) || 
        item.totalWaterProcessed.toString().includes(searchText) ||
        item.tseToIrrigation.toString().includes(searchText)
      );
    }
    
    return filtered;
  }, [dailyData, dateRange, searchText]);

  // Format data for charts
  const chartData = useMemo(() => 
    filteredData.map(day => ({
      name: day.date.split('-')[2], // Just the day number
      date: formatDate(day.date),
      totalWaterProcessed: day.totalWaterProcessed,
      tseToIrrigation: day.tseToIrrigation,
      directSewageMB: day.directSewageMB,
      expectedVolumeTankers: day.expectedVolumeTankers,
      tankerTrips: day.tankerTrips,
      efficiency: (day.totalWaterProcessed / day.totalInfluent * 100).toFixed(1)
    }))
  , [filteredData]);

  const extremes = useMemo(() => findMetricExtremes(filteredData), [filteredData]);
  const efficiencyStats = useMemo(() => calculateEfficiencyStats(filteredData), [filteredData]);

  // Colors for the charts
  const metricColors = {
    totalWaterProcessed: '#8884d8',
    tseToIrrigation: '#82ca9d',
    directSewageMB: '#ffc658',
    expectedVolumeTankers: '#ff7300',
    tankerTrips: '#e84a5f'
  };

  const metricNames = {
    totalWaterProcessed: 'Water Processed',
    tseToIrrigation: 'Used for Irrigation',
    directSewageMB: 'Direct Sewage',
    expectedVolumeTankers: 'Tanker Volume',
    tankerTrips: 'Tanker Trips'
  };

  const handleMetricToggle = (metric: MetricType) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric) 
        : [...prev, metric]
    );
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!dateRange[0] || dateRange[0] && dateRange[1]) {
      // Start a new range
      setDateRange([date, undefined]);
    } else {
      // Complete the range
      const newRange: [Date | undefined, Date | undefined] = [dateRange[0], date];
      setDateRange(newRange);
    }
  };

  const renderChart = () => {
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value} m³`, metricNames[name as MetricType] || name]} />
              <Legend />
              {selectedMetrics.includes('totalWaterProcessed') && 
                <Line type="monotone" dataKey="totalWaterProcessed" name="Water Processed" stroke={metricColors.totalWaterProcessed} activeDot={{ r: 8 }} />}
              {selectedMetrics.includes('tseToIrrigation') && 
                <Line type="monotone" dataKey="tseToIrrigation" name="Used for Irrigation" stroke={metricColors.tseToIrrigation} />}
              {selectedMetrics.includes('directSewageMB') && 
                <Line type="monotone" dataKey="directSewageMB" name="Direct Sewage" stroke={metricColors.directSewageMB} />}
              {selectedMetrics.includes('expectedVolumeTankers') && 
                <Line type="monotone" dataKey="expectedVolumeTankers" name="Tanker Volume" stroke={metricColors.expectedVolumeTankers} />}
              {selectedMetrics.includes('tankerTrips') && 
                <Line type="monotone" dataKey="tankerTrips" name="Tanker Trips" stroke={metricColors.tankerTrips} yAxisId="right" />}
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value} m³`, metricNames[name as MetricType] || name]} />
              <Legend />
              {selectedMetrics.includes('totalWaterProcessed') && 
                <Bar dataKey="totalWaterProcessed" name="Water Processed" fill={metricColors.totalWaterProcessed} />}
              {selectedMetrics.includes('tseToIrrigation') && 
                <Bar dataKey="tseToIrrigation" name="Used for Irrigation" fill={metricColors.tseToIrrigation} />}
              {selectedMetrics.includes('directSewageMB') && 
                <Bar dataKey="directSewageMB" name="Direct Sewage" fill={metricColors.directSewageMB} />}
              {selectedMetrics.includes('expectedVolumeTankers') && 
                <Bar dataKey="expectedVolumeTankers" name="Tanker Volume" fill={metricColors.expectedVolumeTankers} />}
              {selectedMetrics.includes('tankerTrips') && 
                <Bar dataKey="tankerTrips" name="Tanker Trips" fill={metricColors.tankerTrips} />}
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value} m³`, metricNames[name as MetricType] || name]} />
              <Legend />
              {selectedMetrics.includes('totalWaterProcessed') && 
                <Area type="monotone" dataKey="totalWaterProcessed" name="Water Processed" fill={metricColors.totalWaterProcessed} stroke={metricColors.totalWaterProcessed} fillOpacity={0.3} />}
              {selectedMetrics.includes('tseToIrrigation') && 
                <Area type="monotone" dataKey="tseToIrrigation" name="Used for Irrigation" fill={metricColors.tseToIrrigation} stroke={metricColors.tseToIrrigation} fillOpacity={0.3} />}
              {selectedMetrics.includes('directSewageMB') && 
                <Area type="monotone" dataKey="directSewageMB" name="Direct Sewage" fill={metricColors.directSewageMB} stroke={metricColors.directSewageMB} fillOpacity={0.3} />}
              {selectedMetrics.includes('expectedVolumeTankers') && 
                <Area type="monotone" dataKey="expectedVolumeTankers" name="Tanker Volume" fill={metricColors.expectedVolumeTankers} stroke={metricColors.expectedVolumeTankers} fillOpacity={0.3} />}
              {selectedMetrics.includes('tankerTrips') && 
                <Area type="monotone" dataKey="tankerTrips" name="Tanker Trips" fill={metricColors.tankerTrips} stroke={metricColors.tankerTrips} fillOpacity={0.3} />}
            </AreaChart>
          </ResponsiveContainer>
        );
        
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value} m³`, metricNames[name as MetricType] || name]} />
              <Legend />
              {selectedMetrics.includes('totalWaterProcessed') && 
                <Area type="monotone" dataKey="totalWaterProcessed" name="Water Processed" fill={metricColors.totalWaterProcessed} stroke={metricColors.totalWaterProcessed} fillOpacity={0.3} />}
              {selectedMetrics.includes('tseToIrrigation') && 
                <Line type="monotone" dataKey="tseToIrrigation" name="Used for Irrigation" stroke={metricColors.tseToIrrigation} />}
              {selectedMetrics.includes('directSewageMB') && 
                <Bar dataKey="directSewageMB" name="Direct Sewage" fill={metricColors.directSewageMB} />}
              {selectedMetrics.includes('expectedVolumeTankers') && 
                <Bar dataKey="expectedVolumeTankers" name="Tanker Volume" fill={metricColors.expectedVolumeTankers} />}
              {selectedMetrics.includes('tankerTrips') && 
                <Line type="monotone" dataKey="tankerTrips" name="Tanker Trips" stroke={metricColors.tankerTrips} />}
            </ComposedChart>
          </ResponsiveContainer>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search by date or value..."
            className="max-w-xs"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[240px] justify-start text-left font-normal">
                <CalendarIcon className="mr-2 h-4 w-4" />
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
              <div className="p-3 border-t border-border/20">
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => setDateRange([undefined, undefined])}
                  className="w-full"
                >
                  Clear
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={chartType === 'line' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setChartType('line')}
          >
            <LineChartIcon className="h-4 w-4 mr-2" />
            Line
          </Button>
          <Button 
            variant={chartType === 'bar' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setChartType('bar')}
          >
            <BarChart2 className="h-4 w-4 mr-2" />
            Bar
          </Button>
          <Button 
            variant={chartType === 'area' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setChartType('area')}
          >
            <AreaChartIcon className="h-4 w-4 mr-2" />
            Area
          </Button>
          <Button 
            variant={chartType === 'composed' ? 'default' : 'outline'} 
            size="sm" 
            onClick={() => setChartType('composed')}
          >
            Combined
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Processing Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(efficiencyStats?.processingEfficiency || 0) * 100}%</div>
            <p className="text-xs text-muted-foreground">Processing to inflow ratio</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Max Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{extremes?.totalWaterProcessed.max || 0} m³</div>
            <p className="text-xs text-muted-foreground">Highest daily volume</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Irrigation Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(efficiencyStats?.irrigationUtilization || 0) * 100}%</div>
            <p className="text-xs text-muted-foreground">Of processed water reused</p>
          </CardContent>
        </Card>
        
        <Card className="bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Daily Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(efficiencyStats?.averageProcessingVolume || 0)} m³</div>
            <p className="text-xs text-muted-foreground">Average daily volume</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Daily Volumes for {formatMonth(selectedMonth)}</CardTitle>
          <CardDescription>
            Interactive chart of water processing metrics (cubic meters)
          </CardDescription>
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(metricNames).map(([key, name]) => (
              <Button
                key={key}
                variant={selectedMetrics.includes(key as MetricType) ? "default" : "outline"}
                size="sm"
                onClick={() => handleMetricToggle(key as MetricType)}
                className="text-xs"
                style={{ 
                  backgroundColor: selectedMetrics.includes(key as MetricType) ? metricColors[key as MetricType] : undefined,
                  opacity: selectedMetrics.includes(key as MetricType) ? 1 : 0.7
                }}
              >
                {name}
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {renderChart()}
        </CardContent>
      </Card>

      <Tabs defaultValue="table">
        <TabsList className="grid grid-cols-2 w-full max-w-md">
          <TabsTrigger value="table">Table View</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency Analysis</TabsTrigger>
        </TabsList>
        
        <TabsContent value="table">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Daily Records</CardTitle>
              <CardDescription>
                Detailed daily operational data
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Tanker Trips</TableHead>
                      <TableHead>Tanker Volume (m³)</TableHead>
                      <TableHead>Direct Sewage (m³)</TableHead>
                      <TableHead>Total Influent (m³)</TableHead>
                      <TableHead>Water Processed (m³)</TableHead>
                      <TableHead>TSE to Irrigation (m³)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((day) => (
                      <TableRow key={day.date}>
                        <TableCell>{formatDate(day.date)}</TableCell>
                        <TableCell>{day.tankerTrips}</TableCell>
                        <TableCell>{day.expectedVolumeTankers}</TableCell>
                        <TableCell>{day.directSewageMB}</TableCell>
                        <TableCell>{day.totalInfluent}</TableCell>
                        <TableCell>{day.totalWaterProcessed}</TableCell>
                        <TableCell>{day.tseToIrrigation}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredData.length} records
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="efficiency">
          <Card className="bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Efficiency Analysis</CardTitle>
              <CardDescription>
                Daily processing efficiency metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="totalWaterProcessed" name="Water Processed" fill="#8884d8" />
                  <Bar yAxisId="left" dataKey="totalInfluent" name="Total Influent" fill="#82ca9d" />
                  <Line yAxisId="right" type="monotone" dataKey="efficiency" name="Efficiency %" stroke="#ff7300" />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
