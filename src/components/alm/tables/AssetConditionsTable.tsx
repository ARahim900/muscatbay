
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssetCondition } from '@/types/asset';

export interface AssetConditionsTableProps {
  conditions: AssetCondition[];
}

export const AssetConditionsTable: React.FC<AssetConditionsTableProps> = ({ conditions }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Condition</TableHead>
          <TableHead className="text-right">Count</TableHead>
          <TableHead className="text-right">Percentage</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {conditions.map((condition) => {
          const totalCount = conditions.reduce((sum, c) => sum + c.count, 0);
          const percentage = totalCount > 0 ? (condition.count / totalCount) * 100 : 0;
          
          return (
            <TableRow key={condition.condition}>
              <TableCell className="font-medium">{condition.condition}</TableCell>
              <TableCell className="text-right">{condition.count}</TableCell>
              <TableCell className="text-right">{percentage.toFixed(1)}%</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
