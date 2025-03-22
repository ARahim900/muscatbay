
import React, { useState, useEffect } from 'react';
import { Calculator, ChevronUp, ChevronDown } from 'lucide-react';
import { ServiceChargeData, ServiceCharge } from '@/types/alm';

interface ServiceChargeCalculatorProps {
  initialData: ServiceChargeData;
}

const ServiceChargeCalculator: React.FC<ServiceChargeCalculatorProps> = ({ initialData }) => {
  const [serviceChargeZone, setServiceChargeZone] = useState('zone3');
  const [serviceChargeUnitType, setServiceChargeUnitType] = useState('apartment');
  const [serviceChargeUnitSize, setServiceChargeUnitSize] = useState(150);
  const [calculatedServiceCharge, setCalculatedServiceCharge] = useState<ServiceCharge | null>(null);
  const [showServiceChargeBreakdown, setShowServiceChargeBreakdown] = useState(false);

  const calculateServiceCharge = () => {
    const zone = initialData[serviceChargeZone];
    const unitType = zone.unitTypes?.[serviceChargeUnitType];
    const baseCharge = (unitType?.baseRate || 0) * serviceChargeUnitSize;
    const vat = baseCharge * 0.05;
    
    setCalculatedServiceCharge({
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
  };

  useEffect(() => {
    const zone = initialData[serviceChargeZone];
    if (zone && zone.unitTypes) {
      if (!zone.unitTypes[serviceChargeUnitType]) {
        setServiceChargeUnitType(Object.keys(zone.unitTypes)[0]);
      } else {
        if (!zone.unitTypes[serviceChargeUnitType]?.sizes.includes(serviceChargeUnitSize)) {
          setServiceChargeUnitSize(zone.unitTypes[serviceChargeUnitType]?.sizes[0] || 0);
        }
      }
      calculateServiceCharge();
    }
  }, [serviceChargeZone, serviceChargeUnitType, serviceChargeUnitSize, initialData]);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
        <h3 className="font-semibold text-lg text-gray-800">Service Charge Calculator</h3>
        <div className="flex items-center text-orange-600">
          <Calculator className="h-5 w-5 mr-2" />
          <span className="text-sm">Calculate your charges</span>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Input Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
              <select 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700"
                value={serviceChargeZone}
                onChange={(e) => setServiceChargeZone(e.target.value)}
              >
                {Object.entries(initialData).map(([key, zone]) => (
                  <option key={key} value={key}>{zone.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Type</label>
              <select 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700"
                value={serviceChargeUnitType}
                onChange={(e) => setServiceChargeUnitType(e.target.value)}
              >
                {initialData[serviceChargeZone] && 
                 Object.keys(initialData[serviceChargeZone].unitTypes || {}).map((type) => (
                  <option key={type} value={type}>
                    {initialData[serviceChargeZone].unitTypes[type].name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Unit Size (sqm)</label>
              <select 
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700"
                value={serviceChargeUnitSize}
                onChange={(e) => setServiceChargeUnitSize(Number(e.target.value))}
              >
                {initialData[serviceChargeZone] && 
                 initialData[serviceChargeZone].unitTypes[serviceChargeUnitType] && 
                 initialData[serviceChargeZone].unitTypes[serviceChargeUnitType].sizes.map((size) => (
                  <option key={size} value={size}>{size} sqm</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Base Rate</label>
              <div className="w-full px-4 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-700 font-medium">
                OMR {initialData[serviceChargeZone]?.unitTypes[serviceChargeUnitType]?.baseRate.toFixed(2) || '0.00'}
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="md:col-span-2 bg-blue-50 rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-lg font-medium text-gray-900">Calculated Charges</h4>
              <button 
                onClick={() => setShowServiceChargeBreakdown(!showServiceChargeBreakdown)}
                className="flex items-center px-3 py-1.5 bg-white text-blue-700 border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors duration-200 text-sm"
              >
                {showServiceChargeBreakdown ? 'Hide Details' : 'Show Details'}
                {showServiceChargeBreakdown ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Monthly Charge:</span>
                  <span className="text-xl font-bold text-blue-600">
                    OMR {calculatedServiceCharge?.monthly.total.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                  <span>{serviceChargeUnitSize} sqm {initialData[serviceChargeZone]?.unitTypes[serviceChargeUnitType]?.name || ''}</span>
                </div>
              </div>
              
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Annual Charge:</span>
                  <span className="text-xl font-bold text-gray-900">
                    OMR {calculatedServiceCharge?.annual.total.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                  <span>Includes 5% VAT</span>
                </div>
              </div>
            </div>

            {/* Breakdown Table */}
            {showServiceChargeBreakdown && calculatedServiceCharge && (
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
                      <td className="px-4 py-3 text-right">{calculatedServiceCharge.monthly.baseCharge.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{calculatedServiceCharge.annual.baseCharge.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">95%</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">VAT (5%)</td>
                      <td className="px-4 py-3 text-right">{calculatedServiceCharge.monthly.vat.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{calculatedServiceCharge.annual.vat.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">5%</td>
                    </tr>
                    <tr className="font-bold bg-blue-50">
                      <td className="px-4 py-3 text-gray-900">Total</td>
                      <td className="px-4 py-3 text-right">{calculatedServiceCharge.monthly.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">{calculatedServiceCharge.annual.total.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right">100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceChargeCalculator;
