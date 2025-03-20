
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

interface MaintenanceForecastTableProps {
  data: MaintenanceForecast[];
}

const MaintenanceForecastTable: React.FC<MaintenanceForecastTableProps> = ({ data }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset ID</TableHead>
            <TableHead>Asset Name</TableHead>
            <TableHead>Zone</TableHead>
            <TableHead>Installation Year</TableHead>
            <TableHead>Condition</TableHead>
            <TableHead>Next Maintenance</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Estimated Cost (OMR)</TableHead>
            <TableHead>Life (Years)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.id}</TableCell>
              <TableCell>{item.assetName}</TableCell>
              <TableCell>{item.zone}</TableCell>
              <TableCell>{item.installationYear}</TableCell>
              <TableCell>{item.currentCondition}</TableCell>
              <TableCell>{item.nextMaintenanceYear}</TableCell>
              <TableCell>{item.maintenanceType}</TableCell>
              <TableCell className="text-right">{item.estimatedCost.toLocaleString()}</TableCell>
              <TableCell>{item.lifeExpectancy}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaintenanceForecastTable;
