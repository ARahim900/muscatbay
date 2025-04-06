import React from 'react';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ElectricityFacility, FacilityConsumption } from '@/types/electricity';

interface ElectricityFacilitiesTableProps {
  electricityData: ElectricityFacility[];
  electricityRate: number;
}

export const calculateFacilityConsumption = (
  facility: ElectricityFacility,
  electricityRate: number
): FacilityConsumption => {
  const currentConsumption = Object.values(facility.consumption).reduce((sum, value) => sum + value, 0);
  const currentCost = currentConsumption * electricityRate;

  return {
    name: facility.name,
    type: facility.type,
    consumption: currentConsumption,
    cost: currentCost,
    previousConsumption: 0, // Placeholder
    previousCost: 0,        // Placeholder
    change: null,           // Placeholder
  };
};

export const ElectricityFacilitiesTable: React.FC<ElectricityFacilitiesTableProps> = ({ electricityData, electricityRate }) => {
  const facilitiesConsumption = electricityData.map(facility =>
    calculateFacilityConsumption(facility, electricityRate)
  );

  return (
    <div className="container mx-auto p-4">
      <Table>
        <TableCaption>A list of your electricity facilities.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Name</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Consumption</TableHead>
            <TableHead>Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {facilitiesConsumption.map((facility) => (
            <TableRow key={facility.name}>
              <TableCell className="font-medium">{facility.name}</TableCell>
              <TableCell>{facility.type}</TableCell>
              <TableCell>{facility.consumption.toFixed(2)} kWh</TableCell>
              <TableCell>{facility.cost.toFixed(2)} OMR</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
