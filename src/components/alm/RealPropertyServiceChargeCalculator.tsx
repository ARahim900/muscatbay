
import React, { useState, useEffect } from 'react';
import { usePropertyUnits } from '@/hooks/usePropertyUnits';
import { useServiceChargeZones } from '@/hooks/useServiceChargeZones';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calculator, ChevronUp, ChevronDown, Building2 } from 'lucide-react';
import { PropertyUnit, ServiceCharge } from '@/types/alm';
import PropertyUnitSelector from './PropertyUnitSelector';

const RealPropertyServiceChargeCalculator: React.FC = () => {
  // State for selections
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [showDetails, setShowDetails] = useState(false);
  
  // Fetch data
  const { zones, loading: zonesLoading } = useServiceChargeZones();
  const { properties, loading: propertiesLoading } = usePropertyUnits(
    selectedZone ? { zone: selectedZone } : {}
  );
  
  // State for result
  const [calculatedCharge, setCalculatedCharge] = useState<ServiceCharge | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<PropertyUnit | null>(null);

  // Effect to handle property selection
  useEffect(() => {
    if (selectedPropertyId && properties.length > 0) {
      const property = properties.find(p => p.id === selectedPropertyId);
      setSelectedProperty(property || null);
      
      if (property) {
        calculateServiceCharge(property);
      }
    } else {
      setSelectedProperty(null);
      setCalculatedCharge(null);
    }
  }, [selectedPropertyId, properties]);

  // Function to calculate service charge
  const calculateServiceCharge = (property: PropertyUnit) => {
    const zone = zones.find(z => z.code === property.zone);
    
    if (!zone || !property.bua) {
      setCalculatedCharge(null);
      return;
    }
    
    // Calculate service charge based on zone rate and property BUA
    const baseRate = zone.serviceChargeRate;
    const liftRate = property.hasLift ? 0.15 : 0; // Add lift charge if applicable
    const reserveFundRate = zone.reserveFundRate;
    
    const baseCharge = baseRate * property.bua;
    const liftCharge = liftRate * property.bua;
    const reserveFundCharge = reserveFundRate * property.bua;
    
    const subtotal = baseCharge + liftCharge + reserveFundCharge;
    const vat = subtotal * 0.05; // 5% VAT
    const total = subtotal + vat;
    
    setCalculatedCharge({
      annual: {
        baseCharge: baseCharge,
        vat: vat,
        total: total
      },
      monthly: {
        baseCharge: baseCharge / 12,
        vat: vat / 12,
        total: total / 12
      }
    });
  };

  // Function to handle zone change
  const handleZoneChange = (value: string) => {
    setSelectedZone(value);
    setSelectedPropertyId('');
    setSelectedProperty(null);
    setCalculatedCharge(null);
  };

  return (
    <Card className="bg-white shadow-sm overflow-hidden">
      <CardHeader className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <div>
          <CardTitle className="text-lg text-gray-800">Real Property Service Charge Calculator</CardTitle>
          <CardDescription>Calculate service charges for actual properties</CardDescription>
        </div>
        <div className="flex items-center text-blue-600">
          <Building2 className="h-5 w-5 mr-2" />
          <span className="text-sm">Property-Based Calculation</span>
        </div>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Selectors */}
          <div className="space-y-4 lg:col-span-1">
            <div className="space-y-2">
              <Label htmlFor="zone-select">Zone</Label>
              <Select value={selectedZone} onValueChange={handleZoneChange} disabled={zonesLoading}>
                <SelectTrigger id="zone-select">
                  <SelectValue placeholder="Select a zone" />
                </SelectTrigger>
                <SelectContent>
                  {zones.map(zone => (
                    <SelectItem key={zone.code} value={zone.code}>{zone.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="property-select">Property</Label>
              <PropertyUnitSelector 
                zoneCode={selectedZone}
                value={selectedPropertyId}
                onChange={setSelectedPropertyId}
              />
            </div>
            
            {selectedProperty && (
              <div className="mt-6 p-4 bg-blue-50 rounded-md space-y-2">
                <h4 className="font-medium text-blue-900">Selected Property Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-gray-600">Unit Number:</div>
                  <div className="text-gray-900">{selectedProperty.unitNo}</div>
                  
                  <div className="text-gray-600">Type:</div>
                  <div className="text-gray-900">{selectedProperty.unitType}</div>
                  
                  <div className="text-gray-600">Size (BUA):</div>
                  <div className="text-gray-900">{selectedProperty.bua} sqm</div>
                  
                  <div className="text-gray-600">Has Lift Access:</div>
                  <div className="text-gray-900">{selectedProperty.hasLift ? 'Yes' : 'No'}</div>
                  
                  <div className="text-gray-600">Status:</div>
                  <div className="text-gray-900">{selectedProperty.status}</div>
                  
                  <div className="text-gray-600">Owner:</div>
                  <div className="text-gray-900">{selectedProperty.owner || 'Unknown'}</div>
                </div>
              </div>
            )}
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2">
            {calculatedCharge ? (
              <div className="bg-blue-50 rounded-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-lg font-medium text-gray-900">Calculated Service Charges</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDetails(!showDetails)}
                    className="flex items-center text-blue-700 border-blue-100 hover:bg-blue-50"
                  >
                    {showDetails ? 'Hide Details' : 'Show Details'}
                    {showDetails ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Monthly Charge:</span>
                      <span className="text-xl font-bold text-blue-600">
                        OMR {calculatedCharge.monthly.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span>For {selectedProperty?.unitNo} ({selectedProperty?.bua} sqm)</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Annual Charge:</span>
                      <span className="text-xl font-bold text-gray-900">
                        OMR {calculatedCharge.annual.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500">
                      <span>Includes 5% VAT</span>
                    </div>
                  </div>
                </div>

                {showDetails && (
                  <div className="mt-6 bg-white rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                          <th className="px-4 py-3 text-left">Component</th>
                          <th className="px-4 py-3 text-right">Monthly</th>
                          <th className="px-4 py-3 text-right">Annual</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        <tr>
                          <td className="px-4 py-3 font-medium text-gray-900">Base Service Charge</td>
                          <td className="px-4 py-3 text-right">{(calculatedCharge.monthly.baseCharge).toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">{calculatedCharge.annual.baseCharge.toFixed(2)}</td>
                        </tr>
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">VAT (5%)</td>
                          <td className="px-4 py-3 text-right">{calculatedCharge.monthly.vat.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">{calculatedCharge.annual.vat.toFixed(2)}</td>
                        </tr>
                        <tr className="font-bold bg-blue-50">
                          <td className="px-4 py-3 text-gray-900">Total</td>
                          <td className="px-4 py-3 text-right">{calculatedCharge.monthly.total.toFixed(2)}</td>
                          <td className="px-4 py-3 text-right">{calculatedCharge.annual.total.toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full p-10 text-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <Calculator className="w-12 h-12 text-gray-400 mb-3" />
                <h3 className="text-lg font-medium text-gray-700 mb-1">Service Charge Calculator</h3>
                <p className="text-gray-500 mb-4">Select a zone and property to calculate service charges</p>
                {selectedZone && !selectedPropertyId && (
                  <p className="text-blue-600">Please select a property to continue</p>
                )}
                {!selectedZone && (
                  <p className="text-blue-600">Please select a zone to start</p>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealPropertyServiceChargeCalculator;
