
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { stpDailyData, formatDate } from '@/utils/stpDataUtils';
import { STPDailyData } from '@/types/stp';

const STPDailyDetails: React.FC = () => {
  const [dailyData, setDailyData] = useState<STPDailyData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const data = await stpDailyData();
        setDailyData(data);
      } catch (error) {
        console.error('Error loading STP daily data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Daily Processing Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Processing Data</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Tanker Trips</TableHead>
                <TableHead>Direct Sewage (m³)</TableHead>
                <TableHead>Total Influent (m³)</TableHead>
                <TableHead>Processed Water (m³)</TableHead>
                <TableHead>TSE to Irrigation (m³)</TableHead>
                <TableHead>Processing Efficiency</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dailyData.length > 0 ? (
                dailyData.map((day) => {
                  const efficiency = day.totalInfluent > 0 
                    ? (day.totalWaterProcessed / day.totalInfluent) * 100 
                    : 0;
                    
                  return (
                    <TableRow key={day.id}>
                      <TableCell>{formatDate(day.date)}</TableCell>
                      <TableCell>{day.tankerTrips}</TableCell>
                      <TableCell>{day.directSewageMB.toLocaleString()}</TableCell>
                      <TableCell>{day.totalInfluent.toLocaleString()}</TableCell>
                      <TableCell>{day.totalWaterProcessed.toLocaleString()}</TableCell>
                      <TableCell>{day.tseToIrrigation.toLocaleString()}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          efficiency >= 95 ? 'bg-green-100 text-green-800' :
                          efficiency >= 90 ? 'bg-yellow-100 text-yellow-800' :
                                           'bg-red-100 text-red-800'
                        }`}>
                          {efficiency.toFixed(1)}%
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">No daily data available</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default STPDailyDetails;
