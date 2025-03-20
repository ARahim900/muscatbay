
import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '@/components/theme/theme-provider';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ServiceChargeData, UnitType, ZoneData, ServiceCharge } from '@/types/alm';

const ServiceChargeCalculator: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState('zone3');
  const [selectedUnitType, setSelectedUnitType] = useState('apartment');
  const [selectedUnitSize, setSelectedUnitSize] = useState(150);
  const [calculatedServiceCharge, setCalculatedServiceCharge] = useState<ServiceCharge | null>(null);
  const [showServiceChargeBreakdown, setShowServiceChargeBreakdown] = useState(false);
  const { theme } = useTheme();

  // Service charge data
  const serviceChargeData: ServiceChargeData = {
    zone3: {
      name: 'Zone 3 (Al Zaha)',
      totalContribution: 13624,
      totalArea: 15810.78,
      unitTypes: {
        apartment: {
          name: 'Apartment',
          baseRate: 9.00,
          sizes: [90, 120, 150, 200]
        },
        villa: {
          name: 'Villa',
          baseRate: 6.99,
          sizes: [200, 250, 300, 350]
        }
      },
      description: 'Zone 3 includes both apartments and luxury villas in the Al Zaha area'
    },
    zone5: {
      name: 'Zone 5 (Al Nameer)',
      totalContribution: 17914,
      totalArea: 171426.04,
      unitTypes: {
        villa: {
          name: 'Villa',
          baseRate: 6.99,
          sizes: [280, 320, 380, 420]
        }
      },
      description: 'Zone 5 features exclusive villas in the Al Nameer development'
    },
    zone8: {
      name: 'Zone 8 (Al Wajd)',
      totalContribution: 7281,
      totalArea: 211230.98,
      unitTypes: {
        villa: {
          name: 'Villa',
          baseRate: 6.99,
          sizes: [300, 350, 400, 450]
        }
      },
      description: 'Zone 8 contains premium villas in the Al Wajd area with oceanfront views'
    },
    typical: {
      name: 'Typical Buildings',
      totalContribution: 2447,
      totalArea: 1500,
      unitTypes: {
        apartment: {
          name: 'Apartment',
          baseRate: 9.00,
          sizes: [75, 100, 125, 150]
        }
      },
      description: 'Typical Buildings include standard apartment configurations throughout the development'
    },
    staffAccommodation: {
      name: 'Staff Accommodation & CF',
      totalContribution: 52636,
      totalArea: 144904,
      unitTypes: {
        apartment: {
          name: 'Staff Apartment',
          baseRate: 9.00,
          sizes: [60, 80, 100]
        }
      },
      description: 'Staff Accommodation includes housing units for on-site staff'
    }
  };
  
  // Background color based on theme
  const getBgColor = () => {
    return theme === 'dark' ? 'bg-background' : 'bg-gray-50';
  };

  const getCardBgColor = () => {
    return theme === 'dark' ? 'bg-card' : 'bg-white';
  };

  const getTextColor = () => {
    return theme === 'dark' ? 'text-foreground' : 'text-gray-900';
  };

  const getMutedTextColor = () => {
    return theme === 'dark' ? 'text-muted-foreground' : 'text-gray-500';
  };
  
  // Calculate service charge based on inputs
  const calculateServiceCharge = () => {
    const zone = serviceChargeData[selectedZone as keyof typeof serviceChargeData];
    if (!zone) {
      setCalculatedServiceCharge({
        annual: { total: 0, baseCharge: 0, vat: 0 },
        monthly: { total: 0, baseCharge: 0, vat: 0 }
      });
      return;
    }
    
    const unitType = zone.unitTypes[selectedUnitType as keyof typeof zone.unitTypes];
    if (!unitType) {
      setCalculatedServiceCharge({
        annual: { total: 0, baseCharge: 0, vat: 0 },
        monthly: { total: 0, baseCharge: 0, vat: 0 }
      });
      return;
    }
    
    // Calculate base service charge
    const baseCharge = unitType.baseRate * selectedUnitSize;
    
    // Add 5% VAT
    const vat = baseCharge * 0.05;
    const totalWithVAT = baseCharge + vat;
    
    // Calculate monthly values
    const monthlyBaseCharge = baseCharge / 12;
    const monthlyVAT = vat / 12;
    const monthlyTotal = totalWithVAT / 12;
    
    // Calculate component breakdown
    const reserveFund = totalWithVAT * 0.3; // 30% for reserve fund
    const operational = totalWithVAT * 0.4; // 40% for operational costs
    const admin = totalWithVAT * 0.1; // 10% for administration
    const masterCommunity = totalWithVAT * 0.2; // 20% for master community
    
    setCalculatedServiceCharge({
      annual: {
        total: totalWithVAT,
        baseCharge: baseCharge,
        vat: vat,
        reserveFund: reserveFund,
        operational: operational,
        admin: admin,
        masterCommunity: masterCommunity
      },
      monthly: {
        total: monthlyTotal,
        baseCharge: monthlyBaseCharge,
        vat: monthlyVAT,
        reserveFund: reserveFund / 12,
        operational: operational / 12,
        admin: admin / 12,
        masterCommunity: masterCommunity / 12
      }
    });
  };
  
  // Calculate service charge when inputs change
  useEffect(() => {
    // Safety check to ensure the selected zone exists
    const zone = serviceChargeData[selectedZone as keyof typeof serviceChargeData];
    if (!zone) return;
    
    // Safety check to ensure the selected unit type exists in the current zone
    if (!zone.unitTypes[selectedUnitType as keyof typeof zone.unitTypes]) {
      // If not valid, set to the first available unit type for this zone
      const firstAvailableType = Object.keys(zone.unitTypes)[0];
      setSelectedUnitType(firstAvailableType);
      return;
    }
    
    // Safety check to ensure the selected size exists for the unit type
    if (zone.unitTypes[selectedUnitType as keyof typeof zone.unitTypes]) {
      const unitType = zone.unitTypes[selectedUnitType as keyof typeof zone.unitTypes];
      if (!unitType.sizes.includes(selectedUnitSize)) {
        // If not valid, set to the first available size
        setSelectedUnitSize(unitType.sizes[0]);
        return;
      }
    }
    
    calculateServiceCharge();
  }, [selectedZone, selectedUnitType, selectedUnitSize]);
  
  // Set initial unit type and size based on what's available in the selected zone
  useEffect(() => {
    const zone = serviceChargeData[selectedZone as keyof typeof serviceChargeData];
    if (!zone) return;
    
    const availableUnitTypes = Object.keys(zone.unitTypes);
    
    // Set to the first available unit type if current is not valid
    if (!availableUnitTypes.includes(selectedUnitType)) {
      setSelectedUnitType(availableUnitTypes[0]);
    }
    
    // Ensure we have valid unit sizes to work with
    if (zone.unitTypes[selectedUnitType as keyof typeof zone.unitTypes]) {
      const unitSizes = zone.unitTypes[selectedUnitType as keyof typeof zone.unitTypes].sizes;
      if (!unitSizes.includes(selectedUnitSize)) {
        setSelectedUnitSize(unitSizes[0]);
      }
    }
  }, [selectedZone]);

  // Helper function to get simplified unit name
  const getUnitTypeName = (zoneKey: string, typeKey: string): string => {
    const zone = serviceChargeData[zoneKey as keyof typeof serviceChargeData];
    if (!zone) return typeKey;
    
    const unitType = zone.unitTypes[typeKey as keyof typeof zone.unitTypes];
    if (!unitType) return typeKey;
    
    return unitType.name;
  };

  // Helper function to get unit base rate
  const getUnitBaseRate = (zoneKey: string, typeKey: string): number => {
    const zone = serviceChargeData[zoneKey as keyof typeof serviceChargeData];
    if (!zone) return 0;
    
    const unitType = zone.unitTypes[typeKey as keyof typeof zone.unitTypes];
    if (!unitType) return 0;
    
    return unitType.baseRate;
  };

  // Helper function to safely get unit sizes
  const getUnitSizes = (zoneKey: string, typeKey: string): number[] => {
    const zone = serviceChargeData[zoneKey as keyof typeof serviceChargeData];
    if (!zone) return [];
    
    const unitType = zone.unitTypes[typeKey as keyof typeof zone.unitTypes];
    if (!unitType) return [];
    
    return unitType.sizes;
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 shadow-md">
        <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Service Charge Calculator</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="zone" className={`block text-sm font-medium ${getMutedTextColor()}`}>Zone</label>
              <Select
                value={selectedZone}
                onValueChange={setSelectedZone}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zone3">Zone 3 (Al Zaha)</SelectItem>
                  <SelectItem value="zone5">Zone 5 (Al Nameer)</SelectItem>
                  <SelectItem value="zone8">Zone 8 (Al Wajd)</SelectItem>
                  <SelectItem value="typical">Typical Buildings</SelectItem>
                  <SelectItem value="staffAccommodation">Staff Accommodation & CF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="unitType" className={`block text-sm font-medium ${getMutedTextColor()}`}>Unit Type</label>
              <Select
                value={selectedUnitType}
                onValueChange={setSelectedUnitType}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Unit Type" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(serviceChargeData[selectedZone as keyof typeof serviceChargeData]?.unitTypes || {}).map((type) => (
                    <SelectItem key={type} value={type}>
                      {getUnitTypeName(selectedZone, type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="unitSize" className={`block text-sm font-medium ${getMutedTextColor()}`}>Unit Size (sqm)</label>
              <Select
                value={selectedUnitSize.toString()}
                onValueChange={(value) => setSelectedUnitSize(Number(value))}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select Unit Size" />
                </SelectTrigger>
                <SelectContent>
                  {getUnitSizes(selectedZone, selectedUnitType).map((size) => (
                    <SelectItem key={size} value={size.toString()}>{size} sqm</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="base-rate" className={`block text-sm font-medium ${getMutedTextColor()}`}>Base Rate per sqm</label>
              <div className={`mt-1 py-2 px-3 border border-input bg-muted rounded-md text-sm`}>
                OMR {getUnitBaseRate(selectedZone, selectedUnitType).toFixed(2)}
              </div>
            </div>
          </div>
          
          <div className="md:col-span-2 bg-primary/5 rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className={`text-lg font-medium ${getTextColor()}`}>Calculated Service Charge</h4>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setShowServiceChargeBreakdown(!showServiceChargeBreakdown)}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  {showServiceChargeBreakdown ? 'Hide Breakdown' : 'Show Breakdown'}
                  {showServiceChargeBreakdown ? <ChevronUp size={16} className="ml-1" /> : <ChevronDown size={16} className="ml-1" />}
                </button>
                <button 
                  onClick={calculateServiceCharge}
                  className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  <Calculator size={16} className="mr-1" /> Recalculate
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div className={`${getCardBgColor()} rounded-lg p-4 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${getMutedTextColor()}`}>Monthly Service Charge:</span>
                  <span className="text-xl font-bold text-primary">
                    OMR {calculatedServiceCharge?.monthly?.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className={`mt-2 text-sm ${getMutedTextColor()}`}>
                  For a {selectedUnitSize} sqm {getUnitTypeName(selectedZone, selectedUnitType).toLowerCase()} in {serviceChargeData[selectedZone as keyof typeof serviceChargeData]?.name || selectedZone}
                </div>
              </div>
              
              <div className={`${getCardBgColor()} rounded-lg p-4 shadow-sm`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${getMutedTextColor()}`}>Annual Service Charge:</span>
                  <span className={`text-xl font-bold ${getTextColor()}`}>
                    OMR {calculatedServiceCharge?.annual?.total?.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className={`mt-2 text-sm ${getMutedTextColor()}`}>
                  Due at the beginning of each fiscal year
                </div>
              </div>
            </div>
            
            {showServiceChargeBreakdown && calculatedServiceCharge && (
              <div className="mt-4">
                <h5 className={`text-sm font-medium ${getMutedTextColor()} mb-2`}>Service Charge Breakdown</h5>
                <div className={`${getCardBgColor()} rounded-lg overflow-hidden shadow-sm`}>
                  <table className="min-w-full divide-y divide-border">
                    <thead className="bg-muted">
                      <tr>
                        <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Component</th>
                        <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Monthly (OMR)</th>
                        <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Annual (OMR)</th>
                        <th scope="col" className={`px-6 py-3 text-right text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>% of Total</th>
                      </tr>
                    </thead>
                    <tbody className={`${getCardBgColor()} divide-y divide-border`}>
                      <tr>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Reserve Fund</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>{calculatedServiceCharge.monthly.reserveFund?.toFixed(2) || '0.00'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>{calculatedServiceCharge.annual.reserveFund?.toFixed(2) || '0.00'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>
                          {((calculatedServiceCharge.annual.reserveFund || 0) / calculatedServiceCharge.annual.total * 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Operational Costs</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>{calculatedServiceCharge.monthly.operational?.toFixed(2) || '0.00'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>{calculatedServiceCharge.annual.operational?.toFixed(2) || '0.00'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>
                          {((calculatedServiceCharge.annual.operational || 0) / calculatedServiceCharge.annual.total * 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Administrative Fee</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>{calculatedServiceCharge.monthly.admin?.toFixed(2) || '0.00'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>{calculatedServiceCharge.annual.admin?.toFixed(2) || '0.00'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>
                          {((calculatedServiceCharge.annual.admin || 0) / calculatedServiceCharge.annual.total * 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr className="bg-muted/50">
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Master Community Share</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>{calculatedServiceCharge.monthly.masterCommunity?.toFixed(2) || '0.00'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>{calculatedServiceCharge.annual.masterCommunity?.toFixed(2) || '0.00'}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm text-right ${getMutedTextColor()}`}>
                          {((calculatedServiceCharge.annual.masterCommunity || 0) / calculatedServiceCharge.annual.total * 100).toFixed(1)}%
                        </td>
                      </tr>
                      <tr>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold ${getTextColor()}`}>Total</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${getTextColor()}`}>{calculatedServiceCharge.monthly.total.toFixed(2)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${getTextColor()}`}>{calculatedServiceCharge.annual.total.toFixed(2)}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${getTextColor()}`}>100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6 shadow-md">
        <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Service Charge Comparison</h3>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={Object.keys(serviceChargeData).map(zoneKey => {
                const zone = serviceChargeData[zoneKey as keyof typeof serviceChargeData];
                // Calculate for a standard 150 sqm unit as comparison
                const standardSize = 150;
                const unitType = Object.keys(zone.unitTypes)[0];
                const baseRate = zone.unitTypes[unitType as keyof typeof zone.unitTypes]?.baseRate || 0;
                
                // Calculate base charge and VAT
                const baseCharge = baseRate * standardSize;
                const vat = baseCharge * 0.05;
                const total = baseCharge + vat;
                
                return {
                  name: zone.name || zoneKey,
                  baseCharge: (baseCharge / 12) || 0,
                  vat: (vat / 12) || 0,
                  monthlyTotal: (total / 12) || 0
                };
              })}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <defs>
                <linearGradient id="colorBase" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#8884d8" stopOpacity={0.2}/>
                </linearGradient>
                <linearGradient id="colorVat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#82ca9d" stopOpacity={0.2}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={70} />
              <YAxis />
              <Tooltip formatter={(value: number) => `OMR ${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="baseCharge" name="Base Charge" stackId="a" fill="url(#colorBase)" />
              <Bar dataKey="vat" name="VAT (5%)" stackId="a" fill="url(#colorVat)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={`text-sm ${getMutedTextColor()} mt-2 text-center`}>
          Monthly service charges comparison for a standard 150 sqm unit across all zones
        </div>
      </Card>
    </div>
  );
};

export default ServiceChargeCalculator;
