
import React, { useState, useMemo, useEffect } from 'react';
import { Search, Building2, User2, SquareStack, Wallet } from 'lucide-react';
import { 
  propertyDatabase, 
  getZones, 
  getPropertyTypes, 
  getUnitsByZoneAndType, 
  getPropertyById,
  searchProperties,
  PropertyUnit
} from '@/data/propertyDatabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ReserveFundLookupProps {
  compactView?: boolean;
  darkMode?: boolean;
}

const ReserveFundLookup: React.FC<ReserveFundLookupProps> = ({ 
  compactView = false, 
  darkMode = false 
}) => {
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [filteredUnits, setFilteredUnits] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const zones = useMemo(() => getZones(), []);
  
  const propertyTypes = useMemo(() => 
    selectedZone ? getPropertyTypes(selectedZone) : []
  , [selectedZone]);
  
  useEffect(() => {
    setSelectedPropertyType('');
    setSelectedUnitId('');
    setSearchTerm('');
    setSelectedUnit(null);
  }, [selectedZone]);
  
  useEffect(() => {
    setSelectedUnitId('');
    setSearchTerm('');
    setSelectedUnit(null);
  }, [selectedPropertyType]);
  
  useEffect(() => {
    if (searchTerm) {
      setFilteredUnits(searchProperties(searchTerm));
      return;
    }
    
    if (selectedZone && selectedPropertyType) {
      setFilteredUnits(getUnitsByZoneAndType(selectedZone, selectedPropertyType));
      return;
    }
    
    setFilteredUnits([]);
  }, [selectedZone, selectedPropertyType, searchTerm]);
  
  useEffect(() => {
    if (selectedUnitId) {
      setLoading(true);
      setTimeout(() => {
        const unit = getPropertyById(selectedUnitId);
        setSelectedUnit(unit || null);
        setLoading(false);
      }, 300);
    } else {
      setSelectedUnit(null);
    }
  }, [selectedUnitId]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUnitId) {
      const unit = getPropertyById(selectedUnitId);
      setSelectedUnit(unit || null);
    }
  };

  const getZoneDisplayName = (zoneCode: string) => {
    switch (zoneCode) {
      case '1': return 'Zone 1 (Staff Accommodation)';
      case '3': return 'Zone 3 (Zaha)';
      case '5': return 'Zone 5 (Nameer)';
      case '8': return 'Zone 8 (Wajd)';
      case '3C': return 'Zone 3C (Commercial)';
      default: return `Zone ${zoneCode}`;
    }
  };

  return (
    <Card className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white'} transition-all duration-300`}>
      <CardHeader className="pb-3 border-b">
        <CardTitle className="flex items-center">
          <Search className="h-5 w-5 mr-2" />
          Reserve Fund Contribution Lookup
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Search and view the annual reserve fund contribution for any Muscat Bay property
        </p>
      </CardHeader>
      
      <CardContent className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'} space-y-6`}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label htmlFor="zone" className="text-sm font-medium">
                Zone
              </label>
              <Select value={selectedZone} onValueChange={setSelectedZone}>
                <SelectTrigger id="zone" className="w-full">
                  <SelectValue placeholder="Select Zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Zones</SelectItem>
                  {zones.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {getZoneDisplayName(zone)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="propertyType" className="text-sm font-medium">
                Property Type
              </label>
              <Select 
                value={selectedPropertyType} 
                onValueChange={setSelectedPropertyType}
                disabled={!selectedZone}
              >
                <SelectTrigger id="propertyType" className="w-full">
                  <SelectValue placeholder="Select Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {propertyTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="searchTerm" className="text-sm font-medium">
                Search by Unit No, Type, or Owner
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  id="searchTerm"
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Enter unit number, type or owner name"
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <label htmlFor="unit" className="text-sm font-medium flex justify-between">
              <span>Select Unit</span>
              {filteredUnits.length > 0 && <span className="text-muted-foreground">({filteredUnits.length} properties found)</span>}
            </label>
            <Select 
              value={selectedUnitId} 
              onValueChange={setSelectedUnitId}
              disabled={filteredUnits.length === 0}
            >
              <SelectTrigger id="unit" className="w-full">
                <SelectValue placeholder="-- Select Unit --" />
              </SelectTrigger>
              <SelectContent className="max-h-80">
                {filteredUnits.length === 0 ? (
                  <SelectItem value="no-results">
                    {selectedZone || searchTerm ? "No properties match your criteria" : "Please select a zone or search first"}
                  </SelectItem>
                ) : (
                  filteredUnits.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.unitNo} - {unit.unitTypeDetail} {unit.clientName && `(${unit.clientName})`}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          
          <Button
            type="submit"
            disabled={!selectedUnitId || loading}
            className="w-full"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </>
            ) : (
              'View Reserve Fund Details'
            )}
          </Button>
        </form>

        {selectedUnit && (
          <div className="mt-6 space-y-6">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>Showing:</span>
              <span className="font-medium">{selectedUnit.unitNo} Reserve Fund Details</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className={`rounded-md p-5 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h4 className="text-base font-medium mb-4 flex items-center">
                  <Building2 className="h-4 w-4 mr-1.5" />
                  Property Information
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Unit No</p>
                    <p className="font-medium">{selectedUnit.unitNo}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sector</p>
                    <p className="font-medium">{selectedUnit.sector}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Zone</p>
                    <p className="font-medium">{getZoneDisplayName(selectedUnit.zone)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Property Type</p>
                    <p className="font-medium">{selectedUnit.propertyType}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">Unit Type Detail</p>
                    <p className="font-medium">{selectedUnit.unitTypeDetail}</p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">Built-up Area (BUA)</p>
                    <p className="font-medium flex items-center">
                      <SquareStack className="h-4 w-4 mr-1.5" />
                      {selectedUnit.buaSqm ? `${selectedUnit.buaSqm.toFixed(2)} sq.m` : 'Not Applicable'}
                    </p>
                  </div>
                  <div className="space-y-1 col-span-2">
                    <p className="text-sm text-muted-foreground">Owner</p>
                    <p className="font-medium flex items-center">
                      <User2 className="h-4 w-4 mr-1.5" />
                      {selectedUnit.clientName}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="rounded-md p-5 bg-primary/5 border border-primary/10">
                <h4 className="text-base font-medium mb-4 flex items-center">
                  <Wallet className="h-4 w-4 mr-1.5" />
                  Reserve Fund Contribution
                </h4>
                
                {selectedUnit.reserveFund !== null ? (
                  <div className="space-y-4">
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground mb-1">Annual Contribution (2025)</p>
                      <p className="text-3xl font-bold text-primary">
                        {selectedUnit.reserveFund.toFixed(2)} OMR
                      </p>
                      <div className="text-sm text-muted-foreground mt-1">
                        (Approximately {(selectedUnit.reserveFund / 12).toFixed(2)} OMR per month)
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Quarterly Payment</p>
                          <p className="font-semibold">{(selectedUnit.reserveFund / 4).toFixed(2)} OMR</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-xs text-muted-foreground">Monthly Payment</p>
                          <p className="font-semibold">{(selectedUnit.reserveFund / 12).toFixed(2)} OMR</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground mt-4 text-center">
                      Based on the 2021 Land Sterling Reserve Fund Study, adjusted for 2025.
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8">
                    <div className="text-amber-600 bg-amber-50 px-4 py-2 rounded-md mb-2">
                      No reserve fund contribution details available
                    </div>
                    <p className="text-sm text-muted-foreground text-center max-w-xs">
                      Staff accommodation and some other properties may have different contribution structures.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReserveFundLookup;
