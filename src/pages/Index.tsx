
import React from 'react';
import { Card } from '@/components/ui/card';

const Index = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col gap-6">
        <div className="text-center my-8">
          <h1 className="text-3xl font-bold mb-2">Muscat Bay Management Portal</h1>
          <p className="text-gray-500">Welcome to the Muscat Bay property management and utilities dashboard</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
                  <path d="M3 6h18v4H3z" />
                  <path d="M9 14h6" />
                  <path d="M9 18h6" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Asset Lifecycle Management</h2>
              <p className="text-center text-gray-500 mb-4">Track and manage all assets across the property</p>
              <a href="/alm" className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">Access Module</a>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                  <path d="M2 20h20" />
                  <path d="M14 12v.01" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Property Management</h2>
              <p className="text-center text-gray-500 mb-4">Manage properties, tenants, and maintenance requests</p>
              <a href="/property-management" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Access Module</a>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-purple-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3v18" />
                  <rect x="4" y="8" width="16" height="12" rx="2" />
                  <path d="M2 8h20" />
                  <path d="M2 13h20" />
                  <path d="M2 18h20" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Financial Visualizer</h2>
              <p className="text-center text-gray-500 mb-4">Analyze and visualize financial data</p>
              <a href="/financial-visualizer" className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors">Access Module</a>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12H3M3 12L8 7M3 12L8 17" />
                  <path d="M14 7L19 12L14 17" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Utilities Management</h2>
              <p className="text-center text-gray-500 mb-4">Monitor and manage water, electricity, and other utilities</p>
              <a href="/water" className="px-4 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 transition-colors">Access Module</a>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Reserve Fund Calculator</h2>
              <p className="text-center text-gray-500 mb-4">Calculate and manage reserve fund contributions</p>
              <a href="/reserve-fund-calculator" className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Access Module</a>
            </div>
          </Card>
          
          <Card className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-teal-100 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <path d="M14 2v6h6" />
                  <path d="M16 13H8" />
                  <path d="M16 17H8" />
                  <path d="M10 9H8" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold mb-2">Reports</h2>
              <p className="text-center text-gray-500 mb-4">Generate and export various reports</p>
              <a href="/reports" className="px-4 py-2 bg-teal-600 text-white rounded-md hover:bg-teal-700 transition-colors">Access Module</a>
            </div>
          </Card>
        </div>
        
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">© {new Date().getFullYear()} Muscat Bay Management | Version 1.5.0</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
