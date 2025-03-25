
import React, { useState, useEffect } from 'react';
import { useServiceCharges } from '@/hooks/useServiceCharges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Calculator, ChevronDown, ChevronUp, Printer, Download } from 'lucide-react';
import { PropertyUnit, ExpenseBreakdownItem, ServiceChargeCalculation } from '@/types/serviceCharges';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const ServiceChargeCalculator: React.FC = () => {
  // State for form selections
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [propertySize, setPropertySize] = useState<string>('');
  const [hasLiftAccess, setHasLiftAccess] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<ServiceChargeCalculation | null>(null);
  const [expenseBreakdown, setExpenseBreakdown] = useState<ExpenseBreakdownItem[]>([]);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [showCalculation, setShowCalculation] = useState<boolean>(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);

  // Filtered data state
  const [availablePropertyTypes, setAvailablePropertyTypes] = useState<string[]>([]);
  const [availableProperties, setAvailableProperties] = useState<PropertyUnit[]>([]);

  const { zones, properties, loading, error, calculateServiceCharge, saveCalculation } = useServiceCharges();
  const { toast } = useToast();
  const resultRef = React.useRef<HTMLDivElement>(null);

  // Update available property types when zone changes
  useEffect(() => {
    if (selectedZone && properties.length > 0) {
      const filteredProperties = properties.filter(p => p.zoneCode === selectedZone);
      
      // Get unique property types for this zone
      const uniqueTypes = [...new Set(filteredProperties.map(p => p.unitType))];
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
    if (selectedZone && selectedPropertyType && properties.length > 0) {
      const filteredProperties = properties.filter(
        p => p.zoneCode === selectedZone && p.unitType === selectedPropertyType
      );
      setAvailableProperties(filteredProperties);
      
      // Reset property selection
      setSelectedProperty('');
      setPropertySize('');
    } else {
      setAvailableProperties([]);
    }
  }, [selectedZone, selectedPropertyType, properties]);
  
  // Update property details when property is selected
  useEffect(() => {
    if (selectedProperty && properties.length > 0) {
      const selectedProp = properties.find(p => p.id === selectedProperty);
      if (selectedProp) {
        setPropertySize(selectedProp.bua.toString());
        setHasLiftAccess(selectedProp.hasLift);
      }
    }
  }, [selectedProperty, properties]);
  
  // Calculate service charges
  const handleCalculate = () => {
    if (!selectedZone || !propertySize) {
      toast({
        title: 'Missing information',
        description: 'Please select a zone and enter property size',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      const propSize = parseFloat(propertySize);
      if (isNaN(propSize) || propSize <= 0) {
        toast({
          title: 'Invalid input',
          description: 'Property size must be a positive number',
          variant: 'destructive'
        });
        return;
      }
      
      const { calculation, breakdown } = calculateServiceCharge(
        selectedZone,
        propSize,
        hasLiftAccess,
        selectedProperty || undefined
      );
      
      setCalculationResult(calculation);
      setExpenseBreakdown(breakdown);
      setShowCalculation(true);
    } catch (err) {
      console.error('Calculation error:', err);
      toast({
        title: 'Calculation error',
        description: 'An error occurred while calculating service charges. Please try again.',
        variant: 'destructive'
      });
    }
  };
  
  // Reset form
  const resetForm = () => {
    setSelectedZone('');
    setSelectedPropertyType('');
    setSelectedProperty('');
    setPropertySize('');
    setHasLiftAccess(false);
    setCalculationResult(null);
    setExpenseBreakdown([]);
    setShowCalculation(false);
    setShowBreakdown(false);
  };
  
  // Generate PDF from the calculation
  const generatePDF = async () => {
    if (!resultRef.current || !calculationResult) return;
    
    try {
      setIsGeneratingPdf(true);
      
      // Capture the result section as an image
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        logging: false,
        useCORS: true
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      
      // Add title
      pdf.setFontSize(18);
      pdf.text('Service Charge Calculation', 105, 15, { align: 'center' });
      
      // Add date
      pdf.setFontSize(10);
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
      
      // Calculate aspect ratio to fit on page
      const imgWidth = 190;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Add image to PDF
      pdf.addImage(imgData, 'PNG', 10, 30, imgWidth, imgHeight);
      
      // Add footnote
      pdf.setFontSize(8);
      pdf.text('Generated by Muscat Bay Asset Manager', 105, 285, { align: 'center' });
      
      // Download the PDF
      pdf.save(`Service_Charge_Calculation_${new Date().toISOString().slice(0, 10)}.pdf`);
      
      toast({
        title: 'Success',
        description: 'PDF generated successfully'
      });
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast({
        title: 'Error',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // Save calculation to database
  const handleSaveCalculation = async () => {
    if (!calculationResult) return;
    
    try {
      await saveCalculation(calculationResult);
    } catch (err) {
      console.error('Error saving calculation:', err);
    }
  };
  
  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <div className="flex justify-end space-x-3 pt-4">
                <Skeleton className="h-9 w-24" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Service Charge Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
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
                    <SelectItem key={zone.code} value={zone.code}>
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
                        {property.unitNo} - {property.unitType}
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
                value={propertySize}
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
                onClick={handleCalculate}
                disabled={!selectedZone || !propertySize}
              >
                Calculate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {showCalculation && calculationResult && (
        <Card ref={resultRef}>
          <CardHeader>
            <CardTitle>Service Charge Calculation Results</CardTitle>
            <CardDescription>
              Calculated on {new Date(calculationResult.calculationDate).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Property Information</h3>
                <div className="bg-muted p-4 rounded">
                  <div className="grid grid-cols-2 gap-y-2">
                    <div className="text-sm text-muted-foreground">Property ID:</div>
                    <div className="font-medium">
                      {selectedProperty ? 
                        properties.find(p => p.id === selectedProperty)?.unitNo || "Custom" : 
                        "Custom"}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">Zone:</div>
                    <div className="font-medium">
                      {zones.find(z => z.code === calculationResult.zoneCode)?.name || calculationResult.zoneCode}
                    </div>
                    
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
                    <div className="font-semibold">OMR {calculationResult.totalAnnual.toFixed(2)}</div>
                    
                    <div className="text-sm text-muted-foreground">Quarterly Payment:</div>
                    <div className="font-medium">OMR {calculationResult.quarterly.toFixed(2)}</div>
                    
                    <div className="text-sm text-muted-foreground">Monthly Payment:</div>
                    <div className="font-medium">OMR {calculationResult.monthly.toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-medium">Detailed Breakdown</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowBreakdown(!showBreakdown)}
                className="flex items-center"
              >
                {showBreakdown ? 'Hide Details' : 'Show Details'}
                {showBreakdown ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
              </Button>
            </div>
            
            {showBreakdown && (
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
                    {expenseBreakdown.map((expense, index) => (
                      <tr key={index} className={`border-b ${!expense.isApplicable ? 'text-muted-foreground' : ''}`}>
                        <td className="py-2 px-4">
                          {expense.category}
                          {!expense.isApplicable && ' (Not Applicable)'}
                        </td>
                        <td className="py-2 px-4">{expense.allocation}</td>
                        <td className="py-2 px-4 text-right">{expense.isApplicable ? expense.amount.toFixed(2) : '0.00'}</td>
                      </tr>
                    ))}
                    <tr className="bg-muted/50 border-b">
                      <td className="py-2 px-4 font-medium">Operating Expenses Subtotal</td>
                      <td className="py-2 px-4"></td>
                      <td className="py-2 px-4 text-right font-medium">
                        {(calculationResult.operatingShare + calculationResult.liftShare).toFixed(2)}
                      </td>
                    </tr>
                    <tr className="border-b">
                      <td className="py-2 px-4">Reserve Fund Contribution</td>
                      <td className="py-2 px-4">All Units</td>
                      <td className="py-2 px-4 text-right">{calculationResult.reserveContribution.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-primary/10 font-semibold">
                      <td className="py-3 px-4">TOTAL ANNUAL SERVICE CHARGE</td>
                      <td className="py-3 px-4"></td>
                      <td className="py-3 px-4 text-right">{calculationResult.totalAnnual.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="flex justify-end space-x-3 mt-6">
              <Button 
                variant="outline" 
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className="flex items-center"
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download PDF
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCalculation(false)}
              >
                New Calculation
              </Button>
              <Button
                onClick={handleSaveCalculation}
              >
                Save Calculation
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServiceChargeCalculator;
