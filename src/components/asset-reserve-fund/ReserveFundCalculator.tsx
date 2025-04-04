
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Calculator, ArrowRight } from 'lucide-react';
import { 
  mockZones, 
  mockPropertyTypes, 
  mockBuildings, 
  mockUnits 
} from '@/data/reserveFundData';
import { 
  calculateTotalContribution, 
  getZoneDisplayName,
  getBaseRateForZone,
  calculateAdjustedRate
} from '@/utils/reserveFundCalculator';
import { toast } from '@/components/ui/use-toast';

const ReserveFundCalculator: React.FC = () => {
  // Selection state
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  
  // Custom BUA entry
  const [useCustomBua, setUseCustomBua] = useState<boolean>(false);
  const [customBua, setCustomBua] = useState<string>('');
  
  // Calculation state
  const [calculationYear, setCalculationYear] = useState<number>(2025);
  const [calculationResult, setCalculationResult] = useState<number | null>(null);
  const [selectedUnitDetails, setSelectedUnitDetails] = useState<any>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  
  // Reset dependent fields when zone changes
  useEffect(() => {
    setSelectedPropertyType('');
    setSelectedBuilding('');
    setSelectedUnitId('');
    setSelectedUnitDetails(null);
    setCalculationResult(null);
  }, [selectedZone]);
  
  // Reset dependent fields when property type changes
  useEffect(() => {
    setSelectedBuilding('');
    setSelectedUnitId('');
    setSelectedUnitDetails(null);
    setCalculationResult(null);
  }, [selectedPropertyType]);
  
  // Reset dependent fields when building changes
  useEffect(() => {
    setSelectedUnitId('');
    setSelectedUnitDetails(null);
    setCalculationResult(null);
  }, [selectedBuilding]);
  
  // Update unit details when unit is selected
  useEffect(() => {
    if (!selectedUnitId) {
      setSelectedUnitDetails(null);
      return;
    }
    
    const units = getAvailableUnits();
    const selectedUnit = units.find(unit => unit.id === selectedUnitId);
    
    if (selectedUnit) {
      setSelectedUnitDetails(selectedUnit);
      setUseCustomBua(false);
    } else {
      setSelectedUnitDetails(null);
    }
    
    setCalculationResult(null);
  }, [selectedUnitId]);
  
  // Get available property types based on selected zone
  const getAvailablePropertyTypes = () => {
    if (!selectedZone) return [];
    return mockPropertyTypes[selectedZone] || [];
  };
  
  // Get available buildings based on selected zone and property type
  const getAvailableBuildings = () => {
    if (!selectedZone || !selectedPropertyType) return [];
    
    if (mockBuildings[selectedZone] && mockBuildings[selectedZone][selectedPropertyType]) {
      return mockBuildings[selectedZone][selectedPropertyType];
    }
    
    return [];
  };
  
  // Get available units based on selections
  const getAvailableUnits = () => {
    if (!selectedZone || !selectedPropertyType) return [];
    
    if (mockUnits[selectedZone] && mockUnits[selectedZone][selectedPropertyType]) {
      // If building selection is required (like for apartments)
      if (typeof mockUnits[selectedZone][selectedPropertyType] === 'object' && !Array.isArray(mockUnits[selectedZone][selectedPropertyType])) {
        if (selectedBuilding) {
          return mockUnits[selectedZone][selectedPropertyType][selectedBuilding] || [];
        }
        return [];
      }
      
      // If no building selection is required (like for villas)
      return mockUnits[selectedZone][selectedPropertyType];
    }
    
    return [];
  };
  
  // Check if building selection is required based on zone and property type
  const isBuildingSelectionRequired = () => {
    return selectedZone && 
           selectedPropertyType && 
           mockUnits[selectedZone] && 
           mockUnits[selectedZone][selectedPropertyType] && 
           typeof mockUnits[selectedZone][selectedPropertyType] === 'object' && 
           !Array.isArray(mockUnits[selectedZone][selectedPropertyType]);
  };
  
  // Format building display name
  const formatBuildingName = (buildingId: string) => {
    if (selectedZone === '3' && selectedPropertyType === 'Apartment') {
      return `Building ${buildingId}`;
    }
    return buildingId;
  };
  
  // Calculate the reserve fund contribution
  const handleCalculate = () => {
    setIsCalculating(true);
    
    // Validate inputs
    if (!selectedZone) {
      toast({
        title: "Selection Required",
        description: "Please select a zone.",
        variant: "destructive"
      });
      setIsCalculating(false);
      return;
    }
    
    let buaValue: number = 0;
    
    if (useCustomBua) {
      // Use custom BUA
      if (!customBua || isNaN(parseFloat(customBua)) || parseFloat(customBua) <= 0) {
        toast({
          title: "Invalid BUA",
          description: "Please enter a valid BUA value greater than 0.",
          variant: "destructive"
        });
        setIsCalculating(false);
        return;
      }
      buaValue = parseFloat(customBua);
    } else {
      // Use selected unit's BUA
      if (!selectedUnitDetails || selectedUnitDetails.bua === null || selectedUnitDetails.bua === undefined) {
        toast({
          title: "Selection Required",
          description: "Please select a unit with a valid BUA value.",
          variant: "destructive"
        });
        setIsCalculating(false);
        return;
      }
      buaValue = selectedUnitDetails.bua;
    }
    
    // Perform the calculation
    try {
      // Simulate a delay for UX
      setTimeout(() => {
        const propertyType = selectedUnitDetails?.type || selectedPropertyType;
        const contribution = calculateTotalContribution(buaValue, selectedZone, propertyType, calculationYear);
        setCalculationResult(contribution);
        setIsCalculating(false);
      }, 500);
    } catch (error) {
      console.error("Calculation error:", error);
      toast({
        title: "Calculation Error",
        description: "An error occurred during calculation. Please try again.",
        variant: "destructive"
      });
      setIsCalculating(false);
    }
  };
  
  // Reset the form
  const handleReset = () => {
    setSelectedZone('');
    setSelectedPropertyType('');
    setSelectedBuilding('');
    setSelectedUnitId('');
    setUseCustomBua(false);
    setCustomBua('');
    setCalculationResult(null);
    setSelectedUnitDetails(null);
  };
  
  // Get rate information for display
  const getRateInformation = () => {
    if (!selectedZone) return null;
    
    const propertyType = selectedUnitDetails?.type || selectedPropertyType;
    const baseRate = getBaseRateForZone(selectedZone, propertyType);
    const adjustedRate = calculateAdjustedRate(baseRate, calculationYear);
    
    return {
      baseRate: baseRate.toFixed(3),
      adjustedRate: adjustedRate.toFixed(3),
      year: calculationYear
    };
  };
  
  const rateInfo = getRateInformation();
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-xl flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Reserve Fund Calculator
          </CardTitle>
          <CardDescription>
            Calculate reserve fund contributions based on property details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Property Selection Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Zone Selection */}
              <div className="space-y-2">
                <Label htmlFor="zone">Zone</Label>
                <Select
                  value={selectedZone}
                  onValueChange={setSelectedZone}
                >
                  <SelectTrigger id="zone">
                    <SelectValue placeholder="Select zone" />
                  </SelectTrigger>
                  <SelectContent>
                    {mockZones.map(zone => (
                      <SelectItem key={zone.id} value={zone.id}>
                        {zone.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Property Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={selectedPropertyType}
                  onValueChange={setSelectedPropertyType}
                  disabled={!selectedZone}
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {getAvailablePropertyTypes().map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Building Selection (if needed) */}
              {isBuildingSelectionRequired() && (
                <div className="space-y-2">
                  <Label htmlFor="building">Building</Label>
                  <Select
                    value={selectedBuilding}
                    onValueChange={setSelectedBuilding}
                    disabled={!selectedPropertyType}
                  >
                    <SelectTrigger id="building">
                      <SelectValue placeholder="Select building" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableBuildings().map(building => (
                        <SelectItem key={building} value={building}>
                          {formatBuildingName(building)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {/* Year Selection */}
              <div className="space-y-2">
                <Label htmlFor="year">Calculation Year</Label>
                <Select
                  value={calculationYear.toString()}
                  onValueChange={(value) => setCalculationYear(parseInt(value))}
                >
                  <SelectTrigger id="year">
                    <SelectValue placeholder="Select year" />
                  </SelectTrigger>
                  <SelectContent>
                    {[2023, 2024, 2025, 2026, 2027, 2028].map(year => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Unit Selection */}
            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Select
                value={selectedUnitId}
                onValueChange={setSelectedUnitId}
                disabled={isBuildingSelectionRequired() ? !selectedBuilding : !selectedPropertyType}
              >
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableUnits().map(unit => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitNo} - {unit.type} {unit.ownerName ? `(${unit.ownerName})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Custom BUA Option */}
            <div className="flex items-center space-x-2 pt-4">
              <input
                type="checkbox"
                id="useCustomBua"
                checked={useCustomBua}
                onChange={() => setUseCustomBua(!useCustomBua)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="useCustomBua" className="text-sm font-normal">
                Use custom BUA value instead of selected unit
              </Label>
            </div>
            
            {useCustomBua && (
              <div className="space-y-2">
                <Label htmlFor="customBua">Custom BUA (sqm)</Label>
                <Input
                  id="customBua"
                  type="number"
                  placeholder="Enter BUA in square meters"
                  value={customBua}
                  onChange={(e) => setCustomBua(e.target.value)}
                />
              </div>
            )}
            
            {selectedUnitDetails && !useCustomBua && (
              <div className="bg-muted p-4 rounded-md mt-4">
                <h3 className="font-medium text-sm mb-2">Selected Unit Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-muted-foreground">Unit No:</div>
                  <div>{selectedUnitDetails.unitNo}</div>
                  
                  <div className="text-muted-foreground">Type:</div>
                  <div>{selectedUnitDetails.type}</div>
                  
                  <div className="text-muted-foreground">BUA:</div>
                  <div>{selectedUnitDetails.bua !== null ? `${selectedUnitDetails.bua} sqm` : 'N/A'}</div>
                  
                  <div className="text-muted-foreground">Owner:</div>
                  <div>{selectedUnitDetails.ownerName || 'N/A'}</div>
                  
                  <div className="text-muted-foreground">Status:</div>
                  <div>{selectedUnitDetails.status || 'N/A'}</div>
                  
                  {selectedUnitDetails.reserveFund && (
                    <>
                      <div className="text-muted-foreground">RF Contribution (2025):</div>
                      <div>OMR {selectedUnitDetails.reserveFund}</div>
                    </>
                  )}
                </div>
              </div>
            )}
            
            {selectedZone && rateInfo && (
              <div className="bg-blue-50 p-4 rounded-md mt-2">
                <h3 className="font-medium text-sm mb-2 text-blue-900">Rate Information</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-blue-700">Zone:</div>
                  <div>{getZoneDisplayName(selectedZone)}</div>
                  
                  <div className="text-blue-700">Base Rate (2021):</div>
                  <div>OMR {rateInfo.baseRate} per sqm</div>
                  
                  <div className="text-blue-700">Adjusted Rate ({rateInfo.year}):</div>
                  <div>OMR {rateInfo.adjustedRate} per sqm</div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-between pt-2">
          <Button variant="outline" onClick={handleReset}>
            Reset
          </Button>
          <Button 
            onClick={handleCalculate} 
            disabled={isCalculating || (!selectedUnitDetails && !useCustomBua) || (useCustomBua && !customBua)}
          >
            {isCalculating ? 'Calculating...' : 'Calculate'}
          </Button>
        </CardFooter>
      </Card>
      
      {/* Results Card */}
      {calculationResult !== null && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-xl text-green-800">Calculation Results</CardTitle>
            <CardDescription className="text-green-700">
              Reserve Fund Contribution for {calculationYear}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid place-items-center py-4">
                <div className="text-xs text-green-700 mb-1">Annual Contribution</div>
                <div className="text-4xl font-bold text-green-800">
                  OMR {calculationResult.toFixed(2)}
                </div>
                <div className="text-sm text-green-700 mt-1">
                  (Monthly: OMR {(calculationResult / 12).toFixed(2)})
                </div>
              </div>
              
              <div className="bg-white bg-opacity-60 p-4 rounded-md border border-green-200">
                <h3 className="font-medium text-sm mb-2 text-green-900">Calculation Breakdown</h3>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="col-span-2 text-green-800">BUA (Area):</div>
                  <div className="text-right font-medium">
                    {useCustomBua ? customBua : selectedUnitDetails?.bua} sqm
                  </div>
                  
                  <div className="col-span-2 text-green-800">Rate per sqm:</div>
                  <div className="text-right font-medium">
                    OMR {rateInfo?.adjustedRate}
                  </div>
                  
                  <div className="col-span-2 text-green-800 font-medium">Annual Contribution:</div>
                  <div className="text-right font-bold">
                    OMR {calculationResult.toFixed(2)}
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-green-600 text-center">
                Calculation based on the Reserve Fund Study with annual escalation of 0.5%
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReserveFundCalculator;
