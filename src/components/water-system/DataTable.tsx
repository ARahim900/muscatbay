
import React from 'react';
import { waterData } from '@/data/water-data';
import { formatNumber } from '@/lib/utils';

export function DataTable() {
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
          {waterData.zones.map((zone, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-gray-50 dark:bg-gray-800/50" : ""}>
              <td className="px-4 py-3">{zone.name}</td>
              <td className="px-4 py-3 text-right">{formatNumber(zone.consumption)}</td>
              <td className="px-4 py-3 text-right">{formatNumber(zone.loss)}</td>
            </tr>
          ))}
          <tr className="font-medium border-t">
            <td className="px-4 py-3">Total</td>
            <td className="px-4 py-3 text-right">{formatNumber(waterData.total.consumption)}</td>
            <td className="px-4 py-3 text-right">{formatNumber(waterData.total.loss)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
