
import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  filterDataByDateRange, 
  filterDataByTimeRange, 
  calculateMonthlyAggregates 
} from '@/services/stpService';
import { STPDailyRecord } from '@/types/stp';
import { useIsMobile } from '@/hooks/use-mobile';

interface STPDailyDetailsProps {
  data: STPDailyRecord[];
  selectedYear: number;
  selectedMonth: number | 'all';
}

export const STPDailyDetails: React.FC<STPDailyDetailsProps> = ({ 
  data, 
  selectedYear, 
  selectedMonth 
}) => {
  const isMobile = useIsMobile();
  const [filteredData, setFilteredData] = useState<STPDailyRecord[]>([]);
  
  useEffect(() => {
    // Filter data based on selected year and month
    let filtered = data;
    
    if (selectedYear) {
      const startDate = new Date(selectedYear, selectedMonth === 'all' ? 0 : selectedMonth as number - 1, 1);
      const endDate = new Date(selectedYear, selectedMonth === 'all' ? 11 : selectedMonth as number - 1 + 1, 0);
      filtered = filterDataByDateRange(data, startDate, endDate);
    }
    
    setFilteredData(filtered);
  }, [data, selectedYear, selectedMonth]);

  if (!data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Daily Performance Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">No data available for the selected period.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Daily Performance Metrics</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={filteredData} 
              margin={{ 
                top: 10, 
                right: isMobile ? 10 : 30, 
                left: isMobile ? 0 : 20, 
                bottom: isMobile ? 60 : 30 
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                angle={-45} 
                textAnchor="end" 
                height={60} 
                tickMargin={20}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={(value) => `${value.toFixed(1)}`}
                tick={{ fontSize: isMobile ? 10 : 12 }}
              />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: isMobile ? 10 : 12 }} />
              <Bar 
                yAxisId="left"
                dataKey="bod" 
                fill="#8884d8" 
                name="BOD"
              />
              <Bar 
                yAxisId="left"
                dataKey="cod" 
                fill="#82ca9d" 
                name="COD"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
