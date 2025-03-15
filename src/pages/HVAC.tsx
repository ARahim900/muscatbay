import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AirVent, Filter, Download, Building, AlertTriangle, CheckCircle, DollarSign } from 'lucide-react';
import Papa from 'papaparse';
import _ from 'lodash';
import Layout from '@/components/layout/Layout';

const HVACDashboard = () => {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedPPM, setSelectedPPM] = useState('All');
  const [selectedBuilding, setSelectedBuilding] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  // Sample quotation data from the PDF summary
  const quotationData = [
    { building: "B1", quoteRef: "GEOU20255089", value: 1367 },
    { building: "B2", quoteRef: "GEOU20255090", value: 1424 },
    { building: "B3", quoteRef: "GEOU20255093", value: 185 },
    { building: "B4", quoteRef: "GEOU20255094", value: 274 },
    { building: "B5", quoteRef: "GEOU20255098", value: 4456 },
    { building: "B6", quoteRef: "GEOU20255095", value: 526 },
    { building: "B7", quoteRef: "GEOU20255096", value: 1023 },
    { building: "B8", quoteRef: "GEOU20255097", value: 1558 },
    { building: "CIF", quoteRef: "GEOU20255091", value: 179 },
    { building: "FM", quoteRef: "GEOU20255092", value: 869 },
    { building: "COMMON BUILDINGS", quoteRef: "GEOU20256000", value: 1040 }
  ];

  // Sample maintenance items data
  const maintenanceItems = [
    { building: "B1", equipment: "Chiller #1", quoteRef: "GEOU20255089", part: "SUPPLY AND INSTALL PLUG SENSORS 025-29150-002", price: 50, status: "Delivered", ppm: "PPM1" },
    { building: "B1", equipment: "Chiller #1", quoteRef: "GEOU20255089", part: "SUPPLY AND INSTALL CONTROL TRANSFORMER 025-27911-000", price: 85, status: "Scheduled", ppm: "PPM2" },
    { building: "B2", equipment: "Pressurization Unit #3", quoteRef: "GEOU20255090", part: "SUPPLY AND INSTALL HIGH PRESSURE CUT OUT", price: 25, status: "Pending", ppm: "PPM3" },
    { building: "B3", equipment: "Chiller #2", quoteRef: "GEOU20255093", part: "SUPPLY AND INSTALL ON/OFF SWITCH", price: 34, status: "Delivered", ppm: "PPM1" },
    { building: "B4", equipment: "Pressurization Unit #4", quoteRef: "GEOU20255094", part: "PUMP NEEDS PAINT", price: 20, status: "Completed", ppm: "PPM2" },
    { building: "B5", equipment: "Chiller #1", quoteRef: "GEOU20255098", part: "SUPPLY AND INSTALL YORK HEAT EXCHANGER 026-46713-146", price: 2350, status: "Pending", ppm: "PPM3" },
    { building: "B6", equipment: "Chiller #1", quoteRef: "GEOU20255095", part: "CONDENSER FAN MOTOR BEARINGS REP (6206/6203)", price: 130, status: "Scheduled", ppm: "PPM2" },
    { building: "B7", equipment: "Pressurization Unit #6", quoteRef: "GEOU20255096", part: "SUPPLY AND INSTALL START CONTROL HAND SIT", price: 43, status: "Pending", ppm: "PPM1" },
    { building: "B8", equipment: "Pressurization Unit #7", quoteRef: "GEOU20255097", part: "SUPPLY AND INSTALL SWITCH PRESSURE CUT OUT", price: 25, status: "Delivered", ppm: "PPM3" },
    { building: "FM", equipment: "Chiller #1", quoteRef: "GEOU20255092", part: "PUMP # 1 NEED OVERHAULING", price: 125, status: "Scheduled", ppm: "PPM3" },
    { building: "CIF", equipment: "Chiller #1", quoteRef: "GEOU20255091", part: "SUPPLY AND INSTALL EDUCATOR SENSOR 025-47673-000", price: 34, status: "Completed", ppm: "PPM2" },
    { building: "COMMON", equipment: "Multiple Chillers", quoteRef: "GEOU20256000", part: "SUPPLY AND INSTALL CHILLER BUTTERFLY VALVE", price: 990, status: "Pending", ppm: "PPM1" }
  ];

  // Equipment types data
  const equipmentTypes = [
    { type: 'Chillers', parts: ['Plug Sensors', 'Plug Transducer', 'Water Sensor', 'Control Transformer', 'Fuse', 'Solenoid Valve', 'Heat Exchanger', 'Cooler Insulation', 'Refrigerant'] },
    { type: 'Pressurization Units', parts: ['High Pressure Cut Out', 'Switch Pressure', 'Valve', 'Start Control', 'Bearings'] },
    { type: 'Pumps', parts: ['Pump Overhauling', 'Bearings', 'Paint'] },
    { type: 'General Items', parts: ['Butterfly Valve', 'Filter', 'Nitrogen', 'Oil', 'Consumables'] }
  ];

  // Equipment type costs
  const equipmentTypeCosts = [
    { name: 'Chillers', value: 9000 },
    { name: 'Pressurization Units', value: 1500 },
    { name: 'Pumps', value: 750 },
    { name: 'General Items', value: 1650 }
  ];

  useEffect(() => {
    // Simulate loading data
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  // Get unique buildings
  const buildings = ['All', ..._.uniq(quotationData.map(item => item.building))];

  // Filter quotation data by building
  const filteredQuotations = quotationData.filter(item => 
    selectedBuilding === 'All' || item.building === selectedBuilding
  );

  // Filter maintenance items by building and PPM
  const filteredItems = maintenanceItems.filter(item => 
    (selectedBuilding === 'All' || item.building === selectedBuilding) &&
    (selectedPPM === 'All' || item.ppm === selectedPPM)
  );

  // Calculate totals
  const totalEquipment = _.uniqBy(maintenanceItems, item => `${item.building}-${item.equipment}`).length;
  const totalCost = _.sumBy(quotationData, 'value');
  const filteredTotalCost = _.sumBy(filteredQuotations, 'value');
  const pendingItems = maintenanceItems.filter(item => item.status === "Pending").length;
  const completedItems = maintenanceItems.filter(item => item.status === "Completed").length;

  // Building costs for charts
  const buildingCosts = filteredQuotations.map(item => ({
    name: item.building,
    cost: item.value,
    quoteRef: item.quoteRef
  }));

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  // Monthly cost trend data
  const monthlyTrendData = [
    { month: 'Jan', cost: 1800 },
    { month: 'Feb', cost: 1200 },
    { month: 'Mar', cost: 3500 },
    { month: 'Apr', cost: 2800 },
    { month: 'May', cost: 1900 },
    { month: 'Jun', cost: 2900 },
    { month: 'Jul', cost: 3100 },
    { month: 'Aug', cost: 2400 },
    { month: 'Sep', cost: 1700 },
    { month: 'Oct', cost: 2100 },
    { month: 'Nov', cost: 900 },
    { month: 'Dec', cost: 1100 }
  ];

  // Equipment maintenance frequency data
  const maintenanceFrequencyData = [
    { name: "Chillers", repairs: 37 },
    { name: "Pressurization Units", repairs: 14 },
    { name: "Pumps", repairs: 5 },
    { name: "Electrical Components", repairs: 9 },
    { name: "Sensors", repairs: 18 },
    { name: "Valves", repairs: 11 }
  ];

  // Skeleton loader
  const CardSkeleton = () => (
    <div className="bg-gray-100 animate-pulse rounded-lg p-6 h-36"></div>
  );

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen p-4 md:p-6">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <div className="bg-blue-100 p-3 rounded-full mr-4">
              <AirVent size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">HVAC Asset Management</h1>
              <p className="text-gray-500">Maintenance and repair tracking</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex items-center bg-white border rounded-md p-2 shadow-sm">
              <Filter size={16} className="text-gray-400 mr-2" />
              <select 
                className="text-sm border-none focus:ring-0"
                value={selectedPPM}
                onChange={(e) => setSelectedPPM(e.target.value)}
              >
                <option value="All">All PPMs</option>
                <option value="PPM1">PPM1 (Q1)</option>
                <option value="PPM2">PPM2 (Q2)</option>
                <option value="PPM3">PPM3 (Q3)</option>
                <option value="PPM4">PPM4 (Q4)</option>
              </select>
            </div>
            
            <button className="flex items-center bg-white border rounded-md p-2 shadow-sm">
              <Download size={16} className="text-gray-400 mr-2" />
              <span className="text-sm">Export</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-6 overflow-hidden">
          <div className="border-b">
            <div className="flex overflow-x-auto">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Overview
              </button>
              <button 
                onClick={() => setActiveTab('analysis')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'analysis' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Analysis
              </button>
              <button 
                onClick={() => setActiveTab('types')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'types' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Equipment Types
              </button>
              <button 
                onClick={() => setActiveTab('maintenance')}
                className={`px-6 py-3 text-sm font-medium whitespace-nowrap ${activeTab === 'maintenance' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Maintenance
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="text-sm text-gray-500">
              Showing: <span className="font-medium text-gray-700">{selectedBuilding === 'All' ? 'All Buildings' : selectedBuilding}</span>
              {selectedPPM !== 'All' && `, ${selectedPPM}`}
            </div>
          </div>
        </div>

        {/* Key Metrics Cards - Only on Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isLoading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden border-l-4 border-blue-500">
                  <div className="text-sm text-gray-500 mb-1">Total Equipment</div>
                  <div className="text-3xl font-bold mb-1">{totalEquipment}</div>
                  <div className="text-sm text-gray-500">Across all buildings</div>
                  <div className="absolute right-4 top-6 text-blue-100">
                    <Building size={48} />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden border-l-4 border-green-500">
                  <div className="text-sm text-gray-500 mb-1">Total Cost</div>
                  <div className="text-3xl font-bold mb-1">{totalCost.toLocaleString()} OMR</div>
                  <div className="text-sm text-gray-500">Maintenance & repairs</div>
                  <div className="absolute right-4 top-6 text-green-100">
                    <DollarSign size={48} />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden border-l-4 border-yellow-500">
                  <div className="text-sm text-gray-500 mb-1">Pending Items</div>
                  <div className="text-3xl font-bold mb-1">{pendingItems}</div>
                  <div className="text-sm text-gray-500">Awaiting parts or installation</div>
                  <div className="absolute right-4 top-6 text-yellow-100">
                    <AlertTriangle size={48} />
                  </div>
                </div>
                
                <div className="bg-white rounded-lg shadow p-6 relative overflow-hidden border-l-4 border-purple-500">
                  <div className="text-sm text-gray-500 mb-1">Completed Items</div>
                  <div className="text-3xl font-bold mb-1">{completedItems}</div>
                  <div className="text-sm text-gray-500">Successfully resolved</div>
                  <div className="absolute right-4 top-6 text-purple-100">
                    <CheckCircle size={48} />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Building Filter - Always Visible */}
        <div className="mb-8">
          <div className="text-sm text-gray-500 mb-2">Filter by Building</div>
          <div className="flex flex-wrap gap-2">
            {buildings.map(building => (
              <button
                key={building}
                onClick={() => setSelectedBuilding(building)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  selectedBuilding === building 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center">
                  <span className={`w-2 h-2 rounded-full mr-2 ${building === 'All' ? 'bg-gray-400' : 'bg-blue-500'}`}></span>
                  {building}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area - Changes based on active tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Building Cost Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Cost by Building</h2>
              {isLoading ? (
                <div className="animate-pulse bg-gray-100 h-64 rounded"></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={buildingCosts}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, 'Cost']} />
                    <Legend />
                    <Bar dataKey="cost" name="Cost (OMR)" fill="#0088FE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Equipment Type Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Cost by Equipment Type</h2>
              {isLoading ? (
                <div className="animate-pulse bg-gray-100 h-64 rounded"></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={equipmentTypeCosts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {equipmentTypeCosts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'analysis' && (
          <div className="grid grid-cols-1 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Cost Analysis by Quotation</h2>
              {isLoading ? (
                <div className="animate-pulse bg-gray-100 h-64 rounded"></div>
              ) : (
                <div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
                          <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote Reference</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Value (OMR)</th>
                          <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% of Total</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {buildingCosts.map((item, index) => (
                          <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-500">{item.quoteRef}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{item.cost.toLocaleString()} OMR</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">
                              {((item.cost / filteredTotalCost) * 100).toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-blue-50">
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">SUBTOTAL</td>
                          <td className="px-4 py-3 text-sm text-gray-500"></td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{filteredTotalCost.toLocaleString()} OMR</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">100%</td>
                        </tr>
                        <tr className="bg-green-50">
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">SPECIAL DISCOUNT</td>
                          <td className="px-4 py-3 text-sm text-gray-500"></td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{selectedBuilding === 'All' ? '500' : '0'} OMR</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right"></td>
                        </tr>
                        <tr className="bg-blue-50">
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">SUB TOTAL</td>
                          <td className="px-4 py-3 text-sm text-gray-500"></td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{(filteredTotalCost - (selectedBuilding === 'All' ? 500 : 0)).toLocaleString()} OMR</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right"></td>
                        </tr>
                        <tr className="bg-yellow-50">
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">VAT 5%</td>
                          <td className="px-4 py-3 text-sm text-gray-500"></td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{Math.round((filteredTotalCost - (selectedBuilding === 'All' ? 500 : 0)) * 0.05).toLocaleString()} OMR</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right"></td>
                        </tr>
                        <tr className="bg-blue-100">
                          <td className="px-4 py-3 text-sm font-bold text-gray-900">TOTAL</td>
                          <td className="px-4 py-3 text-sm text-gray-500"></td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">{Math.round((filteredTotalCost - (selectedBuilding === 'All' ? 500 : 0)) * 1.05).toLocaleString()} OMR</td>
                          <td className="px-4 py-3 text-sm text-gray-900 text-right"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Monthly Cost Trend</h2>
              {isLoading ? (
                <div className="animate-pulse bg-gray-100 h-64 rounded"></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value.toLocaleString()} OMR`, 'Cost']} />
                    <Legend />
                    <Line type="monotone" dataKey="cost" name="Monthly Cost (OMR)" stroke="#0088FE" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'types' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Equipment Type Chart */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Cost Distribution by Equipment Type</h2>
              {isLoading ? (
                <div className="animate-pulse bg-gray-100 h-64 rounded"></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={equipmentTypeCosts}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="name"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {equipmentTypeCosts.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value.toLocaleString()} OMR`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            
            {/* Parts by Equipment Type */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-medium mb-4">Common Parts by Equipment Type</h2>
              {isLoading ? (
                <div className="animate-pulse bg-gray-100 h-64 rounded"></div>
              ) : (
                <div className="space-y-6">
                  {equipmentTypes.map((equipment, index) => (
                    <div key={index}>
                      <h3 className="font-medium text-gray-800 mb-2">{equipment.type}</h3>
                      <div className="flex flex-wrap gap-2">
                        {equipment.parts.map((part, partIndex) => (
                          <span 
                            key={partIndex}
                            className={`px-3 py-1 rounded-full text-xs font-medium 
                              ${index === 0 ? 'bg-blue-100 text-blue-800' : 
                                index === 1 ? 'bg-green-100 text-green-800' :
                                index === 2 ? 'bg-purple-100 text-purple-800' : 
                                'bg-orange-100 text-orange-800'}`}
                          >
                            {part}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Equipment Maintenance Frequency */}
            <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
              <h2 className="text-lg font-medium mb-4">Equipment Maintenance Frequency</h2>
              {isLoading ? (
                <div className="animate-pulse bg-gray-100 h-64 rounded"></div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    layout="vertical" 
                    data={maintenanceFrequencyData}
                    margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={150} />
                    <Tooltip formatter={(value) => [`${value} repairs`, 'Frequency']} />
                    <Legend />
                    <Bar dataKey="repairs" name="Number of Repairs" fill="#8884d8" barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        )}

        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-6 border-b">
              <h2 className="text-lg font-medium">Maintenance Items</h2>
              <p className="text-sm text-gray-500">Showing all maintenance and repair items from quotations</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Building</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Equipment</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quote Ref</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part/Service</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price (OMR)</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <>
                      <tr><td colSpan="6" className="px-4 py-3"><div className="animate-pulse bg-gray-100 h-8 rounded"></div></td></tr>
                      <tr><td colSpan="6" className="px-4 py-3"><div className="animate-pulse bg-gray-100 h-8 rounded"></div></td></tr>
                      <tr><td colSpan="6" className="px-4 py-3"><div className="animate-pulse bg-gray-100 h-8 rounded"></div></td></tr>
                    </>
                  ) : (
                    filteredItems.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.building}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{item.equipment}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 font-medium">{item.quoteRef}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{item.part}</td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right font-medium">{item.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span 
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              item.status === 'Completed' 
                                ? 'bg-green-100 text-green-800' 
                                : item.status === 'Pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : item.status === 'Scheduled'
                                    ? 'bg-orange-100 text-orange-800'
                                    : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-700">
                  Showing maintenance items from <span className="font-medium">{selectedPPM === 'All' ? 'All PPMs' : selectedPPM}</span>
                </div>
                <div className="flex gap-2">
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Previous
                  </button>
                  <button className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default HVACDashboard;
