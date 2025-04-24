
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssetLifecycleForecast } from '@/types/asset';

interface MaintenanceForecastTableProps {
  forecasts: AssetLifecycleForecast[];
}

const MaintenanceForecastTable: React.FC<MaintenanceForecastTableProps> = ({ forecasts }) => {
  // Format forecasts as needed for the table
  const formattedForecasts = forecasts.map(forecast => ({
    ...forecast,
    assets: forecast.assets || []
  }));
  
  // Flatten forecasts to display assets
  const forecastItems = formattedForecasts.flatMap(forecast => 
    forecast.assets.map(asset => ({
      assetId: asset.id,
      assetName: asset.name,
      category: asset.category,
      expectedReplacement: forecast.year,
      estimatedCost: asset.value * 0.2, // Estimation based on asset value
      priority: asset.criticalityLevel || 'Medium'
    }))
  );

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
          {forecastItems.length > 0 ? (
            forecastItems.map((item, index) => (
              <TableRow key={`${item.assetId}-${index}`}>
                <TableCell className="font-medium">{item.assetName}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.expectedReplacement}</TableCell>
                <TableCell>${item.estimatedCost.toLocaleString()}</TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    item.priority === 'High' ? 'bg-red-100 text-red-800' : 
                    item.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {item.priority}
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
