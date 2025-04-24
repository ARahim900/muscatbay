
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { stpDailyData } from '@/utils/stpDataUtils';

interface STPDailyDetailsProps {
  selectedMonth?: string;
}

const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ selectedMonth }) => {
  // Filter data by month if provided
  const filteredData = selectedMonth 
    ? stpDailyData.filter(record => record.date.startsWith(selectedMonth)) 
    : stpDailyData;

  return (
    <Card>
      <CardHeader>
        <CardTitle>STP Daily Operations</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Tanker Trips</TableHead>
              <TableHead>Direct Sewage (m³)</TableHead>
              <TableHead>Total Influent (m³)</TableHead>
              <TableHead>Water Processed (m³)</TableHead>
              <TableHead>TSE to Irrigation (m³)</TableHead>
              <TableHead>Efficiency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.map(record => (
              <TableRow key={record.id}>
                <TableCell>{record.date}</TableCell>
                <TableCell>{record.tankerTrips}</TableCell>
                <TableCell>{record.directSewageMB}</TableCell>
                <TableCell>{record.totalInfluent}</TableCell>
                <TableCell>{record.totalWaterProcessed}</TableCell>
                <TableCell>{record.tseToIrrigation}</TableCell>
                <TableCell>
                  {((record.totalWaterProcessed / record.totalInfluent) * 100).toFixed(1)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default STPDailyDetails;
