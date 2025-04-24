
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssetLifecycleForecast } from '@/types/asset';

interface MaintenanceForecastTableProps {
  forecasts: AssetLifecycleForecast[];
}

const MaintenanceForecastTable: React.FC<MaintenanceForecastTableProps> = ({ forecasts }) => {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Asset Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Expected Replacement</TableHead>
            <TableHead>Estimated Cost</TableHead>
            <TableHead>Priority</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {forecasts.length > 0 ? (
            forecasts.map((forecast) => (
              <TableRow key={forecast.id}>
                <TableCell className="font-medium">{forecast.assetName}</TableCell>
                <TableCell>{forecast.category}</TableCell>
                <TableCell>{new Date(forecast.expectedReplacement).toLocaleDateString()}</TableCell>
                <TableCell>${forecast.estimatedCost.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    forecast.priority === 'High' ? 'bg-red-100 text-red-800' : 
                    forecast.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {forecast.priority}
                  </span>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">No maintenance forecasts available</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default MaintenanceForecastTable;
