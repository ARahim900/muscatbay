
import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/utils';

interface PropertyUnit {
  id: string;
  name: string;
  type: string;
  area: number;
  unitFactor: number;
}

interface ContributionRate {
  id: string;
  assetType: string;
  ratePerSqMeter: number;
  baseRate: number;
}

export interface ReserveCalculatorProps {
  propertyUnits?: PropertyUnit[];
  contributionRates?: ContributionRate[];
}

export const ReserveCalculator: React.FC<ReserveCalculatorProps> = ({ 
  propertyUnits = [], 
  contributionRates = []
}) => {
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [selectedRate, setSelectedRate] = useState<string>('');
  const [contribution, setContribution] = useState<number | null>(null);
  
  const handleUnitChange = (unitId: string) => {
    setSelectedUnit(unitId);
    calculateContribution(unitId, selectedRate);
  };
  
  const handleRateChange = (rateId: string) => {
    setSelectedRate(rateId);
    calculateContribution(selectedUnit, rateId);
  };
  
  const calculateContribution = (unitId: string, rateId: string) => {
    if (!unitId || !rateId) {
      setContribution(null);
      return;
    }
    
    const unit = propertyUnits.find(u => u.id === unitId);
    const rate = contributionRates.find(r => r.id === rateId);
    
    if (!unit || !rate) {
      setContribution(null);
      return;
    }
    
    const calculatedAmount = (unit.area * rate.ratePerSqMeter * unit.unitFactor) + rate.baseRate;
    setContribution(calculatedAmount);
  };
  
  const handleCalculate = () => {
    calculateContribution(selectedUnit, selectedRate);
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Reserve Fund Calculator</CardTitle>
        <CardDescription>
          Calculate the necessary contribution to the reserve fund based on property details
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Property Unit</label>
          <Select onValueChange={handleUnitChange} value={selectedUnit}>
            <SelectTrigger>
              <SelectValue placeholder="Select a property unit" />
            </SelectTrigger>
            <SelectContent>
              {propertyUnits.length > 0 ? (
                propertyUnits.map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.name} ({unit.area} m²)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No property units available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Contribution Rate</label>
          <Select onValueChange={handleRateChange} value={selectedRate}>
            <SelectTrigger>
              <SelectValue placeholder="Select a contribution rate" />
            </SelectTrigger>
            <SelectContent>
              {contributionRates.length > 0 ? (
                contributionRates.map((rate) => (
                  <SelectItem key={rate.id} value={rate.id}>
                    {rate.assetType} ({rate.ratePerSqMeter} OMR/m²)
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>No contribution rates available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        {contribution !== null && (
          <div className="border rounded-md p-4 bg-muted/50 mt-4">
            <h3 className="text-md font-medium mb-2">Calculated Contribution</h3>
            <div className="text-2xl font-bold">{formatNumber(contribution, 2)} OMR</div>
            <p className="text-xs text-muted-foreground mt-1">Annual contribution to reserve fund</p>
          </div>
        )}
      </CardContent>
      
      <CardFooter>
        <Button onClick={handleCalculate} disabled={!selectedUnit || !selectedRate}>
          Calculate Contribution
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ReserveCalculator;
