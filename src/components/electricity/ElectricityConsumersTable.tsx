
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { TopConsumer } from '@/types/electricity';

interface ElectricityConsumersTableProps {
  topConsumers: TopConsumer[];
}

const ElectricityConsumersTable: React.FC<ElectricityConsumersTableProps> = ({ topConsumers }) => {
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
              <TableHead className="text-right">Consumption (kWh)</TableHead>
              <TableHead className="text-right">Cost (OMR)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topConsumers && topConsumers.length > 0 ? (
              topConsumers.map((consumer, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{consumer.name}</TableCell>
                  <TableCell>{consumer.type}</TableCell>
                  <TableCell className="text-right">{Math.round(consumer.consumption).toLocaleString()}</TableCell>
                  <TableCell className="text-right">{consumer.cost.toFixed(2)}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-4">No consumption data available</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ElectricityConsumersTable;
