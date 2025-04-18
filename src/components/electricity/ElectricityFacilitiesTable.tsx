
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ElectricityRecord, FacilityConsumption } from '@/types/electricity';
import { Input } from "@/components/ui/input";
import { Building, Search, SortAsc, SortDesc, Filter } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
  const [selectedMonth, setSelectedMonth] = useState<string>('Feb-25');
  const [selectedType, setSelectedType] = useState<string>('all');
  const isMobile = useIsMobile();
  
  // Get all facility types for filtering
  const facilityTypes = ['all', ...new Set(electricityData.map(facility => facility.type))];
  
  // All available months
  const months = [
    { value: 'Apr-24', label: 'April 2024' },
    { value: 'May-24', label: 'May 2024' },
    { value: 'Jun-24', label: 'June 2024' },
    { value: 'Jul-24', label: 'July 2024' },
    { value: 'Aug-24', label: 'August 2024' },
    { value: 'Sep-24', label: 'September 2024' },
    { value: 'Oct-24', label: 'October 2024' },
    { value: 'Nov-24', label: 'November 2024' },
    { value: 'Dec-24', label: 'December 2024' },
    { value: 'Jan-25', label: 'January 2025' },
    { value: 'Feb-25', label: 'February 2025' }
  ];

  // Process data for the table based on selected month
  const facilitiesData: FacilityConsumption[] = electricityData
    .map(facility => {
      const consumption = facility.consumption[selectedMonth] || 0;
      
      // Get previous month data
      const monthIndex = months.findIndex(m => m.value === selectedMonth);
      const previousMonthIndex = monthIndex > 0 ? monthIndex - 1 : -1;
      const previousMonth = previousMonthIndex >= 0 ? months[previousMonthIndex].value : null;
      const previousConsumption = previousMonth ? (facility.consumption[previousMonth] || 0) : 0;
      
      // Calculate change percentage
      const change = previousConsumption > 0 
        ? ((consumption - previousConsumption) / previousConsumption) * 100 
        : null;
      
      return {
        name: facility.type === 'D_Building' && facility.name.includes('D Building') 
          ? facility.name.replace('D Building', 'DB') 
          : facility.name,
        type: facility.type,
        consumption: consumption,
        cost: consumption * electricityRate,
        previousConsumption: previousConsumption,
        previousCost: previousConsumption * electricityRate,
        change: change
      };
    })
    .filter(facility => {
      // Apply search filter
      const nameMatch = facility.name.toLowerCase().includes(searchTerm.toLowerCase());
      const typeMatch = facility.type.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Apply type filter
      const typeFilter = selectedType === 'all' || facility.type === selectedType;
      
      return (nameMatch || typeMatch) && typeFilter;
    });

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
  const totalConsumption = facilitiesData.reduce((sum, facility) => sum + facility.consumption, 0);
  const totalPrevConsumption = facilitiesData.reduce((sum, facility) => sum + (facility.previousConsumption || 0), 0);
  const totalChange = totalPrevConsumption > 0 
    ? ((totalConsumption - totalPrevConsumption) / totalPrevConsumption) * 100 
    : null;

  // Find the month labels
  const currentMonthLabel = months.find(m => m.value === selectedMonth)?.label || selectedMonth;
  const monthIndex = months.findIndex(m => m.value === selectedMonth);
  const previousMonthIndex = monthIndex > 0 ? monthIndex - 1 : -1;
  const previousMonthLabel = previousMonthIndex >= 0 
    ? months[previousMonthIndex].label 
    : 'No Previous Month';

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
          <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
            <SelectValue placeholder="Select Month" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value} className="text-sm sm:text-base">
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-full sm:w-[180px] text-sm sm:text-base">
            <SelectValue placeholder="Filter by Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm sm:text-base">All Types</SelectItem>
            {facilityTypes.filter(type => type !== 'all').map((type) => (
              <SelectItem key={type} value={type} className="text-sm sm:text-base">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="relative w-full sm:w-64 ml-auto">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search facilities..."
            className="pl-8 text-sm sm:text-base"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-lg font-medium">{currentMonthLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalConsumption.toLocaleString()} kWh</div>
            <div className="text-xs sm:text-md text-gray-500">{(totalConsumption * electricityRate).toLocaleString()} OMR</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-lg font-medium">{previousMonthLabel}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{totalPrevConsumption.toLocaleString()} kWh</div>
            <div className="text-xs sm:text-md text-gray-500">{(totalPrevConsumption * electricityRate).toLocaleString()} OMR</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-lg font-medium">Month-over-Month Change</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${totalChange && totalChange > 0 ? 'text-red-500' : totalChange && totalChange < 0 ? 'text-green-500' : ''}`}>
              {totalChange ? `${totalChange.toFixed(1)}%` : 'N/A'}
            </div>
            <div className="text-xs sm:text-md text-gray-500">
              {totalChange && totalChange > 0 ? 'Increase' : totalChange && totalChange < 0 ? 'Decrease' : ''}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Facilities Table */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base sm:text-lg md:text-xl font-medium flex items-center">
              <Building className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Facilities Consumption - {currentMonthLabel}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr className="bg-gray-100 text-left text-gray-600 text-xs sm:text-sm">
                  <th 
                    className="px-3 sm:px-4 py-2 cursor-pointer hover:bg-gray-200" 
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Facility Name
                      {sortBy === 'name' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : 
                          <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-4 py-2 cursor-pointer hover:bg-gray-200" 
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center">
                      Type
                      {sortBy === 'type' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : 
                          <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('consumption')}
                  >
                    <div className="flex items-center justify-end">
                      {isMobile ? 'kWh' : 'Consumption (kWh)'}
                      {sortBy === 'consumption' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : 
                          <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('cost')}
                  >
                    <div className="flex items-center justify-end">
                      {isMobile ? 'OMR' : 'Cost (OMR)'}
                      {sortBy === 'cost' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : 
                          <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      )}
                    </div>
                  </th>
                  <th 
                    className="px-3 sm:px-4 py-2 cursor-pointer hover:bg-gray-200 text-right" 
                    onClick={() => handleSort('change')}
                  >
                    <div className="flex items-center justify-end">
                      Change %
                      {sortBy === 'change' && (
                        sortOrder === 'asc' ? 
                          <SortAsc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" /> : 
                          <SortDesc className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
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
                    <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">
                      {facility.name}
                    </td>
                    <td className="px-3 sm:px-4 py-2 text-xs sm:text-sm">
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100">
                        {facility.type}
                      </span>
                    </td>
                    <td className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm">
                      {facility.consumption.toLocaleString()}
                    </td>
                    <td className="px-3 sm:px-4 py-2 text-right text-xs sm:text-sm">
                      {facility.cost.toLocaleString()}
                    </td>
                    <td className={`px-3 sm:px-4 py-2 text-right text-xs sm:text-sm ${
                      facility.change && facility.change > 0 ? 'text-red-500' : 
                      facility.change && facility.change < 0 ? 'text-green-500' : ''
                    }`}>
                      {facility.change !== null ? `${facility.change.toFixed(1)}%` : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-100 font-medium text-xs sm:text-sm">
                  <td className="px-3 sm:px-4 py-2" colSpan={2}>Totals</td>
                  <td className="px-3 sm:px-4 py-2 text-right">{totalConsumption.toLocaleString()}</td>
                  <td className="px-3 sm:px-4 py-2 text-right">{(totalConsumption * electricityRate).toLocaleString()}</td>
                  <td className={`px-3 sm:px-4 py-2 text-right ${
                    totalChange && totalChange > 0 ? 'text-red-500' : 
                    totalChange && totalChange < 0 ? 'text-green-500' : ''
                  }`}>
                    {totalChange !== null ? `${totalChange.toFixed(1)}%` : 'N/A'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
