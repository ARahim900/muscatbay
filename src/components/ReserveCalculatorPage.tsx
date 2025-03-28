
import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

// Data Structure
interface PropertyUnit {
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

// Rates
const ratesOMRPerSqm2025 = {
  masterCommunity: 1.75,
  typicalBuilding: 1.65,
  zone3: 0.44,
  zone5: 1.10,
  zone8: 0.33,
  zone1: 3.95,
  zone2: 0.0,
};

// Property Database
const propertyDatabase: PropertyUnit[] = [
  // Zone 1 - Staff Accommodation & CF
  { id: "FM-B1", unitNo: "FM B1", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B1", buaSqm: 1615.44, plot: "FM-101", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B2", unitNo: "FM B2", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B2", buaSqm: 1615.44, plot: "FM-102", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B3", unitNo: "FM B3", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B3", buaSqm: 1615.44, plot: "FM-103", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B4", unitNo: "FM B4", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B4", buaSqm: 1615.44, plot: "FM-104", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B5", unitNo: "FM B5", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B5", buaSqm: 1615.44, plot: "FM-105", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B6", unitNo: "FM B6", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B6", buaSqm: 1615.44, plot: "FM-106", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B7", unitNo: "FM B7", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B7", buaSqm: 1615.44, plot: "FM-107", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-B8", unitNo: "FM B8", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "Staff Building B8", buaSqm: 1615.44, plot: "FM-108", status: "Occupied", ownerName: "Muscat Bay" },
  { id: "FM-CIF", unitNo: "FM CIF", sector: "FM", zone: '1', propertyType: "Staff Accommodation", unitTypeDetail: "CIF Building", buaSqm: 548.5, plot: "FM-109", status: "Occupied", ownerName: "Muscat Bay" },
  
  // Zone 2 - Village Square
  { id: "Z2-VS-01", unitNo: "Z2 VS-01", sector: "Village Square", zone: '2', propertyType: "Commercial", unitTypeDetail: "Commercial Unit (e.g., Spar)", buaSqm: 150, plot: "VS-01", status: "Operational", ownerName: "Tenant A" },
  { id: "Z2-VS-02", unitNo: "Z2 VS-02", sector: "Village Square", zone: '2', propertyType: "Commercial", unitTypeDetail: "Commercial Unit (e.g., Laundry)", buaSqm: 80, plot: "VS-02", status: "Operational", ownerName: "Tenant B" },
  { id: "Z2-VS-03", unitNo: "Z2 VS-03", sector: "Village Square", zone: '2', propertyType: "Commercial", unitTypeDetail: "Commercial Unit (e.g., Gym)", buaSqm: 200, plot: "VS-03", status: "Operational", ownerName: "Tenant C" },
  
  // Zone 3 - Zaha (First few entries)
  { id: "Z3 061(1A)", unitNo: "Z3 061(1A)", sector: "Zaha", zone: '3', propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, plot: "1232", status: "Sold", ownerName: "Abdullah Al-Farsi" },
  { id: "Z3 054(4A)", unitNo: "Z3 054(4A)", sector: "Zaha", zone: '3', propertyType: "Apartment", unitTypeDetail: "2 Bedroom Small Apartment", buaSqm: 115.47, plot: "1275", status: "Sold", ownerName: "Fatima Al-Balushi" },
  { id: "Z3 057(5)", unitNo: "Z3 057(5)", sector: "Zaha", zone: '3', propertyType: "Apartment", unitTypeDetail: "3 Bedroom Zaha Apartment", buaSqm: 355.07, plot: "1290", status: "Sold", ownerName: "Mohammed Al-Habsi" },
  { id: "Z3 050(1)", unitNo: "Z3 050(1)", sector: "Zaha", zone: '3', propertyType: "Apartment", unitTypeDetail: "2 Bedroom Premium Apartment", buaSqm: 199.13, plot: "1144", status: "Sold", ownerName: "Aisha Al-Riyami" },
  { id: "Z3 019", unitNo: "Z3 019", sector: "Zaha", zone: '3', propertyType: "Villa", unitTypeDetail: "3 Bedroom Zaha Villa", buaSqm: 357.12, plot: "471", status: "Sold", ownerName: "Khalid Al-Maskari" },
  
  // Zone 5 - Nameer (First few entries)
  { id: "Z5 019", unitNo: "Z5 019", sector: "Nameer", zone: '5', propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, plot: "769", status: "Sold", ownerName: "Hamad Al-Rawahi" },
  { id: "Z5 018", unitNo: "Z5 018", sector: "Nameer", zone: '5', propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, plot: "769", status: "Sold", ownerName: "Alya Al-Sinani" },
  { id: "Z5 020", unitNo: "Z5 020", sector: "Nameer", zone: '5', propertyType: "Villa", unitTypeDetail: "4 Bedroom Nameer Villa", buaSqm: 497.62, plot: "770", status: "Sold", ownerName: "Qais Al-Khusaibi" },
  
  // Zone 8 - Wajd (First few entries)
  { id: "Z8 002", unitNo: "Z8 002", sector: "Wajd", zone: '8', propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, plot: "1418.7", status: "Inventory", ownerName: "Muscat Bay Holding" },
  { id: "Z8 003", unitNo: "Z8 003", sector: "Wajd", zone: '8', propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 750.35, plot: "1373", status: "Sold", ownerName: "Owner Name 003" },
  { id: "Z8 005", unitNo: "Z8 005", sector: "Wajd", zone: '8', propertyType: "Villa", unitTypeDetail: "5 Bedroom Wajd Villa", buaSqm: 943, plot: "1684.4", status: "Sold", ownerName: "Owner Name 005" },
  
  // Development Land
  { id: "3C", unitNo: "3C", sector: "C", zone: 'MC', propertyType: "Development Land", unitTypeDetail: "Development Land", buaSqm: 5656, plot: "N/A", status: "Sold" },
];

const ReserveCalculatorPage: React.FC = () => {
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

  // Filtering Logic
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
    // Specific logic for empty zones if necessary
    if (selectedZone === '1') return ["Staff Accommodation"];
    if (selectedZone === '2') return ["Commercial"];

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

  // Update details when unit selection changes
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

  // Reset dependent filters on change
  useEffect(() => {
    setSelectedPropType('');
    setSelectedUnitId('');
    setSearchTerm('');
  }, [selectedZone]);

  useEffect(() => {
    setSelectedUnitId('');
    setSearchTerm('');
  }, [selectedPropType]);

  // Calculation Logic
  const simulateCalculation = async (unit: PropertyUnit) => {
    setIsLoading(true);
    setError(null);
    setCalculationResult(null);

    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async

    if (unit.buaSqm === null || unit.buaSqm === undefined || isNaN(unit.buaSqm) || unit.buaSqm <= 0) {
      // Handle zero or invalid BUA differently depending on context (e.g., Dev Land)
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
      // Apply unless Zone 1 or Dev Land (Confirm exclusion rules)
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

      if (zoneRate > 0) {
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

      // Handle cases where no rates applied but BUA is valid (e.g., Zone 2 with 0 rate)
      if (breakdown.length === 0 && totalContribution === 0 && bua > 0) {
        if (zone === '2') {
          setError(`Zone 2 units currently have a 0.0 OMR/Sq.m specific rate applied. Master Community rate might apply depending on rules.`);
          setCalculationResult({ totalAnnualContribution: 0, monthlyContribution: 0, breakdown: [] });
        } else {
          setError(`No applicable contribution rates found or calculated for unit ${unit.unitNo}.`);
          setCalculationResult({ totalAnnualContribution: 0, monthlyContribution: 0, breakdown: [] });
        }

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

  // Render Logic
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Reserve Fund Calculator</h1>
      <p className="text-sm text-gray-600">Calculations based on 2025 projected rates derived from 2021 RFS. VAT not included.</p>

      {/* Filter Selection Area */}
      <div className="p-4 bg-white rounded-lg shadow-md space-y-4">
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
              disabled={!selectedZone} // Disable if no zone selected
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
              disabled={!selectedZone} // Optionally disable if no zone/type selected
            />
          </div>

          {/* Unit Filter (based on Zone, Type, and Search) */}
          <div className="md:col-span-3"> {/* Span across full width on medium screens */}
            <label htmlFor="unit-select" className="block text-sm font-medium text-gray-600 mb-1">Select Unit</label>
            <select
              id="unit-select"
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              disabled={unitsInFilter.length === 0} // Disable if no units match filters
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
        <div className="p-4 bg-white rounded-lg shadow-md space-y-4 mt-6">
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
        <div className="p-4 bg-white rounded-lg shadow-md space-y-4 mt-6">
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
                {/* Chart for Breakdown */}
                <div style={{ width: '100%', height: 150 }}> {/* Adjust height as needed */}
                  <ResponsiveContainer>
                    <BarChart layout="vertical" data={calculationResult.breakdown} margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" domain={[0, 'dataMax + 10']} tickFormatter={(value) => `OMR ${value.toFixed(0)}`} />
                      <YAxis dataKey="name" type="category" width={120} />
                      <Tooltip formatter={(value: number) => `OMR ${value.toFixed(2)}`} />
                      <Bar dataKey="contribution" fill="#82ca9d" background={{ fill: '#eee' }}>
                        {calculationResult.breakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658'][index % 3]} /> // Example colors
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
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
    </div>
  );
};

export default ReserveCalculatorPage;
