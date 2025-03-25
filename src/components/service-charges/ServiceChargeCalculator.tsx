
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ServiceChargeCalculatorProps, OperatingExpenseDisplay } from '@/types/expenses';
import { Calculator } from 'lucide-react';

interface PropertyData {
  id: string;
  name: string;
  zone: string;
  size: number;
  type: string;
  hasLift: boolean;
  typeName: string;
}

interface CalculationResult {
  propertyId: string;
  propertySize: number | string;
  zone: string;
  hasLiftAccess: boolean;
  baseRate: string;
  liftRate: string;
  reserveRate: string;
  operatingShare: string;
  liftShare: string;
  reserveContribution: string;
  totalAnnual: string;
  quarterly: string;
  monthly: string;
  expenseBreakdown: Array<{
    category: string;
    supplier: string;
    annual: number;
    allocation: string;
    isApplicable: boolean;
    amount: string;
  }>;
  calculationDate: string;
}

const ServiceChargeCalculator: React.FC<ServiceChargeCalculatorProps> = ({ expenses, reserveFundRates }) => {
  // State for form selections
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [selectedProperty, setSelectedProperty] = useState('');
  const [propertySize, setPropertySize] = useState<string | number>('');
  const [hasLiftAccess, setHasLiftAccess] = useState(false);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [showCalculation, setShowCalculation] = useState(false);
  
  // Sample data for zones and properties
  const zones = [
    { id: 'zone03', name: 'Zone 03 - Residential Area (Zaha)' },
    { id: 'zone05', name: 'Zone 05 - Residential Area (Nameer)' },
    { id: 'zone08', name: 'Zone 08 - Residential Area (Wajd)' },
    { id: 'commercial', name: 'Commercial Area' },
    { id: 'staff', name: 'Staff Accommodation' }
  ];
  
  const propertiesData: PropertyData[] = [
    { id: 'Z3_050(1)', name: 'Z3 050(1) - 2 Bedroom Premium Apartment', zone: 'zone03', size: 199.13, type: 'apartment', hasLift: true, typeName: 'Apartment (With Lift)' },
    { id: 'Z3_057(5)', name: 'Z3 057(5) - 3 Bedroom Zaha Apartment', zone: 'zone03', size: 355.07, type: 'apartment', hasLift: true, typeName: 'Apartment (With Lift)' },
    { id: 'Z3_019', name: 'Z3 019 - 3 Bedroom Zaha Villa', zone: 'zone03', size: 357.12, type: 'villa', hasLift: false, typeName: 'Villa (Without Lift)' },
    { id: 'Z5_008', name: 'Z5 008 - 4 Bedroom Nameer Villa', zone: 'zone05', size: 497.62, type: 'villa', hasLift: false, typeName: 'Villa (Without Lift)' },
    { id: 'Z8_007', name: 'Z8 007 - 5 Bedroom Wajd Villa', zone: 'zone08', size: 750.35, type: 'villa', hasLift: false, typeName: 'Villa (Without Lift)' },
    { id: 'C_01', name: 'Commercial Unit 01', zone: 'commercial', size: 250, type: 'shop', hasLift: false, typeName: 'Commercial Space' },
    { id: 'S_01', name: 'Staff Accommodation 01', zone: 'staff', size: 85, type: 'studio', hasLift: false, typeName: 'Studio Apartment' }
  ];
  
  // State for available options
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<string[]>([]);
  const [availableProperties, setAvailableProperties] = useState<PropertyData[]>([]);
  
  // Update available property types when zone changes
  useEffect(() => {
    if (selectedZone) {
      const filteredProperties = propertiesData.filter(p => p.zone === selectedZone);
      
      // Get unique property types for this zone
      const uniqueTypes = [...new Set(filteredProperties.map(p => p.typeName))];
      setAvailablePropertyTypes(uniqueTypes);
      
      // Reset selections
      setSelectedPropertyType('');
      setSelectedProperty('');
      setPropertySize('');
      setHasLiftAccess(false);
    } else {
      setAvailablePropertyTypes([]);
    }
  }, [selectedZone]);
  
  // Update available properties when property type changes
  useEffect(() => {
    if (selectedZone && selectedPropertyType) {
      const filteredProperties = propertiesData.filter(
        p => p.zone === selectedZone && p.typeName === selectedPropertyType
      );
      setAvailableProperties(filteredProperties);
      
      // Reset property selection
      setSelectedProperty('');
      setPropertySize('');
      
      // Set lift access based on property type
      setHasLiftAccess(selectedPropertyType.includes('Lift'));
    } else {
      setAvailableProperties([]);
    }
  }, [selectedZone, selectedPropertyType]);
  
  // Update property details when property is selected
  useEffect(() => {
    if (selectedProperty) {
      const selectedProp = propertiesData.find(p => p.id === selectedProperty);
      if (selectedProp) {
        setPropertySize(selectedProp.size);
        setHasLiftAccess(selectedProp.hasLift);
      }
    }
  }, [selectedProperty]);
  
  // Calculate service charges
  const calculateServiceCharge = () => {
    if (!selectedZone || !propertySize) return;
    
    // Get zone-specific data
    const selectedRateObj = reserveFundRates.find(r => r.zone === selectedZone);
    const reserveRate = selectedRateObj ? selectedRateObj.rate : 0.40; // Default to Zaha rate if not found
    
    // Calculate total operating expenses
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.annual, 0);
    const liftExpense = expenses.find(e => e.category === 'Lift Maintenance');
    const liftExpenses = liftExpense ? liftExpense.annual : 0;
    const nonLiftExpenses = totalExpenses - liftExpenses;
    
    // Calculate total BUA for all properties (simplified for demo)
    const totalBUA = propertiesData.reduce((sum, prop) => sum + prop.size, 0);
    const liftBUA = propertiesData.filter(p => p.hasLift).reduce((sum, prop) => sum + prop.size, 0);
    
    // Calculate base rates - OMR per sqm
    const baseRate = nonLiftExpenses / totalBUA;
    const liftRate = liftBUA > 0 ? liftExpenses / liftBUA : 0;
    
    const propSize = typeof propertySize === 'string' ? parseFloat(propertySize) : propertySize;
    
    // Calculate this property's charges
    const operatingShare = baseRate * propSize;
    const liftShare = hasLiftAccess ? liftRate * propSize : 0;
    
    // Reserve fund using the rate in OMR per sqm
    const reserveContribution = reserveRate * propSize;
    
    const totalAnnual = operatingShare + liftShare + reserveContribution;
    const quarterly = totalAnnual / 4;
    const monthly = totalAnnual / 12;
    
    // Expense breakdown
    const expenseBreakdown = expenses.map(expense => {
      const isApplicable = expense.category !== 'Lift Maintenance' || hasLiftAccess;
      let amount = 0;
      
      if (isApplicable) {
        if (expense.category === 'Lift Maintenance') {
          amount = liftRate * propSize;
        } else {
          amount = (expense.annual / nonLiftExpenses) * operatingShare;
        }
      }
      
      return {
        ...expense,
        isApplicable,
        amount: amount.toFixed(2)
      };
    });
    
    // Set calculation result
    setCalculationResult({
      propertyId: selectedProperty,
      propertySize,
      zone: zones.find(z => z.id === selectedZone)?.name || selectedZone,
      hasLiftAccess,
      baseRate: baseRate.toFixed(3),
      liftRate: liftRate.toFixed(3),
      reserveRate: reserveRate.toFixed(3),
      operatingShare: operatingShare.toFixed(2),
      liftShare: liftShare.toFixed(2),
      reserveContribution: reserveContribution.toFixed(2),
      totalAnnual: totalAnnual.toFixed(2),
      quarterly: quarterly.toFixed(2),
      monthly: monthly.toFixed(2),
      expenseBreakdown,
      calculationDate: new Date().toLocaleDateString()
    });
    
    setShowCalculation(true);
  };
  
  const resetForm = () => {
    setSelectedZone('');
    setSelectedPropertyType('');
    setSelectedProperty('');
    setPropertySize('');
    setHasLiftAccess(false);
    setCalculationResult(null);
    setShowCalculation(false);
  };
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calculator className="h-5 w-5 mr-2" />
            Service Charge Calculator
          </CardTitle>
          <CardDescription>
            Calculate service charges for any property based on size and location
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="zone">Zone</Label>
              <Select
                value={selectedZone}
                onValueChange={setSelectedZone}
              >
                <SelectTrigger id="zone">
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Selecting a zone will filter the available property types
              </p>
            </div>
            
            {selectedZone && (
              <div className="grid gap-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select
                  value={selectedPropertyType}
                  onValueChange={setSelectedPropertyType}
                >
                  <SelectTrigger id="propertyType">
                    <SelectValue placeholder="Select property type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePropertyTypes.map(type => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecting a property type will filter the available properties
                </p>
              </div>
            )}
            
            {selectedZone && selectedPropertyType && (
              <div className="grid gap-2">
                <Label htmlFor="property">Select Property ({availableProperties.length} properties available)</Label>
                <Select
                  value={selectedProperty}
                  onValueChange={setSelectedProperty}
                >
                  <SelectTrigger id="property">
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableProperties.map(property => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Selecting a property will auto-fill the size
                </p>
              </div>
            )}
            
            <div className="grid gap-2">
              <Label htmlFor="size">Property Size (sqm)</Label>
              <Input
                id="size"
                type="number"
                value={propertySize.toString()}
                onChange={(e) => setPropertySize(e.target.value)}
                placeholder="Enter property size in square meters"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="liftAccess"
                checked={hasLiftAccess}
                onCheckedChange={(checked) => setHasLiftAccess(checked === true)}
              />
              <Label htmlFor="liftAccess">
                Property has lift access
              </Label>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="outline" onClick={resetForm}>
                Reset
              </Button>
              <Button 
                onClick={calculateServiceCharge}
                disabled={!selectedZone || !propertySize}
              >
                Calculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showCalculation && calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Service Charge Calculation Results</CardTitle>
            <CardDescription>
              Calculated on {calculationResult.calculationDate}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Property Information</h3>
                <div className="bg-muted p-4 rounded">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-sm text-muted-foreground">Property ID:</div>
                    <div className="font-medium">{calculationResult.propertyId || "Custom"}</div>
                    
                    <div className="text-sm text-muted-foreground">Zone:</div>
                    <div className="font-medium">{calculationResult.zone}</div>
                    
                    <div className="text-sm text-muted-foreground">Size:</div>
                    <div className="font-medium">{calculationResult.propertySize} sqm</div>
                    
                    <div className="text-sm text-muted-foreground">Lift Access:</div>
                    <div className="font-medium">{calculationResult.hasLiftAccess ? 'Yes' : 'No'}</div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Service Charge Summary</h3>
                <div className="bg-primary/10 p-4 rounded">
                  <div className="grid grid-cols-2 gap-y-3">
                    <div className="text-sm text-muted-foreground">Base Operating Rate:</div>
                    <div className="font-medium">OMR {calculationResult.baseRate} per sqm</div>
                    
                    {calculationResult.hasLiftAccess && (
                      <>
                        <div className="text-sm text-muted-foreground">Lift Maintenance Rate:</div>
                        <div className="font-medium">OMR {calculationResult.liftRate} per sqm</div>
                      </>
                    )}
                    
                    <div className="text-sm text-muted-foreground">Reserve Fund Rate:</div>
                    <div className="font-medium">OMR {calculationResult.reserveRate} per sqm</div>
                    
                    <div className="col-span-2 border-t border-primary/20 my-2"></div>
                    
                    <div className="text-sm text-muted-foreground">Annual Service Charge:</div>
                    <div className="font-semibold">OMR {calculationResult.totalAnnual}</div>
                    
                    <div className="text-sm text-muted-foreground">Quarterly Payment:</div>
                    <div className="font-medium">OMR {calculationResult.quarterly}</div>
                    
                    <div className="text-sm text-muted-foreground">Monthly Payment:</div>
                    <div className="font-medium">OMR {calculationResult.monthly}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <h3 className="text-lg font-medium mb-3">Detailed Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 px-4 text-left">Expense Category</th>
                    <th className="py-2 px-4 text-left">Allocation</th>
                    <th className="py-2 px-4 text-right">Annual Amount (OMR)</th>
                  </tr>
                </thead>
                <tbody>
                  {calculationResult.expenseBreakdown.map((expense, index) => (
                    <tr key={index} className={`border-b ${!expense.isApplicable ? 'text-muted-foreground' : ''}`}>
                      <td className="py-2 px-4">
                        {expense.category}
                        {!expense.isApplicable && ' (Not Applicable)'}
                      </td>
                      <td className="py-2 px-4">{expense.allocation}</td>
                      <td className="py-2 px-4 text-right">{expense.isApplicable ? expense.amount : '0.00'}</td>
                    </tr>
                  ))}
                  <tr className="bg-muted/50 border-b">
                    <td className="py-2 px-4 font-medium">Operating Expenses Subtotal</td>
                    <td className="py-2 px-4"></td>
                    <td className="py-2 px-4 text-right font-medium">
                      {(parseFloat(calculationResult.operatingShare) + parseFloat(calculationResult.liftShare)).toFixed(2)}
                    </td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">Reserve Fund Contribution</td>
                    <td className="py-2 px-4">All Units</td>
                    <td className="py-2 px-4 text-right">{calculationResult.reserveContribution}</td>
                  </tr>
                  <tr className="bg-primary/10 font-semibold">
                    <td className="py-3 px-4">TOTAL ANNUAL SERVICE CHARGE</td>
                    <td className="py-3 px-4"></td>
                    <td className="py-3 px-4 text-right">{calculationResult.totalAnnual}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCalculation(false)}>
                New Calculation
              </Button>
              <Button>
                Generate Invoice
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceChargeCalculator;
