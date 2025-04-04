import React, { useState, useMemo, useEffect } from 'react';
import { 
  propertyDatabase, 
  getZones, 
  getPropertyTypes, 
  getUnitsByZoneAndType, 
  getPropertyById,
  searchProperties,
  PropertyUnit
} from '@/data/propertyDatabase';

interface ReserveFundLookupProps {
  compactView?: boolean;
  darkMode?: boolean;
}

const ReserveFundLookup: React.FC<ReserveFundLookupProps> = ({ 
  compactView = false, 
  darkMode = false 
}) => {
  // State for filters
  const [selectedZone, setSelectedZone] = useState<string>('');
  const [selectedPropertyType, setSelectedPropertyType] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // State for results
  const [selectedUnit, setSelectedUnit] = useState<PropertyUnit | null>(null);
  const [filteredUnits, setFilteredUnits] = useState<PropertyUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get all available zones
  const zones = useMemo(() => getZones(), []);
  
  // Get property types for selected zone
  const propertyTypes = useMemo(() => 
    selectedZone ? getPropertyTypes(selectedZone) : []
  , [selectedZone]);
  
  // Reset dependent selections when zone changes
  useEffect(() => {
    setSelectedPropertyType('');
    setSelectedUnitId('');
    setSearchTerm('');
    setSelectedUnit(null);
  }, [selectedZone]);
  
  // Reset unit selection when property type changes
  useEffect(() => {
    setSelectedUnitId('');
    setSearchTerm('');
    setSelectedUnit(null);
  }, [selectedPropertyType]);
  
  // Update filtered units based on selections
  useEffect(() => {
    // If search is active, use search
    if (searchTerm) {
      setFilteredUnits(searchProperties(searchTerm));
      return;
    }
    
    // Otherwise filter by zone and type if both are selected
    if (selectedZone && selectedPropertyType) {
      setFilteredUnits(getUnitsByZoneAndType(selectedZone, selectedPropertyType));
      return;
    }
    
    setFilteredUnits([]);
  }, [selectedZone, selectedPropertyType, searchTerm]);
  
  // Update selected unit when unit ID changes
  useEffect(() => {
    if (selectedUnitId) {
      setLoading(true);
      // Simulate API call with setTimeout
      setTimeout(() => {
        const unit = getPropertyById(selectedUnitId);
        setSelectedUnit(unit || null);
        setLoading(false);
      }, 300);
    } else {
      setSelectedUnit(null);
    }
  }, [selectedUnitId]);
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUnitId) {
      const unit = getPropertyById(selectedUnitId);
      setSelectedUnit(unit || null);
    }
  };

  return (
    <div className="space-y-6">
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-all duration-300`}>
        <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Reserve Fund Contribution Lookup</h3>
          <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            Find the annual reserve fund contribution for your property.
          </p>
        </div>
        
        <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'}`}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  {zones.map((zone) => (
                    <option key={zone} value={zone}>
                      {zone === '1' ? 'Zone 1 (Staff Accommodation)' : 
                       zone === '3' ? 'Zone 3 (Zaha)' :
                       zone === '5' ? 'Zone 5 (Nameer)' :
                       zone === '8' ? 'Zone 8 (Wajd)' :
                       zone === '3C' ? 'C Sector (Commercial)' : `Zone ${zone}`}
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
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label htmlFor="searchTerm" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Search by Unit No, Type, or Owner
              </label>
              <input
                type="text"
                id="searchTerm"
                className={`mt-1 block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Enter unit number, type or owner name"
              />
            </div>
            
            <div>
              <label htmlFor="unit" className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Unit {filteredUnits.length > 0 && `(${filteredUnits.length} results)`}
              </label>
              <select
                id="unit"
                className={`mt-1 block w-full px-3 py-2 border ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'} rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm`}
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                disabled={filteredUnits.length === 0}
              >
                <option value="">-- Select Unit --</option>
                {filteredUnits.map((unit) => (
                  <option key={unit.id} value={unit.id}>
                    {unit.unitNo} - {unit.unitTypeDetail} {unit.clientName && `(${unit.clientName})`}
                  </option>
                ))}
              </select>
            </div>
            
            <button
              type="submit"
              disabled={!selectedUnitId || loading}
              className={`mt-4 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#4E4456] ${loading ? 'opacity-75 cursor-not-allowed' : ''}`}
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
            </button>
          </form>
        </div>
      </div>

      {selectedUnit && (
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md transition-all duration-300`}>
          <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'} border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className={`text-lg font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Unit Details</h3>
            <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Property information and reserve fund contribution
            </p>
          </div>
          
          <div className={`p-4 ${compactView ? 'sm:p-5' : 'sm:p-6'}`}>
            <div className={`mb-6 p-4 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h4 className={`text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Property Information
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit No:</span> {selectedUnit.unitNo}
                </div>
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Sector:</span> {selectedUnit.sector}
                </div>
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Zone:</span> {selectedUnit.zone}
                </div>
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Type:</span> {selectedUnit.propertyType}
                </div>
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Unit Type Detail:</span> {selectedUnit.unitTypeDetail}
                </div>
                <div>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>BUA (sqm):</span> {selectedUnit.buaSqm ?? 'N/A'}
                </div>
                <div className="col-span-2">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Owner:</span> {selectedUnit.clientName}
                </div>
              </div>
            </div>
            
            <div className="text-center mb-6">
              <p className={`text-sm font-medium ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Annual Reserve Fund Contribution
              </p>
              {selectedUnit.reserveFund !== null ? (
                <>
                  <p className="mt-1 text-3xl font-bold text-[#4E4456] dark:text-[#AD9BBD]">
                    OMR {selectedUnit.reserveFund.toFixed(2)}
                  </p>
                  <p className={`mt-1 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    (Approx. OMR {(selectedUnit.reserveFund / 12).toFixed(2)} per month)
                  </p>
                </>
              ) : (
                <p className="mt-1 text-xl italic text-yellow-600 dark:text-yellow-400">
                  No reserve fund data available for this unit
                </p>
              )}
            </div>
            
            <div className="mt-4 text-xs text-center text-gray-500 dark:text-gray-400">
              <p>
                Note: The reserve fund contribution values are based on the current rate structure as per the Land Sterling Reserve Fund Study.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReserveFundLookup;
