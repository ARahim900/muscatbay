
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { STPDailyData } from '@/types/stp';

import { useToast } from "@/components/ui/use-toast";

// Mock data for STP daily details
const mockSTPDailyData: STPDailyData[] = [
  {
    date: '2025-03-10',
    tankerTrips: 15,
    expectedVolumeTankers: 75000,
    directSewageMB: 120000,
    totalInfluent: 195000,
    totalWaterProcessed: 185000,
    tseToIrrigation: 175000,
    utilizationPercentage: '89.7%',
    processingEfficiency: '94.9%'
  },
  {
    date: '2025-03-11',
    tankerTrips: 16,
    expectedVolumeTankers: 80000,
    directSewageMB: 125000,
    totalInfluent: 205000,
    totalWaterProcessed: 194000,
    tseToIrrigation: 183000,
    utilizationPercentage: '91.5%',
    processingEfficiency: '94.6%'
  }
];

const STPDailyDetails: React.FC = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { toast } = useToast();

  // Function to export data as CSV
  const exportData = () => {
    const headers = ['Date', 'Tanker Trips', 'Tanker Volume', 'Direct Sewage', 'Total Influent', 'Processed Water', 'TSE to Irrigation'];
    const dataRows = mockSTPDailyData.map(record => [
      record.date,
      record.tankerTrips,
      record.expectedVolumeTankers,
      record.directSewageMB,
      record.totalInfluent,
      record.totalWaterProcessed,
      record.tseToIrrigation
    ]);
    
    const csvContent = [
      headers.join(','),
      ...dataRows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'stp_daily_data.csv';
    a.click();
    
    toast({
      title: "Data exported successfully",
      description: "STP daily data has been downloaded as CSV"
    });
  };

  // Filter data based on selected date
  const filteredData = mockSTPDailyData.filter(
    record => record.date === (date ? format(date, 'yyyy-MM-dd') : '')
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <CalendarIcon className="h-4 w-4" />
                {date ? format(date, 'PPP') : 'Pick a date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <Button variant="outline" size="sm" onClick={exportData}>
          <Download className="h-4 w-4 mr-2" /> Export Data
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Daily Processing Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tanker Trips</TableHead>
                <TableHead>Tanker Volume (L)</TableHead>
                <TableHead>Direct Sewage (L)</TableHead>
                <TableHead>Total Influent (L)</TableHead>
                <TableHead>Processed Water (L)</TableHead>
                <TableHead>TSE to Irrigation (L)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((record, index) => (
                  <TableRow key={`${record.date}-${index}`}>
                    <TableCell>{format(new Date(record.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{record.tankerTrips}</TableCell>
                    <TableCell>{record.expectedVolumeTankers.toLocaleString()}</TableCell>
                    <TableCell>{record.directSewageMB.toLocaleString()}</TableCell>
                    <TableCell>{record.totalInfluent.toLocaleString()}</TableCell>
                    <TableCell>{record.totalWaterProcessed.toLocaleString()}</TableCell>
                    <TableCell>{record.tseToIrrigation.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No data available for the selected date
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default STPDailyDetails;
