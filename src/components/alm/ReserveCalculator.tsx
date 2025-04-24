
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calculator, Building, Coins } from 'lucide-react';
import { useAssetService } from '@/hooks/useAssetService';

interface ReserveCalcProps {
  title?: string;
  subtitle?: string;
}

export const ReserveCalculator: React.FC<ReserveCalcProps> = ({ title = "Reserve Fund Calculator", subtitle = "Calculate reserve fund contributions" }) => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [area, setArea] = useState<string>('');
  const [contribution, setContribution] = useState<number>(0);
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [availableTypes, setAvailableTypes] = useState<string[]>([]);
  
  const { propertyUnits, contributionRates, loading } = useAssetService();

  // Extract unique zones and property types when data is loaded
  useEffect(() => {
    if (propertyUnits && propertyUnits.length > 0) {
      const zones = [...new Set(propertyUnits.map(unit => unit.zoneCode))];
      setAvailableZones(zones.filter((zone): zone is string => typeof zone === 'string'));
      
      if (zones.length > 0) {
        setSelectedZone(zones[0] as string);
      }
    }
  }, [propertyUnits]);

  // Update available property types when selected zone changes
  useEffect(() => {
    if (propertyUnits && propertyUnits.length > 0 && selectedZone) {
      const types = [...new Set(
        propertyUnits
          .filter(unit => unit.zoneCode === selectedZone)
          .map(unit => unit.propertyType)
      )];
      
      setAvailableTypes(types.filter((type): type is string => typeof type === 'string'));
      
      if (types.length > 0) {
        setSelectedPropertyType(types[0] as string);
      }
    }
  }, [selectedZone, propertyUnits]);

  // Calculate contribution when inputs change
  useEffect(() => {
    if (selectedZone && selectedPropertyType && area) {
      const numericArea = parseFloat(area);
      
      if (isNaN(numericArea) || numericArea <= 0) {
        setContribution(0);
        return;
      }
      
      // Find applicable rate
      const rate = contributionRates.find((rate: any) => 
        rate.zone === selectedZone && 
        rate.propertyType === selectedPropertyType
      );
      
      if (rate) {
        const baseRate = rate.rate || 0;
        const annualContribution = baseRate * numericArea;
        setContribution(annualContribution);
      } else {
        setContribution(0);
      }
    }
  }, [selectedZone, selectedPropertyType, area, contributionRates]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Calculator className="h-5 w-5 text-blue-600" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Zone</label>
            <Select
              value={selectedZone}
              onValueChange={setSelectedZone}
              disabled={loading || availableZones.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Zones</SelectLabel>
                  {availableZones.map((zone) => (
                    <SelectItem key={zone} value={zone}>{zone}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Property Type</label>
            <Select
              value={selectedPropertyType}
              onValueChange={setSelectedPropertyType}
              disabled={loading || availableTypes.length === 0}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Property Types</SelectLabel>
                  {availableTypes.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid gap-2">
            <label className="text-sm font-medium">Built-up Area (m²)</label>
            <input
              type="number"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter area in square meters"
              disabled={loading}
            />
          </div>
          
          <div className="mt-4 p-4 bg-blue-50 border border-blue-100 rounded-md">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Annual Contribution</span>
              </div>
              <span className="text-xl font-bold text-blue-700">
                {contribution.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} OMR
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-600">Monthly</span>
              <span className="text-md font-medium text-gray-800">
                {(contribution / 12).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} OMR
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
