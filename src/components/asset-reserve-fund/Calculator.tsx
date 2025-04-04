import React, { useState, useEffect } from 'react';
import {
  mockZones,
  mockBuildings,
  mockUnits,
} from '@/data/reserveFundData';
import { 
  calculateTotalContribution, 
  getZoneDisplayName, 
  SQM_TO_SQFT,
  getBaseRateForZone,
  calculateAdjustedRate
} from '@/utils/reserveFundCalculator';

interface CalculatorProps {
  compactView?: boolean;
  darkMode?: boolean;
}

const Calculator: React.FC<CalculatorProps> = ({ compactView, darkMode }) => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [manualBua, setManualBua] = useState<string>('');
  const [calculationYear, setCalculationYear] = useState<number>(2025);
  const [calculationResult, setCalculationResult] = useState<number | null>(null);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [useCustomBua, setUseCustomBua] = useState<boolean>(false);
  const [selectedUnitDetails, setSelectedUnitDetails] = useState<any>(null);

  useEffect(() => {
    setSelectedPropertyType('');
    setSelectedBuilding('');
    setSelectedUnitId('');
    setCalculationResult(null);
    setErrorMessage('');
  }, [selectedZone]);

  useEffect(() => {
    setSelectedBuilding('');
    setSelectedUnitId('');
    setCalculationResult(null);
    setErrorMessage('');
  }, [selectedPropertyType]);

  useEffect(() => {
    setSelectedUnitId('');
    setCalculationResult(null);
    setErrorMessage('');
  }, [selectedBuilding]);

  const getPropertyTypes = () => {
    if (!selectedZone) return [];
    
    if (mockUnits[selectedZone]) {
      return Object.keys(mockUnits[selectedZone]);
    }
    
    return [];
  };

  const getBuildings = () => {
    if (!selectedZone || !selectedPropertyType) return [];
    
    if (mockBuildings[selectedZone] && mockBuildings[selectedZone][selectedPropertyType]) {
      return mockBuildings[selectedZone][selectedPropertyType];
    }
    
    return [];
  };

  const getUnits = () => {
    if (!selectedZone || !selectedPropertyType) return [];
    
    if (selectedPropertyType && mockUnits[selectedZone] && mockUnits[selectedZone][selectedPropertyType]) {
      if (requiresBuildingSelection()) {
        if (selectedBuilding && typeof mockUnits[selectedZone][selectedPropertyType] === 'object') {
          return mockUnits[selectedZone][selectedPropertyType][selectedBuilding] || [];
        }
        return [];
      } else if (Array.isArray(mockUnits[selectedZone][selectedPropertyType])) {
        return mockUnits[selectedZone][selectedPropertyType];
      }
    }
    
    return [];
  };

  const requiresBuildingSelection = () => {
    return selectedZone && 
           selectedPropertyType && 
           mockUnits[selectedZone] && 
           mockUnits[selectedZone][selectedPropertyType] && 
           typeof mockUnits[selectedZone][selectedPropertyType] === 'object' && 
           !Array.isArray(mockUnits[selectedZone][selectedPropertyType]);
  };

  const calculateContribution = () => {
    setCalculating(true);
    setErrorMessage('');
    setCalculationResult(null);
    setSelectedUnitDetails(null);

    if ((!selectedUnitId && !useCustomBua) || (useCustomBua && !manualBua)) {
      setErrorMessage('Please select a unit or enter a custom BUA value.');
      setCalculating(false);
      return;
    }

    try {
      let bua = 0;
      let unitInfo = { unitNo: 'Custom Unit', type: 'Custom' };

      if (useCustomBua) {
        bua = parseFloat(manualBua);
        if (isNaN(bua) || bua <= 0) {
          setErrorMessage('Please enter a valid BUA value greater than 0.');
          setCalculating(false);
          return;
        }
        
        const totalContribution = calculateTotalContribution(bua, selectedZone, selectedPropertyType, calculationYear);
        setCalculationResult(totalContribution);
        
      } else {
        const units = getUnits();
        const unit = units.find(u => u.id === selectedUnitId);
        
        if (!unit) {
          setErrorMessage('Selected unit not found.');
          setCalculating(false);
          return;
        }
        
        bua = unit.bua;
        unitInfo = unit;
        setSelectedUnitDetails(unit);
        
        const totalContribution = calculateTotalContribution(bua, selectedZone, unit.type, calculationYear);
        setCalculationResult(totalContribution);
      }

      setTimeout(() => {
        setCalculating(false);
      }, 500);
    } catch (error) {
      console.error('Calculation error:', error);
      setErrorMessage('An error occurred during calculation. Please try again.');
      setCalculating(false);
    }
  };

  const getRateDisplay = () => {
    if (!selectedZone) return null;
    
    const baseRate = getBaseRateForZone(selectedZone);
    const adjustedRate = calculateAdjustedRate(baseRate, calculationYear);
    
    return {
      baseRate: baseRate.toFixed(2),
      adjustedRate: adjustedRate.toFixed(3),
      year: calculationYear
    };
  };

  const rateInfo = getRateDisplay();

  return (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-all duration-300`}>
        <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reserve Fund Contribution Calculator</h3>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Calculate annual reserve fund contribution based on the Land Sterling Reserve Fund Study.
          </p>
        </div>
        
        <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'}`}>
          <div className="space-y-4">
            <div>
              <label htmlFor="calculationYear" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Calculation Year
              </label>
              <select
                id="calculationYear"
                className={`mt-1 block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={calculationYear}
                onChange={(e) => setCalculationYear(parseInt(e.target.value))}
              >
                {[2021, 2022, 2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
            
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
            
            {requiresBuildingSelection() && (
              <div>
                <label htmlFor="building" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Building/Block
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
                  disabled={!selectedPropertyType || (requiresBuildingSelection() && !selectedBuilding)}
                >
                  <option value="">-- Select Unit --</option>
                  {getUnits().map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unitNo} - {unit.type} ({unit.bua} sqm)
                    </option>
                  ))}
                </select>
              </div>
            )}
            
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
            
            {errorMessage && (
              <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                {errorMessage}
              </div>
            )}
            
            {selectedZone && rateInfo && (
              <div className={`mt-3 text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'} p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <p>Using {getZoneDisplayName(selectedZone)} rate for {rateInfo.year}:</p>
                <p>Base rate (2021): {rateInfo.baseRate} OMR/SqFt</p>
                <p>Adjusted rate ({rateInfo.year}): {rateInfo.adjustedRate} OMR/SqFt</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {calculationResult !== null && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-all duration-300`}>
          <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Calculation Results</h3>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Projected reserve fund contributions based on the {calculationYear} RFS-adjusted rates.
            </p>
          </div>
          
          <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'}`}>
            {selectedUnitDetails && (
              <div className={`mb-6 p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Selected Unit Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit No:</span> {selectedUnitDetails.unitNo}
                  </div>
                  <div>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type:</span> {selectedUnitDetails.type}
                  </div>
                  <div>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>BUA:</span> {selectedUnitDetails.bua} sqm <span className="text-xs">({(selectedUnitDetails.bua * SQM_TO_SQFT).toFixed(2)} sqft)</span>
                  </div>
                  <div>
                    <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Zone:</span> {getZoneDisplayName(selectedZone)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-center mb-6">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Total Annual Contribution ({calculationYear})
              </p>
              <p className="mt-1 text-3xl font-bold text-[#4E4456] dark:text-[#AD9BBD]">
                OMR {calculationResult.toFixed(2)}
              </p>
              <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                (Approx. OMR {(calculationResult / 12).toFixed(2)} per month)
              </p>
            </div>
            
            <div className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
              <p>
                Note: These calculations are based on the Land Sterling Reserve Fund Study (RFS) Draft Report dated 31 March 2021 (Ref: LS/IB/2021/6003/REV.0), with the applicable {calculationYear} rates adjusted from 2021 base rates using an annual growth factor of 0.5%.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calculator;
