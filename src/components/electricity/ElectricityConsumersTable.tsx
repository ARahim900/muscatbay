
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TopConsumer } from '@/types/electricity';
import { formatNumber, formatCurrency, getTypeColor } from '@/utils/electricityDataUtils';

interface ElectricityConsumersTableProps {
  data: TopConsumer[];
}

const ElectricityConsumersTable: React.FC<ElectricityConsumersTableProps> = ({ data }) => {
  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Top Consumers</CardTitle>
        <CardDescription>Facilities with highest electricity consumption</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Zone</TableHead>
              <TableHead className="text-right">Consumption (kWh)</TableHead>
              <TableHead className="text-right">Cost (OMR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((consumer, index) => (
                <TableRow key={consumer.id || index}>
                  <TableCell className="font-medium">{consumer.name}</TableCell>
                  <TableCell>
                    <Badge 
                      className="text-xs" 
                      style={{
                        backgroundColor: `${getTypeColor(consumer.type)}20`,
                        color: getTypeColor(consumer.type),
                        borderColor: getTypeColor(consumer.type)
                      }}
                    >
                      {consumer.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">{consumer.zone || 'N/A'}</TableCell>
                  <TableCell className="text-right">{formatNumber(consumer.consumption)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(consumer.cost)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                  <div className="flex flex-col items-center justify-center">
                    <p>No consumption data available</p>
                    <p className="text-xs mt-1">Try selecting a different month</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ElectricityConsumersTable;
