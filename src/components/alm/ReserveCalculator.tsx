
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator, Building2, MapPin, ArrowRight } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAssetService } from '@/hooks/useAssetService';
import { PropertyUnit, ContributionBreakdown } from '@/types/asset';
import { toast } from "sonner";

interface CalculationResult {
  totalAnnualContribution: number;
  componentBreakdown: ContributionBreakdown[];
  zoneBreakdown: {
    master: number;
    zone: number;
    building: number;
  };
}

const ReserveCalculator: React.FC = () => {
  // State for selections
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>("");
  const [selectedBuilding, setSelectedBuilding] = useState<string>("");
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  
  // State for filtered data
  const [availableZones, setAvailableZones] = useState<string[]>([]);
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<string[]>([]);
  const [availableBuildings, setAvailableBuildings] = useState<string[]>([]);
  const [availableUnits, setAvailableUnits] = useState<PropertyUnit[]>([]);
  
  // State for results
  const [propertyDetails, setPropertyDetails] = useState<PropertyUnit | null>(null);
  const [calculationResults, setCalculationResults] = useState<CalculationResult | null>(null);
  
  const { getPropertyUnits, calculateContribution, loading, error } = useAssetService();
  
  // Fetch all available zones initially
  useEffect(() => {
    const fetchZones = async () => {
      try {
        const units = await getPropertyUnits();
        const zones = [...new Set(units.map(unit => unit.zone))].sort();
        setAvailableZones(zones);
      } catch (err) {
        console.error("Error fetching zones:", err);
        toast.error("Failed to load zones");
      }
    };
    
    fetchZones();
  }, [getPropertyUnits]);
  
  // Filter property types when zone changes
  useEffect(() => {
    const fetchPropertyTypes = async () => {
      if (!selectedZone) {
        setAvailablePropertyTypes([]);
        setSelectedPropertyType("");
        return;
      }
      
      try {
        const units = await getPropertyUnits({ zone: selectedZone });
        const types = [...new Set(units.map(unit => unit.property_type))].sort();
        setAvailablePropertyTypes(types);
        setSelectedPropertyType("");
        setSelectedBuilding("");
        setSelectedUnitId(null);
        setPropertyDetails(null);
        setCalculationResults(null);
      } catch (err) {
        console.error("Error fetching property types:", err);
        toast.error("Failed to load property types");
      }
    };
    
    fetchPropertyTypes();
  }, [selectedZone, getPropertyUnits]);
  
  // Filter buildings when property type changes
  useEffect(() => {
    const fetchBuildings = async () => {
      if (!selectedZone || !selectedPropertyType) {
        setAvailableBuildings([]);
        setAvailableUnits([]);
        setSelectedBuilding("");
        setSelectedUnitId(null);
        return;
      }
      
      try {
        const units = await getPropertyUnits({ 
          zone: selectedZone, 
          property_type: selectedPropertyType 
        });
        
        // Get unique buildings (excluding null/undefined)
        const buildings = [...new Set(units
          .map(unit => unit.building)
          .filter(building => building) as string[]
        )].sort();
        
        setAvailableBuildings(buildings);
        setSelectedBuilding("");
        
        // If no buildings exist (e.g., villas), directly set available units
        if (buildings.length === 0) {
          setAvailableUnits(units);
        } else {
          setAvailableUnits([]);
        }
        
        setSelectedUnitId(null);
        setPropertyDetails(null);
        setCalculationResults(null);
      } catch (err) {
        console.error("Error fetching buildings:", err);
        toast.error("Failed to load buildings");
      }
    };
    
    fetchBuildings();
  }, [selectedZone, selectedPropertyType, getPropertyUnits]);
  
  // Filter units when building changes
  useEffect(() => {
    const fetchUnits = async () => {
      if (!selectedZone || !selectedPropertyType) {
        setAvailableUnits([]);
        setSelectedUnitId(null);
        return;
      }
      
      // Skip if buildings exist but none selected
      if (availableBuildings.length > 0 && !selectedBuilding) {
        setAvailableUnits([]);
        setSelectedUnitId(null);
        return;
      }
      
      try {
        const filters: {
          zone?: string;
          property_type?: string;
          building?: string;
        } = {
          zone: selectedZone,
          property_type: selectedPropertyType
        };
        
        if (selectedBuilding) {
          filters.building = selectedBuilding;
        }
        
        const units = await getPropertyUnits(filters);
        setAvailableUnits(units);
        setSelectedUnitId(null);
        setPropertyDetails(null);
        setCalculationResults(null);
      } catch (err) {
        console.error("Error fetching units:", err);
        toast.error("Failed to load units");
      }
    };
    
    fetchUnits();
  }, [selectedZone, selectedPropertyType, selectedBuilding, availableBuildings, getPropertyUnits]);
  
  // Fetch details and calculate when unit is selected
  useEffect(() => {
    const fetchDetailsAndCalculate = async () => {
      if (!selectedUnitId) {
        setPropertyDetails(null);
        setCalculationResults(null);
        return;
      }
      
      const selectedUnit = availableUnits.find(unit => unit.id === selectedUnitId);
      if (!selectedUnit) return;
      
      setPropertyDetails(selectedUnit);
      
      try {
        const result = await calculateContribution(selectedUnit);
        if (result) {
          setCalculationResults({
            totalAnnualContribution: result.calculation.totalAnnualContribution,
            componentBreakdown: result.calculation.componentBreakdown,
            zoneBreakdown: result.calculation.zoneBreakdown
          });
        }
      } catch (err) {
        console.error("Error calculating contribution:", err);
        toast.error("Failed to calculate contribution");
        setCalculationResults(null);
      }
    };
    
    fetchDetailsAndCalculate();
  }, [selectedUnitId, availableUnits, calculateContribution]);
  
  // Zone label mapping
  const getZoneLabel = (zoneCode: string): string => {
    const zoneMap: Record<string, string> = {
      'Z3': 'Zone 3 (Zaha)',
      '3': 'Zone 3 (Zaha)', 
      'Z5': 'Zone 5 (Nameer)',
      '5': 'Zone 5 (Nameer)',
      'Z8': 'Zone 8 (Wajd)',
      '8': 'Zone 8 (Wajd)',
      'staff': 'Staff Accommodation',
      'VS': 'Village Square'
    };
    return zoneMap[zoneCode] || `Zone ${zoneCode}`;
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Reserve Fund Contribution Calculator
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Selection UI */}
          <div className="space-y-4 bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold text-blue-800">Select Property</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Zone */}
              <div>
                <label htmlFor="zone-select" className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                <Select value={selectedZone} onValueChange={setSelectedZone}>
                  <SelectTrigger id="zone-select" className="w-full">
                    <SelectValue placeholder="-- Select Zone --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableZones.map(zone => (
                      <SelectItem key={zone} value={zone}>
                        {getZoneLabel(zone)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Property Type */}
              <div>
                <label htmlFor="type-select" className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                <Select value={selectedPropertyType} onValueChange={setSelectedPropertyType} disabled={!selectedZone}>
                  <SelectTrigger id="type-select" className="w-full">
                    <SelectValue placeholder="-- Select Type --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePropertyTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Building (conditional) */}
              {availableBuildings.length > 0 && (
                <div>
                  <label htmlFor="building-select" className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding} disabled={!selectedPropertyType}>
                    <SelectTrigger id="building-select" className="w-full">
                      <SelectValue placeholder="-- Select Building --" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBuildings.map(building => (
                        <SelectItem key={building} value={building}>
                          {building}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Unit */}
              <div>
                <label htmlFor="unit-select" className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <Select 
                  value={selectedUnitId ? selectedUnitId.toString() : ""} 
                  onValueChange={(value) => setSelectedUnitId(value ? parseInt(value) : null)} 
                  disabled={availableUnits.length === 0}
                >
                  <SelectTrigger id="unit-select" className="w-full">
                    <SelectValue placeholder="-- Select Unit --" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.unit_no}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Loading State */}
          {loading && (
            <div className="text-center p-6 text-blue-600 font-semibold">
              <span className="animate-pulse">Calculating Contribution...</span>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="text-center p-4 text-red-600 bg-red-50 border border-red-300 rounded">
              {error}
            </div>
          )}
          
          {/* Results Display */}
          {propertyDetails && calculationResults && !loading && (
            <div className="mt-8 space-y-6 animate-fade-in">
              {/* Property Details */}
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <h2 className="text-lg font-semibold mb-3 text-gray-800">Property Details</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
                  <div><p className="text-gray-600">Unit:</p><p className="font-medium text-gray-900">{propertyDetails.unit_no}</p></div>
                  <div><p className="text-gray-600">Type:</p><p className="font-medium text-gray-900">{propertyDetails.property_type}</p></div>
                  <div><p className="text-gray-600">Size:</p><p className="font-medium text-gray-900">{propertyDetails.bua.toFixed(2)} Sq.m.</p></div>
                  {propertyDetails.building && (
                    <div><p className="text-gray-600">Building:</p><p className="font-medium text-gray-900">{propertyDetails.building}</p></div>
                  )}
                  <div><p className="text-gray-600">Zone:</p><p className="font-medium text-gray-900">{getZoneLabel(propertyDetails.zone)}</p></div>
                </div>
              </div>
              
              {/* Calculation Results */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contribution Summary */}
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h2 className="text-lg font-semibold mb-4 text-green-800">Est. Reserve Contribution (2025)</h2>
                  <div className="space-y-2 text-sm">
                    {calculationResults.zoneBreakdown.master > 0 && (
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="text-gray-700">Master Community Share:</span>
                        <span className="font-medium text-gray-900">OMR {calculationResults.zoneBreakdown.master.toFixed(2)}</span>
                      </div>
                    )}
                    {calculationResults.zoneBreakdown.zone > 0 && (
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="text-gray-700">
                          {propertyDetails.zone === "staff" ? "Staff Accomm. Share" : `Zone ${propertyDetails.zone} Share`}:
                        </span>
                        <span className="font-medium text-gray-900">OMR {calculationResults.zoneBreakdown.zone.toFixed(2)}</span>
                      </div>
                    )}
                    {calculationResults.zoneBreakdown.building > 0 && (
                      <div className="flex justify-between items-center border-b pb-1">
                        <span className="text-gray-700">Building Specific Share:</span>
                        <span className="font-medium text-gray-900">OMR {calculationResults.zoneBreakdown.building.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="pt-2 flex justify-between font-bold text-base">
                      <span className="text-green-900">Total Annual:</span>
                      <span className="text-green-900">OMR {calculationResults.totalAnnualContribution.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-700">
                      <span>Approx. Monthly:</span>
                      <span>OMR {(calculationResults.totalAnnualContribution / 12).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                {/* Component Breakdown */}
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                  <h2 className="text-lg font-semibold mb-4 text-orange-800">Est. Contribution Breakdown</h2>
                  <div className="max-h-60 overflow-y-auto text-sm">
                    {calculationResults.componentBreakdown.length > 0 ? (
                      <table className="min-w-full">
                        <thead className="sticky top-0 bg-orange-100">
                          <tr>
                            <th className="text-left p-1 font-medium text-orange-900">Category / Component</th>
                            <th className="text-right p-1 font-medium text-orange-900">Share (OMR)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-orange-200">
                          {calculationResults.componentBreakdown.map((item, index) => (
                            <tr key={index}>
                              <td className="p-1 text-gray-700">
                                {item.name} <span className="text-xs text-gray-500">({item.category})</span>
                              </td>
                              <td className="p-1 text-right font-medium text-gray-800">{item.share.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <p className="text-center text-gray-500 py-4">No breakdown data available.</p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Notes Section */}
              <div className="mt-6 bg-gray-100 p-3 rounded-lg border border-gray-300">
                <h3 className="text-sm font-semibold mb-1 text-gray-700">Calculation Notes</h3>
                <ul className="text-xs list-disc list-inside space-y-1 text-gray-600">
                  <li>Calculations are estimates based on 2025 projected rates derived from 2021 RFS (incl. 0.5% annual increase).</li>
                  <li>These calculations are based on rates stored in the database. Actual fees may vary.</li>
                  <li>Does not include operational service charges or potential special assessments.</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* No Selection State */}
          {!propertyDetails && !loading && (
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">Select a Property</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select a property from the dropdown above to calculate reserve fund contributions based on the property's details and applicable assets.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ReserveCalculator;
