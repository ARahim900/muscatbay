
import React, { useState, useEffect } from 'react';
import { Building2, Activity, Layers, Filter, Search, ChevronsUpDown, Users, Calculator } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

// Mock data
const zones = [
  { id: 'Z3', name: 'Zone 3 (Al Zaha)', rate: 0.03, color: '#3498db', unitCount: 64, totalBua: 15810.78 },
  { id: 'Z5', name: 'Zone 5 (Al Nameer)', rate: 0.10, color: '#2ecc71', unitCount: 33, totalBua: 171426.04 },
  { id: 'Z8', name: 'Zone 8 (Al Wajd)', rate: 0.03, color: '#9b59b6', unitCount: 22, totalBua: 211230.98 },
  { id: 'SA', name: 'Staff Accommodation', rate: 0.36, color: '#e74c3c', unitCount: 8, totalBua: 144904 },
  { id: 'MC', name: 'Master Community', rate: 0.16, color: '#f39c12', unitCount: 127, totalBua: 1037282 },
];

const reserveMetrics = {
  totalReserveFunds: 2368500,
  totalAnnualContribution: 246638,
  lastUpdated: '2025-03-15',
  fundStatus: 'Healthy',
  fundingRatio: 94.7,
  nextMajorExpenditure: {
    amount: 1253391,
    year: 2032,
    description: 'Major renovations in Zone 5'
  }
};

