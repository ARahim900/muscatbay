
import React from 'react';
import { WaterFilter } from '@/types/water';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

interface WaterFiltersProps {
  filters: WaterFilter;
  availableZones: string[];
  availableTypes: string[];
  onFilterChange: (filters: Partial<WaterFilter>) => void;
  onReset: () => void;
}

const WaterFilters: React.FC<WaterFiltersProps> = ({
  filters,
  availableZones,
  availableTypes,
  onFilterChange,
  onReset
}) => {
  const months = [
    { value: 'jan_24', label: 'Jan 24' },
    { value: 'feb_24', label: 'Feb 24' },
    { value: 'mar_24', label: 'Mar 24' },
    { value: 'apr_24', label: 'Apr 24' },
    { value: 'may_24', label: 'May 24' },
    { value: 'jun_24', label: 'Jun 24' },
    { value: 'jul_24', label: 'Jul 24' },
    { value: 'aug_24', label: 'Aug 24' },
    { value: 'sep_24', label: 'Sep 24' },
    { value: 'oct_24', label: 'Oct 24' },
    { value: 'nov_24', label: 'Nov 24' },
    { value: 'dec_24', label: 'Dec 24' },
    { value: 'jan_25', label: 'Jan 25' },
    { value: 'feb_25', label: 'Feb 25' }
  ];

  return (
    <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow mb-6">
      <Select value={filters.month} onValueChange={(value) => onFilterChange({ month: value })}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Month" />
        </SelectTrigger>
        <SelectContent>
          {months.map((month) => (
            <SelectItem key={month.value} value={month.value}>
              {month.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.zone} onValueChange={(value) => onFilterChange({ zone: value })}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Zone" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Zones</SelectItem>
          {availableZones.map((zone) => (
            <SelectItem key={zone} value={zone}>
              {zone}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={filters.type} onValueChange={(value) => onFilterChange({ type: value })}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Select Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          {availableTypes.map((type) => (
            <SelectItem key={type} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button 
        variant="outline" 
        size="sm" 
        onClick={onReset}
        className="flex items-center gap-2"
      >
        <Filter className="h-4 w-4" />
        Reset Filters
      </Button>
    </div>
  );
};

export default WaterFilters;
