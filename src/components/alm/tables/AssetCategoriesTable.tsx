
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AssetCategorySummary } from '@/types/asset';
import { formatNumber } from '@/lib/utils';

export interface AssetCategoriesTableProps {
  categories: AssetCategorySummary[];
}

export const AssetCategoriesTable: React.FC<AssetCategoriesTableProps> = ({ categories }) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Count</TableHead>
          <TableHead className="text-right">Total Value</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow key={category.category}>
            <TableCell className="font-medium">{category.category}</TableCell>
            <TableCell className="text-right">{category.count}</TableCell>
            <TableCell className="text-right">{formatNumber(category.totalValue)} OMR</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default AssetCategoriesTable;
