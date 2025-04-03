
import React, { useState } from 'react';
import { Calculator, Download, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';

// Mock data for calculator
const zones = [
  { id: '3', name: 'Zone 3 (Al Zaha)' },
  { id: '5', name: 'Zone 5 (Al Nameer)' },
  { id: '8', name: 'Zone 8 (Al Wajd)' },
  { id: 'staff', name: 'Staff Accommodation' }
];

const propertyTypes = {
  '3': ['Apartment', 'Villa'],
  '5': ['Villa'],
  '8': ['Villa'],
  'staff': ['Staff Accommodation']
};

const buildings = {
  '3': {
    'Apartment': ['Building D44', 'Building D45', 'Building D46', 'Building D47', 'Building D48', 'Building D49', 'Building D50', 'Building D51', 'Building D52', 'Building D53', 'Building D54', 'Building D55', 'Building D56', 'Building D57', 'Building D58', 'Building D59', 'Building D60', 'Building D61', 'Building D62', 'Building D74', 'Building D75']
  }
};

const units = {
  '3': {
    'Apartment': {
      'Building D45': [
        { id: 'Z3-045-1', unitNo: 'Z3 045(1)', type: '2 Bedroom Premium Apartment', bua: 199.13 }
      ]
    }
  }
};

// Base rates for 2025 (OMR per sq.m.)
const rates2025 = {
  masterCommunity: 1.75,
  typicalBuilding: 1.65,
  zone3: 0.44,
  zone5: 1.10,
  zone8: 0.33,
  staffAccommodation: 3.95
};

// Mock calculation result
const calculationResult = {
  unitDetails: {
    unitNo: 'Z3 045(1)',
    type: '2 Bedroom Premium Apartment',
    bua: 199.00,
    zone: 'Zone 3 (Al Zaha)'
  },
  totalAnnual: 764.16,
  monthly: 63.68,
  breakdown: {
    masterCommunity: 348.25,
    zone3: 87.56,
    building: 328.35
  },
  detailedBreakdown: {
    masterCommunity: [
      { category: 'Roads & Infrastructure', amount: 139.30 },
      { category: 'Landscaping', amount: 69.65 },
      { category: 'Utilities', amount: 104.47 },
      { category: 'Other', amount: 34.83 }
    ],
    zone3: [
      { category: 'Zone 3 Infrastructure', amount: 43.78 },
      { category: 'Zone 3 Amenities', amount: 43.78 }
    ],
    building: [
      { category: 'Elevators', amount: 98.50 },
      { category: 'Common HVAC', amount: 98.50 },
      { category: 'Finishes', amount: 65.67 },
      { category: 'Other', amount: 65.67 }
    ]
  }
};

const ReserveFundCalculator: React.FC = () => {
  const [selectedZone, setSelectedZone] = useState('3');
  const [selectedType, setSelectedType] = useState('Apartment');
  const [selectedBuilding, setSelectedBuilding] = useState('Building D45');
  const [selectedUnit, setSelectedUnit] = useState('Z3 045(1) - 2 Bedroom Premium Apartment');
  const [selectedYear, setSelectedYear] = useState('2025 (Base Year)');
  const [showCalculation, setShowCalculation] = useState(true);

  const handleCalculate = () => {
    setShowCalculation(true);
  };

  const handleReset = () => {
    setSelectedZone('3');
    setSelectedType('Apartment');
    setSelectedBuilding('Building D45');
    setSelectedUnit('Z3 045(1) - 2 Bedroom Premium Apartment');
    setSelectedYear('2025 (Base Year)');
    setShowCalculation(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 transition-colors duration-300">
      <header className="bg-[#4E4456] text-white shadow-lg sticky top-0 z-10 transition-all duration-300 py-4">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <Calculator className="h-6 w-6" />
              </div>
              <h1 className="font-bold tracking-tight text-xl">Muscat Bay Reserve Fund</h1>
            </div>
            <nav className="hidden md:flex space-x-1 flex-grow justify-center px-4">
              {['Dashboard', 'Calculator', 'Reports', 'Assets'].map((tab) => (
                <button 
                  key={tab} 
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    tab === 'Calculator' ? 'bg-white/20 text-white' : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`} 
                >
                  {tab}
                </button>
              ))}
            </nav>
            <div className="flex items-center">
              <button className="p-2 rounded-md text-white hover:bg-white/20 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-[#4E4456]">Reserve Fund Calculator</h2>
          <Button variant="outline" onClick={handleReset}>Reset</Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Property Selection</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Calculation Year</label>
                  <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2025 (Base Year)">2025 (Base Year)</SelectItem>
                      <SelectItem value="2026">2026</SelectItem>
                      <SelectItem value="2027">2027</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                  <Select value={selectedZone} onValueChange={setSelectedZone}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {zones.map(zone => (
                        <SelectItem key={zone.id} value={zone.id}>{zone.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                  <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {propertyTypes[selectedZone as keyof typeof propertyTypes]?.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Building</label>
                  <Select value={selectedBuilding} onValueChange={setSelectedBuilding}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {buildings[selectedZone as keyof typeof buildings]?.[selectedType as keyof typeof buildings[typeof selectedZone]]?.map(building => (
                        <SelectItem key={building} value={building}>{building}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Z3 045(1) - 2 Bedroom Premium Apartment">Z3 045(1) - 2 Bedroom Premium Apartment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Button 
                    className="w-full bg-[#4E4456] hover:bg-[#6D5D7B] text-white" 
                    onClick={handleCalculate}
                  >
                    Calculate Contribution
                  </Button>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Reserve Fund Rates (2025)</h4>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>Master Community: <span className="font-medium">OMR 1.75/m²</span></div>
                  <div>Typical Building: <span className="font-medium">OMR 1.65/m²</span></div>
                  <div>Zone 3 (Al Zaha): <span className="font-medium">OMR 0.44/m²</span></div>
                  <div>Zone 5 (Al Nameer): <span className="font-medium">OMR 1.10/m²</span></div>
                  <div>Zone 8 (Al Wajd): <span className="font-medium">OMR 0.33/m²</span></div>
                  <div>Staff Accommodation: <span className="font-medium">OMR 3.95/m²</span></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">*Rates adjusted for 0.5% annual inflation from 2025 base year. Master Community rate shown as OMR equivalent.</p>
              </div>
            </CardContent>
          </Card>

          {showCalculation && (
            <Card className="bg-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-medium">{calculationResult.unitDetails.unitNo}</h3>
                    <p className="text-gray-500">{calculationResult.unitDetails.type}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-gray-500">Annual Contribution (2025):</div>
                    <div className="text-2xl font-bold text-[#4E4456]">OMR {calculationResult.totalAnnual.toFixed(2)}</div>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-md mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Property Details</h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Unit</div>
                    <div className="font-medium">{calculationResult.unitDetails.unitNo}</div>
                    
                    <div className="text-gray-500">Type</div>
                    <div className="font-medium">{calculationResult.unitDetails.type}</div>
                    
                    <div className="text-gray-500">Built-Up Area</div>
                    <div className="font-medium">{calculationResult.unitDetails.bua.toFixed(2)} sq.m.</div>
                    
                    <div className="text-gray-500">Zone</div>
                    <div className="font-medium">{calculationResult.unitDetails.zone}</div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Contribution Summary (2025)</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Master Community:</span>
                      <span className="font-medium">OMR {calculationResult.breakdown.masterCommunity.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Zone 3:</span>
                      <span className="font-medium">OMR {calculationResult.breakdown.zone3.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500">Building Specific:</span>
                      <span className="font-medium">OMR {calculationResult.breakdown.building.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                      <span className="text-gray-700 font-medium">Total Annual Contribution:</span>
                      <span className="font-bold">OMR {calculationResult.totalAnnual.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500">Monthly Payment:</span>
                      <span className="font-medium">OMR {calculationResult.monthly.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Contribution Breakdown (Approx.)</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-gray-700 mb-1">Master Community</p>
                      <div className="space-y-1 pl-2 text-sm">
                        {calculationResult.detailedBreakdown.masterCommunity.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-gray-500">{item.category}</span>
                            <span>OMR {item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-700 mb-1">Zone 3 Specific</p>
                      <div className="space-y-1 pl-2 text-sm">
                        {calculationResult.detailedBreakdown.zone3.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-gray-500">{item.category}</span>
                            <span>OMR {item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <p className="text-gray-700 mb-1">Building Specific</p>
                      <div className="space-y-1 pl-2 text-sm">
                        {calculationResult.detailedBreakdown.building.map((item, i) => (
                          <div key={i} className="flex justify-between">
                            <span className="text-gray-500">{item.category}</span>
                            <span>OMR {item.amount.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <Button variant="outline" className="flex items-center space-x-1">
                    <Download className="h-4 w-4 mr-1" />
                    Generate PDF
                  </Button>
                  <Button className="bg-[#4E4456] hover:bg-[#6D5D7B] text-white flex items-center space-x-1">
                    <Save className="h-4 w-4 mr-1" />
                    Save Calculation
                  </Button>
                </div>

                <div className="mt-6 pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-1">
                  <p>* Calculation based on 2025 rates adjusted for 0.5% annual inflation since 2025 base year.</p>
                  <p>* Component breakdown is an approximation based on the 2021 Reserve Fund Study.</p>
                  <p>* Master Community contribution shown as OMR equivalent; actual billing may differ.</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <footer className="bg-gray-100 border-t border-gray-200 py-4 mt-10">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© 2025 Muscat Bay Reserve Fund Management</p>
          <p className="text-xs mt-1">Version 1.0.3</p>
        </div>
      </footer>
    </div>
  );
};

export default ReserveFundCalculator;
