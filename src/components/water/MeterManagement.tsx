
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, FileText } from 'lucide-react';

interface MeterManagementProps {
  meters: any[];
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  handleMeterSelect: (meterId: string) => void;
  zones: string[];
  formatNumber: (num: number) => string;
}

export const MeterManagement: React.FC<MeterManagementProps> = ({
  meters,
  selectedZone,
  setSelectedZone,
  handleMeterSelect,
  zones,
  formatNumber
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  
  // Filter meters by search, zone and type
  const filteredMeters = meters.filter(meter => {
    const matchesSearch = searchTerm === '' || 
      meter.meterLabel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      meter.accountNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesZone = selectedZone === 'all' || meter.zone === selectedZone;
    const matchesType = selectedType === 'all' || meter.type === selectedType;
    
    return matchesSearch && matchesZone && matchesType;
  });
  
  // Get unique meter types
  const meterTypes = ['all', ...new Set(meters.map(meter => meter.type))];
  
  // Get status color based on meter status
  const getStatusColor = (meter: any) => {
    // Determine status based on readings or other factors
    if (!meter.readings || Object.values(meter.readings).every(v => !v)) return 'bg-gray-100 text-gray-600';
    return 'bg-green-100 text-green-600';
  };
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap justify-between items-center">
          <div>
            <CardTitle className="text-xl">Water Meter Management</CardTitle>
            <CardDescription>View and manage all water meters in the system</CardDescription>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-3 sm:mt-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search meters..."
                className="pl-9 max-w-[200px]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedZone} onValueChange={setSelectedZone}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {zones.map(zone => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                {meterTypes.map(type => (
                  <SelectItem key={type} value={type}>
                    {type === 'all' ? 'All Types' : type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Button variant="default" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Meter
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Meter Label</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Account #</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Last Reading</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMeters.map(meter => (
                <tr key={meter.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{meter.meterLabel}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{meter.accountNumber}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{meter.zone || '—'}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{meter.type}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    <Badge variant="outline" className={`
                      ${meter.label === 'L1' ? 'bg-purple-50 text-purple-700' : ''}
                      ${meter.label === 'L2' ? 'bg-blue-50 text-blue-700' : ''}
                      ${meter.label === 'L3' ? 'bg-green-50 text-green-700' : ''}
                      ${meter.label === 'DC' ? 'bg-amber-50 text-amber-700' : ''}
                    `}>
                      {meter.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                    {formatNumber(Object.values(meter.readings)[0] as number || 0)} m³
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm">
                    <Badge className={getStatusColor(meter)}>
                      {Object.values(meter.readings).some(v => v) ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                    <Button variant="ghost" size="sm" onClick={() => handleMeterSelect(meter.id)}>
                      <FileText className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </td>
                </tr>
              ))}
              
              {filteredMeters.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-6 text-center text-gray-500">
                    No meters found matching the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {filteredMeters.length} of {meters.length} meters
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm" disabled>Next</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
