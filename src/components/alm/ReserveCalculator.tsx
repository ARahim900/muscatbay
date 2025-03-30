
import React, { useState, useEffect, useMemo } from 'react';
import { useAssetService } from '@/hooks/useAssetService';
import _ from 'lodash';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { PropertyUnit } from '@/services/assetService';

interface ContributionBreakdownItem {
  name: string;
  category: string;
  share: number;
}

interface CalculationResult {
  totalAnnualContribution: number;
  componentBreakdown: ContributionBreakdownItem[];
  zoneBreakdown: {
    master: number;
    zone: number;
    building: number;
  };
}

const ReserveCalculator: React.FC = () => {
  // State
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [availableZones, setAvailableZones] = useState<{id: string, name: string, propertyTypes: string[]}[]>([]);
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<string[]>([]);
  const [availableBuildings, setAvailableBuildings] = useState<string[]>([]);
  const [availableUnits, setAvailableUnits] = useState<PropertyUnit[]>([]);
  const [propertyDetails, setPropertyDetails] = useState<PropertyUnit | null>(null);
  const [calculationResults, setCalculationResults] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Services
  const { getPropertyUnits, calculateContribution, loading, error: serviceError } = useAssetService();

  // Load all units initially
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const units = await getPropertyUnits();
        
        // Extract available zones
        const zones = _.chain(units)
          .map('zone')
          .uniq()
          .compact()
          .map(zoneId => {
            const nameMap: { [key: string]: string } = { 
              '3': 'Zone 3 (Zaha)', 
              '5': 'Zone 5 (Nameer)', 
              '8': 'Zone 8 (Wajd)', 
              'staff': 'Staff Accommodation', 
              '2': 'Zone 2 (Village Square)'
            };
            const types = _.chain(units)
              .filter(p => p.zone === zoneId)
              .map('property_type')
              .uniq()
              .compact()
              .value();
            return { id: zoneId, name: nameMap[zoneId] || `Zone ${zoneId}`, propertyTypes: types };
          })
          .sortBy('name')
          .value();
        
        setAvailableZones(zones);
      } catch (err) {
        console.error('Error loading initial data:', err);
        setError('Failed to load property data');
      }
    };

    loadInitialData();
  }, [getPropertyUnits]);

  // Filter property types when zone changes
  useEffect(() => {
    if (!selectedZone) {
      setAvailablePropertyTypes([]);
      setSelectedPropertyType('');
      setAvailableBuildings([]);
      setAvailableUnits([]);
      setSelectedBuilding('');
      setSelectedUnitId('');
      setPropertyDetails(null);
      setCalculationResults(null);
      return;
    }

    const zoneInfo = availableZones.find(z => z.id === selectedZone);
    setAvailablePropertyTypes(zoneInfo ? zoneInfo.propertyTypes : []);
    setSelectedPropertyType('');
    setAvailableBuildings([]);
    setAvailableUnits([]);
    setSelectedBuilding('');
    setSelectedUnitId('');
    setPropertyDetails(null);
    setCalculationResults(null);
  }, [selectedZone, availableZones]);

  // Filter buildings when property type changes
  useEffect(() => {
    const loadPropertyTypeData = async () => {
      if (!selectedZone || !selectedPropertyType) {
        setAvailableBuildings([]);
        setAvailableUnits([]);
        setSelectedBuilding('');
        setSelectedUnitId('');
        setPropertyDetails(null);
        setCalculationResults(null);
        return;
      }

      try {
        const units = await getPropertyUnits({ 
          zone: selectedZone, 
          property_type: selectedPropertyType 
        });

        // Extract buildings
        const buildings = _.chain(units)
          .map('building')
          .uniq()
          .compact()
          .sortBy()
          .value();

        setAvailableBuildings(buildings);
        setSelectedBuilding('');
        
        // If no buildings apply (e.g., villas), pre-filter units
        if (buildings.length === 0) {
          setAvailableUnits(units);
        } else {
          setAvailableUnits([]);
        }
        
        setSelectedUnitId('');
        setPropertyDetails(null);
        setCalculationResults(null);
      } catch (err) {
        console.error('Error loading property type data:', err);
        setError('Failed to load property data');
      }
    };

    loadPropertyTypeData();
  }, [selectedZone, selectedPropertyType, getPropertyUnits]);

  // Filter units when building changes
  useEffect(() => {
    const loadBuildingData = async () => {
      if (!selectedZone || !selectedPropertyType) {
        return;
      }

      // If buildings are relevant but none selected, clear units
      if (availableBuildings.length > 0 && !selectedBuilding) {
        setAvailableUnits([]);
        setSelectedUnitId('');
        setPropertyDetails(null);
        setCalculationResults(null);
        return;
      }

      // Skip if we've already loaded units (for villas)
      if (availableBuildings.length === 0 && availableUnits.length > 0) {
        return;
      }

      try {
        const units = await getPropertyUnits({
          zone: selectedZone,
          property_type: selectedPropertyType,
          building: selectedBuilding
        });

        setAvailableUnits(units);
        setSelectedUnitId('');
        setPropertyDetails(null);
        setCalculationResults(null);
      } catch (err) {
        console.error('Error loading building data:', err);
        setError('Failed to load property data');
      }
    };

    loadBuildingData();
  }, [
    selectedBuilding, 
    availableBuildings, 
    selectedZone, 
    selectedPropertyType, 
    getPropertyUnits,
    availableUnits.length
  ]);

  // Fetch details and calculate when unit is selected
  useEffect(() => {
    if (!selectedUnitId) {
      setPropertyDetails(null);
      setCalculationResults(null);
      return;
    }

    const selectedUnit = availableUnits.find(u => u.id === parseInt(selectedUnitId));
    if (selectedUnit) {
      setPropertyDetails(selectedUnit);
      handleCalculate(selectedUnit);
    }
  }, [selectedUnitId, availableUnits]);

  // Calculation function
  const handleCalculate = async (unit: PropertyUnit) => {
    setIsLoading(true);
    setError(null);
    setCalculationResults(null);

    try {
      const result = await calculateContribution(unit);
      if (result) {
        setCalculationResults(result.calculation);
      }
    } catch (err: any) {
      console.error('Calculation error:', err);
      setError(err.message || 'Failed to calculate contribution');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">Reserve Fund Calculator</CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculations based on 2025 projected rates derived from 2021 RFS. VAT not included.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Select Property</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zone-select">Zone</Label>
                <Select
                  value={selectedZone}
                  onValueChange={setSelectedZone}
                >
                  <SelectTrigger id="zone-select">
                    <SelectValue placeholder="-- Select Zone --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableZones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type-select">Property Type</Label>
                <Select
                  value={selectedPropertyType}
                  onValueChange={setSelectedPropertyType}
                  disabled={!selectedZone}
                >
                  <SelectTrigger id="type-select">
                    <SelectValue placeholder="-- Select Type --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePropertyTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {availableBuildings.length > 0 && (
                <div className="space-y-2">
                  <Label htmlFor="building-select">Building</Label>
                  <Select
                    value={selectedBuilding}
                    onValueChange={setSelectedBuilding}
                    disabled={!selectedPropertyType}
                  >
                    <SelectTrigger id="building-select">
                      <SelectValue placeholder="-- Select Building --" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBuildings.map(building => (
                        <SelectItem key={building} value={building}>{building}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="unit-select">Select Unit ({availableUnits.length} available)</Label>
                <Select
                  value={selectedUnitId}
                  onValueChange={setSelectedUnitId}
                  disabled={availableUnits.length === 0}
                >
                  <SelectTrigger id="unit-select">
                    <SelectValue placeholder="-- Select Unit --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.unit_no} - {unit.unit_type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Calculating...</span>
        </div>
      )}

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
            
            {propertyDetails && (
              <div className="p-4 mt-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="font-medium text-blue-800 mb-2">Selected Property Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                  <p><span className="text-gray-600">Unit No:</span> {propertyDetails.unit_no}</p>
                  <p><span className="text-gray-600">Type:</span> {propertyDetails.unit_type}</p>
                  <p><span className="text-gray-600">Sector:</span> {propertyDetails.sector_zone}</p>
                  <p><span className="text-gray-600">Zone:</span> {propertyDetails.zone}</p>
                  <p><span className="text-gray-600">BUA:</span> {propertyDetails.bua ? `${propertyDetails.bua.toFixed(2)} Sq.m.` : 'N/A'}</p>
                  <p><span className="text-gray-600">Plot:</span> {propertyDetails.plot || 'N/A'}</p>
                  <p><span className="text-gray-600">Status:</span> {propertyDetails.status || 'N/A'}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && propertyDetails && calculationResults && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results for Unit: {propertyDetails.unit_no}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Property Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                <p><span className="text-gray-600">Unit No:</span> {propertyDetails.unit_no}</p>
                <p><span className="text-gray-600">Type:</span> {propertyDetails.unit_type}</p>
                <p><span className="text-gray-600">Sector:</span> {propertyDetails.sector_zone}</p>
                <p><span className="text-gray-600">Zone:</span> {propertyDetails.zone}</p>
                <p><span className="text-gray-600">BUA:</span> {propertyDetails.bua ? `${propertyDetails.bua.toFixed(2)} Sq.m.` : 'N/A'}</p>
                <p><span className="text-gray-600">Plot:</span> {propertyDetails.plot || 'N/A'}</p>
                <p><span className="text-gray-600">Status:</span> {propertyDetails.status || 'N/A'}</p>
              </div>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">Projected Reserve Fund Contribution (2025 Basis)</h3>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Total Annual</p>
                <p className="text-3xl font-bold text-green-700">OMR {calculationResults.totalAnnualContribution.toFixed(2)}</p>
                <p className="text-md text-gray-700">(Approx. OMR {(calculationResults.totalAnnualContribution / 12).toFixed(2)} / month)</p>
              </div>
              
              <div className="space-y-2 text-sm">
                {calculationResults.zoneBreakdown.master > 0 && (
                  <div className="flex justify-between items-center border-b border-green-100 pb-1">
                    <span className="text-gray-700">Master Community Share:</span>
                    <span className="font-medium text-gray-900">OMR {calculationResults.zoneBreakdown.master.toFixed(2)}</span>
                  </div>
                )}
                {calculationResults.zoneBreakdown.zone > 0 && (
                  <div className="flex justify-between items-center border-b border-green-100 pb-1">
                    <span className="text-gray-700">{propertyDetails.zone === "staff" ? "Staff Accomm. Share" : `Zone ${propertyDetails.zone} Share`}:</span>
                    <span className="font-medium text-gray-900">OMR {calculationResults.zoneBreakdown.zone.toFixed(2)}</span>
                  </div>
                )}
                {calculationResults.zoneBreakdown.building > 0 && (
                  <div className="flex justify-between items-center border-b border-green-100 pb-1">
                    <span className="text-gray-700">Building Specific Share:</span>
                    <span className="font-medium text-gray-900">OMR {calculationResults.zoneBreakdown.building.toFixed(2)}</span>
                  </div>
                )}
              </div>
              
              {calculationResults.componentBreakdown.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Breakdown by Component:</h4>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="min-w-full">
                      <thead className="bg-green-100">
                        <tr>
                          <th className="text-left py-1 px-2 text-xs font-medium text-green-800">Component</th>
                          <th className="text-right py-1 px-2 text-xs font-medium text-green-800">Share (OMR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-green-100">
                        {calculationResults.componentBreakdown.map((item, index) => (
                          <tr key={index} className="text-sm">
                            <td className="py-1 px-2 text-gray-700">{item.name}</td>
                            <td className="py-1 px-2 text-right font-medium text-gray-800">{item.share.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 text-center mt-4">Note: Calculation based on 2021 RFS methodology and projected 2025 rates. Does not include operational service charges or VAT.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReserveCalculator;
