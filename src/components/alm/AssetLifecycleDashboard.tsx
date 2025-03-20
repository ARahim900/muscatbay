import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Calendar, ChevronDown, ChevronUp, AlertTriangle, Clock, DollarSign, CheckCircle, Zap, FileText, Settings, Home, Calculator } from 'lucide-react';
import { useTheme } from '@/components/theme/theme-provider';

// Define proper interfaces for our data structures
interface UnitType {
  name: string;
  baseRate: number;
  sizes: number[];
}

interface ZoneData {
  name: string;
  totalContribution: number;
  totalArea: number;
  unitTypes: Record<string, UnitType>;
  description: string;
}

interface ServiceChargeData {
  [key: string]: ZoneData;
}

interface ServiceCharge {
  annual: {
    total: number;
    baseCharge: number;
    vat: number;
    reserveFund?: number;
    operational?: number;
    admin?: number;
    masterCommunity?: number;
  };
  monthly: {
    total: number;
    baseCharge: number;
    vat: number;
    reserveFund?: number;
    operational?: number;
    admin?: number;
    masterCommunity?: number;
  };
}

interface AssetData {
  id: number;
  name: string;
  location: string;
  cost: number;
  lifeExpectancy: number;
  nextScheduled: number;
  criticality: string;
}

interface MaintenanceTask {
  id: number;
  asset: string;
  zone: string;
  date: string;
  type: string;
  estimatedCost: number;
}

interface ReserveFund {
  zone: string;
  contribution: number;
  minimumBalance: number;
}

const AssetLifecycleDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedCard, setExpandedCard] = useState<number | null>(null);
  const [selectedZone, setSelectedZone] = useState('zone3');
  const [selectedUnitType, setSelectedUnitType] = useState('apartment');
  const [selectedUnitSize, setSelectedUnitSize] = useState(150);
  const [calculatedServiceCharge, setCalculatedServiceCharge] = useState<ServiceCharge | null>(null);
  const [showServiceChargeBreakdown, setShowServiceChargeBreakdown] = useState(false);
  const { theme } = useTheme();

  // Sample data for dashboard
  const assetCategoriesData = [
    { name: 'Architectural', value: 500, color: '#8884d8' },
    { name: 'Mechanical', value: 400, color: '#82ca9d' },
    { name: 'Electrical', value: 350, color: '#ffc658' },
    { name: 'External Works', value: 650, color: '#ff8042' },
    { name: 'Infrastructure', value: 200, color: '#0088fe' }
  ];

  const maintenanceForecastData = [
    { year: '2023', cost: 75000 },
    { year: '2024', cost: 120000 },
    { year: '2025', cost: 90000 },
    { year: '2026', cost: 210000 },
    { year: '2027', cost: 180000 },
    { year: '2028', cost: 320000 },
    { year: '2029', cost: 450000 },
    { year: '2030', cost: 250000 }
  ];

  const assetConditionData = [
    { name: 'Excellent', value: 65, color: '#4CAF50' },
    { name: 'Good', value: 20, color: '#2196F3' },
    { name: 'Fair', value: 10, color: '#FFC107' },
    { name: 'Poor', value: 5, color: '#F44336' }
  ];

  const criticalAssetsData: AssetData[] = [
    { id: 1, name: 'Chillers (Type 1)', location: 'Staff Accommodation', cost: 65625, lifeExpectancy: 20, nextScheduled: 2041, criticality: 'High' },
    { id: 2, name: 'Fire Pumps', location: 'Zone 3 (Al Zaha)', cost: 12060, lifeExpectancy: 15, nextScheduled: 2036, criticality: 'High' },
    { id: 3, name: 'Elevators', location: 'Typical Buildings', cost: 4870, lifeExpectancy: 18, nextScheduled: 2039, criticality: 'High' },
    { id: 4, name: 'STP Components', location: 'Master Community', cost: 54580, lifeExpectancy: 10, nextScheduled: 2031, criticality: 'High' },
    { id: 5, name: 'Main Distribution Boards', location: 'Staff Accommodation', cost: 9160, lifeExpectancy: 20, nextScheduled: 2041, criticality: 'High' }
  ];

  const upcomingMaintenanceData: MaintenanceTask[] = [
    { id: 1, asset: 'Road Markings', zone: 'Master Community', date: '2023-12-15', type: 'Repaint', estimatedCost: 10500 },
    { id: 2, asset: 'Fire Extinguishers', zone: 'Zone 5 (Al Nameer)', date: '2023-12-20', type: 'Replace', estimatedCost: 1200 },
    { id: 3, asset: 'Irrigation Pumps', zone: 'Zone 8 (Al Wajd)', date: '2024-01-10', type: 'Service', estimatedCost: 800 },
    { id: 4, asset: 'Ground Floor Parking', zone: 'Typical Buildings', date: '2024-01-15', type: 'Epoxy Repairs', estimatedCost: 1500 },
    { id: 5, asset: 'Lagoon Water Pumps', zone: 'Master Community', date: '2024-01-20', type: 'Maintenance', estimatedCost: 2200 }
  ];

  const reserveFundData: ReserveFund[] = [
    { zone: 'Typical Buildings (per building)', contribution: 2447, minimumBalance: 2000 },
    { zone: 'Zone 3 (Al Zaha)', contribution: 13624, minimumBalance: 8655 },
    { zone: 'Zone 5 (Al Nameer)', contribution: 17914, minimumBalance: 11327 },
    { zone: 'Zone 8 (Al Wajd)', contribution: 7281, minimumBalance: 4661 },
    { zone: 'Staff Accommodation & CF', contribution: 52636, minimumBalance: 103180 },
    { zone: 'Master Community', contribution: 166360, minimumBalance: 150000 }
  ];

  const toggleCard = (id: number) => {
    if (expandedCard === id) {
      setExpandedCard(null);
    } else {
      setExpandedCard(id);
    }
  };
  
  // Service charge data
  const serviceChargeData: ServiceChargeData = {
    zone3: {
      name: 'Zone 3 (Al Zaha)',
      totalContribution: 13624,
      totalArea: 15810.78,
      unitTypes: {
        apartment: {
          name: 'Apartment',
          baseRate: 9.00, // OMR/m² as per actual Muscat Bay rates
          sizes: [90, 120, 150, 200]
        },
        villa: {
          name: 'Villa',
          baseRate: 6.98, // OMR/m² as per actual Muscat Bay rates
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
          baseRate: 6.98, // OMR/m² as per actual Muscat Bay rates
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
          baseRate: 6.98, // OMR/m² as per actual Muscat Bay rates
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
          baseRate: 9.00, // Assuming same rate as Zone 3 apartments
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
          baseRate: 9.00, // Assuming same rate as Zone 3 apartments
          sizes: [60, 80, 100]
        }
      },
      description: 'Staff Accommodation includes housing units for on-site staff'
    }
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
    
    const unitType = zone.unitTypes?.[selectedUnitType as keyof typeof zone.unitTypes];
    if (!unitType) {
      setCalculatedServiceCharge({
        annual: { total: 0, baseCharge: 0, vat: 0 },
        monthly: { total: 0, baseCharge: 0, vat: 0 }
      });
      return;
    }
    
    // Calculate base service charge
    const baseCharge = (unitType.baseRate || 0) * selectedUnitSize;
    
    // Add 5% VAT
    const vat = baseCharge * 0.05;
    const totalWithVAT = baseCharge + vat;
    
    // Calculate monthly values
    const monthlyBaseCharge = baseCharge / 12;
    const monthlyVAT = vat / 12;
    const monthlyTotal = totalWithVAT / 12;
    
    // Calculate component breakdown (dummy values for demonstration)
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
    if (zone && zone.unitTypes[selectedUnitType as keyof typeof zone.unitTypes]) {
      const unitType = zone.unitTypes[selectedUnitType as keyof typeof zone.unitTypes];
      if (unitType && !unitType.sizes.includes(selectedUnitSize)) {
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

  // Background color based on theme
  const getBgColor = () => {
    return theme === 'dark' ? 'bg-background' : 'bg-gray-100';
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

  
  return (
    <div className={`min-h-screen ${getBgColor()}`}>
      {/* Header */}
      <header className={`${getCardBgColor()} shadow`}>
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className={`text-3xl font-bold ${getTextColor()}`}>Asset Lifecycle Management Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className={`text-sm ${getMutedTextColor()}`}>Muscat Bay Community</span>
            <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">Live Data</span>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
        <div className="border-b border-border">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'overview'
                  ? 'border-b-2 border-primary text-primary'
                  : `${getMutedTextColor()} hover:text-primary`
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('assets')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'assets'
                  ? 'border-b-2 border-primary text-primary'
                  : `${getMutedTextColor()} hover:text-primary`
              }`}
            >
              Asset Inventory
            </button>
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'maintenance'
                  ? 'border-b-2 border-primary text-primary'
                  : `${getMutedTextColor()} hover:text-primary`
              }`}
            >
              Maintenance
            </button>
            <button
              onClick={() => setActiveTab('financial')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'financial'
                  ? 'border-b-2 border-primary text-primary'
                  : `${getMutedTextColor()} hover:text-primary`
              }`}
            >
              Financial Planning
            </button>
            <button
              onClick={() => setActiveTab('serviceCharge')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'serviceCharge'
                  ? 'border-b-2 border-primary text-primary'
                  : `${getMutedTextColor()} hover:text-primary`
              }`}
            >
              Service Charges
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-3 py-2 text-sm font-medium ${
                activeTab === 'reports'
                  ? 'border-b-2 border-primary text-primary'
                  : `${getMutedTextColor()} hover:text-primary`
              }`}
            >
              Reports
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'serviceCharge' && (
          <div className="space-y-6">
            <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Service Charge Calculator</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="zone" className={`block text-sm font-medium ${getMutedTextColor()}`}>Zone</label>
                    <select 
                      id="zone" 
                      className={`mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                      value={selectedZone}
                      onChange={(e) => setSelectedZone(e.target.value)}
                    >
                      <option value="zone3">Zone 3 (Al Zaha)</option>
                      <option value="zone5">Zone 5 (Al Nameer)</option>
                      <option value="zone8">Zone 8 (Al Wajd)</option>
                      <option value="typical">Typical Buildings</option>
                      <option value="staffAccommodation">Staff Accommodation & CF</option>
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="unitType" className={`block text-sm font-medium ${getMutedTextColor()}`}>Unit Type</label>
                    <select 
                      id="unitType" 
                      className={`mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                      value={selectedUnitType}
                      onChange={(e) => setSelectedUnitType(e.target.value)}
                    >
                      {Object.keys(serviceChargeData[selectedZone as keyof typeof serviceChargeData]?.unitTypes || {}).map((type) => (
                        <option key={type} value={type}>
                          {serviceChargeData[selectedZone as keyof typeof serviceChargeData]?.unitTypes[type as any]?.name || type}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="unitSize" className={`block text-sm font-medium ${getMutedTextColor()}`}>Unit Size (sqm)</label>
                    <select 
                      id="unitSize" 
                      className={`mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm`}
                      value={selectedUnitSize}
                      onChange={(e) => setSelectedUnitSize(Number(e.target.value))}
                    >
                      {serviceChargeData[selectedZone as keyof typeof serviceChargeData]?.unitTypes[selectedUnitType as any]?.sizes.map((size) => (
                        <option key={size} value={size}>{size} sqm</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label htmlFor="base-rate" className={`block text-sm font-medium ${getMutedTextColor()}`}>Base Rate per sqm</label>
                    <div className={`mt-1 py-2 px-3 border border-input bg-muted rounded-md text-sm`}>
                      OMR {(serviceChargeData[selectedZone as keyof typeof serviceChargeData]?.unitTypes[selectedUnitType as any]?.baseRate || 0).toFixed(2)}
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
                        onClick={() => calculateServiceCharge()}
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
                        For a {selectedUnitSize} sqm {serviceChargeData[selectedZone as keyof typeof serviceChargeData]?.unitTypes[selectedUnitType as any]?.name?.toLowerCase() || selectedUnitType} in {serviceChargeData[selectedZone as keyof typeof serviceChargeData]?.name}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
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
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value: number) => `OMR ${value.toFixed(2)}`} />
                      <Legend />
                      <Bar dataKey="baseCharge" name="Base Charge" stackId="a" fill="#8884d8" />
                      <Bar dataKey="vat" name="VAT (5%)" stackId="a" fill="#82ca9d" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className={`text-sm ${getMutedTextColor()} mt-2 text-center`}>
                  Monthly service charges comparison for a standard 150 sqm unit across all zones
                </div>
              </div>

              <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
                <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Service Charge Calculation Methodology</h3>
                <div className={`prose prose-sm ${getMutedTextColor()}`}>
                  <p>
                    Service charges at Muscat Bay are calculated using the official rates established by Muscat Bay management:
                  </p>
                  <ul className="list-disc list-inside space-y-2">
                    <li>
                      <span className="font-medium text-foreground">
