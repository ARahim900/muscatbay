
import React from 'react';
import { 
  Select, 
  SelectContent, 
  SelectGroup, 
  SelectItem, 
  SelectLabel, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { PropertyUnit } from '@/types/alm';
import { usePropertyUnits } from '@/hooks/usePropertyUnits';

interface PropertyUnitSelectorProps {
  zoneCode?: string;
  value: string;
  onChange: (value: string) => void;
}

const PropertyUnitSelector: React.FC<PropertyUnitSelectorProps> = ({ 
  zoneCode, 
  value, 
  onChange 
}) => {
  const { properties, loading, error } = usePropertyUnits(
    zoneCode ? { zone: zoneCode } : {}
  );

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Loading properties..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (error) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue placeholder="Error loading properties" />
        </SelectTrigger>
      </Select>
    );
  }

  // Group properties by sector
  const groupedProperties: Record<string, PropertyUnit[]> = {};
  properties.forEach(property => {
    const sector = property.sector || 'Other';
    if (!groupedProperties[sector]) {
      groupedProperties[sector] = [];
    }
    groupedProperties[sector].push(property);
  });

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a property" />
      </SelectTrigger>
      <SelectContent>
        {properties.length === 0 ? (
          <SelectItem value="no-properties-available">No properties available</SelectItem>
        ) : (
          Object.entries(groupedProperties).map(([sector, sectorProperties]) => (
            <SelectGroup key={sector}>
              <SelectLabel>{sector}</SelectLabel>
              {sectorProperties.map(property => (
                <SelectItem key={property.id} value={property.id}>
                  {property.unitNo} - {property.unitType} ({property.bua} sqm)
                </SelectItem>
              ))}
            </SelectGroup>
          ))
        )}
      </SelectContent>
    </Select>
  );
};

export default PropertyUnitSelector;
