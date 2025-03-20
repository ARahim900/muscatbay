
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
                      <span className="font-medium text-foreground">Base Rate:</span> Each unit type has a base rate (per sqm) defined by zone and unit type
                    </li>
                    <li>
                      <span className="font-medium text-foreground">VAT:</span> 5% VAT is applied to the base service charge
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Reserve Fund:</span> 30% contribution to long-term asset replacement
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Operational Costs:</span> 40% for daily maintenance and operations
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Admin Fee:</span> 10% for administrative overhead
                    </li>
                    <li>
                      <span className="font-medium text-foreground">Master Community:</span> 20% contribution to master community upkeep
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Assets by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetCategoriesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetCategoriesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} assets`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Maintenance Forecast</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={maintenanceForecastData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="year" />
                    <YAxis />
                    <Tooltip formatter={(value) => `OMR ${value.toLocaleString()}`} />
                    <Bar dataKey="cost" fill="#8884d8" name="Estimated Cost" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Asset Condition</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={assetConditionData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {assetConditionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className={`${getCardBgColor()} rounded-lg shadow p-6 col-span-full`}>
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-lg font-medium ${getTextColor()}`}>Critical Assets</h3>
                <button className="px-3 py-1 text-xs rounded-full bg-red-100 text-red-800 flex items-center">
                  <AlertTriangle size={12} className="mr-1" /> Requires Attention
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Asset</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Location</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Replacement Cost</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Life Expectancy</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Next Scheduled</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Criticality</th>
                    </tr>
                  </thead>
                  <tbody className={`${getCardBgColor()} divide-y divide-border`}>
                    {criticalAssetsData.map((asset) => (
                      <tr key={asset.id}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>{asset.name}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>{asset.location}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>OMR {asset.cost.toLocaleString()}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>{asset.lifeExpectancy} years</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>{asset.nextScheduled}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">{asset.criticality}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className={`${getCardBgColor()} rounded-lg shadow p-6 col-span-full`}>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Upcoming Maintenance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Asset</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Zone</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Date</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Type</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Estimated Cost</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`${getCardBgColor()} divide-y divide-border`}>
                    {upcomingMaintenanceData.map((task) => (
                      <tr key={task.id}>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>{task.asset}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>{task.zone}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>{new Date(task.date).toLocaleDateString()}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            task.type === 'Replace' ? 'bg-red-100 text-red-800' : 
                            task.type === 'Service' ? 'bg-blue-100 text-blue-800' : 
                            'bg-yellow-100 text-yellow-800'
                          }`}>{task.type}</span>
                        </td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>OMR {task.estimatedCost.toLocaleString()}</td>
                        <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                          <button className="px-2 py-1 text-xs rounded bg-primary text-primary-foreground">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
                <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Reserve Fund</h3>
                <div className="space-y-4">
                  {reserveFundData.map((item, index) => (
                    <div key={index} className="bg-muted/20 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className={`text-sm font-medium ${getTextColor()}`}>{item.zone}</h4>
                        <span className="text-lg font-bold text-primary">OMR {item.contribution.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className={`${getMutedTextColor()}`}>Annual Contribution</span>
                        <span className={`${getMutedTextColor()}`}>Min Balance: OMR {item.minimumBalance.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`${getCardBgColor()} rounded-lg shadow p-6 md:col-span-2`}>
                <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>20-Year Financial Forecast</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={[
                        { year: '2021', income: 260262, expense: 0, balance: 260262 },
                        { year: '2022', income: 261563, expense: 9490, balance: 512335 },
                        { year: '2023', income: 262871, expense: 0, balance: 775206 },
                        { year: '2024', income: 264185, expense: 28210, balance: 1011181 },
                        { year: '2025', income: 265506, expense: 65591, balance: 1211096 },
                        { year: '2026', income: 266834, expense: 70819, balance: 1407111 },
                        { year: '2027', income: 268168, expense: 42592, balance: 1632687 },
                        { year: '2028', income: 269509, expense: 248833, balance: 1653363 },
                        { year: '2029', income: 270856, expense: 161579, balance: 1762640 },
                        { year: '2030', income: 272211, expense: 109033, balance: 1925818 },
                        { year: '2031', income: 273572, expense: 67919, balance: 2131471 },
                        { year: '2032', income: 274940, expense: 175944, balance: 2230467 },
                        { year: '2033', income: 276314, expense: 263986, balance: 2242795 },
                        { year: '2034', income: 277696, expense: 160821, balance: 2359670 },
                        { year: '2035', income: 279084, expense: 290901, balance: 2347853 },
                        { year: '2036', income: 280480, expense: 98272, balance: 2530061 },
                        { year: '2037', income: 281882, expense: 273462, balance: 2538481 },
                        { year: '2038', income: 283292, expense: 85191, balance: 2736582 },
                        { year: '2039', income: 284708, expense: 327035, balance: 2694255 },
                        { year: '2040', income: 286132, expense: 269492, balance: 2710895 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="year" />
                      <YAxis />
                      <Tooltip formatter={(value) => `OMR ${value.toLocaleString()}`} />
                      <Legend />
                      <Line type="monotone" dataKey="income" name="Annual Contribution" stroke="#4CAF50" strokeWidth={2} />
                      <Line type="monotone" dataKey="expense" name="Annual Expenditure" stroke="#F44336" strokeWidth={2} />
                      <Line type="monotone" dataKey="balance" name="Reserve Balance" stroke="#2196F3" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Financial Parameters</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className={`text-sm font-medium ${getMutedTextColor()}`}>Contribution Growth Rate</h4>
                  <p className="text-2xl font-bold">0.5%</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className={`text-sm font-medium ${getMutedTextColor()}`}>Inflation Rate</h4>
                  <p className="text-2xl font-bold">0.5%</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className={`text-sm font-medium ${getMutedTextColor()}`}>Interest Rate</h4>
                  <p className="text-2xl font-bold">1.5%</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-lg">
                  <h4 className={`text-sm font-medium ${getMutedTextColor()}`}>Contingency</h4>
                  <p className="text-2xl font-bold">5.0%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className={`${getCardBgColor()} rounded-lg shadow overflow-hidden`}>
              <div className="px-6 py-4 border-b border-border">
                <h3 className={`text-lg font-medium ${getTextColor()}`}>Maintenance Calendar</h3>
              </div>
              <div className="p-6">
                <div className="flex flex-col space-y-4">
                  {upcomingMaintenanceData.map((task) => (
                    <div 
                      key={task.id}
                      className="border border-border rounded-lg overflow-hidden"
                    >
                      <div 
                        className="px-4 py-3 bg-muted/20 flex justify-between items-center cursor-pointer"
                        onClick={() => toggleCard(task.id)}
                      >
                        <div className="flex items-center">
                          {task.type === 'Replace' ? (
                            <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
                              <Settings size={18} />
                            </div>
                          ) : task.type === 'Service' ? (
                            <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                              <Settings size={18} />
                            </div>
                          ) : (
                            <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                              <Settings size={18} />
                            </div>
                          )}
                          <div>
                            <h4 className={`text-sm font-medium ${getTextColor()}`}>{task.asset}</h4>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <Calendar size={12} className="mr-1" />
                              <span>{new Date(task.date).toLocaleDateString()}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className="px-2 py-1 text-xs rounded-full bg-muted/30 text-muted-foreground mr-2">
                            {task.zone}
                          </span>
                          {expandedCard === task.id ? (
                            <ChevronUp size={16} />
                          ) : (
                            <ChevronDown size={16} />
                          )}
                        </div>
                      </div>
                      {expandedCard === task.id && (
                        <div className="px-4 py-3 border-t border-border">
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            <div>
                              <dt className="text-xs text-muted-foreground">Maintenance Type</dt>
                              <dd className={`text-sm font-medium ${getTextColor()}`}>{task.type}</dd>
                            </div>
                            <div>
                              <dt className="text-xs text-muted-foreground">Estimated Cost</dt>
                              <dd className={`text-sm font-medium ${getTextColor()}`}>OMR {task.estimatedCost.toLocaleString()}</dd>
                            </div>
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-muted-foreground">Description</dt>
                              <dd className={`text-sm ${getTextColor()}`}>
                                Scheduled {task.type.toLowerCase()} of {task.asset} in {task.zone} according to 
                                the asset lifecycle management plan. This task ensures operational reliability
                                and extends asset lifespan.
                              </dd>
                            </div>
                            <div className="sm:col-span-2 mt-2">
                              <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                                <CheckCircle size={16} className="mr-1" />
                                Mark as Complete
                              </button>
                            </div>
                          </dl>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Maintenance By Category</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Preventive', value: 65, color: '#4CAF50' },
                        { name: 'Corrective', value: 20, color: '#FFC107' },
                        { name: 'Replacement', value: 15, color: '#F44336' }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Preventive', value: 65, color: '#4CAF50' },
                        { name: 'Corrective', value: 20, color: '#FFC107' },
                        { name: 'Replacement', value: 15, color: '#F44336' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value}%`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'assets' && (
          <div className="space-y-6">
            <div className={`${getCardBgColor()} rounded-lg shadow overflow-hidden`}>
              <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                <h3 className={`text-lg font-medium ${getTextColor()}`}>Asset Inventory</h3>
                <div className="flex space-x-2">
                  <div className="relative">
                    <input
                      type="text"
                      className="focus:ring-primary focus:border-primary block w-full pl-10 pr-3 py-2 border border-input bg-background rounded-md text-sm"
                      placeholder="Search assets..."
                    />
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-muted-foreground" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <select className="focus:ring-primary focus:border-primary py-2 px-3 border border-input bg-background rounded-md text-sm">
                    <option>All Categories</option>
                    <option>Architectural</option>
                    <option>Mechanical</option>
                    <option>Electrical</option>
                    <option>External Works</option>
                    <option>Infrastructure</option>
                  </select>
                  <select className="focus:ring-primary focus:border-primary py-2 px-3 border border-input bg-background rounded-md text-sm">
                    <option>All Locations</option>
                    <option>Typical Buildings</option>
                    <option>Zone 3 (Al Zaha)</option>
                    <option>Zone 5 (Al Nameer)</option>
                    <option>Zone 8 (Al Wajd)</option>
                    <option>Staff Accommodation</option>
                    <option>Master Community</option>
                  </select>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Asset Name</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Category</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Location</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Condition</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Install Date</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Life Expectancy</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Replacement Cost</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-border`}>
                    <tr>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Chillers (Type 1)</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Mechanical</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Staff Accommodation</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2021-01-15</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>20 years</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>OMR 65,625</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80">View</button>
                      </td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Fire Pumps</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Mechanical</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Zone 3 (Al Zaha)</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2021-02-20</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>15 years</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>OMR 12,060</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80">View</button>
                      </td>
                    </tr>
                    <tr>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Elevators</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Mechanical</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Typical Buildings</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2021-03-10</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>18 years</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>OMR 4,870</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80">View</button>
                      </td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>STP Components</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Infrastructure</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Master Community</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2021-02-05</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>10 years</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>OMR 54,580</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80">View</button>
                      </td>
                    </tr>
                    <tr>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Main Distribution Boards</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Electrical</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Staff Accommodation</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Excellent</span>
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2021-01-30</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>20 years</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>OMR 9,160</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80">View</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="px-6 py-3 flex items-center justify-between border-t border-border">
                <div className="flex-1 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium">1</span> to <span className="font-medium">5</span> of <span className="font-medium">2,100+</span> assets
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                      <a href="#" className="relative inline-flex items-center px-4 py-2 border border-input bg-background text-sm font-medium text-foreground hover:bg-muted">
                        1
                      </a>
                      <a href="#" className="relative inline-flex items-center px-4 py-2 border border-input bg-background text-sm font-medium text-foreground hover:bg-muted">
                        2
                      </a>
                      <a href="#" className="relative inline-flex items-center px-4 py-2 border border-input bg-background text-sm font-medium text-foreground hover:bg-muted">
                        3
                      </a>
                      <span className="relative inline-flex items-center px-4 py-2 border border-input bg-background text-sm font-medium text-muted-foreground">
                        ...
                      </span>
                      <a href="#" className="relative inline-flex items-center px-4 py-2 border border-input bg-background text-sm font-medium text-foreground hover:bg-muted">
                        10
                      </a>
                      <a href="#" className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-input bg-background text-sm font-medium text-muted-foreground hover:bg-muted">
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </a>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
                <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Available Reports</h3>
                <ul className="divide-y divide-border">
                  <li className="py-4 flex">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${getTextColor()}`}>Asset Lifecycle Summary Report</p>
                      <p className="text-sm text-muted-foreground">Overview of all assets with lifecycle information</p>
                    </div>
                    <div className="ml-auto">
                      <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        Download
                      </button>
                    </div>
                  </li>
                  <li className="py-4 flex">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${getTextColor()}`}>Maintenance Forecast Report</p>
                      <p className="text-sm text-muted-foreground">20-year projection of maintenance activities</p>
                    </div>
                    <div className="ml-auto">
                      <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        Download
                      </button>
                    </div>
                  </li>
                  <li className="py-4 flex">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${getTextColor()}`}>Reserve Fund Analysis</p>
                      <p className="text-sm text-muted-foreground">Detailed financial projections for asset replacements</p>
                    </div>
                    <div className="ml-auto">
                      <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        Download
                      </button>
                    </div>
                  </li>
                  <li className="py-4 flex">
                    <div className="flex-shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="ml-3">
                      <p className={`text-sm font-medium ${getTextColor()}`}>Critical Assets Report</p>
                      <p className="text-sm text-muted-foreground">Focus on high-criticality assets requiring special attention</p>
                    </div>
                    <div className="ml-auto">
                      <button className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-primary bg-primary/10 hover:bg-primary/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                        Download
                      </button>
                    </div>
                  </li>
                </ul>
              </div>

              <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
                <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Generate Custom Report</h3>
                <form className="space-y-4">
                  <div>
                    <label htmlFor="report-type" className={`block text-sm font-medium ${getMutedTextColor()}`}>Report Type</label>
                    <select id="report-type" className="mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                      <option>Asset Lifecycle Report</option>
                      <option>Maintenance Schedule</option>
                      <option>Financial Projection</option>
                      <option>Asset Condition Assessment</option>
                      <option>Risk Analysis</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="asset-category" className={`block text-sm font-medium ${getMutedTextColor()}`}>Asset Category</label>
                    <select id="asset-category" className="mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                      <option>All Categories</option>
                      <option>Architectural</option>
                      <option>Mechanical</option>
                      <option>Electrical</option>
                      <option>External Works</option>
                      <option>Infrastructure</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="location" className={`block text-sm font-medium ${getMutedTextColor()}`}>Location</label>
                    <select id="location" className="mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                      <option>All Locations</option>
                      <option>Typical Buildings</option>
                      <option>Zone 3 (Al Zaha)</option>
                      <option>Zone 5 (Al Nameer)</option>
                      <option>Zone 8 (Al Wajd)</option>
                      <option>Staff Accommodation</option>
                      <option>Master Community</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="start-date" className={`block text-sm font-medium ${getMutedTextColor()}`}>Start Date</label>
                      <input type="date" id="start-date" className="mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                    <div>
                      <label htmlFor="end-date" className={`block text-sm font-medium ${getMutedTextColor()}`}>End Date</label>
                      <input type="date" id="end-date" className="mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="format" className={`block text-sm font-medium ${getMutedTextColor()}`}>Format</label>
                    <select id="format" className="mt-1 block w-full py-2 px-3 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm">
                      <option>PDF</option>
                      <option>Excel</option>
                      <option>CSV</option>
                    </select>
                  </div>
                  <div className="pt-2">
                    <button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                      Generate Report
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className={`${getCardBgColor()} rounded-lg shadow p-6`}>
              <h3 className={`text-lg font-medium ${getTextColor()} mb-4`}>Recent Reports</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted">
                    <tr>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Report Name</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Generated On</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Generated By</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Format</th>
                      <th scope="col" className={`px-6 py-3 text-left text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y divide-border`}>
                    <tr>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Muscat Bay ALM Monthly Summary</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2023-11-01</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>System</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>PDF</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80 mr-3">View</button>
                        <button className="text-primary hover:text-primary/80">Download</button>
                      </td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Critical Assets Status Report</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2023-10-15</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Ahmed Hassan</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Excel</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80 mr-3">View</button>
                        <button className="text-primary hover:text-primary/80">Download</button>
                      </td>
                    </tr>
                    <tr>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Maintenance Schedule Q4 2023</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2023-10-01</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Sarah Johnson</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>PDF</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80 mr-3">View</button>
                        <button className="text-primary hover:text-primary/80">Download</button>
                      </td>
                    </tr>
                    <tr className="bg-muted/20">
                      <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${getTextColor()}`}>Reserve Fund Analysis 2023</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>2023-09-15</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>Mohammed Al-Balushi</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>PDF</td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${getMutedTextColor()}`}>
                        <button className="text-primary hover:text-primary/80 mr-3">View</button>
                        <button className="text-primary hover:text-primary/80">Download</button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AssetLifecycleDashboard;
