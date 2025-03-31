
import React, { useState } from 'react';
import { Building2, Activity, Layers, Filter, Search, ChevronsUpDown, 
  Users, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import EnhancedPieChart from '@/components/ui/enhanced-pie-chart';

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

const assetConditionData = [
  { name: 'Excellent', value: 45, color: '#10b981' },
  { name: 'Good', value: 30, color: '#3b82f6' },
  { name: 'Fair', value: 15, color: '#f59e0b' },
  { name: 'Poor', value: 8, color: '#f97316' },
  { name: 'Critical', value: 2, color: '#ef4444' }
];

const Dashboard = () => {
  const [selectedZone, setSelectedZone] = useState(null);
  const [isZoneModalOpen, setIsZoneModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
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
            <Input 
              type="search" 
              className="w-full py-2 pl-10 pr-4 text-sm"
              placeholder="Search properties, owners, assets..." 
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon">
              <Filter size={20} />
            </Button>
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center font-medium">MB</div>
          </div>
        </div>
      </header>
      
      {/* Main Content Area */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-20 md:w-64 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <nav className="space-y-1 mt-6">
            <Button 
              onClick={() => setActiveTab('overview')}
              variant={activeTab === 'overview' ? 'secondary' : 'ghost'}
              className={`flex items-center w-full justify-start ${activeTab === 'overview' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Activity size={20} className="mr-3" />
              <span className="hidden md:inline">Overview</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('properties')}
              variant={activeTab === 'properties' ? 'secondary' : 'ghost'}
              className={`flex items-center w-full justify-start ${activeTab === 'properties' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Building2 size={20} className="mr-3" />
              <span className="hidden md:inline">Properties</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('assets')}
              variant={activeTab === 'assets' ? 'secondary' : 'ghost'}
              className={`flex items-center w-full justify-start ${activeTab === 'assets' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Layers size={20} className="mr-3" />
              <span className="hidden md:inline">Assets</span>
            </Button>
            
            <Button 
              onClick={() => setActiveTab('owners')}
              variant={activeTab === 'owners' ? 'secondary' : 'ghost'}
              className={`flex items-center w-full justify-start ${activeTab === 'owners' 
                ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-100' 
                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}
            >
              <Users size={20} className="mr-3" />
              <span className="hidden md:inline">Owners</span>
            </Button>
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
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-gray-500 text-sm font-medium">Total Reserve Funds</h3>
                        <p className="text-2xl font-bold mt-1">OMR {reserveMetrics.totalReserveFunds.toLocaleString()}</p>
                        <div className="flex items-center mt-2 text-sm">
                          <span className="text-green-500 font-medium">+{reserveMetrics.fundingRatio}%</span>
                          <span className="text-gray-500 ml-1">funded ratio</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-gray-500 text-sm font-medium">Annual Contribution</h3>
                        <p className="text-2xl font-bold mt-1">OMR {reserveMetrics.totalAnnualContribution.toLocaleString()}</p>
                        <div className="flex items-center mt-2 text-sm">
                          <span className="text-gray-500">Last updated {reserveMetrics.lastUpdated}</span>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-gray-500 text-sm font-medium">Next Major Expenditure</h3>
                        <p className="text-2xl font-bold mt-1">OMR {reserveMetrics.nextMajorExpenditure.amount.toLocaleString()}</p>
                        <div className="flex items-center mt-2 text-sm">
                          <span className="text-gray-500">Projected for {reserveMetrics.nextMajorExpenditure.year}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* Zones overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Reserve Fund by Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {zones.map(zone => (
                          <Button 
                            key={zone.id}
                            variant="outline"
                            onClick={() => {
                              setSelectedZone(zone);
                              setIsZoneModalOpen(true);
                            }}
                            className="w-full flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors h-auto"
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
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Recent Activity */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
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
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'properties' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Properties</h1>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle>Property List</CardTitle>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Filter size={18} />
                        </Button>
                        <Button variant="secondary">
                          Add Property
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
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
                                <Button variant="link">View</Button>
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
                                <Button variant="link">View</Button>
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
                                <Button variant="link">View</Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'assets' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Assets</h1>
                  <Card>
                    <CardHeader>
                      <CardTitle>Asset Lifecycle Management</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h3 className="text-lg font-medium mb-4">Asset Condition Overview</h3>
                          <div className="h-[300px]">
                            <EnhancedPieChart 
                              data={assetConditionData}
                              innerRadius={60}
                              outerRadius={100}
                              valueFormatter={(value) => `${value}%`}
                            />
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium mb-4">Critical Assets</h3>
                          <div className="space-y-3">
                            <div className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">HVAC Chiller Unit #3</h4>
                                  <p className="text-sm text-gray-500">Zone 5 - Main Building</p>
                                </div>
                                <Badge variant="destructive">Critical</Badge>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm">Replacement Cost: <span className="font-medium">OMR 78,500</span></p>
                                <p className="text-sm">Expected Failure: <span className="font-medium">Within 3 months</span></p>
                              </div>
                            </div>
                            <div className="p-4 border rounded-lg">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-medium">Swimming Pool Filtration System</h4>
                                  <p className="text-sm text-gray-500">Zone 3 - Recreation Area</p>
                                </div>
                                <Badge variant="destructive">Critical</Badge>
                              </div>
                              <div className="mt-2">
                                <p className="text-sm">Replacement Cost: <span className="font-medium">OMR 42,300</span></p>
                                <p className="text-sm">Expected Failure: <span className="font-medium">Within 6 months</span></p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <Separator />
                      
                      <div>
                        <h3 className="text-lg font-medium mb-4">Upcoming Maintenance</h3>
                        <div className="space-y-3">
                          <div className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">Quarterly HVAC Maintenance</h4>
                                <p className="text-sm text-gray-500">All Zones</p>
                              </div>
                              <Badge variant="outline">Scheduled</Badge>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm">Due Date: <span className="font-medium">April 15, 2025</span></p>
                              <p className="text-sm">Estimated Cost: <span className="font-medium">OMR 12,500</span></p>
                            </div>
                          </div>
                          <div className="p-4 border rounded-lg">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium">Fire Safety System Inspection</h4>
                                <p className="text-sm text-gray-500">Zones 3, 5, 8</p>
                              </div>
                              <Badge variant="outline">Scheduled</Badge>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm">Due Date: <span className="font-medium">April 22, 2025</span></p>
                              <p className="text-sm">Estimated Cost: <span className="font-medium">OMR 8,300</span></p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {activeTab === 'owners' && (
                <div>
                  <h1 className="text-2xl font-bold mb-6">Property Owners</h1>
                  <Card>
                    <CardHeader>
                      <CardTitle>Owner Directory</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700 dark:text-gray-300">The Property Owners view will be displayed here.</p>
                    </CardContent>
                  </Card>
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
              <Button variant="ghost" size="icon" onClick={() => setIsZoneModalOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
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
              <Button variant="outline" onClick={() => setIsZoneModalOpen(false)}>
                Close
              </Button>
              <Button>
                View Detailed Report
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
