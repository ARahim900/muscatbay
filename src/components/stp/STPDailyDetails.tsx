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
  WarningCircle 
} from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface STPDailyDetailsProps {
  selectedMonth: string;
}

const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ selectedMonth }) => {
  const [dailyData, setDailyData] = useState(getDailyDataForMonth(selectedMonth));

  useEffect(() => {
    setDailyData(getDailyDataForMonth(selectedMonth));
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
        return <WarningCircle className="h-4 w-4 text-amber-500 mr-1" />;
      case 'critical':
        return <WarningCircle className="h-4 w-4 text-red-500 mr-1" />;
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

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Daily Details for {formatMonth(selectedMonth)}</CardTitle>
          <CardDescription>
            Detailed metrics for each day of the selected month.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-auto">
          {dailyData.length > 0 ? (
            <ScrollArea>
              <Table>
                <TableHeader>
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
                    <TableRow key={day.date}>
                      <TableCell className="font-medium">{day.date}</TableCell>
                      <TableCell>{day.flow}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          {getStatusIcon(getStatus(day.pH))}
                          {day.pH}
                          {getTrendIcon(day.pH - 7)}
                        </div>
                      </TableCell>
                      <TableCell>{day.BOD}</TableCell>
                      <TableCell>{day.COD}</TableCell>
                      <TableCell>{day.TSS}</TableCell>
                      <TableCell>{day['NH4-N']}</TableCell>
                      <TableCell>{day.TN}</TableCell>
                      <TableCell>{day.TP}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <Alert variant="default">
              <WarningCircle className="h-4 w-4" />
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
