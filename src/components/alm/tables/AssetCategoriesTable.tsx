
import React from 'react';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { AssetCategorySummary } from '@/types/alm';

export interface AssetCategoriesTableProps {
  data: AssetCategorySummary[];
}

const AssetCategoriesTable: React.FC<AssetCategoriesTableProps> = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-md shadow">
      <h3 className="text-lg font-medium p-4 border-b">Asset Categories</h3>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium text-sm">ID</TableHead>
              <TableHead className="font-medium text-sm">Category</TableHead>
              <TableHead className="font-medium text-sm">Sub Category</TableHead>
              <TableHead className="font-medium text-sm">Asset Count</TableHead>
              <TableHead className="font-medium text-sm text-right">Replacement Cost (OMR)</TableHead>
              <TableHead className="font-medium text-sm">Life Expectancy (Years)</TableHead>
              <TableHead className="font-medium text-sm">Zone Coverage</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="text-sm font-medium">{category.id}</TableCell>
                  <TableCell className="text-sm">{category.name}</TableCell>
                  <TableCell className="text-sm">{category.subCategory}</TableCell>
                  <TableCell className="text-sm">{category.assetCount}</TableCell>
                  <TableCell className="text-sm text-right">{category.totalReplacementCost.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{category.lifeExpectancyRange}</TableCell>
                  <TableCell className="text-sm">{category.zoneCoverage}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4 text-gray-500">
                  No category data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AssetCategoriesTable;
