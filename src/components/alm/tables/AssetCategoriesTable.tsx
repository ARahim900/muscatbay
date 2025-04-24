
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AssetCategorySummary } from '@/types/asset';

export interface AssetCategoriesTableProps {
  categories: AssetCategorySummary[];
}

export const AssetCategoriesTable: React.FC<AssetCategoriesTableProps> = ({ categories }) => {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Assets</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">No categories found</TableCell>
            </TableRow>
          ) : (
            categories.map((category) => (
              <TableRow key={category.category}>
                <TableCell className="font-medium">{category.category}</TableCell>
                <TableCell className="text-right">{category.count}</TableCell>
                <TableCell className="text-right">{category.totalValue.toLocaleString()} OMR</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetCategoriesTable;
