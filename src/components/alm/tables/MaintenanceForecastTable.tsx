
import React from 'react';
import { MaintenanceForecast } from '@/types/alm';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';

export interface MaintenanceForecastTableProps {
  data: MaintenanceForecast[];
}

const MaintenanceForecastTable: React.FC<MaintenanceForecastTableProps> = ({ data = [] }) => {
  return (
    <div className="bg-white rounded-md shadow">
      <h3 className="text-lg font-medium p-4 border-b">Maintenance Forecast</h3>
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="font-medium text-sm">Asset ID</TableHead>
              <TableHead className="font-medium text-sm">Asset Name</TableHead>
              <TableHead className="font-medium text-sm">Zone</TableHead>
              <TableHead className="font-medium text-sm">Installation Year</TableHead>
              <TableHead className="font-medium text-sm">Condition</TableHead>
              <TableHead className="font-medium text-sm">Next Maintenance</TableHead>
              <TableHead className="font-medium text-sm">Type</TableHead>
              <TableHead className="font-medium text-sm text-right">Estimated Cost (OMR)</TableHead>
              <TableHead className="font-medium text-sm">Life (Years)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="text-sm font-medium">{item.id}</TableCell>
                  <TableCell className="text-sm">{item.assetName}</TableCell>
                  <TableCell className="text-sm">{item.zone}</TableCell>
                  <TableCell className="text-sm">{item.installationYear}</TableCell>
                  <TableCell className="text-sm">{item.currentCondition}</TableCell>
                  <TableCell className="text-sm">{item.nextMaintenanceYear}</TableCell>
                  <TableCell className="text-sm">{item.maintenanceType}</TableCell>
                  <TableCell className="text-sm text-right">{item.estimatedCost.toLocaleString()}</TableCell>
                  <TableCell className="text-sm">{item.lifeExpectancy}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4 text-gray-500">
                  No maintenance forecast data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default MaintenanceForecastTable;
