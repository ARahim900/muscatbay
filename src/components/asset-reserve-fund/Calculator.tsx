
import React, { useState, useMemo } from 'react';
import Transition from './Transition';
import { mockZones, mockBuildings, mockUnits, rates2025 } from '@/data/reserveFundData';

interface CalculatorProps {
  compactView?: boolean;
  darkMode?: boolean;
}

interface UnitDetails {
  id: string;
  unitNo: string;
  type: string;
  bua: number;
}

interface ContributionBreakdown {
  category: string;
  components: {
    name: string;
    share: number;
  }[];
}

interface CalculationResultType {
  unitDetails: UnitDetails;
  masterContribution: number;
  zoneContribution: number;
  buildingContribution: number;
  totalAnnualContribution: number;
  componentBreakdown: ContributionBreakdown[];
  year: string;
}

const Calculator: React.FC<CalculatorProps> = ({ compactView = false, darkMode = false }) => {
  const [selectedZone, setSelectedZone] = useState('');
  const [selectedPropertyType, setSelectedPropertyType] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [calculationResult, setCalculationResult] = useState<CalculationResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedYear, setSelectedYear] = useState('2025');

  const propertyTypes = useMemo(
    () => (selectedZone ? mockZones.find(z => z.id === selectedZone)?.propertyTypes || [] : []),
    [selectedZone]
  );

  const buildings = useMemo(
    () => (selectedZone && selectedPropertyType === 'Apartment' && mockBuildings[selectedZone]?.[selectedPropertyType]) || [],
    [selectedZone, selectedPropertyType]
  );

  const units = useMemo(() => {
    if (!selectedZone || !selectedPropertyType) return [];
    
    if (selectedPropertyType === 'Apartment') {
      if (!selectedBuilding && buildings.length > 0) return [];
      return mockUnits[selectedZone]?.[selectedPropertyType]?.[selectedBuilding] || [];
    } else {
      return mockUnits[selectedZone]?.[selectedPropertyType] || [];
    }
  }, [selectedZone, selectedPropertyType, selectedBuilding, buildings]);

  const getInflationAdjustedRates = (year: string) => {
    const yearDiff = parseInt(year) - 2025;
    const inflationRate = 0.005;
    const adjustmentFactor = Math.pow(1 + inflationRate, yearDiff);
    
    return {
      masterCommunity: rates2025.masterCommunity * adjustmentFactor,
      typicalBuilding: rates2025.typicalBuilding * adjustmentFactor,
      zone3: rates2025.zone3 * adjustmentFactor,
      zone5: rates2025.zone5 * adjustmentFactor,
      zone8: rates2025.zone8 * adjustmentFactor,
      staffAccommodation: rates2025.staffAccommodation * adjustmentFactor
    };
  };

  const getUnitDetails = () => {
    if (!selectedZone || !selectedPropertyType || !selectedUnit) return null;
    
    if (selectedPropertyType === 'Apartment' && selectedBuilding) {
      return mockUnits[selectedZone]?.[selectedPropertyType]?.[selectedBuilding]?.find(
        unit => unit.id === selectedUnit
      );
    } else {
      return mockUnits[selectedZone]?.[selectedPropertyType]?.find(
        unit => unit.id === selectedUnit
      );
    }
  };

  const calculateContribution = () => {
    setLoading(true);
    setCalculationResult(null);
    
    setTimeout(() => {
      const unitDetails = getUnitDetails();
      if (!unitDetails) {
        setLoading(false);
        return;
      }
      
      const adjustedRates = getInflationAdjustedRates(selectedYear);
      let masterContribution = 0;
      let zoneContribution = 0;
      let buildingContribution = 0;
      
      if (selectedZone !== 'staff') {
        masterContribution = unitDetails.bua * adjustedRates.masterCommunity;
      }
      
      switch (selectedZone) {
        case '3':
          zoneContribution = unitDetails.bua * adjustedRates.zone3;
          break;
        case '5':
          zoneContribution = unitDetails.bua * adjustedRates.zone5;
          break;
        case '8':
          zoneContribution = unitDetails.bua * adjustedRates.zone8;
          break;
        case 'staff':
          zoneContribution = unitDetails.bua * adjustedRates.staffAccommodation;
          break;
        default:
          zoneContribution = 0;
      }
      
      if (selectedPropertyType === 'Apartment') {
        buildingContribution = unitDetails.bua * adjustedRates.typicalBuilding;
      }
      
      const totalAnnualContribution = masterContribution + zoneContribution + buildingContribution;
      
      const componentBreakdown: ContributionBreakdown[] = [];
      
      if (masterContribution > 0) {
        componentBreakdown.push({
          category: 'Master Community',
          components: [
            { name: 'Roads & Infrastructure', share: masterContribution * 0.4 },
            { name: 'Landscaping', share: masterContribution * 0.2 },
            { name: 'Utilities', share: masterContribution * 0.3 },
            { name: 'Other', share: masterContribution * 0.1 }
          ]
        });
      }
      
      if (zoneContribution > 0) {
        componentBreakdown.push({
          category: selectedZone === 'staff' ? 'Staff Accommodation' : `Zone ${selectedZone} Specific`,
          components: [
            { name: `Zone ${selectedZone} Infrastructure`, share: zoneContribution * 0.5 },
            { name: `Zone ${selectedZone} Amenities`, share: zoneContribution * 0.5 }
          ]
        });
      }
      
      if (buildingContribution > 0) {
        componentBreakdown.push({
          category: 'Building Specific',
          components: [
            { name: 'Elevators', share: buildingContribution * 0.3 },
            { name: 'Common HVAC', share: buildingContribution * 0.3 },
            { name: 'Finishes', share: buildingContribution * 0.2 },
            { name: 'Other', share: buildingContribution * 0.2 }
          ]
        });
      }
      
      setCalculationResult({
        unitDetails,
        masterContribution,
        zoneContribution,
        buildingContribution,
        totalAnnualContribution,
        componentBreakdown,
        year: selectedYear
      });
      
      setLoading(false);
    }, 800);
  };

  const resetCalculator = () => {
    setSelectedZone('');
    setSelectedPropertyType('');
    setSelectedBuilding('');
    setSelectedUnit('');
    setSelectedYear('2025');
    setCalculationResult(null);
  };

  const handleZoneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedZone(e.target.value);
    setSelectedPropertyType('');
    setSelectedBuilding('');
    setSelectedUnit('');
    setCalculationResult(null);
  };

  const handlePropertyTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPropertyType(e.target.value);
    setSelectedBuilding('');
    setSelectedUnit('');
    setCalculationResult(null);
  };

  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedBuilding(e.target.value);
    setSelectedUnit('');
    setCalculationResult(null);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedUnit(e.target.value);
    setCalculationResult(null);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedYear(e.target.value);
    setCalculationResult(null);
  };

  const generatePDFReport = () => {
    alert('PDF Report generation feature is planned for a future update.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`${compactView ? 'text-xl' : 'text-2xl'} font-bold text-[#4E4456] dark:text-[#AD9BBD]`}>
          Reserve Fund Calculator
        </h2>
        <button
          onClick={resetCalculator}
          className={`px-4 py-2 text-sm font-medium rounded-md border transition-colors ${
            darkMode
              ? 'text-[#AD9BBD] border-[#AD9BBD] hover:bg-[#4E4456] hover:text-white'
              : 'text-[#4E4456] border-[#4E4456] hover:bg-[#4E4456] hover:text-white'
          }`}
        >
          Reset
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-[#AD9BBD]' : 'text-[#4E4456]'}`}>
            Property Selection
          </h3>
          <div className="space-y-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Calculation Year
              </label>
              <select
                value={selectedYear}
                onChange={handleYearChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-[#6D5D7B]'
                    : 'border-gray-300 focus:border-[#4E4456]'
                }`}
              >
                {Array.from({ length: 20 }, (_, i) => 2025 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}{year === 2025 ? ' (Base Year)' : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Zone
              </label>
              <select
                value={selectedZone}
                onChange={handleZoneChange}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-[#6D5D7B]'
                    : 'border-gray-300 focus:border-[#4E4456]'
                }`}
              >
                <option value="">Select Zone</option>
                {mockZones.map((zone) => (
                  <option key={zone.id} value={zone.id}>
                    {zone.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Property Type
              </label>
              <select
                value={selectedPropertyType}
                onChange={handlePropertyTypeChange}
                disabled={!selectedZone}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-[#6D5D7B] disabled:bg-gray-800 disabled:border-gray-700'
                    : 'border-gray-300 focus:border-[#4E4456] disabled:bg-gray-100 disabled:cursor-not-allowed'
                }`}
              >
                <option value="">Select Property Type</option>
                {propertyTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            
            {selectedPropertyType === 'Apartment' && buildings.length > 0 && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Building
                </label>
                <select
                  value={selectedBuilding}
                  onChange={handleBuildingChange}
                  disabled={!selectedPropertyType}
                  className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-[#6D5D7B] disabled:bg-gray-800 disabled:border-gray-700'
                      : 'border-gray-300 focus:border-[#4E4456] disabled:bg-gray-100 disabled:cursor-not-allowed'
                  }`}
                >
                  <option value="">Select Building</option>
                  {buildings.map((building) => (
                    <option key={building} value={building}>
                      Building {building}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Unit
              </label>
              <select
                value={selectedUnit}
                onChange={handleUnitChange}
                disabled={units.length === 0}
                className={`w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-[#6D5D7B] disabled:bg-gray-800 disabled:border-gray-700'
                    : 'border-gray-300 focus:border-[#4E4456] disabled:bg-gray-100 disabled:cursor-not-allowed'
                }`}
              >
                <option value="">Select Unit</option>
                {units.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unitNo} - {unit.type}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="pt-4 flex gap-2">
              <button
                onClick={calculateContribution}
                disabled={!selectedUnit || loading}
                className={`flex-1 bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] text-white rounded-md py-2 px-4 font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#4E4456]/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                  loading ? 'animate-pulse' : ''
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Calculating...
                  </span>
                ) : (
                  'Calculate Contribution'
                )}
              </button>
            </div>
          </div>
          
          <div className={`mt-6 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Reserve Fund Rates ({selectedYear})
            </h4>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Master Community:{' '}
                <span className={`ml-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  OMR {getInflationAdjustedRates(selectedYear).masterCommunity.toFixed(2)}/m²
                </span>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Typical Building:{' '}
                <span className={`ml-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  OMR {getInflationAdjustedRates(selectedYear).typicalBuilding.toFixed(2)}/m²
                </span>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Zone 3 (Al Zaha):{' '}
                <span className={`ml-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  OMR {getInflationAdjustedRates(selectedYear).zone3.toFixed(2)}/m²
                </span>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Zone 5 (Al Nameer):{' '}
                <span className={`ml-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  OMR {getInflationAdjustedRates(selectedYear).zone5.toFixed(2)}/m²
                </span>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Zone 8 (Al Wajd):{' '}
                <span className={`ml-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  OMR {getInflationAdjustedRates(selectedYear).zone8.toFixed(2)}/m²
                </span>
              </div>
              <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Staff Accommodation:{' '}
                <span className={`ml-1 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  OMR {getInflationAdjustedRates(selectedYear).staffAccommodation.toFixed(2)}/m²
                </span>
              </div>
            </div>
            <div className={`mt-2 text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              *Rates adjusted for 0.5% annual inflation from 2025 base year. Master Community rate shown as OMR
              equivalent.
            </div>
          </div>
        </div>
        
        <div className={`rounded-lg shadow-md p-6 ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <h3 className={`text-lg font-medium mb-4 ${darkMode ? 'text-[#AD9BBD]' : 'text-[#4E4456]'}`}>
            Calculation Results
          </h3>
          <Transition
            show={calculationResult !== null}
            enter="transition-opacity duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
            unmount={false}
          >
            {calculationResult ? (
              <div className="space-y-6 animate-fadeIn">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {calculationResult.unitDetails.unitNo}
                    </h4>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {calculationResult.unitDetails.type}
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Annual Contribution ({calculationResult.year}):
                    </div>
                    <div className="text-xl font-bold text-[#4E4456] dark:text-[#AD9BBD]">
                      OMR {calculationResult.totalAnnualContribution.toFixed(2)}
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Property Details
                  </h4>
                  <div className={`rounded-md p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit</p>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {calculationResult.unitDetails.unitNo}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type</p>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {calculationResult.unitDetails.type}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Built-Up Area
                        </p>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {calculationResult.unitDetails.bua.toFixed(2)} sq.m.
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Zone</p>
                        <p className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {mockZones.find(z => z.id === selectedZone)?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Contribution Summary ({calculationResult.year})
                  </h4>
                  <div className={`rounded-md p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="space-y-2">
                      {calculationResult.masterContribution > 0 && (
                        <div className="flex justify-between">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Master Community:
                          </span>
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            OMR {calculationResult.masterContribution.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {selectedZone === 'staff' ? 'Staff Accommodation:' : `Zone ${selectedZone}:`}
                        </span>
                        <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          OMR {calculationResult.zoneContribution.toFixed(2)}
                        </span>
                      </div>
                      {calculationResult.buildingContribution > 0 && (
                        <div className="flex justify-between">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            Building Specific:
                          </span>
                          <span className={`text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                            OMR {calculationResult.buildingContribution.toFixed(2)}
                          </span>
                        </div>
                      )}
                      <div className={`border-t pt-2 mt-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                        <div className="flex justify-between font-medium">
                          <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-800'}`}>
                            Total Annual Contribution:
                          </span>
                          <span className="text-sm text-[#4E4456] dark:text-[#AD9BBD]">
                            OMR {calculationResult.totalAnnualContribution.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Monthly Payment:
                          </span>
                          <span className={`${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            OMR {(calculationResult.totalAnnualContribution / 12).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                    Contribution Breakdown (Approx.)
                  </h4>
                  <div className={`rounded-md p-4 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <div className="space-y-4">
                      {calculationResult.componentBreakdown.map((category, categoryIndex) => (
                        <div key={categoryIndex}>
                          <h5 className={`text-xs font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {category.category}
                          </h5>
                          <div className="space-y-1">
                            {category.components.map((component, componentIndex) => (
                              <div key={componentIndex} className="flex justify-between text-xs">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
                                  {component.name}
                                </span>
                                <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                                  OMR {component.share.toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                          {categoryIndex < calculationResult.componentBreakdown.length - 1 && (
                            <div className={`border-t mt-2 ${darkMode ? 'border-gray-600' : 'border-gray-200'}`} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={generatePDFReport}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      darkMode
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } transition-colors`}
                  >
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                        />
                      </svg>
                      Generate PDF
                    </span>
                  </button>
                  <button className="px-4 py-2 text-sm font-medium rounded-md bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] text-white hover:opacity-90 transition-colors">
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                        />
                      </svg>
                      Save Calculation
                    </span>
                  </button>
                </div>
                <div className={`text-xs italic ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>
                    * Calculation based on {calculationResult.year} rates adjusted for 0.5% annual inflation
                    since 2025 base year.
                  </p>
                  <p>* Component breakdown is an approximation based on the 2021 Reserve Fund Study.</p>
                  <p>
                    * Master Community contribution shown as OMR equivalent; actual billing may differ.
                  </p>
                </div>
              </div>
            ) : (
              <div
                className={`flex flex-col items-center justify-center py-12 text-center ${
                  darkMode ? 'text-gray-500' : 'text-gray-400'
                }`}
              >
                <svg
                  className={`w-16 h-16 mb-4 ${darkMode ? 'text-gray-600' : 'text-gray-300'}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-sm">
                  Select a property from the form to calculate the reserve fund contribution.
                </p>
              </div>
            )}
          </Transition>
        </div>
      </div>
    </div>
  );
};

export default Calculator;
