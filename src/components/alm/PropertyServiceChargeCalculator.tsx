import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { PieChart, BarChart3, Calculator, ChevronDown, ChevronUp, Download } from 'lucide-react';
import { usePropertyServiceCharges } from '@/hooks/usePropertyServiceCharges';
import { Skeleton } from "@/components/ui/skeleton";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { format } from 'date-fns';

const PropertyServiceChargeCalculator: React.FC = () => {
  const {
    filteredProperties,
    zones,
    loading,
    error,
    filterPropertiesByZone,
    filterPropertiesBySearch
  } = usePropertyServiceCharges();
  
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [calculationResult, setCalculationResult] = useState<any>(null);
  
  const resultRef = React.useRef<HTMLDivElement>(null);
  
  // Handle zone selection change
  useEffect(() => {
    filterPropertiesByZone(selectedZone);
  }, [selectedZone]);
  
  // Handle search term change
  useEffect(() => {
    filterPropertiesBySearch(searchTerm);
  }, [searchTerm]);
  
  // Handle property selection
  useEffect(() => {
    if (selectedPropertyId) {
      const property = filteredProperties.find(p => p.propertyId === selectedPropertyId);
      setSelectedProperty(property);
      
      if (property) {
        calculateServiceCharge(property);
      }
    } else {
      setSelectedProperty(null);
      setCalculationResult(null);
    }
  }, [selectedPropertyId, filteredProperties]);
  
  // Calculate service charge for a property
  const calculateServiceCharge = (property: any) => {
    if (!property) return;
    
    // Find the zone data
    const zone = zones.find(z => z.code === property.zoneCode);
    if (!zone) return;
    
    // Calculate base service charge
    const baseRate = zone.serviceChargeRate;
    const baseCharge = baseRate * property.bua;
    
    // Calculate lift share if applicable
    const liftMaintenanceExpense = property.expenses.find((e: any) => 
      e.category.toLowerCase().includes('lift') || e.category.toLowerCase().includes('elevator')
    );
    const liftCharge = property.hasLift && liftMaintenanceExpense ? 
      (liftMaintenanceExpense.annualCost / property.bua) * property.bua : 0;
    
    // Calculate reserve fund contribution
    const reserveRate = zone.reserveFundRate;
    const reserveContribution = reserveRate * property.bua;
    
    // Calculate totals
    const totalAnnual = baseCharge + liftCharge + reserveContribution;
    const quarterly = totalAnnual / 4;
    const monthly = totalAnnual / 12;
    
    // Group expenses by category for breakdown
    const expenseBreakdown = property.expenses.map((expense: any) => {
      // Determine if expense is applicable (e.g., don't include lift expenses for properties without lifts)
      const isLiftExpense = expense.category.toLowerCase().includes('lift') || 
                           expense.category.toLowerCase().includes('elevator');
      const isApplicable = !isLiftExpense || property.hasLift;
      
      // Calculate property's share of this expense
      let amount = 0;
      if (isApplicable) {
        if (isLiftExpense) {
          amount = property.hasLift ? expense.annualCost / property.bua * property.bua : 0;
        } else {
          const totalOperatingExpenses = property.expenses
            .filter((e: any) => !(e.category.toLowerCase().includes('lift') || e.category.toLowerCase().includes('elevator')))
            .reduce((sum: number, e: any) => sum + e.annualCost, 0);
          
          amount = (expense.annualCost / totalOperatingExpenses) * baseCharge;
        }
      }
      
      return {
        category: expense.category,
        serviceProvider: expense.serviceProvider,
        allocation: expense.allocation,
        amount: amount,
        isApplicable
      };
    });
    
    setCalculationResult({
      baseRate,
      baseCharge,
      liftCharge,
      reserveRate,
      reserveContribution,
      totalAnnual,
      quarterly,
      monthly,
      expenseBreakdown,
      calculationDate: new Date().toISOString()
    });
  };
  
  // Generate PDF report
  const generatePDF = async () => {
    if (!resultRef.current || !calculationResult || !selectedProperty) return;
    
    try {
      // Capture the result div as an image
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
      
      // Add title and date
      pdf.setFontSize(18);
      pdf.text('Service Charge Calculation', 105, 15, { align: 'center' });
      
      pdf.setFontSize(12);
      pdf.text(`Property: ${selectedProperty.unitNo}`, 105, 25, { align: 'center' });
      pdf.text(`Generated on: ${format(new Date(), 'dd/MM/yyyy')}`, 105, 30, { align: 'center' });
      
      // Calculate aspect ratio to fit on page
      const imgWidth = 180;
      const imgHeight = canvas.height * imgWidth / canvas.width;
      
      // Add result image
      pdf.addImage(imgData, 'PNG', 15, 40, imgWidth, imgHeight);
      
      // Add footer
      pdf.setFontSize(10);
      pdf.text('Muscat Bay Service Charge Calculator', 105, 285, { align: 'center' });
      
      // Save PDF
      pdf.save(`Service_Charge_${selectedProperty.unitNo}_${format(new Date(), 'yyyyMMdd')}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Service Charge Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center">
            <p className="text-destructive">Error: {error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">Reload Page</Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calculator className="h-5 w-5 mr-2" />
          Property Service Charge Calculator
        </CardTitle>
        <CardDescription>
          Calculate service charges for properties based on actual property data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Selection Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Zone</label>
              <Select
                value={selectedZone}
                onValueChange={setSelectedZone}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone.code} value={zone.code}>
                      {zone.name} ({zone.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Search Property</label>
              <Input
                placeholder="Search by unit number or owner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Property</label>
              <Select
                value={selectedPropertyId}
                onValueChange={setSelectedPropertyId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a property" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProperties.length === 0 ? (
                    <SelectItem value="no-properties">No properties available</SelectItem>
                  ) : (
                    filteredProperties.map((property) => (
                      <SelectItem key={property.propertyId} value={property.propertyId}>
                        {property.unitNo} - {property.unitType} ({property.bua} sqm)
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredProperties.length} properties available
              </p>
            </div>
          </div>
          
          {/* Results Section */}
          {selectedProperty && calculationResult && (
            <div ref={resultRef} className="bg-muted/30 rounded-lg p-6 mt-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Service Charge Calculation Results</h3>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={generatePDF}
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download PDF
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-sm font-medium mb-2">Property Details</h4>
                  <div className="bg-card p-4 rounded-md shadow-sm">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                      <div className="text-muted-foreground">Unit Number:</div>
                      <div className="font-medium">{selectedProperty.unitNo}</div>
                      
                      <div className="text-muted-foreground">Zone:</div>
                      <div className="font-medium">{selectedProperty.zoneName}</div>
                      
                      <div className="text-muted-foreground">Property Type:</div>
                      <div className="font-medium">{selectedProperty.unitType}</div>
                      
                      <div className="text-muted-foreground">Built-up Area:</div>
                      <div className="font-medium">{selectedProperty.bua} sqm</div>
                      
                      <div className="text-muted-foreground">Lift Access:</div>
                      <div className="font-medium">{selectedProperty.hasLift ? 'Yes' : 'No'}</div>
                      
                      <div className="text-muted-foreground">Owner:</div>
                      <div className="font-medium">{selectedProperty.ownerName || 'Not specified'}</div>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium mb-2">Service Charge Summary</h4>
                  <div className="bg-primary/10 p-4 rounded-md shadow-sm">
                    <div className="grid grid-cols-2 gap-y-3">
                      <div className="text-sm text-muted-foreground">Base Service Charge:</div>
                      <div className="font-medium">OMR {calculationResult.baseCharge.toFixed(3)}</div>
                      
                      {calculationResult.liftCharge > 0 && (
                        <>
                          <div className="text-sm text-muted-foreground">Lift Maintenance:</div>
                          <div className="font-medium">OMR {calculationResult.liftCharge.toFixed(3)}</div>
                        </>
                      )}
                      
                      <div className="text-sm text-muted-foreground">Reserve Fund Contribution:</div>
                      <div className="font-medium">OMR {calculationResult.reserveContribution.toFixed(3)}</div>
                      
                      <div className="col-span-2 border-t border-primary/20 my-2"></div>
                      
                      <div className="text-sm text-muted-foreground">Annual Total:</div>
                      <div className="font-bold text-lg">OMR {calculationResult.totalAnnual.toFixed(3)}</div>
                      
                      <div className="text-sm text-muted-foreground">Quarterly Payment:</div>
                      <div className="font-medium">OMR {calculationResult.quarterly.toFixed(3)}</div>
                      
                      <div className="text-sm text-muted-foreground">Monthly Payment:</div>
                      <div className="font-medium">OMR {calculationResult.monthly.toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mb-2 flex justify-between items-center">
                <h4 className="text-sm font-medium">Rate Breakdown</h4>
                <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                  Calculation Date: {format(new Date(calculationResult.calculationDate), 'dd/MM/yyyy')}
                </div>
              </div>
              <div className="bg-card p-4 rounded-md shadow-sm mb-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-sm">
                  <div className="text-muted-foreground">Base Rate:</div>
                  <div className="font-medium">OMR {calculationResult.baseRate.toFixed(3)} per sqm</div>
                  
                  {selectedProperty.hasLift && (
                    <>
                      <div className="text-muted-foreground">Lift Rate:</div>
                      <div className="font-medium">Included in calculation</div>
                    </>
                  )}
                  
                  <div className="text-muted-foreground">Reserve Fund Rate:</div>
                  <div className="font-medium">OMR {calculationResult.reserveRate.toFixed(3)} per sqm</div>
                  
                  <div className="text-muted-foreground">Total Area:</div>
                  <div className="font-medium">{selectedProperty.bua} sqm</div>
                </div>
              </div>
              
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Expense Breakdown</h4>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="flex items-center text-sm"
                >
                  {showBreakdown ? 'Hide Details' : 'Show Details'}
                  {showBreakdown ? <ChevronUp className="ml-1 h-4 w-4" /> : <ChevronDown className="ml-1 h-4 w-4" />}
                </Button>
              </div>
              
              {showBreakdown && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="px-4 py-2 text-left">Expense Category</th>
                        <th className="px-4 py-2 text-left">Service Provider</th>
                        <th className="px-4 py-2 text-left">Allocation</th>
                        <th className="px-4 py-2 text-right">Amount (OMR)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {calculationResult.expenseBreakdown.map((expense: any, index: number) => (
                        <tr 
                          key={index} 
                          className={`border-b ${!expense.isApplicable ? 'text-muted-foreground' : ''}`}
                        >
                          <td className="px-4 py-2">
                            {expense.category}
                            {!expense.isApplicable && ' (Not Applicable)'}
                          </td>
                          <td className="px-4 py-2">{expense.serviceProvider}</td>
                          <td className="px-4 py-2">{expense.allocation}</td>
                          <td className="px-4 py-2 text-right">
                            {expense.isApplicable ? expense.amount.toFixed(3) : '0.000'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/50 font-medium">
                        <td className="px-4 py-2" colSpan={3}>Operating Expenses Subtotal</td>
                        <td className="px-4 py-2 text-right">
                          {(calculationResult.baseCharge + calculationResult.liftCharge).toFixed(3)}
                        </td>
                      </tr>
                      <tr className="border-b">
                        <td className="px-4 py-2" colSpan={3}>Reserve Fund Contribution</td>
                        <td className="px-4 py-2 text-right">
                          {calculationResult.reserveContribution.toFixed(3)}
                        </td>
                      </tr>
                      <tr className="bg-primary/10 font-semibold">
                        <td className="px-4 py-2" colSpan={3}>TOTAL ANNUAL SERVICE CHARGE</td>
                        <td className="px-4 py-2 text-right">
                          {calculationResult.totalAnnual.toFixed(3)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-md shadow-sm flex items-center space-x-3">
                  <PieChart className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="text-sm font-medium">Expense Distribution</h4>
                    <p className="text-xs text-muted-foreground">
                      View the detailed expense breakdown across categories
                    </p>
                  </div>
                </div>
                
                <div className="bg-card p-4 rounded-md shadow-sm flex items-center space-x-3">
                  <BarChart3 className="h-8 w-8 text-primary" />
                  <div>
                    <h4 className="text-sm font-medium">Comparative Analysis</h4>
                    <p className="text-xs text-muted-foreground">
                      Compare with similar properties in the same zone
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* No Property Selected State */}
          {!selectedProperty && (
            <div className="text-center p-8 bg-muted/30 rounded-lg">
              <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">No Property Selected</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Select a property from the dropdown above to calculate service charges based on the property's details and applicable expenses.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyServiceChargeCalculator;
