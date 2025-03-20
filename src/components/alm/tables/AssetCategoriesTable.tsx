
import React from 'react';
import { AssetCategory } from '@/types/alm';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

interface AssetCategoriesTableProps {
  data: AssetCategory[];
}

const AssetCategoriesTable: React.FC<AssetCategoriesTableProps> = ({ data }) => {
  return (
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
          {data.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="text-sm font-medium">{category.id}</TableCell>
              <TableCell className="text-sm">{category.name}</TableCell>
              <TableCell className="text-sm">{category.subCategory}</TableCell>
              <TableCell className="text-sm">{category.assetCount}</TableCell>
              <TableCell className="text-sm text-right">{category.totalReplacementCost.toLocaleString()}</TableCell>
              <TableCell className="text-sm">{category.lifeExpectancyRange}</TableCell>
              <TableCell className="text-sm">{category.zoneCoverage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetCategoriesTable;
