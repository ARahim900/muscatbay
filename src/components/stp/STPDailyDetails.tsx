
import React, { useEffect, useState } from 'react';
import { stpDailyData, formatMonth, getDailyDataForMonth } from '@/utils/stpDataUtils';
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
  ArrowDown, 
  ArrowUp, 
  CheckCircle2, 
  Info, 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Filter,
  Download
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Spotlight } from "@/components/ui/spotlight";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface STPDailyDetailsProps {
  selectedMonth: string;
}

const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ selectedMonth }) => {
  const [dailyData, setDailyData] = useState(getDailyDataForMonth(selectedMonth));
  const [loading, setLoading] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // First try to get data from Supabase
        const monthParts = selectedMonth.split('-');
        const startDate = `${monthParts[0]}-${monthParts[1]}-01`;
        const endDate = monthParts[1] === '12' 
          ? `${parseInt(monthParts[0]) + 1}-01-01` 
          : `${monthParts[0]}-${(parseInt(monthParts[1]) + 1).toString().padStart(2, '0')}-01`;
        
        const { data, error } = await supabase
          .from('stp_daily_data')
          .select('*')
          .gte('date', startDate)
          .lt('date', endDate);
        
        if (error) {
          console.error("Error fetching from Supabase:", error);
          // Fall back to mock data
          setDailyData(getDailyDataForMonth(selectedMonth));
        } else if (data && data.length > 0) {
          // Map Supabase data format to our app's format
          const mappedData = data.map(item => ({
            date: new Date(item.date).toISOString().split('T')[0],
            tankerTrips: item.tanker_trips || 0,
            expectedVolumeTankers: item.expected_volume_tankers || 0,
            directSewageMB: item.direct_sewage_mb || 0,
            totalInfluent: item.total_influent || 0,
            totalWaterProcessed: item.total_water_processed || 0,
            tseToIrrigation: item.tse_to_irrigation || 0,
            "NH4-N": item.nh4_n,
            pH: item.ph,
            BOD: item.bod,
            COD: item.cod,
            TSS: item.tss,
            TN: item.tn,
            TP: item.tp
          }));
          setDailyData(mappedData);
        } else {
          // No data in Supabase, fall back to mock data
          setDailyData(getDailyDataForMonth(selectedMonth));
        }
      } catch (err) {
        console.error("Error in data fetching:", err);
        setDailyData(getDailyDataForMonth(selectedMonth));
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
  }, [selectedMonth]);

  const getStatus = (value: number): 'good' | 'warning' | 'critical' => {
    if (value >= 7) {
      return 'good';
    } else if (value >= 5) {
      return 'warning';
    } else {
      return 'critical';
    }
  };

  const getStatusIcon = (status: 'good' | 'warning' | 'critical') => {
    switch (status) {
      case 'good':
        return <CheckCircle2 className="h-4 w-4 text-green-500 mr-1" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />;
      default:
        return <Info className="h-4 w-4 text-gray-500 mr-1" />;
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) {
      return <TrendingUp className="h-4 w-4 text-green-500 ml-1" />;
    } else if (trend < 0) {
      return <TrendingDown className="h-4 w-4 text-red-500 ml-1" />;
    } else {
      return null;
    }
  };

  const exportData = () => {
    try {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Date,Flow (m³),pH,BOD (mg/L),COD (mg/L),TSS (mg/L),NH4-N (mg/L),TN (mg/L),TP (mg/L)\n" +
        dailyData.map(day => {
          return `${day.date},${day.totalInfluent},${day.pH || 7},${day.BOD || 25},${day.COD || 75},${day.TSS || 30},${day["NH4-N"] || 15},${day.TN || 20},${day.TP || 5}`;
        }).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `STP_Daily_Data_${formatMonth(selectedMonth)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Data exported successfully");
    } catch (err) {
      console.error("Error exporting data:", err);
      toast.error("Failed to export data");
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
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <div>
            <CardTitle>Daily Details for {formatMonth(selectedMonth)}</CardTitle>
            <CardDescription>
              Detailed metrics for each day of the selected month.
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" className="flex items-center gap-1">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filter</span>
            </Button>
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
        <CardContent className="overflow-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-muscat-primary"></div>
            </div>
          ) : dailyData.length > 0 ? (
            <ScrollArea className="h-[calc(100vh-22rem)] rounded-md">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead className="w-[100px]">Date</TableHead>
                    <TableHead>Flow (m³)</TableHead>
                    <TableHead>pH</TableHead>
                    <TableHead>BOD (mg/L)</TableHead>
                    <TableHead>COD (mg/L)</TableHead>
                    <TableHead>TSS (mg/L)</TableHead>
                    <TableHead>NH4-N (mg/L)</TableHead>
                    <TableHead>TN (mg/L)</TableHead>
                    <TableHead>TP (mg/L)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dailyData.map((day) => (
                    <TableRow key={day.date} className="group hover:bg-muscat-light/30 transition-colors">
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-muscat-teal/10 hover:bg-muscat-teal/20 text-muscat-primary">
                          {day.totalInfluent}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(getStatus(day.pH || 7))}
                          {day.pH || 7}
                          {getTrendIcon(0)}
                        </div>
                      </TableCell>
                      <TableCell>{day.BOD || 25}</TableCell>
                      <TableCell>{day.COD || 75}</TableCell>
                      <TableCell>{day.TSS || 30}</TableCell>
                      <TableCell>{day["NH4-N"] || 15}</TableCell>
                      <TableCell>{day.TN || 20}</TableCell>
                      <TableCell>{day.TP || 5}</TableCell>
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
                No daily data found for {formatMonth(selectedMonth)}. Please select another month.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { STPDailyDetails };
