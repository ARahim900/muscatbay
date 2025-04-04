
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReserveFundLookup from '@/components/asset-reserve-fund/ReserveFundLookup';

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
          <ReserveFundLookup />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReserveFundCalculatorPage;
