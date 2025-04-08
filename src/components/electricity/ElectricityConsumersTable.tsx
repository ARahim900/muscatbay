
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Zap, Users, ArrowDown, Table as TableIcon } from 'lucide-react';
import { TopConsumer } from '@/types/electricity';

interface ElectricityConsumersTableProps {
  topConsumers: TopConsumer[];
}

const ElectricityConsumersTable: React.FC<ElectricityConsumersTableProps> = ({ topConsumers }) => {
  const hasData = topConsumers && topConsumers.length > 0;
  
  // Get colors for different types from a utility function
  const getTypeColor = (type: string): string => {
    const typeColors: { [key: string]: string } = {
      'Retail': 'bg-blue-100 text-blue-800 border-blue-200',
      'Apartment': 'bg-green-100 text-green-800 border-green-200', 
      'D_Building': 'bg-amber-100 text-amber-800 border-amber-200',
      'SBJ Common Meter': 'bg-amber-100 text-amber-800 border-amber-200',
      'IRR': 'bg-red-100 text-red-800 border-red-200',
      'IRR_Services': 'bg-red-100 text-red-800 border-red-200',
      'MC': 'bg-purple-100 text-purple-800 border-purple-200',
      'MB_Common': 'bg-purple-100 text-purple-800 border-purple-200',
      'Building': 'bg-sky-100 text-sky-800 border-sky-200',
      'PS': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'LS': 'bg-violet-100 text-violet-800 border-violet-200',
      'DB': 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
      'Street Light': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'Zone-3 landscape light': 'bg-lime-100 text-lime-800 border-lime-200',
      'FP-Landscape Lights Z3': 'bg-lime-100 text-lime-800 border-lime-200',
      'Common': 'bg-purple-100 text-purple-800 border-purple-200',
      'Common Area': 'bg-purple-100 text-purple-800 border-purple-200'
    };
    
    return typeColors[type] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-2">
            <div className="rounded-full bg-indigo-100 p-1.5">
              <TableIcon className="h-4 w-4 text-indigo-600" />
            </div>
            <div>
              <CardTitle>Top Consumers</CardTitle>
              <CardDescription>Facilities with highest electricity consumption</CardDescription>
            </div>
          </div>
          
          {hasData && (
            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-indigo-200">
              {topConsumers.length} facilities
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
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
              {topConsumers.map((consumer, index) => (
                <TableRow key={index} className={index === 0 ? "bg-amber-50/50" : ""}>
                  <TableCell className="font-medium">
                    {consumer.name}
                    {index === 0 && (
                      <Badge variant="outline" className="ml-2 bg-amber-100 text-amber-800 border-amber-200">
                        Top
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getTypeColor(consumer.type)}>
                      {consumer.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {Math.round(consumer.consumption).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {consumer.cost.toFixed(2)} OMR
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 bg-gray-50/50 rounded-lg">
            <ArrowDown className="h-8 w-8 text-gray-300 mb-2" />
            <p className="text-gray-500">No consumption data available for the selected period</p>
            <p className="text-xs text-gray-400 mt-1">Try selecting a different month or year</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ElectricityConsumersTable;
