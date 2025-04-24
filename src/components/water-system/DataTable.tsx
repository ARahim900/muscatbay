
import React from 'react';
import { useWaterData } from '@/hooks/useWaterData';
import { formatNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

export function DataTable() {
  // Use the water data hook to fetch data
  const { data, loading, error } = useWaterData();
  
  // Handle loading state
  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }
  
  // Handle error state
  if (error || !data) {
    return (
      <div className="p-4 text-red-500">
        Failed to load water consumption data
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b">
            <th className="px-4 py-3 text-left font-medium">Zone</th>
            <th className="px-4 py-3 text-right font-medium">Consumption (m³)</th>
            <th className="px-4 py-3 text-right font-medium">Loss (m³)</th>
          </tr>
        </thead>
        <tbody>
          {data.zones.map((zone, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : ""}>
              <td className="px-4 py-3">{zone.name}</td>
              <td className="px-4 py-3 text-right">{formatNumber(zone.consumption)}</td>
              <td className="px-4 py-3 text-right">{formatNumber(zone.loss)}</td>
            </tr>
          ))}
          <tr className="font-medium border-t">
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3 text-right">{formatNumber(data.total.consumption)}</td>
            <td className="px-4 py-3 text-right">{formatNumber(data.total.loss)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
