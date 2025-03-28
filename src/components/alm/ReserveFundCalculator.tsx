
import React, { useState, useMemo, useEffect } from 'react';
import _ from 'lodash';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

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

const ReserveFundCalculator: React.FC = () => {
  // State for filters
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropType, setSelectedPropType] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [propertyDatabase, setPropertyDatabase] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // State for results
  const [selectedUnitDetails, setSelectedUnitDetails] = useState<PropertyUnit | null>(null);
  const [calculationResult, setCalculationResult] = useState<CalculationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch properties from Supabase
  useEffect(() => {
    const fetchProperties = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const { data, error } = await supabase
          .from('Owners/Properties Details')
          .select('*')
          .order('Unit No', { ascending: true });

        if (error) {
          throw new Error(`Error fetching properties: ${error.message}`);
        }

        if (data) {
          // Parse and structure the data from Supabase
          const parsedData: PropertyUnit[] = data.map(item => {
            // Convert BUA to number if it's a string
            const buaValue = typeof item.BUA === 'string' 
              ? parseFloat(item.BUA.replace(/,/g, '')) 
              : item.BUA;

            // Derive property type
            let propertyType: PropertyUnit['propertyType'] = 'Unknown';
            if (item['Unit Type']?.toLowerCase().includes('apartment')) propertyType = 'Apartment';
            else if (item['Unit Type']?.toLowerCase().includes('villa')) propertyType = 'Villa';
            else if (item['Type']?.toLowerCase().includes('commercial')) propertyType = 'Commercial';
            else if (item['Unit Type']?.toLowerCase().includes('staff')) propertyType = 'Staff Accommodation';
            else if (item['Unit Type']?.toLowerCase().includes('land')) propertyType = 'Development Land';

            // Derive zone from Unit No
            let zone = 'Unknown';
            const unitNo = item['Unit No'] || '';
            if (unitNo.startsWith('Z1') || item.Sector === 'FM') zone = '1';
            else if (unitNo.startsWith('Z3') || item.Sector === 'Zaha') zone = '3';
            else if (unitNo.startsWith('Z5') || item.Sector === 'Nameer') zone = '5';
            else if (unitNo.startsWith('Z8') || item.Sector === 'Wajd') zone = '8';
            else if (item.Sector === 'Village Square') zone = '2';
            else if (item.Sector === 'C') zone = 'MC'; // Assuming Sector C is Master Community related

            return {
              id: item['Unit No'] || `id-${Math.random()}`,
              unitNo: item['Unit No'] || 'Unknown',
              sector: item.Sector || 'Unknown',
              zone,
              propertyType,
              unitTypeDetail: item['Unit Type'] || 'Unknown',
              buaSqm: !isNaN(buaValue) ? buaValue : null,
              plot: item.Plot || null,
              status: item.Status || 'Unknown',
              ownerName: item['Client Name'] || 'Unknown Owner'
            };
          });

          console.log('Fetched properties:', parsedData.length);
          setPropertyDatabase(parsedData);
        }
      } catch (err) {
        console.error('Error fetching property data:', err);
        setFetchError(err instanceof Error ? err.message : 'Failed to fetch property data');
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

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
      return a.localeCompare(b);
    });
  }, [propertyDatabase]);

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
  }, [selectedZone, propertyDatabase]);

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
  }, [selectedZone, selectedPropType, searchTerm, propertyDatabase]);

  // Update details when unit selection changes
  useEffect(() => {
    if (!selectedUnitId) {
      setSelectedUnitDetails(null);
      setCalculationResult(null);
      setError(null);
      return;
    }
    
    const unit = propertyDatabase.find(p => p.id === selectedUnitId);
    setSelectedUnitDetails(unit || null);

    if (unit) {
      simulateCalculation(unit);
    } else {
      setSelectedUnitDetails(null);
      setCalculationResult(null);
      setError(`Could not find details for selected unit ID: ${selectedUnitId}`);
    }
  }, [selectedUnitId, propertyDatabase]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading property data...</span>
      </div>
    );
  }

  if (fetchError) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Error Loading Data</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 text-red-800 p-4 rounded-md">
            <p>Failed to load property data: {fetchError}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">Reserve Fund Calculator</CardTitle>
          <p className="text-sm text-muted-foreground">
            Calculations based on 2025 projected rates derived from 2021 RFS. VAT not included.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-700 border-b pb-2">Select Property</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Zone Filter */}
              <div className="space-y-2">
                <Label htmlFor="zone-select">Zone</Label>
                <Select
                  value={selectedZone}
                  onValueChange={setSelectedZone}
                >
                  <SelectTrigger id="zone-select">
                    <SelectValue placeholder="-- Select Zone --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Zones</SelectItem>
                    {zones.map(zone => (
                      <SelectItem key={zone} value={zone}>
                        Zone {zone === '1' ? '01 (FM)' : (zone === '2' ? '02 (Comm.)' : zone)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Property Type Filter */}
              <div className="space-y-2">
                <Label htmlFor="type-select">Property Type</Label>
                <Select
                  value={selectedPropType}
                  onValueChange={setSelectedPropType}
                  disabled={!selectedZone}
                >
                  <SelectTrigger id="type-select">
                    <SelectValue placeholder="-- Select Type --" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Types</SelectItem>
                    {propertyTypesInZone.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="unit-search">Search Unit No/Type/Owner</Label>
                <Input
                  id="unit-search"
                  placeholder="Filter units..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  disabled={!selectedZone}
                />
              </div>

              {/* Unit Filter */}
              <div className="col-span-1 md:col-span-3 space-y-2">
                <Label htmlFor="unit-select">Select Unit ({unitsInFilter.length} available)</Label>
                <Select
                  value={selectedUnitId}
                  onValueChange={setSelectedUnitId}
                  disabled={unitsInFilter.length === 0}
                >
                  <SelectTrigger id="unit-select">
                    <SelectValue placeholder="-- Select Unit --" />
                  </SelectTrigger>
                  <SelectContent>
                    {unitsInFilter.map(unit => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.unitNo} {unit.ownerName !== 'Unknown Owner' ? `(${unit.ownerName})` : ''} - {unit.unitTypeDetail}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Area */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Calculating...</span>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center p-4 text-red-600 bg-red-100 rounded-md">{error}</div>
            
            {selectedUnitDetails && (
              <div className="p-4 mt-4 bg-blue-50 border border-blue-200 rounded-md">
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
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {!isLoading && !error && selectedUnitDetails && calculationResult && (
        <Card>
          <CardHeader>
            <CardTitle>Calculation Results for Unit: {selectedUnitDetails.unitNo}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Property Details */}
            <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-md">
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

            {/* Calculation Result */}
            <div className="p-4 bg-green-50 border border-green-200 rounded-md">
              <h3 className="font-medium text-green-800 mb-2">Projected Reserve Fund Contribution (2025 Basis)</h3>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">Total Annual</p>
                <p className="text-3xl font-bold text-green-700">OMR {calculationResult.totalAnnualContribution.toFixed(2)}</p>
                <p className="text-md text-gray-700">(Approx. OMR {calculationResult.monthlyContribution.toFixed(2)} / month)</p>
              </div>
              
              {calculationResult.breakdown.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-600 uppercase mb-1">Breakdown:</h4>
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
            
            <p className="text-xs text-gray-500 text-center mt-4">Note: Calculation based on 2021 RFS methodology and projected 2025 rates. Does not include operational service charges or VAT.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ReserveFundCalculator;
