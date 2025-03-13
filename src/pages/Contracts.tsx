import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Calendar, Search, Filter, ArrowUpDown, FileText, Activity, Clock, DollarSign } from 'lucide-react';
import Layout from '@/components/layout/Layout';
const ContractDashboard = () => {
  // State for contract data
  const [contracts, setContracts] = useState<any[]>([]);
  const [filteredContracts, setFilteredContracts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [sortBy, setSortBy] = useState('End Date');
  const [sortOrder, setSortOrder] = useState('Ascending');

  // Load contract data
  useEffect(() => {
    const loadData = () => {
      // Using the provided contract data directly
      const data = [{
        contractor: "KONE Assarain LLC",
        service: "Lift Maintenance Services",
        status: "Active",
        type: "Contract",
        startDate: "1/1/2025",
        endDate: "12/31/2025",
        monthlyValue: 525,
        yearlyValue: 11550,
        note: "",
        valueType: "OMR (Excl VAT)"
      }, {
        contractor: "Oman Water Treatment Company (OWATCO)",
        service: "Comprehensive STP Operation and Maintenance",
        status: "Active",
        type: "Contract",
        startDate: "1/26/2024",
        endDate: "1/25/2029",
        monthlyValue: 3103.8,
        yearlyValue: 37245.4,
        note: "New contract due to early termination of previous Contract with Celar Company",
        valueType: "OMR (Inc VAT)"
      }, {
        contractor: "Kalhat",
        service: "Facility Management (FM)",
        status: "Active",
        type: "Contract",
        startDate: "5/7/2024",
        endDate: "5/6/2030",
        monthlyValue: 32200.8,
        yearlyValue: 386409.718,
        note: "New contract overlapping with COMO",
        valueType: "OMR (Inc VAT)"
      }, {
        contractor: "Future Cities S.A.O.C (Tadoom)",
        service: "SUPPLY AND INSTALLATION OF SMART WATER METERS, BILLING FOR WATER CONSUMPTION",
        status: "Active",
        type: "Contract",
        startDate: "9/24/2024",
        endDate: "9/23/2032",
        monthlyValue: 2.7,
        yearlyValue: 184.3,
        note: "New contract replacing OIFC",
        valueType: "Per Meter Collection"
      }, {
        contractor: "Muna Noor International LLC",
        service: "Pest Control Services",
        status: "Active",
        type: "Contract",
        startDate: "7/1/2024",
        endDate: "6/30/2026",
        monthlyValue: 1400,
        yearlyValue: 16000,
        note: "",
        valueType: "OMR (Inc VAT)"
      }, {
        contractor: "Celar Water",
        service: "Comprehensive STP Operation and Maintenance",
        status: "Expired",
        type: "Contract",
        startDate: "1/16/2021",
        endDate: "1/15/2025",
        monthlyValue: 4439,
        yearlyValue: 53268,
        note: "Transitioned to OWATCO before contract end",
        valueType: "OMR"
      }, {
        contractor: "Gulf Expert",
        service: "Chillers, BMS & Pressurisation Units",
        status: "Active",
        type: "PO",
        startDate: "6/3/2024",
        endDate: "6/2/2025",
        monthlyValue: 770,
        yearlyValue: 9240,
        note: "",
        valueType: "OMR (Inc VAT)"
      }, {
        contractor: "Advanced Technology and Projects Company",
        service: "BMS Non-Comprehensive Annual Maintenance",
        status: "Expired",
        type: "PO",
        startDate: "3/26/2023",
        endDate: "3/25/2024",
        monthlyValue: 316.67,
        yearlyValue: 3800,
        note: "",
        valueType: "OMR"
      }, {
        contractor: "Al Naba Services LLC",
        service: "Garbage Removal Services",
        status: "Expired",
        type: "Contract",
        startDate: "4/2/2023",
        endDate: "4/1/2024",
        monthlyValue: 32,
        yearlyValue: 384,
        note: "",
        valueType: "OMR"
      }, {
        contractor: "Bahwan Engineering Company LLC",
        service: "Maintenance of Fire Alarm & Fire Fighting Equipment",
        status: "Expired",
        type: "Contract",
        startDate: "9/27/2023",
        endDate: "9/26/2024",
        monthlyValue: 649.67,
        yearlyValue: 7796,
        note: "",
        valueType: "OMR"
      }, {
        contractor: "Oman Pumps Manufacturing Co.",
        service: "Supply, Installation, and Commissioning of Pumps",
        status: "Expired",
        type: "Contract",
        startDate: "2/23/2020",
        endDate: "7/22/2025",
        monthlyValue: 0,
        yearlyValue: 37800,
        note: "Payment on Delivery",
        valueType: "OMR"
      }, {
        contractor: "Rimal Global",
        service: "Provision of Services",
        status: "Expired",
        type: "Contract",
        startDate: "11/22/2021",
        endDate: "11/21/2031",
        monthlyValue: 0,
        yearlyValue: 51633,
        note: "Payment on Delivery",
        valueType: "OMR"
      }, {
        contractor: "COMO",
        service: "Facility Management (FM)",
        status: "Expired",
        type: "Contract",
        startDate: "3/1/2022",
        endDate: "2/28/2025",
        monthlyValue: 44382,
        yearlyValue: 532584,
        note: "Transitioned to Kalhat before contract end",
        valueType: "OMR"
      }, {
        contractor: "Muscat Electronics LLC",
        service: "Daikin AC Chillers (Sale Center) Maintenance Services",
        status: "Expired",
        type: "Contract",
        startDate: "3/26/2023",
        endDate: "4/25/2024",
        monthlyValue: 66.5,
        yearlyValue: 798,
        note: "Nearing expiration, review for renewal needed",
        valueType: "OMR"
      }, {
        contractor: "Uni Gaz",
        service: "Gas Refilling for Flame Operation at Muscat Bay Main Entrance",
        status: "Expired",
        type: "PO",
        startDate: "",
        endDate: "",
        monthlyValue: 0,
        yearlyValue: 0,
        note: "",
        valueType: "OMR"
      }, {
        contractor: "Genetcoo",
        service: "York AC Chillers (Zone 01) Maintenance Services",
        status: "Expired",
        type: "Contract",
        startDate: "",
        endDate: "",
        monthlyValue: 0,
        yearlyValue: 0,
        note: "",
        valueType: "OMR"
      }, {
        contractor: "NMC",
        service: "Lagoon Main Two Drain Pipes Cleaning",
        status: "In Review",
        type: "PO",
        startDate: "",
        endDate: "",
        monthlyValue: 0,
        yearlyValue: 0,
        note: "",
        valueType: "OMR"
      }];
      setContracts(data);
      setFilteredContracts(data);
    };
    loadData();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...contracts];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter(contract => contract.contractor.toLowerCase().includes(searchTerm.toLowerCase()) || contract.service.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(contract => contract.status === statusFilter);
    }

    // Apply type filter
    if (typeFilter !== 'All') {
      filtered = filtered.filter(contract => contract.type === typeFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'End Date') {
        const dateA = new Date(a.endDate || '2000-01-01');
        const dateB = new Date(b.endDate || '2000-01-01');
        return sortOrder === 'Ascending' ? dateA.getTime() - dateB.getTime() : dateB.getTime() - dateA.getTime();
      } else if (sortBy === 'Value') {
        return sortOrder === 'Ascending' ? (a.monthlyValue || 0) - (b.monthlyValue || 0) : (b.monthlyValue || 0) - (a.monthlyValue || 0);
      } else {
        return sortOrder === 'Ascending' ? a.contractor.localeCompare(b.contractor) : b.contractor.localeCompare(a.contractor);
      }
    });
    setFilteredContracts(filtered);
  }, [contracts, searchTerm, statusFilter, typeFilter, sortBy, sortOrder]);

  // Calculate dashboard metrics
  const totalContracts = contracts.length;
  const activeContracts = contracts.filter(c => c.status === 'Active').length;
  const activePercentage = totalContracts > 0 ? Math.round(activeContracts / totalContracts * 100) : 0;
  const expiredContracts = contracts.filter(c => c.status === 'Expired').length;
  const expiredPercentage = totalContracts > 0 ? Math.round(expiredContracts / totalContracts * 100) : 0;
  const inReviewContracts = contracts.filter(c => c.status === 'In Review').length;
  const inReviewPercentage = totalContracts > 0 ? Math.round(inReviewContracts / totalContracts * 100) : 0;

  // Calculate contracts expiring within 3 months
  const today = new Date();
  const threeMonthsLater = new Date(today);
  threeMonthsLater.setMonth(today.getMonth() + 3);
  const expiringContracts = contracts.filter(contract => {
    if (!contract.endDate) return false;
    const endDate = new Date(contract.endDate);
    return endDate > today && endDate <= threeMonthsLater && contract.status === 'Active';
  });

  // Calculate total monthly value of active contracts
  const monthlyValue = contracts.filter(c => c.status === 'Active').reduce((sum, contract) => sum + (contract.monthlyValue || 0), 0);

  // Prepare data for charts
  const statusData = [{
    name: 'Active',
    value: activePercentage,
    color: '#4CAF50'
  }, {
    name: 'In Review',
    value: inReviewPercentage,
    color: '#FFC107'
  }, {
    name: 'Expired',
    value: expiredPercentage,
    color: '#F44336'
  }];

  // Service categories data
  const serviceCategories = [{
    name: 'Maintenance',
    value: 7
  }, {
    name: 'Facility Management',
    value: 2
  }, {
    name: 'Water Services',
    value: 1
  }, {
    name: 'Cleaning Services',
    value: 2
  }, {
    name: 'Building Systems',
    value: 1
  }, {
    name: 'Other Services',
    value: 4
  }];

  // Expiry timeline data
  const months = ['Apr-2025', 'Jun-2025', 'Aug-2025', 'Oct-2025', 'Dec-2025', 'Feb-2026'];
  const expiryData = months.map(month => {
    const count = contracts.filter(contract => {
      if (!contract.endDate) return false;
      const endDate = new Date(contract.endDate);
      const monthYear = `${endDate.toLocaleString('default', {
        month: 'short'
      })}-${endDate.getFullYear()}`;
      return monthYear === month;
    }).length;
    return {
      month,
      count
    };
  });

  // Contracts needing attention
  const contractsNeedingAttention = [...expiringContracts, ...contracts.filter(c => c.status === 'In Review')];
  return <div className="bg-gray-50 min-h-screen p-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div className="flex items-center">
          <div className="p-2 rounded mr-2 bg-[#4e4456]">
            <div className="text-white font-bold text-xl">MB</div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#4e4456]">Muscat Bay Contract Tracker</h1>
            <p className="text-sm text-gray-600">{totalContracts} contracts • Last updated: 13/03/2025</p>
          </div>
        </div>
        <div className="flex space-x-2 w-full md:w-auto">
          <button className="bg-gray-700 text-white px-4 py-2 rounded flex items-center">
            <span className="mr-1">Update</span>
          </button>
          <button className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded flex items-center">
            <span className="mr-1">Export</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-4">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input type="text" placeholder="Search by contractor or service..." className="w-full border border-gray-300 rounded-md pl-10 pr-4 py-2" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select className="w-full border border-gray-300 rounded-md p-2" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="In Review">In Review</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
            <select className="w-full border border-gray-300 rounded-md p-2" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Contract">Contract</option>
              <option value="PO">PO</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select className="w-full border border-gray-300 rounded-md p-2" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="End Date">End Date</option>
              <option value="Value">Value</option>
              <option value="Contractor">Contractor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select className="w-full border border-gray-300 rounded-md p-2" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
              <option value="Ascending">Ascending</option>
              <option value="Descending">Descending</option>
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
          <button className="bg-gray-700 text-white px-4 py-2 rounded mr-2 flex items-center">
            <Filter size={16} className="mr-1" />
            <span>Apply</span>
          </button>
          <button className="border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded" onClick={() => {
          setSearchTerm('');
          setStatusFilter('All');
          setTypeFilter('All');
          setSortBy('End Date');
          setSortOrder('Ascending');
        }}>
            Reset
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Contracts */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-gray-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Total Contracts</p>
              <h2 className="text-3xl font-bold text-gray-800">{totalContracts}</h2>
              <p className="text-xs text-gray-500 mt-1">{totalContracts} contracts tracked</p>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <FileText size={20} className="text-gray-600" />
            </div>
          </div>
        </div>

        {/* Active Contracts */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-teal-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Active Contracts</p>
              <h2 className="text-3xl font-bold text-gray-800">{activeContracts}</h2>
              <p className="text-xs text-gray-500 mt-1">{activePercentage}% of total</p>
            </div>
            <div className="p-2 bg-teal-50 rounded-lg">
              <Activity size={20} className="text-teal-500" />
            </div>
          </div>
        </div>

        {/* Expiring Soon */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-amber-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Expiring Soon</p>
              <h2 className="text-3xl font-bold text-gray-800">{expiringContracts.length}</h2>
              <p className="text-xs text-gray-500 mt-1">within 3 months</p>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg">
              <Clock size={20} className="text-amber-500" />
            </div>
          </div>
        </div>

        {/* Monthly Value */}
        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-600 text-sm font-medium mb-1">Monthly Value (Active)</p>
              <h2 className="text-3xl font-bold text-gray-800">{Math.round(monthlyValue).toLocaleString()}</h2>
              <p className="text-xs text-gray-500 mt-1">OMR</p>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg">
              <DollarSign size={20} className="text-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Contract Status Distribution */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Contract Status Distribution</h3>
          <div className="flex flex-col md:flex-row">
            <div className="w-full md:w-1/2 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({
                  name,
                  value
                }) => `${name}: ${value}%`}>
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={value => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-1/2 flex flex-col justify-center mt-4 md:mt-0">
              {statusData.map((entry, index) => <div key={index} className="flex items-center mb-2">
                  <div className="w-4 h-4 mr-2" style={{
                backgroundColor: entry.color
              }}></div>
                  <div className="text-sm">{entry.name}: {entry.value}%</div>
                </div>)}
            </div>
          </div>
        </div>

        {/* Service Categories */}
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-lg font-medium text-gray-800 mb-4">Service Categories</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={serviceCategories} layout="vertical" margin={{
              top: 20,
              right: 30,
              left: 100,
              bottom: 5
            }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip />
                <Bar dataKey="value" fill="#4299e1" barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Contract Expiry Timeline */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-4">Contract Expiry Timeline</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={expiryData} margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5
          }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Contracts Needing Attention */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">Contracts Needing Attention</h3>
          <a href="#" className="text-sm text-blue-600 hover:text-blue-800">View All</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {contractsNeedingAttention.slice(0, 3).map((contract, index) => <div key={index} className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between mb-2">
                <h4 className="font-medium text-gray-800 truncate">{contract.contractor}</h4>
                <span className={`text-xs px-2 py-1 rounded-full ${contract.status === 'Active' ? 'bg-yellow-100 text-yellow-800' : 'bg-orange-100 text-orange-800'}`}>
                  {contract.status === 'Active' ? 'Expiring Soon' : 'In Review'}
                </span>
              </div>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{contract.service}</p>
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-500 mb-3">
                <div>
                  <div className="font-medium">End Date</div>
                  <div>{contract.endDate || 'N/A'}</div>
                </div>
                <div>
                  <div className="font-medium">Value</div>
                  <div>{contract.monthlyValue ? `${contract.monthlyValue} OMR` : 'N/A'}</div>
                </div>
              </div>
              <div className="mt-2">
                <button className="w-full bg-gray-100 text-gray-700 py-1 rounded text-sm">Review</button>
              </div>
            </div>)}
        </div>
      </div>

      {/* Contract List & Status */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-lg font-medium text-gray-800">Contract List & Status</h3>
          <span className="text-sm text-gray-500">{filteredContracts.length} of {totalContracts} contracts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contractor
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Service Provided
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  End Date
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Monthly Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredContracts.map((contract, index) => <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {contract.contractor}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contract.service.length > 40 ? contract.service.substring(0, 40) + '...' : contract.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${contract.status === 'Active' ? 'bg-green-100 text-green-800' : contract.status === 'Expired' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {contract.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contract.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contract.endDate || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {contract.monthlyValue ? `${contract.monthlyValue.toLocaleString()} OMR` : 'N/A'}
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </div>;
};
const Contracts = () => {
  return <Layout>
      <ContractDashboard />
    </Layout>;
};
export default Contracts;