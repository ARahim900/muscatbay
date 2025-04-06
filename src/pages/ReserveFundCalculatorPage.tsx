
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

const ReserveFundCalculatorPage = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reserve Fund Calculator</h1>
        <p className="text-gray-600">Look up reserve fund contributions for Muscat Bay properties</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Property Reserve Fund Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Property Zone</label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a zone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zone1">Zone 1</SelectItem>
                  <SelectItem value="zone2">Zone 2</SelectItem>
                  <SelectItem value="zone3">Zone 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Property Unit Number</label>
              <Input placeholder="Enter property unit number" />
            </div>
            <div>
              <p className="text-sm text-gray-600">
                Use this calculator to estimate your property's reserve fund contribution based on its built-up area and location.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReserveFundCalculatorPage;
