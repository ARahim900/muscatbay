
import React, { useMemo } from 'react';
import { getDailyDataForMonth, formatMonth } from '@/utils/stpDataUtils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface STPDailyDetailsProps {
  selectedMonth: string;
}

export const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ selectedMonth }) => {
  const dailyData = useMemo(() => getDailyDataForMonth(selectedMonth), [selectedMonth]);
  
  // Transform data for charts
  const chartData = useMemo(() => 
    dailyData.map(day => ({
      name: day.date.split('-')[2], // Just the day number
      tankerVolume: day.expectedVolumeTankers,
      directSewage: day.directSewageMB,
      totalInfluent: day.totalInfluent,
      processed: day.totalWaterProcessed,
      irrigation: day.tseToIrrigation,
    }))
  , [dailyData]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Daily Volumes for {formatMonth(selectedMonth)}</CardTitle>
          <CardDescription>
            Daily water processing metrics (cubic meters)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} m³`, '']} />
                <Legend />
                <Line type="monotone" dataKey="totalInfluent" name="Total Influent" stroke="#8884d8" />
                <Line type="monotone" dataKey="processed" name="Water Processed" stroke="#82ca9d" />
                <Line type="monotone" dataKey="irrigation" name="Used for Irrigation" stroke="#ffc658" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
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
                {dailyData.map((day) => (
                  <TableRow key={day.date}>
                    <TableCell>{day.date}</TableCell>
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
      </Card>
    </div>
  );
};
