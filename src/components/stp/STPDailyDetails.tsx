
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { toast } from "sonner";
import { 
  STPDailyRecord,
  filterDataByYearMonth,
  processData
} from '@/utils/stpDailyData';
import DateFilter from './DateFilter';

interface STPDailyDetailsProps {
  selectedMonth?: string;
  showHeader?: boolean;
}

const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ 
  selectedMonth = 'all',
  showHeader = true
}) => {
  const [loading, setLoading] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [dailyData, setDailyData] = useState<STPDailyRecord[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [currentSelectedMonth, setCurrentSelectedMonth] = useState<string>(selectedMonth);
  const [timeRange, setTimeRange] = useState<string>('ALL');
  
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = processData([], timeRange, selectedYear, currentSelectedMonth);
        setDailyData(data);
      } catch (err) {
        console.error("Error processing data:", err);
        setDailyData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Show spotlight effect the first time this component loads
    const hasSeenDailyDetails = localStorage.getItem('hasSeenDailyDetails');
    if (!hasSeenDailyDetails) {
      setShowSpotlight(true);
      localStorage.setItem('hasSeenDailyDetails', 'true');
      
      // Hide spotlight after 3 seconds
      const timer = setTimeout(() => {
        setShowSpotlight(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [selectedYear, currentSelectedMonth, timeRange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric'
    });
  };

  const resetFilters = () => {
    setSelectedYear('all');
    setCurrentSelectedMonth('all');
    setTimeRange('ALL');
  };

  const exportData = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Date,Tanker Trips,Expected Volume (m³),Direct Sewage (m³),Total Influent (m³),Total Water Processed (m³),TSE to Irrigation (m³)\n" +
        dailyData.map(day => {
          return `${day.date},${day.tankerTrips},${day.expectedVolumeTankers},${day.directSewageMB},${day.totalInfluent},${day.totalWaterProcessed},${day.tseToIrrigation}`;
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `STP_Daily_Data_${selectedYear}_${currentSelectedMonth}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Data exported successfully");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export data");
    }
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear().toString();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    setSelectedYear(year);
    setCurrentSelectedMonth(month);
    setTimeRange('ALL');
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    // Reset year and month when using predefined time ranges
    if (range !== 'ALL') {
      setSelectedYear('all');
      setCurrentSelectedMonth('all');
    }
  };

  return (
    <div className="grid gap-4 relative">
      {showSpotlight && (
        <div className="absolute inset-0 z-10 pointer-events-none">
          <Spotlight fill="#68D1CC" spotlightSize="lg" />
        </div>
      )}
      
      <Card className="animate-fade-in">
        {showHeader && (
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <div>
              <CardTitle>STP Daily Details</CardTitle>
              <CardDescription>
                Detailed metrics for each day based on selected filters.
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-1"
                onClick={exportData}
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </CardHeader>
        )}
        
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <DateFilter 
              selectedMonth={currentSelectedMonth}
              selectedYear={selectedYear}
              onMonthChange={setCurrentSelectedMonth}
              onYearChange={setSelectedYear}
              onDateRangeSelect={handleDateSelect}
              onResetFilters={resetFilters}
            />
            
            <div className="flex space-x-1">
              <Button 
                variant={timeRange === '1D' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => handleTimeRangeChange('1D')}
              >
                1D
              </Button>
              <Button 
                variant={timeRange === '7D' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => handleTimeRangeChange('7D')}
              >
                7D
              </Button>
              <Button 
                variant={timeRange === '1M' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => handleTimeRangeChange('1M')}
              >
                1M
              </Button>
              <Button 
                variant={timeRange === '3M' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => handleTimeRangeChange('3M')}
              >
                3M
              </Button>
              <Button 
                variant={timeRange === 'ALL' ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => handleTimeRangeChange('ALL')}
              >
                All
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscat-primary"></div>
            </div>
          ) : dailyData.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-22rem)] rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[120px]">Date</TableHead>
                    <TableHead className="text-right">Tanker Trips</TableHead>
                    <TableHead className="text-right">Tanker Volume (m³)</TableHead>
                    <TableHead className="text-right">Direct Sewage (m³)</TableHead>
                    <TableHead className="text-right">Total Influent (m³)</TableHead>
                    <TableHead className="text-right">Total Processed (m³)</TableHead>
                    <TableHead className="text-right">TSE to Irrigation (m³)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map((day) => (
                    <TableRow key={day.date} className="group hover:bg-muscat-light/30 transition-colors">
                      <TableCell className="font-medium">{formatDate(day.date)}</TableCell>
                      <TableCell className="text-right">{day.tankerTrips}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className="bg-muscat-teal/10 hover:bg-muscat-teal/20 text-muscat-primary">
                          {day.expectedVolumeTankers}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">{day.directSewageMB}</TableCell>
                      <TableCell className="text-right font-medium">{day.totalInfluent}</TableCell>
                      <TableCell className="text-right">{day.totalWaterProcessed}</TableCell>
                      <TableCell className="text-right">{day.tseToIrrigation}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No Data Available</AlertTitle>
              <AlertDescription>
                No daily data found for the selected filters. Please try different filter options.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { STPDailyDetails };
