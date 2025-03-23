
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ElectricityRecord, FacilityConsumption } from '@/types/electricity';
import { Input } from "@/components/ui/input";
import { Building, Search, SortAsc, SortDesc } from 'lucide-react';

interface ElectricityFacilitiesTableProps {
  electricityData: ElectricityRecord[];
  electricityRate: number;
}

export const ElectricityFacilitiesTable: React.FC<ElectricityFacilitiesTableProps> = ({
  electricityData,
  electricityRate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Process data for the table
  const facilitiesData: FacilityConsumption[] = electricityData
    .map(facility => {
      const janConsumption = facility.consumption['Jan-25'] || 0;
      const febConsumption = facility.consumption['Feb-25'] || 0;
      
      return {
        name: facility.name,
        type: facility.type,
        januaryConsumption: janConsumption,
        januaryCost: janConsumption * electricityRate,
        februaryConsumption: febConsumption,
        februaryCost: febConsumption * electricityRate,
        totalConsumption: janConsumption + febConsumption,
        totalCost: (janConsumption + febConsumption) * electricityRate
      };
    })
    .filter(facility => 
      facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      facility.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Sort the data
  const sortedData = [...facilitiesData].sort((a, b) => {
    const aValue = a[sortBy as keyof FacilityConsumption];
    const bValue = b[sortBy as keyof FacilityConsumption];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortOrder === 'asc' 
        ? aValue.localeCompare(bValue) 
        : bValue.localeCompare(aValue);
    } else {
      // Numeric comparison
      return sortOrder === 'asc' 
        ? Number(aValue) - Number(bValue) 
        : Number(bValue) - Number(aValue);
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Calculate totals for the summary
  const totalJanConsumption = facilitiesData.reduce((sum, facility) => sum + facility.januaryConsumption, 0);
  const totalFebConsumption = facilitiesData.reduce((sum, facility) => sum + facility.februaryConsumption, 0);
  const totalConsumption = facilitiesData.reduce((sum, facility) => sum + facility.totalConsumption, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">January 2025 Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalJanConsumption.toLocaleString()} kWh</div>
            <div className="text-md text-gray-500">{(totalJanConsumption * electricityRate).toLocaleString()} OMR</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">February 2025 Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFebConsumption.toLocaleString()} kWh</div>
            <div className="text-md text-gray-500">{(totalFebConsumption * electricityRate).toLocaleString()} OMR</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">2025 Total (Jan-Feb)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumption.toLocaleString()} kWh</div>
            <div className="text-md text-gray-500">{(totalConsumption * electricityRate).toLocaleString()} OMR</div>
          </CardContent>
        </Card>
      </div>
      
      {/* Search and Facilities Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-medium flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Facilities Data (January - February 2025)
            </CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Search facilities..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 text-xs">
                  <th 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200" 
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Facility Name
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-4 h-4 ml-1" /> : 
                          <SortDesc className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200" 
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center">
                      Type
                      {sortBy === 'type' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-4 h-4 ml-1" /> : 
                          <SortDesc className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('januaryConsumption')}
                  >
                    <div className="flex items-center justify-end">
                      Jan 2025 (kWh)
                      {sortBy === 'januaryConsumption' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-4 h-4 ml-1" /> : 
                          <SortDesc className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('januaryCost')}
                  >
                    <div className="flex items-center justify-end">
                      Jan 2025 (OMR)
                      {sortBy === 'januaryCost' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-4 h-4 ml-1" /> : 
                          <SortDesc className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('februaryConsumption')}
                  >
                    <div className="flex items-center justify-end">
                      Feb 2025 (kWh)
                      {sortBy === 'februaryConsumption' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-4 h-4 ml-1" /> : 
                          <SortDesc className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('februaryCost')}
                  >
                    <div className="flex items-center justify-end">
                      Feb 2025 (OMR)
                      {sortBy === 'februaryCost' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-4 h-4 ml-1" /> : 
                          <SortDesc className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('totalConsumption')}
                  >
                    <div className="flex items-center justify-end">
                      Total 2025 (kWh)
                      {sortBy === 'totalConsumption' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-4 h-4 ml-1" /> : 
                          <SortDesc className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('totalCost')}
                  >
                    <div className="flex items-center justify-end">
                      Total 2025 (OMR)
                      {sortBy === 'totalCost' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-4 h-4 ml-1" /> : 
                          <SortDesc className="w-4 h-4 ml-1" />
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((facility, index) => (
                  <tr 
                    key={`${facility.name}-${index}`}
                    className="border-b border-gray-200 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2">{facility.name}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                        {facility.type}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right">{facility.januaryConsumption.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{facility.januaryCost.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{facility.februaryConsumption.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right">{facility.februaryCost.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-medium">{facility.totalConsumption.toLocaleString()}</td>
                    <td className="px-4 py-2 text-right font-medium">{facility.totalCost.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-medium">
                  <td className="px-4 py-2" colSpan={2}>Totals</td>
                  <td className="px-4 py-2 text-right">{totalJanConsumption.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{(totalJanConsumption * electricityRate).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{totalFebConsumption.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{(totalFebConsumption * electricityRate).toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{totalConsumption.toLocaleString()}</td>
                  <td className="px-4 py-2 text-right">{(totalConsumption * electricityRate).toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
