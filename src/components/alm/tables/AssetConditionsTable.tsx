
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AssetCondition } from '@/types/asset';

export interface AssetConditionsTableProps {
  conditions: AssetCondition[];
}

export const AssetConditionsTable: React.FC<AssetConditionsTableProps> = ({ conditions }) => {
  const getConditionColor = (condition: string): string => {
    switch (condition.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'fair': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Condition</TableHead>
            <TableHead className="text-right">Count</TableHead>
            <TableHead className="text-right">Percentage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {conditions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">No condition data found</TableCell>
            </TableRow>
          ) : (
            conditions.map((conditionData) => {
              const totalAssets = conditions.reduce((sum, c) => sum + c.count, 0);
              const percentage = (conditionData.count / totalAssets) * 100;
              
              return (
                <TableRow key={conditionData.condition}>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs ${getConditionColor(conditionData.condition)}`}>
                      {conditionData.condition}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">{conditionData.count}</TableCell>
                  <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetConditionsTable;
