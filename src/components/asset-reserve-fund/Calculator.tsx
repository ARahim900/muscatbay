
import React, { useState, useEffect } from 'react';
import {
  mockZones,
  mockBuildings,
  mockUnits,
  rates2025
} from '@/data/reserveFundData';

interface CalculatorProps {
  compactView?: boolean;
  darkMode?: boolean;
}

interface ContributionBreakdown {
  name: string;
  rateApplied: number;
  buaSqm: number;
  contribution: number;
}

interface CalculationResult {
  totalAnnualContribution: number;
  monthlyContribution: number;
  breakdown: ContributionBreakdown[];
}

const Calculator: React.FC<CalculatorProps> = ({ compactView, darkMode }) => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [manualBua, setManualBua] = useState<string>('');
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [useCustomBua, setUseCustomBua] = useState<boolean>(false);

  // Reset property type when zone changes
  useEffect(() => {
    setSelectedPropertyType('');
    setSelectedBuilding('');
    setSelectedUnitId('');
    setCalculationResult(null);
    setErrorMessage('');
  }, [selectedZone]);

  // Reset building when property type changes
  useEffect(() => {
    setSelectedBuilding('');
    setSelectedUnitId('');
    setCalculationResult(null);
    setErrorMessage('');
  }, [selectedPropertyType]);

  // Reset unit when building changes
  useEffect(() => {
    setSelectedUnitId('');
    setCalculationResult(null);
    setErrorMessage('');
  }, [selectedBuilding]);

  // Get available property types for selected zone
  const getPropertyTypes = () => {
    if (!selectedZone) return [];
    const zone = mockZones.find(z => z.id === selectedZone);
    return zone ? zone.propertyTypes : [];
  };

  // Get available buildings for selected zone and property type
  const getBuildings = () => {
    if (!selectedZone || !selectedPropertyType) return [];
    
    const buildingsInZone = mockBuildings[selectedZone];
    if (!buildingsInZone) return [];
    
    return buildingsInZone[selectedPropertyType] || [];
  };

  // Get available units based on selection
  const getUnits = () => {
    if (!selectedZone || !selectedPropertyType) return [];
    
    if (selectedPropertyType && mockUnits[selectedZone] && mockUnits[selectedZone][selectedPropertyType]) {
      if (selectedBuilding && typeof mockUnits[selectedZone][selectedPropertyType] === 'object' && !Array.isArray(mockUnits[selectedZone][selectedPropertyType])) {
        // For apartments that are organized by buildings
        return mockUnits[selectedZone][selectedPropertyType][selectedBuilding] || [];
      } else if (Array.isArray(mockUnits[selectedZone][selectedPropertyType])) {
        // For villas that are just in an array
        return mockUnits[selectedZone][selectedPropertyType];
      }
    }
    
    return [];
  };

  // Handle calculation
  const calculateContribution = () => {
    setCalculating(true);
    setErrorMessage('');
    setCalculationResult(null);

    // Validate inputs
    if ((!selectedUnitId && !useCustomBua) || (useCustomBua && !manualBua)) {
      setErrorMessage('Please select a unit or enter a custom BUA value.');
      setCalculating(false);
      return;
    }

    try {
      let bua = 0;
      let unitInfo = { unitNo: 'Custom Unit', type: 'Custom' };

      // Get BUA either from selected unit or manual entry
      if (useCustomBua) {
        bua = parseFloat(manualBua);
        if (isNaN(bua) || bua <= 0) {
          setErrorMessage('Please enter a valid BUA value greater than 0.');
          setCalculating(false);
          return;
        }
      } else {
        // Find the selected unit
        const units = getUnits();
        const unit = units.find(u => u.id === selectedUnitId);
        
        if (!unit) {
          setErrorMessage('Selected unit not found.');
          setCalculating(false);
          return;
        }
        
        bua = unit.bua;
        unitInfo = unit;
      }

      // Calculate contributions based on rates
      const breakdown: ContributionBreakdown[] = [];
      let totalContribution = 0;

      // 1. Master Community contribution (applies to all except Zone 1)
      if (selectedZone !== '1') {
        const masterRate = rates2025.masterCommunity;
        const masterContribution = masterRate * bua;
        breakdown.push({
          name: 'Master Community',
          rateApplied: masterRate,
          buaSqm: bua,
          contribution: masterContribution
        });
        totalContribution += masterContribution;
      }

      // 2. Zone-specific contribution
      let zoneRate = 0;
      let zoneName = '';

      switch (selectedZone) {
        case '1':
          zoneRate = rates2025.staffAccommodation;
          zoneName = 'Staff Accommodation';
          break;
        case '3':
          zoneRate = rates2025.zone3;
          zoneName = 'Zone 3 (Al Zaha)';
          break;
        case '5':
          zoneRate = rates2025.zone5;
          zoneName = 'Zone 5 (Al Nameer)';
          break;
        case '8':
          zoneRate = rates2025.zone8;
          zoneName = 'Zone 8 (Al Wajd)';
          break;
      }

      if (zoneRate > 0) {
        const zoneContribution = zoneRate * bua;
        breakdown.push({
          name: zoneName,
          rateApplied: zoneRate,
          buaSqm: bua,
          contribution: zoneContribution
        });
        totalContribution += zoneContribution;
      }

      // 3. Add typical building rate for apartments in Zone 3
      if (selectedZone === '3' && selectedPropertyType === 'Apartment') {
        const buildingRate = rates2025.typicalBuilding;
        const buildingContribution = buildingRate * bua;
        breakdown.push({
          name: 'Typical Building',
          rateApplied: buildingRate,
          buaSqm: bua,
          contribution: buildingContribution
        });
        totalContribution += buildingContribution;
      }

      // Set the calculation result
      setCalculationResult({
        totalAnnualContribution: totalContribution,
        monthlyContribution: totalContribution / 12,
        breakdown
      });

      // Simulate a short delay for better UX
      setTimeout(() => {
        setCalculating(false);
      }, 500);
    } catch (error) {
      console.error('Calculation error:', error);
      setErrorMessage('An error occurred during calculation. Please try again.');
      setCalculating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Calculator Form */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-all duration-300`}>
        <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reserve Fund Contribution Calculator</h3>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Estimate the annual reserve fund contribution for any property based on 2025 rates.
          </p>
        </div>
        
        <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'}`}>
          <div className="space-y-4">
            {/* Zone Selection */}
            <div>
              <label htmlFor="zone" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Zone
              </label>
              <select
                id="zone"
                className={`mt-1 block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
              >
                <option value="">-- Select Zone --</option>
                {mockZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Property Type Selection */}
            <div>
              <label htmlFor="propertyType" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Property Type
              </label>
              <select
                id="propertyType"
                className={`mt-1 block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={selectedPropertyType}
                onChange={(e) => setSelectedPropertyType(e.target.value)}
                disabled={!selectedZone}
              >
                <option value="">-- Select Property Type --</option>
                {getPropertyTypes().map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Building Selection (for apartments) */}
            {selectedPropertyType === 'Apartment' && (
              <div>
                <label htmlFor="building" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Building
                </label>
                <select
                  id="building"
                  className={`mt-1 block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  disabled={!selectedPropertyType}
                >
                  <option value="">-- Select Building --</option>
                  {getBuildings().map((building) => (
                    <option key={building} value={building}>
                      {building}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Toggle for manual BUA entry */}
            <div className="flex items-center">
              <input
                id="customBua"
                name="customBua"
                type="checkbox"
                checked={useCustomBua}
                onChange={(e) => setUseCustomBua(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="customBua" className={`ml-2 block text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Enter custom BUA (Built Up Area)
              </label>
            </div>
            
            {/* Unit Selection or Custom BUA Input */}
            {useCustomBua ? (
              <div>
                <label htmlFor="manualBua" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Built Up Area (sqm)
                </label>
                <input
                  type="number"
                  id="manualBua"
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  value={manualBua}
                  onChange={(e) => setManualBua(e.target.value)}
                  placeholder="Enter BUA in square meters"
                />
              </div>
            ) : (
              <div>
                <label htmlFor="unit" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Unit
                </label>
                <select
                  id="unit"
                  className={`mt-1 block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  disabled={!selectedPropertyType || (selectedPropertyType === 'Apartment' && !selectedBuilding)}
                >
                  <option value="">-- Select Unit --</option>
                  {getUnits().map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNo} - {unit.type}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Calculate Button */}
            <button
              type="button"
              onClick={calculateContribution}
              disabled={calculating || (!selectedUnitId && !useCustomBua) || (useCustomBua && !manualBua)}
              className={`mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4E4456] ${calculating ? 'opacity-75 cursor-not-allowed' : ''}`}
            >
              {calculating ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Calculating...
                </>
              ) : (
                'Calculate Contribution'
              )}
            </button>
            
            {/* Error Message */}
            {errorMessage && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {calculationResult && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-all duration-300`}>
          <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Calculation Results</h3>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Projected reserve fund contributions based on 2025 rates.
            </p>
          </div>
          
          <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'}`}>
            {/* Annual Contribution */}
            <div className="text-center mb-6">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Annual Contribution
              </p>
              <p className="mt-1 text-3xl font-bold text-[#4E4456] dark:text-[#AD9BBD]">
                OMR {calculationResult.totalAnnualContribution.toFixed(2)}
              </p>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                (Approx. OMR {calculationResult.monthlyContribution.toFixed(2)} per month)
              </p>
            </div>
            
            {/* Contribution Breakdown */}
            <div className={`rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} p-4`}>
              <h4 className={`text-sm font-medium mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Contribution Breakdown
              </h4>
              <ul className="space-y-2">
                {calculationResult.breakdown.map((item, index) => (
                  <li key={index} className={`flex justify-between px-2 py-1 text-sm rounded ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                    <span className={darkMode ? 'text-gray-300' : 'text-gray-700'}>
                      {item.name} ({item.rateApplied.toFixed(2)} OMR/m²)
                    </span>
                    <span className="font-medium">OMR {item.contribution.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Notes and disclaimer */}
            <div className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
              <p>
                Note: These calculations are based on the 2025 projected reserve fund rates and are subject to change.
                {selectedZone === '3' && selectedPropertyType === 'Apartment' && (
                  <span> Apartments in Zone 3 include typical building contributions.</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;
