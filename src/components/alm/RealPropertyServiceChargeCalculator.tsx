
import React, { useState, useEffect } from 'react';
import { usePropertyUnits } from '@/hooks/usePropertyUnits';
import { PropertyUnitSelector } from './PropertyUnitSelector';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServiceChargeZones } from '@/hooks/useServiceChargeZones';
import { ServiceCharge } from '@/types/alm';

const RealPropertyServiceChargeCalculator: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [calculatedCharge, setCalculatedCharge] = useState<ServiceCharge | null>(null);
  const { properties, loading: propertiesLoading, error: propertiesError } = usePropertyUnits();
  const { zones, loading: zonesLoading, error: zonesError } = useServiceChargeZones();

  const selectedProperty = selectedPropertyId ? properties.find(p => p.id === selectedPropertyId) : null;
  const selectedZoneData = selectedZone ? zones.find(z => z.code === selectedZone) : null;

  useEffect(() => {
    if (selectedProperty && selectedZoneData) {
      const baseCharge = selectedProperty.bua * selectedZoneData.serviceChargeRate;
      const vat = baseCharge * 0.05;
      
      setCalculatedCharge({
        annual: {
          total: baseCharge + vat,
          baseCharge: baseCharge,
          vat: vat
        },
        monthly: {
          total: (baseCharge + vat) / 12,
          baseCharge: baseCharge / 12,
          vat: vat / 12
        }
      });
    } else {
      setCalculatedCharge(null);
    }
  }, [selectedProperty, selectedZoneData]);

  const handleZoneChange = (zoneCode: string) => {
    setSelectedZone(zoneCode);
    setSelectedPropertyId('');
  };

  const loading = propertiesLoading || zonesLoading;
  const error = propertiesError || zonesError;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Property Service Charge Calculator</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
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
          <Alert variant="destructive">
            <AlertDescription>
              Failed to load property data: {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Group properties by zone
  const zoneOptions = [...new Set(properties.map(p => p.zone))].filter(Boolean);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Service Charge Calculator</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
              <select 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700"
                value={selectedZone}
                onChange={(e) => handleZoneChange(e.target.value)}
              >
                <option value="">Select a zone</option>
                {zoneOptions.map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
              <PropertyUnitSelector 
                zoneCode={selectedZone}
                value={selectedPropertyId}
                onChange={setSelectedPropertyId}
              />
            </div>
            
            {selectedProperty && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
                  <div className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700 font-medium">
                    {selectedProperty.unitType}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Unit Size (sqm)</label>
                  <div className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700 font-medium">
                    {selectedProperty.bua}
                  </div>
                </div>

                {selectedZoneData && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Service Charge Rate</label>
                    <div className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700 font-medium">
                      OMR {selectedZoneData.serviceChargeRate?.toFixed(2) || '0.00'} per sqm
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Results Panel */}
          <div className="md:col-span-2 bg-blue-50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-medium text-gray-900">Calculated Charges</h4>
            </div>
            
            {calculatedCharge ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Monthly Charge:</span>
                      <span className="text-xl font-bold text-blue-600">
                        OMR {calculatedCharge.monthly.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <span>{selectedProperty?.bua} sqm {selectedProperty?.unitType}</span>
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Annual Charge:</span>
                      <span className="text-xl font-bold text-gray-900">
                        OMR {calculatedCharge.annual.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                      <span>Includes 5% VAT</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 bg-white rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 text-xs text-gray-500 uppercase">
                        <th className="px-4 py-3 text-left">Component</th>
                        <th className="px-4 py-3 text-right">Monthly</th>
                        <th className="px-4 py-3 text-right">Annual</th>
                        <th className="px-4 py-3 text-right">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      <tr>
                        <td className="px-4 py-3 font-medium text-gray-900">Base Rate</td>
                        <td className="px-4 py-3 text-right">{calculatedCharge.monthly.baseCharge.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{calculatedCharge.annual.baseCharge.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">95%</td>
                      </tr>
                      <tr className="bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">VAT (5%)</td>
                        <td className="px-4 py-3 text-right">{calculatedCharge.monthly.vat.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{calculatedCharge.annual.vat.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">5%</td>
                      </tr>
                      <tr className="font-bold bg-blue-50">
                        <td className="px-4 py-3 text-gray-900">Total</td>
                        <td className="px-4 py-3 text-right">{calculatedCharge.monthly.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">{calculatedCharge.annual.total.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl p-6 text-center">
                <p className="text-gray-500">
                  {selectedZone 
                    ? 'Select a property to calculate service charges' 
                    : 'Select a zone and property to calculate service charges'}
                </p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default RealPropertyServiceChargeCalculator;
