
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp, Printer, Download } from 'lucide-react';
import { OperatingExpense, ReserveFundRate } from '@/types/expenses';

interface Property {
  id: string;
  name: string;
  zone: string;
  size: number;
  type: string;
  hasLift: boolean;
  typeName: string;
}

interface ServiceChargeCalculatorProps {
  zones: { id: string, name: string }[];
  operatingExpenses: OperatingExpense[];
  reserveFundRates: ReserveFundRate[];
  properties: Property[];
}

const ServiceChargeCalculator: React.FC<ServiceChargeCalculatorProps> = ({ 
  zones, 
  operatingExpenses, 
  reserveFundRates,
  properties 
}) => {
  // State for form selections
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [propertySize, setPropertySize] = useState<string>('');
  const [hasLiftAccess, setHasLiftAccess] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  const [showCalculation, setShowCalculation] = useState<boolean>(false);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  
  // State for available options
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<string[]>([]);
  const [availableProperties, setAvailableProperties] = useState<Property[]>([]);

  // Update available property types when zone changes
  useEffect(() => {
    if (selectedZone) {
      const filteredProperties = properties.filter(p => p.zone === selectedZone);
      
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
  }, [selectedZone, properties]);
  
  // Update available properties when property type changes
  useEffect(() => {
    if (selectedZone && selectedPropertyType) {
      const filteredProperties = properties.filter(
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
  }, [selectedZone, selectedPropertyType, properties]);
  
  // Update property details when property is selected
  useEffect(() => {
    if (selectedProperty) {
      const selectedProp = properties.find(p => p.id === selectedProperty);
      if (selectedProp) {
        setPropertySize(selectedProp.size.toString());
        setHasLiftAccess(selectedProp.hasLift);
      }
    }
  }, [selectedProperty, properties]);

  // Calculate service charges
  const calculateServiceCharge = () => {
    if (!selectedZone || !propertySize) return;
    
    // Get zone-specific data
    const reserveRate = reserveFundRates.find(r => r.zone === selectedZone)?.rate || 0.40; // Default to Zaha rate
    
    // Calculate total operating expenses
    const totalExpenses = operatingExpenses.reduce((sum, expense) => sum + expense.annual, 0);
    const liftExpenses = operatingExpenses.find(e => e.category === 'Lift Maintenance')?.annual || 0;
    const nonLiftExpenses = totalExpenses - liftExpenses;
    
    // Calculate total BUA for all properties
    const totalBUA = properties.reduce((sum, prop) => sum + prop.size, 0);
    const liftBUA = properties.filter(p => p.hasLift).reduce((sum, prop) => sum + prop.size, 0);
    
    // Calculate base rates - OMR per sqm
    const baseRate = nonLiftExpenses / totalBUA;
    const liftRate = liftExpenses / liftBUA;
    
    // Calculate this property's charges
    const propSize = parseFloat(propertySize);
    const operatingShare = baseRate * propSize;
    const liftShare = hasLiftAccess ? liftRate * propSize : 0;
    
    // Reserve fund using the rate in OMR per sqm
    const reserveContribution = reserveRate * propSize;
    
    const totalAnnual = operatingShare + liftShare + reserveContribution;
    const quarterly = totalAnnual / 4;
    const monthly = totalAnnual / 12;
    
    // Expense breakdown
    const expenseBreakdown = operatingExpenses.map(expense => {
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
        amount
      };
    });
    
    // Set calculation result
    setCalculationResult({
      propertyId: selectedProperty,
      propertyName: properties.find(p => p.id === selectedProperty)?.name || "Custom Property",
      propertySize: propSize,
      zone: zones.find(z => z.id === selectedZone)?.name || selectedZone,
      hasLiftAccess,
      baseRate,
      liftRate,
      reserveRate,
      operatingShare,
      liftShare,
      reserveContribution,
      totalAnnual,
      quarterly,
      monthly,
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
    setShowBreakdown(false);
  };
  
  const handlePrint = () => {
    window.print();
  };
  
  const handleExportPDF = () => {
    // Placeholder for PDF export functionality
    alert('PDF export functionality would be implemented here');
  };

  // Render the calculator form
  const renderCalculatorForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>Service Charge Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-muted-foreground mb-6">
          Calculate service charges for any property based on size and location
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="zone">Zone</Label>
              <Select 
                value={selectedZone}
                onValueChange={setSelectedZone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Selecting a zone will filter the available property types</p>
            </div>
            
            {selectedZone && (
              <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select 
                  value={selectedPropertyType}
                  onValueChange={setSelectedPropertyType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Property Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePropertyTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Selecting a property type will filter the available properties</p>
              </div>
            )}
          </div>
          
          {selectedZone && selectedPropertyType && (
            <div className="space-y-2">
              <Label htmlFor="property">Select Property ({availableProperties.length} properties available)</Label>
              <Select 
                value={selectedProperty}
                onValueChange={setSelectedProperty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Property" />
                </SelectTrigger>
                <SelectContent>
                  {availableProperties.map(property => (
                    <SelectItem key={property.id} value={property.id}>{property.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Selecting a property will auto-fill the size</p>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="size">Property Size (sqm)</Label>
              <Input 
                id="size"
                type="number" 
                value={propertySize}
                onChange={(e) => setPropertySize(e.target.value)}
                placeholder="Enter property size in square meters"
              />
            </div>
            
            <div className="flex items-center pt-8">
              <Checkbox 
                id="liftAccess"
                checked={hasLiftAccess}
                onCheckedChange={(checked) => setHasLiftAccess(checked as boolean)}
              />
              <Label htmlFor="liftAccess" className="ml-2">
                Property has lift access
              </Label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline"
              onClick={resetForm}
            >
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
  );
  
  // Render calculation results
  const renderCalculationResults = () => {
    if (!calculationResult) return null;
    
    return (
      <Card className="mt-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Service Charge Calculation Results</CardTitle>
            <div className="flex space-x-2">
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handlePrint}
                title="Print"
              >
                <Printer size={18} />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                onClick={handleExportPDF}
                title="Export PDF"
              >
                <Download size={18} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Property Information</h3>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-y-2">
                  <div className="text-sm text-muted-foreground">Property:</div>
                  <div className="font-medium">{calculationResult.propertyName}</div>
                  
                  <div className="text-sm text-muted-foreground">Zone:</div>
                  <div className="font-medium">{calculationResult.zone}</div>
                  
                  <div className="text-sm text-muted-foreground">Size:</div>
                  <div className="font-medium">{calculationResult.propertySize.toLocaleString()} sqm</div>
                  
                  <div className="text-sm text-muted-foreground">Lift Access:</div>
                  <div className="font-medium">{calculationResult.hasLiftAccess ? 'Yes' : 'No'}</div>
                  
                  <div className="text-sm text-muted-foreground">Calculation Date:</div>
                  <div className="font-medium">{calculationResult.calculationDate}</div>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-3">Service Charge Summary</h3>
              <div className="bg-primary/10 p-4 rounded-lg">
                <div className="grid grid-cols-2 gap-y-3">
                  <div className="text-sm text-muted-foreground">Base Operating Rate:</div>
                  <div className="font-medium">OMR {calculationResult.baseRate.toFixed(3)} per sqm</div>
                  
                  {calculationResult.hasLiftAccess && (
                    <>
                      <div className="text-sm text-muted-foreground">Lift Maintenance Rate:</div>
                      <div className="font-medium">OMR {calculationResult.liftRate.toFixed(3)} per sqm</div>
                    </>
                  )}
                  
                  <div className="text-sm text-muted-foreground">Reserve Fund Rate:</div>
                  <div className="font-medium">OMR {calculationResult.reserveRate.toFixed(3)} per sqm</div>
                  
                  <div className="col-span-2 border-t border-primary/20 my-2"></div>
                  
                  <div className="text-sm text-muted-foreground">Annual Service Charge:</div>
                  <div className="font-bold">{formatCurrency(calculationResult.totalAnnual, 'OMR')}</div>
                  
                  <div className="text-sm text-muted-foreground">Quarterly Payment:</div>
                  <div className="font-medium">{formatCurrency(calculationResult.quarterly, 'OMR')}</div>
                  
                  <div className="text-sm text-muted-foreground">Monthly Payment:</div>
                  <div className="font-medium">{formatCurrency(calculationResult.monthly, 'OMR')}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Charge Breakdown</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center gap-1"
              >
                {showBreakdown ? 'Hide Details' : 'Show Details'}
                {showBreakdown ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </Button>
            </div>
            
            {showBreakdown && (
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Expense Category</TableHead>
                      <TableHead>Allocation</TableHead>
                      <TableHead className="text-right">Annual Amount (OMR)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculationResult.expenseBreakdown.map((expense: any, index: number) => (
                      <TableRow key={index} className={!expense.isApplicable ? 'text-muted-foreground' : undefined}>
                        <TableCell className="font-medium">
                          {expense.category}
                          {!expense.isApplicable && ' (Not Applicable)'}
                        </TableCell>
                        <TableCell>{expense.allocation}</TableCell>
                        <TableCell className="text-right">{expense.isApplicable ? formatCurrency(expense.amount, 'OMR') : '0.00'}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50">
                      <TableCell className="font-medium">Operating Expenses Subtotal</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(calculationResult.operatingShare + calculationResult.liftShare, 'OMR')}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-medium">Reserve Fund Contribution</TableCell>
                      <TableCell>All Units</TableCell>
                      <TableCell className="text-right">{formatCurrency(calculationResult.reserveContribution, 'OMR')}</TableCell>
                    </TableRow>
                    <TableRow className="bg-primary/10 font-bold">
                      <TableCell>TOTAL ANNUAL SERVICE CHARGE</TableCell>
                      <TableCell></TableCell>
                      <TableCell className="text-right">{formatCurrency(calculationResult.totalAnnual, 'OMR')}</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <Button 
              variant="outline"
              onClick={() => setShowCalculation(false)}
            >
              New Calculation
            </Button>
            <Button>
              Generate Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  return (
    <div className="space-y-6">
      {renderCalculatorForm()}
      {showCalculation && renderCalculationResults()}
    </div>
  );
};

export default ServiceChargeCalculator;
