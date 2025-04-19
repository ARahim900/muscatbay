
import React from 'react';
import { Card } from "@/components/ui/card";

interface DataTableProps {
  data?: any[];
}

export function DataTable({ data }: DataTableProps) {
  // This is a placeholder implementation
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted/50">
            <th className="p-3 text-left">Zone</th>
            <th className="p-3 text-left">Consumption</th>
            <th className="p-3 text-left">Efficiency</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-3">Zone 1</td>
            <td className="p-3">12,432 m³</td>
            <td className="p-3">95.2%</td>
          </tr>
          <tr className="border-b">
            <td className="p-3">Zone 2</td>
            <td className="p-3">8,721 m³</td>
            <td className="p-3">92.7%</td>
          </tr>
          <tr className="border-b">
            <td className="p-3">Zone 3</td>
            <td className="p-3">15,345 m³</td>
            <td className="p-3">96.1%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