const AssetLifecycle = () => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="sticky top-0 z-30 w-full px-4 py-3 bg-white shadow-sm dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500 text-white flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <h1 className="text-xl font-bold">OmniProp</h1>
          </div>
          
          <div className="relative w-96">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            </div>
            <input 
              type="search" 
              className="w-full py-2 pl-10 pr-4 text-sm border rounded-lg bg-gray-50 border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white" 
              placeholder="Search properties, owners, assets..." 
            />
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-500 rounded-lg hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-700">
              <Filter size={20} />
            </button>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">MB</div>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-20 md:w-64 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <nav className="space-y-1 mt-6">
            <button 
              onClick={() => setActiveTab('overview')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'overview' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Activity size={20} className="mr-3" />
              <span className="hidden md:inline">Overview</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('properties')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'properties' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Building2 size={20} className="mr-3" />
              <span className="hidden md:inline">Properties</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('assets')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'assets' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Layers size={20} className="mr-3" />
              <span className="hidden md:inline">Assets</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('owners')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'owners' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Users size={20} className="mr-3" />
              <span className="hidden md:inline">Owners</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('calculator')}
              className={`flex items-center w-full p-3 rounded-lg ${activeTab === 'calculator' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Calculator size={20} className="mr-3" />
              <span className="hidden md:inline">Calculator</span>
            </button>
          </nav>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <h1 className="text-2xl font-bold">Dashboard Overview</h1>
                  
                  {/* High-level metrics */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-gray-500 text-sm font-medium">Total Reserve Funds</h3>
                      <p className="text-2xl font-bold mt-1">OMR {reserveMetrics.totalReserveFunds.toLocaleString()}</p>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-green-500 font-medium">+{reserveMetrics.fundingRatio}%</span>
                        <span className="text-gray-500 ml-1">funded ratio</span>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-gray-500 text-sm font-medium">Annual Contribution</h3>
                      <p className="text-2xl font-bold mt-1">OMR {reserveMetrics.totalAnnualContribution.toLocaleString()}</p>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-gray-500">Last updated {reserveMetrics.lastUpdated}</span>
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                      <h3 className="text-gray-500 text-sm font-medium">Next Major Expenditure</h3>
                      <p className="text-2xl font-bold mt-1">OMR {reserveMetrics.nextMajorExpenditure.amount.toLocaleString()}</p>
                      <div className="flex items-center mt-2 text-sm">
                        <span className="text-gray-500">Projected for {reserveMetrics.nextMajorExpenditure.year}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Zones overview */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium">Reserve Fund by Zone</h2>
                    </div>
                    <div className="p-6">
                      <div className="space-y-4">
                        {zones.map(zone => (
                          <button 
                            key={zone.id}
                            onClick={() => {
                              setSelectedZone(zone);
                              setIsZoneModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          >
                            <div className="flex items-center">
                              <div className="w-10 h-10 rounded-md" style={{ backgroundColor: zone.color }}></div>
                              <div className="ml-4 text-left">
                                <h3 className="font-medium">{zone.name}</h3>
                                <p className="text-sm text-gray-500">{zone.unitCount} units • {zone.totalBua.toLocaleString()} sq.ft</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-bold">OMR {zone.rate} / sq.ft</p>
                              <p className="text-sm text-gray-500">Annual rate</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Recent Activity */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium">Recent Activity</h2>
                    </div>
                    <div className="p-6">
                      <ul className="space-y-4">
                        <li className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                            <Activity size={20} />
                          </div>
                          <div>
                            <p className="font-medium">Annual reserve fund report generated</p>
                            <p className="text-sm text-gray-500">March 15, 2025 • 10:23 AM</p>
                          </div>
                        </li>
                        <li className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                            <Building2 size={20} />
                          </div>
                          <div>
                            <p className="font-medium">New property added to Zone 5</p>
                            <p className="text-sm text-gray-500">March 12, 2025 • 2:45 PM</p>
                          </div>
                        </li>
                        <li className="flex items-center gap-4">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center">
                            <Layers size={20} />
                          </div>
                          <div>
                            <p className="font-medium">Asset maintenance scheduled - HVAC Systems</p>
                            <p className="text-sm text-gray-500">March 10, 2025 • 9:15 AM</p>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'properties' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Properties</h1>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium">Property List</h2>
                      <div className="flex items-center gap-2">
                        <button className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
                          <Filter size={18} />
                        </button>
                        <button className="px-3 py-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/30">
                          Add Property
                        </button>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unit No</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">BUA (sq.ft)</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reserve Rate</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Contribution</th>
                              <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Z3-061(1A)</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">Zone 3 (Al Zaha)</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">2 Bedroom Apartment</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">115.47</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">Ahmed Al Balushi</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">0.03</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">OMR 346.41</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">View</button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Z5-008</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">Zone 5 (Al Nameer)</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">4 Bedroom Villa</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">497.62</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">Mohammed Al Harthi</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">0.10</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">OMR 4,976.20</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">View</button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">Z8-007</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">Zone 8 (Al Wajd)</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">5 Bedroom Villa</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">750.35</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">Sara Johnson</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">0.03</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">OMR 2,251.05</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">View</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'assets' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Assets</h1>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium">Asset Lifecycle Management</h2>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-700 dark:text-gray-300">The Asset Lifecycle Management view will be displayed here.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'owners' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Property Owners</h1>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium">Owner Directory</h2>
                    </div>
                    <div className="p-6">
                      <p className="text-gray-700 dark:text-gray-300">The Property Owners view will be displayed here.</p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'calculator' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Reserve Fund Calculator</h1>
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                      <h2 className="text-lg font-medium">Calculate Reserve Fund Contributions</h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Property Details</h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Zone</label>
                              <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="">Select Zone</option>
                                {zones.map(zone => (
                                  <option key={zone.id} value={zone.id}>{zone.name}</option>
                                ))}
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Property Type</label>
                              <select className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                <option value="">Select Property Type</option>
                                <option value="apartment">Apartment</option>
                                <option value="villa">Villa</option>
                              </select>
                            </div>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Built-Up Area (sq.ft)</label>
                              <input type="number" className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white" placeholder="Enter BUA" />
                            </div>
                            
                            <div className="flex items-center">
                              <input id="has-lift" type="checkbox" className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600" />
                              <label htmlFor="has-lift" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Has Lift Access</label>
                            </div>
                            
                            <button className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md">Calculate</button>
                          </div>
                        </div>
                        
                        <div>
                          <h3 className="text-lg font-medium mb-4">Calculation Results</h3>
                          <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg">
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Base Rate</p>
                                <p className="text-lg font-medium">OMR 0.00 / sq.ft</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Operating Share</p>
                                <p className="text-lg font-medium">OMR 0.00</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Lift Maintenance Share</p>
                                <p className="text-lg font-medium">OMR 0.00</p>
                              </div>
                              
                              <div>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Reserve Fund Contribution</p>
                                <p className="text-lg font-medium">OMR 0.00</p>
                              </div>
                              
                              <div className="pt-4 border-t border-gray-200 dark:border-gray-600">
                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Annual Charge</p>
                                <p className="text-xl font-bold">OMR 0.00</p>
                              </div>
                              
                              <div className="grid grid-cols-2 gap-4 pt-4">
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Quarterly</p>
                                  <p className="text-lg font-medium">OMR 0.00</p>
                                </div>
                                
                                <div>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">Monthly</p>
                                  <p className="text-lg font-medium">OMR 0.00</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      {/* Zone detail modal */}
      {isZoneModalOpen && selectedZone && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="relative w-full max-w-4xl bg-white dark:bg-gray-800 rounded-lg shadow-lg">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-medium flex items-center">
                <div className="w-6 h-6 rounded-md mr-2" style={{ backgroundColor: selectedZone.color }}></div>
                {selectedZone.name}
              </h2>
              <button onClick={() => setIsZoneModalOpen(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Reserve Fund Rate</p>
                  <p className="text-xl font-bold">OMR {selectedZone.rate} / sq.ft</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Units</p>
                  <p className="text-xl font-bold">{selectedZone.unitCount}</p>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Built-Up Area</p>
                  <p className="text-xl font-bold">{selectedZone.totalBua.toLocaleString()} sq.ft</p>
                </div>
              </div>
              
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg mb-6">
                <h3 className="text-lg font-medium mb-4">20-Year Reserve Fund Projection</h3>
                <div className="h-64 bg-white dark:bg-gray-800 rounded-lg p-4">
                  <p className="text-center text-gray-500 dark:text-gray-400">Chart will be displayed here</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Upcoming Major Expenses</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Roof Maintenance</p>
                        <p className="text-sm text-gray-500">2026</p>
                      </div>
                      <p className="font-medium">OMR 45,000</p>
                    </div>
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium">HVAC System Replacement</p>
                        <p className="text-sm text-gray-500">2030</p>
                      </div>
                      <p className="font-medium">OMR 125,000</p>
                    </div>
                    <div className="flex justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="font-medium">Exterior Painting</p>
                        <p className="text-sm text-gray-500">2029</p>
                      </div>
                      <p className="font-medium">OMR 85,000</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Assets by Condition</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '45%' }}></div>
                      </div>
                      <span className="ml-2 text-sm">Excellent (45%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-blue-500 h-2.5 rounded-full" style={{ width: '30%' }}></div>
                      </div>
                      <span className="ml-2 text-sm">Good (30%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: '15%' }}></div>
                      </div>
                      <span className="ml-2 text-sm">Fair (15%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: '8%' }}></div>
                      </div>
                      <span className="ml-2 text-sm">Poor (8%)</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                        <div className="bg-red-500 h-2.5 rounded-full" style={{ width: '2%' }}></div>
                      </div>
                      <span className="ml-2 text-sm">Critical (2%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-between">
              <button onClick={() => setIsZoneModalOpen(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Close
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                View Detailed Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetLifecycle;
