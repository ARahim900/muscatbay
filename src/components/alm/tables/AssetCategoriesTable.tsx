
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Sub Category</TableHead>
            <TableHead>Asset Count</TableHead>
            <TableHead className="text-right">Replacement Cost (OMR)</TableHead>
            <TableHead>Life Expectancy (Years)</TableHead>
            <TableHead>Zone Coverage</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((category) => (
            <TableRow key={category.id}>
              <TableCell className="font-medium">{category.id}</TableCell>
              <TableCell>{category.name}</TableCell>
              <TableCell>{category.subCategory}</TableCell>
              <TableCell>{category.assetCount}</TableCell>
              <TableCell className="text-right">{category.totalReplacementCost.toLocaleString()}</TableCell>
              <TableCell>{category.lifeExpectancyRange}</TableCell>
              <TableCell>{category.zoneCoverage}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssetCategoriesTable;
