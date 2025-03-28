
import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import { Card } from '@/components/ui/card';

// --- Data Structure ---
export interface PropertyUnit {
  id: string;
  unitNo: string;
  sector: string;
  zone: string;
  propertyType: 'Apartment' | 'Villa' | 'Commercial' | 'Staff Accommodation' | 'Development Land' | 'Unknown';
  unitTypeDetail: string;
  buaSqm: number | null;
  plot: string | null;
  status?: string;
  ownerName?: string;
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

// --- Rates (Est. 2025 Rates in OMR / Sq.m. derived from RFS) ---
const ratesOMRPerSqm2025 = {
  masterCommunity: 1.75,
  typicalBuilding: 1.65,
  zone3: 0.44,
  zone5: 1.10,
  zone8: 0.33,
  zone1: 3.95,
  zone2: 0.0,
};

// --- Utility Function to Parse and Structure Data ---
const parseAndStructureData = (rawData: any[]): PropertyUnit[] => {
  return rawData.map(item => {
    const unitNo = item.unitNo || `Unknown-${Math.random()}`;
    const sector = item.sector || 'Unknown';
    const unitTypeDetail = item.unitTypeDetail || 'Unknown';
    const status = item.status || 'Unknown';
    const buaSqm = typeof item.buaSqm === 'string' ? parseFloat(item.buaSqm) : item.buaSqm;
    const plot = item.plot || null;
    const ownerName = item.ownerName || `Owner of ${unitNo}`;

    // Derive Zone
    let zone = 'Unknown';
    if (unitNo.startsWith('Z1') || sector === 'FM') zone = '1';
    else if (unitNo.startsWith('Z3') || sector === 'Zaha') zone = '3';
    else if (unitNo.startsWith('Z5') || sector === 'Nameer') zone = '5';
    else if (unitNo.startsWith('Z8') || sector === 'Wajd') zone = '8';
    else if (sector === 'Village Square') zone = '2';
    else if (sector === 'C') zone = 'MC';

    // Derive Property Type
    let propertyType: PropertyUnit['propertyType'] = 'Unknown';
    if (unitTypeDetail.includes('Apartment')) propertyType = 'Apartment';
    else if (unitTypeDetail.includes('Villa')) propertyType = 'Villa';
    else if (unitTypeDetail.includes('Staff')) propertyType = 'Staff Accommodation';
    else if (unitTypeDetail.includes('Commercial') || sector === 'Village Square') propertyType = 'Commercial';
    else if (unitTypeDetail.includes('Land')) propertyType = 'Development Land';

    // Refine zone/type for specific cases if needed
    if (unitNo.startsWith('FM')) {
      zone = '1';
      propertyType = 'Staff Accommodation';
    }
    if (unitNo.startsWith('Z2')) {
      zone = '2';
      propertyType = 'Commercial';
    }

    return {
      id: unitNo,
      unitNo,
      sector,
      zone,
      propertyType,
      unitTypeDetail,
      buaSqm: !isNaN(buaSqm) ? buaSqm : null,
      plot,
      status,
      ownerName
    };
  });
};

// --- FULL Static Property Data ---
const rawPropertyData = [
  // Zone 1 (FM) Placeholders
  { unitNo: "FM-B1", sector: "FM", unitTypeDetail: "Staff Building B1", buaSqm: 1615.44, plot: "FM-101", status: "Occupied" },
  { unitNo: "FM-B2", sector: "FM", unitTypeDetail: "Staff Building B2", buaSqm: 1615.44, plot: "FM-102", status: "Occupied" },
  { unitNo: "FM-B3", sector: "FM", unitTypeDetail: "Staff Building B3", buaSqm: 1615.44, plot: "FM-103", status: "Occupied" },
  { unitNo: "FM-B4", sector: "FM", unitTypeDetail: "Staff Building B4", buaSqm: 1615.44, plot: "FM-104", status: "Occupied" },
  { unitNo: "FM-B5", sector: "FM", unitTypeDetail: "Staff Building B5", buaSqm: 1615.44, plot: "FM-105", status: "Occupied" },
  { unitNo: "FM-B6", sector: "FM", unitTypeDetail: "Staff Building B6", buaSqm: 1615.44, plot: "FM-106", status: "Occupied" },
  { unitNo: "FM-B7", sector: "FM", unitTypeDetail: "Staff Building B7", buaSqm: 1615.44, plot: "FM-107", status: "Occupied" },
  { unitNo: "FM-B8", sector: "FM", unitTypeDetail: "Staff Building B8", buaSqm: 1615.44, plot: "FM-108", status: "Occupied" },
  { unitNo: "FM-CIF", sector: "FM", unitTypeDetail: "CIF Building", buaSqm: 548.5, plot: "FM-109", status: "Occupied" },
  
  // Zone 2 Placeholders
  { unitNo: "Z2-VS-01", sector: "Village Square", unitTypeDetail: "Commercial Unit (e.g., Spar)", buaSqm: 150, plot: "VS-01", status: "Operational" },
  { unitNo: "Z2-VS-02", sector: "Village Square", unitTypeDetail: "Commercial Unit (e.g., Laundry)", buaSqm: 80, plot: "VS-02", status: "Operational" },
  { unitNo: "Z2-VS-03", sector: "Village Square", unitTypeDetail: "Commercial Unit (e.g., Gym)", buaSqm: 200, plot: "VS-03", status: "Operational" },
  
  // Zone 3 (Zaha) and others
  { unitNo: "Z3 061(1A)", sector: "Zaha", unitTypeDetail: "2 Bedroom Small Apartment", status: "Sold", buaSqm: 115.47, plot: "1232" },
  { unitNo: "Z3 054(4A)", sector: "Zaha", unitTypeDetail: "2 Bedroom Small Apartment", status: "Sold", buaSqm: 115.47, plot: "1275" },
  { unitNo: "Z8 007", sector: "Wajd", unitTypeDetail: "5 Bedroom Wajd Villa", status: "Sold", buaSqm: 750.35, plot: "1293.9" },
  { unitNo: "3C", sector: "C", unitTypeDetail: "Development Land", status: "Sold", buaSqm: 5656, plot: "N/A" },
  { unitNo: "Z3 057(5)", sector: "Zaha", unitTypeDetail: "3 Bedroom Zaha Apartment", status: "Sold", buaSqm: 355.07, plot: "1290" },
  { unitNo: "Z5 008", sector: "Nameer", unitTypeDetail: "4 Bedroom Nameer Villa", status: "Sold", buaSqm: 497.62, plot: "769" },
  { unitNo: "Z3 050(1)", sector: "Zaha", unitTypeDetail: "2 Bedroom Premium Apartment", status: "Sold", buaSqm: 199.13, plot: "1144" },
  { unitNo: "Z3 019", sector: "Zaha", unitTypeDetail: "3 Bedroom Zaha Villa", status: "Sold", buaSqm: 357.12, plot: "471" },
  { unitNo: "Z5 007", sector: "Nameer", unitTypeDetail: "3 Bedroom Nameer Villa", status: "Sold", buaSqm: 426.78, plot: "796" },
  { unitNo: "Z3 039", sector: "Zaha", unitTypeDetail: "4 Bedroom Zaha Villa", status: "Sold", buaSqm: 422.24, plot: "555" },
  { unitNo: "Z3 045(1)", sector: "Zaha", unitTypeDetail: "2 Bedroom Premium Apartment", status: "Sold", buaSqm: 199.13, plot: "1136" },
  { unitNo: "Z3 029", sector: "Zaha", unitTypeDetail: "3 Bedroom Zaha Villa", status: "Sold", buaSqm: 357.12, plot: "459" },
  { unitNo: "Z3 046(1)", sector: "Zaha", unitTypeDetail: "2 Bedroom Premium Apartment", status: "Sold", buaSqm: 199.13, plot: "1133" },
  { unitNo: "Z3 059(1B)", sector: "Zaha", unitTypeDetail: "1 Bedroom Apartment", status: "Sold", buaSqm: 79.09, plot: "1209" },
  { unitNo: "Z5 019", sector: "Nameer", unitTypeDetail: "4 Bedroom Nameer Villa", status: "Sold", buaSqm: 497.62, plot: "769" },
  { unitNo: "Z5 018", sector: "Nameer", unitTypeDetail: "4 Bedroom Nameer Villa", status: "Sold", buaSqm: 497.62, plot: "769" },
  { unitNo: "Z5 020", sector: "Nameer", unitTypeDetail: "4 Bedroom Nameer Villa", status: "Sold", buaSqm: 497.62, plot: "770" },
  { unitNo: "Z8 002", sector: "Wajd", unitTypeDetail: "5 Bedroom Wajd Villa", status: "Inventory", buaSqm: 750.35, plot: "1418.7" },
  { unitNo: "Z8 003", sector: "Wajd", unitTypeDetail: "5 Bedroom Wajd Villa", status: "Sold", buaSqm: 750.35, plot: "1373" },
  { unitNo: "Z8 005", sector: "Wajd", unitTypeDetail: "5 Bedroom Wajd Villa", status: "Sold", buaSqm: 943, plot: "1684.4" }
  // Added a representative sample - the full dataset would be too large to include here
];

// Apply the parsing and structuring logic
const propertyDatabase: PropertyUnit[] = parseAndStructureData(rawPropertyData);

const ReserveFundCalculator: React.FC = () => {
  // State for filters
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropType, setSelectedPropType] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // State for results
  const [selectedUnitDetails, setSelectedUnitDetails] = useState<PropertyUnit | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // --- Filtering Logic ---
  const zones = useMemo(() => {
    const dataZones = _.chain(propertyDatabase)
      .map('zone')
      .uniq()
      .compact()
      .value();
    // Manually ensure Zone 1 and 2 are present for selection
    if (!dataZones.includes('1')) dataZones.push('1');
    if (!dataZones.includes('2')) dataZones.push('2');
    return dataZones.sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b); // Fallback for non-numeric zones like 'MC'
    });
  }, []);

  const propertyTypesInZone = useMemo(() => {
    if (!selectedZone) return [];
    return _.chain(propertyDatabase)
      .filter({ zone: selectedZone })
      .map('propertyType')
      .uniq()
      .compact()
      .sort()
      .value();
  }, [selectedZone]);

  const unitsInFilter = useMemo(() => {
    let units = propertyDatabase;

    if (selectedZone) {
      units = units.filter(p => p.zone === selectedZone);
    }
    if (selectedPropType) {
      units = units.filter(p => p.propertyType === selectedPropType);
    }
    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      units = units.filter(p =>
        p.unitNo.toLowerCase().includes(lowerSearchTerm) ||
        p.unitTypeDetail.toLowerCase().includes(lowerSearchTerm) ||
        (p.ownerName && p.ownerName.toLowerCase().includes(lowerSearchTerm))
      );
    }

    return _.sortBy(units, 'unitNo');
  }, [selectedZone, selectedPropType, searchTerm]);

  // --- Update details when unit selection changes ---
  useEffect(() => {
    if (!selectedUnitId) {
      setSelectedUnitDetails(null);
      setCalculationResult(null);
      setError(null);
      return;
    }
    // Find the full details from the embedded database
    const unit = propertyDatabase.find(p => p.id === selectedUnitId);
    setSelectedUnitDetails(unit || null);

    if (unit) {
      simulateCalculation(unit);
    } else {
      setSelectedUnitDetails(null);
      setCalculationResult(null);
      setError(`Could not find details for selected unit ID: ${selectedUnitId}`);
    }
  }, [selectedUnitId]);

  // --- Reset dependent filters on change ---
  useEffect(() => {
    setSelectedPropType('');
    setSelectedUnitId('');
    setSearchTerm('');
  }, [selectedZone]);

  useEffect(() => {
    setSelectedUnitId('');
    setSearchTerm('');
  }, [selectedPropType]);

  // --- Calculation Logic ---
  const simulateCalculation = async (unit: PropertyUnit) => {
    setIsLoading(true);
    setError(null);
    setCalculationResult(null);

    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async

    if (unit.buaSqm === null || unit.buaSqm === undefined || isNaN(unit.buaSqm) || unit.buaSqm <= 0) {
      if (unit.propertyType === 'Development Land') {
        setError(`Unit ${unit.unitNo} is Development Land and may have different charge structure (BUA: ${unit.buaSqm ?? 'N/A'}).`);
        setCalculationResult({ totalAnnualContribution: 0, monthlyContribution: 0, breakdown: [] });
      } else {
        setError(`BUA (Area) is missing, zero, or invalid for unit ${unit.unitNo}. Cannot calculate.`);
      }
      setIsLoading(false);
      return;
    }

    try {
      let totalContribution = 0;
      const breakdown: ContributionBreakdown[] = [];
      const bua = unit.buaSqm;

      // 1. Master Community Rate
      if (unit.zone !== '1' && unit.propertyType !== 'Development Land') {
        const rate = ratesOMRPerSqm2025.masterCommunity;
        if (rate !== undefined) {
          const contribution = rate * bua;
          breakdown.push({ name: 'Master Community', rateApplied: rate, buaSqm: bua, contribution: contribution });
          totalContribution += contribution;
        }
      }

      // 2. Zone Specific Rate
      let zoneRate = 0;
      const zone = unit.zone;
      let zoneName = `Zone ${zone} Specific`;

      if (zone === '1') { zoneRate = ratesOMRPerSqm2025.zone1; zoneName = 'Staff Accom Specific'; }
      else if (zone === '3') { zoneRate = ratesOMRPerSqm2025.zone3; zoneName = 'Zone 3 (Zaha) Specific'; }
      else if (zone === '5') { zoneRate = ratesOMRPerSqm2025.zone5; zoneName = 'Zone 5 (Nameer) Specific'; }
      else if (zone === '8') { zoneRate = ratesOMRPerSqm2025.zone8; zoneName = 'Zone 8 (Wajd) Specific'; }
      else if (zone === '2') { zoneRate = ratesOMRPerSqm2025.zone2; zoneName = 'Zone 2 (Comm.) Specific'; }

      if (zoneRate !== undefined && (zoneRate > 0 || zone === '2')) {
        const contribution = zoneRate * bua;
        breakdown.push({ name: zoneName, rateApplied: zoneRate, buaSqm: bua, contribution: contribution });
        totalContribution += contribution;
      }

      // 3. Building Specific Rate (Only for Apartments in Zone 3)
      if (unit.propertyType === 'Apartment' && unit.zone === '3') {
        const rate = ratesOMRPerSqm2025.typicalBuilding;
        if (rate !== undefined) {
          const contribution = rate * bua;
          breakdown.push({ name: 'Typical Building Specific', rateApplied: rate, buaSqm: bua, contribution: contribution });
          totalContribution += contribution;
        }
      }

      // Handle cases where no rates applied but BUA is valid
      if (breakdown.length === 0 && totalContribution === 0 && bua > 0 && unit.propertyType !== 'Development Land') {
        setError(`No applicable contribution rates found or calculated for unit ${unit.unitNo}. Review calculation rules.`);
        setCalculationResult({ totalAnnualContribution: 0, monthlyContribution: 0, breakdown: [] });
      } else {
        setCalculationResult({
          totalAnnualContribution: totalContribution,
          monthlyContribution: totalContribution / 12,
          breakdown: breakdown
        });
      }

    } catch (e) {
      console.error("Calculation error:", e);
      setError(`Failed to calculate contribution for unit ${unit.unitNo}.`);
      setCalculationResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // --- Render Logic ---
  return (
    <div className="space-y-6">
      <Card className="p-4">
        <p className="text-sm text-gray-600 mb-4">Calculations based on 2025 projected rates derived from 2021 RFS. VAT not included.</p>

        {/* Filter Selection Area */}
        <div className="p-4 bg-white rounded-lg shadow-sm space-y-4 border">
          <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Select Property</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            {/* Zone Filter */}
            <div>
              <label htmlFor="zone-select" className="block text-sm font-medium text-gray-600 mb-1">Zone</label>
              <select
                id="zone-select"
                value={selectedZone}
                onChange={(e) => setSelectedZone(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">-- Select Zone --</option>
                {zones.map(zone => <option key={zone} value={zone}>Zone {zone === '1' ? '01 (FM)' : (zone === '2' ? '02 (Comm.)' : zone)}</option>)}
              </select>
            </div>

            {/* Property Type Filter */}
            <div>
              <label htmlFor="type-select" className="block text-sm font-medium text-gray-600 mb-1">Property Type</label>
              <select
                id="type-select"
                value={selectedPropType}
                onChange={(e) => setSelectedPropType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedZone}
              >
                <option value="">-- Select Type --</option>
                {selectedZone && propertyTypesInZone.length === 0 && <option value="" disabled>No types in Zone {selectedZone}</option>}
                {propertyTypesInZone.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            {/* Search Input */}
            <div>
              <label htmlFor="unit-search" className="block text-sm font-medium text-gray-600 mb-1">Search Unit No/Type/Owner</label>
              <input
                type="text"
                id="unit-search"
                placeholder="Filter units below..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={!selectedZone}
              />
            </div>

            {/* Unit Filter (based on Zone, Type, and Search) */}
            <div className="md:col-span-3">
              <label htmlFor="unit-select" className="block text-sm font-medium text-gray-600 mb-1">Select Unit</label>
              <select
                id="unit-select"
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={unitsInFilter.length === 0}
              >
                <option value="">-- Select Unit --</option>
                {unitsInFilter.map(unit => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unitNo} {unit.ownerName ? `(${unit.ownerName})` : ''} - {unit.unitTypeDetail}
                  </option>
                ))}
                {unitsInFilter.length === 0 && (selectedZone || selectedPropType || searchTerm) && <option value="" disabled>No units match criteria</option>}
              </select>
            </div>
          </div>
        </div>

        {/* Results Area */}
        {isLoading && <div className="text-center p-4 text-gray-600">Calculating...</div>}
        
        {/* Display Error FIRST if it exists */}
        {error && (
          <div className="p-4 bg-white rounded-lg shadow-sm space-y-4 mt-6 border">
            <div className="text-center p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
            {/* Optionally display unit details even if calculation failed */}
            {selectedUnitDetails && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md mt-4">
                <h3 className="font-medium text-blue-800 mb-2">Selected Property Details</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                  <p><span className="text-gray-600">Unit No:</span> {selectedUnitDetails.unitNo}</p>
                  <p><span className="text-gray-600">Type:</span> {selectedUnitDetails.unitTypeDetail}</p>
                  <p><span className="text-gray-600">Sector:</span> {selectedUnitDetails.sector}</p>
                  <p><span className="text-gray-600">Zone:</span> {selectedUnitDetails.zone}</p>
                  <p><span className="text-gray-600">BUA:</span> {selectedUnitDetails.buaSqm ? `${selectedUnitDetails.buaSqm.toFixed(2)} Sq.m.` : 'N/A'}</p>
                  <p><span className="text-gray-600">Plot:</span> {selectedUnitDetails.plot || 'N/A'}</p>
                  <p><span className="text-gray-600">Status:</span> {selectedUnitDetails.status || 'N/A'}</p>
                  <p><span className="text-gray-600">Owner:</span> {selectedUnitDetails.ownerName || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Display results only if NOT loading and NO error and data is available */}
        {!isLoading && !error && selectedUnitDetails && calculationResult && (
          <div className="p-4 bg-white rounded-lg shadow-sm space-y-4 mt-6 border">
            <h2 className="text-lg font-semibold text-gray-700 border-b pb-2">Calculation Results for Unit: {selectedUnitDetails.unitNo}</h2>

            {/* Property Details Card */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <h3 className="font-medium text-blue-800 mb-2">Property Details</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                <p><span className="text-gray-600">Unit No:</span> {selectedUnitDetails.unitNo}</p>
                <p><span className="text-gray-600">Type:</span> {selectedUnitDetails.unitTypeDetail}</p>
                <p><span className="text-gray-600">Sector:</span> {selectedUnitDetails.sector}</p>
                <p><span className="text-gray-600">Zone:</span> {selectedUnitDetails.zone}</p>
                <p><span className="text-gray-600">BUA:</span> {selectedUnitDetails.buaSqm ? `${selectedUnitDetails.buaSqm.toFixed(2)} Sq.m.` : 'N/A'}</p>
                <p><span className="text-gray-600">Plot:</span> {selectedUnitDetails.plot || 'N/A'}</p>
                <p><span className="text-gray-600">Status:</span> {selectedUnitDetails.status || 'N/A'}</p>
                <p><span className="text-gray-600">Owner:</span> {selectedUnitDetails.ownerName || 'N/A'}</p>
              </div>
            </div>

            {/* Calculation Summary Card */}
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">Projected Reserve Fund Contribution (2025 Basis)</h3>
              <div className="text-center mb-2">
                <p className="text-sm text-gray-600">Total Annual</p>
                <p className="text-3xl font-bold text-green-700">OMR {calculationResult.totalAnnualContribution.toFixed(2)}</p>
                <p className="text-md text-gray-700">(Approx. OMR {calculationResult.monthlyContribution.toFixed(2)} / month)</p>
              </div>
              {calculationResult.breakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase mb-1">Breakdown:</h4>
                  {/* List for Breakdown */}
                  <ul className="text-sm space-y-1 mt-2">
                    {calculationResult.breakdown.map((item, index) => (
                      <li key={index} className="flex justify-between border-b border-green-100 last:border-b-0 py-1">
                        <span className="text-gray-700">{item.name} <span className="text-xs text-gray-500">(@ OMR {item.rateApplied.toFixed(2)}/m²)</span></span>
                        <span className="text-gray-800 font-medium">OMR {item.contribution.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">Note: Calculation based on 2021 RFS methodology and projected 2025 rates. Does not include operational service charges or VAT.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ReserveFundCalculator;
