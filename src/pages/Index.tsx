import React, { useState, useEffect } from 'react';
import { 
  Calendar, BarChart2, Droplet, Zap, Home, FileBarChart, FileText, 
  Briefcase, Activity, ThermometerSun, PieChart, ArrowRight, TrendingUp, 
  Bell, Search, Settings, Menu, ChevronRight, User, LogOut, 
  Moon, Sun, Grid, Sliders, X, ChevronLeft, Clock, Filter, Plus
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';

const OperationsDashboard = () => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [activePage, setActivePage] = useState('dashboard');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [notifications, setNotifications] = useState([
    { id: 1, title: 'Critical: STP Plant Flow Rate', message: 'Flow rate exceeded threshold at Pump #3', time: '20m ago', type: 'critical', read: false },
    { id: 2, title: 'Warning: Electricity Consumption', message: 'Usage above monthly average by 12%', time: '1h ago', type: 'warning', read: false },
    { id: 3, title: 'Contracts Expiring', message: '2 vendor contracts expiring in 7 days', time: '2h ago', type: 'info', read: false },
  ]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const energyData = [
    { name: 'Mon', value: 40 },
    { name: 'Tue', value: 35 },
    { name: 'Wed', value: 50 },
    { name: 'Thu', value: 45 },
    { name: 'Fri', value: 55 },
    { name: 'Sat', value: 48 },
    { name: 'Sun', value: 52 }
  ];
  
  const waterData = [
    { name: 'Mon', value: 30 },
    { name: 'Tue', value: 28 },
    { name: 'Wed', value: 35 },
    { name: 'Thu', value: 32 },
    { name: 'Fri', value: 24 },
    { name: 'Sat', value: 22 },
    { name: 'Sun', value: 25 }
  ];
  
  const facilityData = [
    { name: 'STP', value: 92 },
    { name: 'Pumps', value: 94 },
    { name: 'HVAC', value: 86 },
    { name: 'Electric', value: 98 },
    { name: 'Water', value: 91 }
  ];
  
  const contractsData = [
    { name: 'Active', value: 23 },
    { name: 'Pending', value: 5 },
    { name: 'Expiring', value: 2 },
    { name: 'Completed', value: 18 }
  ];
  
  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);
  
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);
  
  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };
  
  const toggleSidebar = () => {
    setSidebarExpanded(!sidebarExpanded);
  };
  
  const handleNotificationClick = () => {
    setShowNotifications(!showNotifications);
  };
  
  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };
  
  const dismissNotification = (id) => {
    setNotifications(notifications.filter(notification => notification.id !== id));
  };
  
  const getUnreadCount = () => {
    return notifications.filter(notification => !notification.read).length;
  };
  
  const navigationItems = [
    { 
      id: 'dashboard', 
      icon: <Grid size={20} />, 
      label: 'Dashboard', 
      active: activePage === 'dashboard'
    },
    { 
      id: 'utilities', 
      icon: <Activity size={20} />, 
      label: 'Utilities', 
      active: activePage === 'utilities' || selectedCategory === 'utilities',
      subItems: [
        { id: 'electricity', label: 'Electricity', icon: <Zap size={16} /> },
        { id: 'water', label: 'Water System', icon: <Droplet size={16} /> }
      ]
    },
    { 
      id: 'facilities', 
      icon: <Home size={20} />, 
      label: 'Facilities', 
      active: activePage === 'facilities' || selectedCategory === 'facilities',
      subItems: [
        { id: 'stp', label: 'STP Plant', icon: <Droplet size={16} /> },
        { id: 'pumping', label: 'Pumping Stations', icon: <Activity size={16} /> },
        { id: 'hvac', label: 'HVAC/BMS', icon: <ThermometerSun size={16} /> }
      ]
    },
    { 
      id: 'management', 
      icon: <Briefcase size={20} />, 
      label: 'Management', 
      active: activePage === 'management' || selectedCategory === 'management',
      subItems: [
        { id: 'contracts', label: 'Contracts', icon: <FileText size={16} /> },
        { id: 'projects', label: 'Projects', icon: <BarChart2 size={16} /> },
        { id: 'assets', label: 'Asset Lifecycle', icon: <Calendar size={16} /> },
        { id: 'reports', label: 'Reports', icon: <FileBarChart size={16} /> }
      ]
    }
  ];
  
  if (isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading your dashboard...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-screen flex overflow-hidden bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 transition-colors duration-200">
      <div 
        className={`fixed inset-y-0 left-0 z-10 flex flex-col ${sidebarExpanded ? 'w-64' : 'w-20'} 
                   bg-white dark:bg-gray-800 shadow-lg transition-all duration-300 ease-in-out`}
      >
        <div className="h-16 flex items-center justify-center px-4 border-b border-gray-100 dark:border-gray-700">
          {sidebarExpanded ? (
            <div className="flex items-center">
              <div className="h-8 w-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="ml-3 font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600">
                OpsDash
              </span>
            </div>
          ) : (
            <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <Activity className="h-6 w-6 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-1 px-3">
            {navigationItems.map(item => (
              <li key={item.id}>
                <button
                  className={`w-full flex items-center ${item.active 
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/30'} 
                    rounded-lg px-3 py-2 mb-1 transition-colors duration-200`}
                  onClick={() => {
                    setActivePage(item.id);
                    setSelectedCategory(item.id !== 'dashboard' ? item.id : null);
                  }}
                >
                  <span className="inline-flex items-center justify-center">
                    {item.icon}
                  </span>
                  {sidebarExpanded && (
                    <>
                      <span className="ml-3 font-medium">{item.label}</span>
                      {item.subItems && (
                        <ChevronRight className={`h-4 w-4 ml-auto transition-transform duration-200 ${item.active ? 'rotate-90' : ''}`} />
                      )}
                    </>
                  )}
                </button>
                
                {sidebarExpanded && item.active && item.subItems && (
                  <ul className="mt-1 ml-6 space-y-1 border-l border-gray-200 dark:border-gray-700 pl-3">
                    {item.subItems.map(subItem => (
                      <li key={subItem.id}>
                        <button
                          className="w-full flex items-center text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 py-1"
                          onClick={() => {
                            // Handle sub-item navigation
                          }}
                        >
                          {subItem.icon}
                          <span className="ml-2 text-sm">{subItem.label}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {sidebarExpanded && (
              <div className="flex items-center">
                <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                  J
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">John Doe</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Administrator</p>
                </div>
              </div>
            )}
            
            {!sidebarExpanded && (
              <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 flex items-center justify-center text-white font-medium">
                J
              </div>
            )}
            
            <button 
              onClick={toggleSidebar}
              className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {sidebarExpanded ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>
      
      <div className={`flex-1 flex flex-col ${sidebarExpanded ? 'ml-64' : 'ml-20'} transition-all duration-300 ease-in-out`}>
        <header className="h-16 bg-white dark:bg-gray-800 shadow-sm flex items-center justify-between px-6 sticky top-0 z-10">
          <div className="flex items-center">
            <button className="lg:hidden mr-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <Menu size={20} />
            </button>
            <h1 className="text-xl font-semibold">Operations Dashboard</h1>
            <div className="hidden md:flex items-center ml-6 text-sm text-gray-500 dark:text-gray-400">
              <Clock size={14} className="mr-1" />
              <span>Sunday, March 30, 2025</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input 
                type="text" 
                placeholder="Search..." 
                className="bg-gray-100 dark:bg-gray-700/50 border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
              />
            </div>
            
            <div className="relative">
              <button 
                className="relative text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={handleNotificationClick}
              >
                <Bell size={20} />
                {getUnreadCount() > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getUnreadCount()}
                  </span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="font-medium">Notifications</h3>
                    <div className="flex space-x-2">
                      <button 
                        onClick={markAllAsRead}
                        className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                      >
                        Mark all as read
                      </button>
                      <button 
                        onClick={() => setShowNotifications(false)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                        <p>No notifications</p>
                      </div>
                    ) : (
                      notifications.map(notification => {
                        let bgColor = '';
                        let dotColor = '';
                        
                        switch(notification.type) {
                          case 'critical':
                            bgColor = notification.read ? '' : 'bg-red-50 dark:bg-red-900/10';
                            dotColor = 'bg-red-500';
                            break;
                          case 'warning':
                            bgColor = notification.read ? '' : 'bg-amber-50 dark:bg-amber-900/10';
                            dotColor = 'bg-amber-500';
                            break;
                          default:
                            bgColor = notification.read ? '' : 'bg-blue-50 dark:bg-blue-900/10';
                            dotColor = 'bg-blue-500';
                        }
                        
                        return (
                          <div 
                            key={notification.id} 
                            className={`p-4 border-b border-gray-200 dark:border-gray-700 ${bgColor} hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-200`}
                          >
                            <div className="flex items-start">
                              <div className={`h-2 w-2 mt-1 rounded-full ${dotColor} flex-shrink-0 mr-3`}></div>
                              <div className="flex-1">
                                <div className="flex justify-between">
                                  <p className="text-sm font-medium">{notification.title}</p>
                                  <button 
                                    onClick={() => dismissNotification(notification.id)}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
                                  >
                                    <X size={14} />
                                  </button>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{notification.message}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.time}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <button 
              onClick={toggleDarkMode}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            
            <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
              <Settings size={20} />
            </button>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Energy Consumption</h3>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-semibold">21.4 MW</span>
                    <span className="ml-2 text-xs font-medium text-green-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      5.3%
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                  <Zap className="h-5 w-5" />
                </div>
              </div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={energyData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#energyGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Water Consumption</h3>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-semibold">325 m³</span>
                    <span className="ml-2 text-xs font-medium text-red-500 flex items-center">
                      <TrendingUp className="h-3 w-3 mr-1 transform rotate-180" />
                      2.1%
                    </span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 dark:text-cyan-400">
                  <Droplet className="h-5 w-5" />
                </div>
              </div>
              <div className="h-16">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={waterData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="waterGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0EA5E9" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#0EA5E9" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="value" stroke="#0EA5E9" fillOpacity={1} fill="url(#waterGradient)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">System Status</h3>
                  <div className="mt-1 flex flex-wrap items-center">
                    <div className="flex items-center mr-4">
                      <span className="h-2 w-2 rounded-full bg-green-500 mr-1"></span>
                      <span className="text-xs">20</span>
                    </div>
                    <div className="flex items-center mr-4">
                      <span className="h-2 w-2 rounded-full bg-amber-500 mr-1"></span>
                      <span className="text-xs">3</span>
                    </div>
                    <div className="flex items-center">
                      <span className="h-2 w-2 rounded-full bg-red-500 mr-1"></span>
                      <span className="text-xs">1</span>
                    </div>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                  <Activity className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <div className="flex-1">
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-emerald-500 w-[83%]"></div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>Overall: 83% healthy</span>
                    <span>24/29 systems</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Alerts</h3>
                  <div className="mt-1 flex items-baseline">
                    <span className="text-2xl font-semibold">4</span>
                    <span className="ml-2 text-xs font-medium text-amber-500">+2 today</span>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                  <Bell className="h-5 w-5" />
                </div>
              </div>
              <div className="space-y-2 mt-2">
                <div className="flex items-center text-xs p-1.5 rounded-lg bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 mr-2"></span>
                  <span>Critical: STP Plant Flow Rate</span>
                </div>
                <div className="flex items-center text-xs p-1.5 rounded-lg bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-2"></span>
                  <span>Warning: Electricity Consumption</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mb-8">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold">System Overview</h2>
              <div className="flex space-x-2">
                <button className="px-3 py-1.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 flex items-center">
                  <Filter className="h-4 w-4 mr-1.5" />
                  <span>Filter</span>
                </button>
                <button className="px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors duration-200 flex items-center">
                  <Plus className="h-4 w-4 mr-1.5" />
                  <span>Add View</span>
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-medium">Facility Performance</h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                    Last 7 days
                  </div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={facilityData} margin={{ top: 0, right: 0, left: 0, bottom: 5 }}>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#6B7280' }}
                      />
                      <YAxis 
                        hide={true}
                        domain={[0, 100]}
                      />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: 'none',
                          borderRadius: '8px',
                          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                          fontSize: '12px'
                        }}
                        formatter={(value) => [`${value}%`, 'Efficiency']}
                      />
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4F46E5" stopOpacity={1} />
                          <stop offset="100%" stopColor="#818CF8" stopOpacity={1} />
                        </linearGradient>
                      </defs>
                      <Bar 
                        dataKey="value" 
                        fill="url(#barGradient)" 
                        radius={[4, 4, 0, 0]}
                        barSize={40}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-end mt-2">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                    View details
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="font-medium">Contract Status</h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full px-2.5 py-1">
                    Total: 48
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row items-center justify-between">
                  <div className="h-48 w-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <defs>
                          <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#60A5FA" stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="pendingGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={1} />
                            <stop offset="100%" stopColor="#A78BFA" stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="expiringGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#F59E0B" stopOpacity={1} />
                            <stop offset="100%" stopColor="#FBBF24" stopOpacity={1} />
                          </linearGradient>
                          <linearGradient id="completedGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10B981" stopOpacity={1} />
                            <stop offset="100%" stopColor="#34D399" stopOpacity={1} />
                          </linearGradient>
                        </defs>
                        <Tooltip 
                          contentStyle={{ 
                            background: 'rgba(255, 255, 255, 0.9)',
                            border: 'none',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                          }}
                          formatter={(value, name) => [`${value} contracts`, name]}
                        />
                        <Pie 
                          dataKey="value" 
                          data={contractsData} 
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={2}
                        >
                          {contractsData.map((entry, index) => {
                            const gradientIds = ['url(#activeGradient)', 'url(#pendingGradient)', 'url(#expiringGradient)', 'url(#completedGradient)'];
                            return <Cell key={`cell-${index}`} fill={gradientIds[index % gradientIds.length]} />;
                          })}
                        </Pie>
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="md:ml-6 mt-4 md:mt-0 space-y-3 flex-1">
                    {contractsData.map((item, index) => {
                      const colors = [
                        { bg: 'bg-blue-100 dark:bg-blue-900/20', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
                        { bg: 'bg-purple-100 dark:bg-purple-900/20', text: 'text-purple-700 dark:text-purple-300', dot: 'bg-purple-500' },
                        { bg: 'bg-amber-100 dark:bg-amber-900/20', text: 'text-amber-700 dark:text-amber-300', dot: 'bg-amber-500' },
                        { bg: 'bg-emerald-100 dark:bg-emerald-900/20', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
                      ];
                      
                      return (
                        <div key={item.name} className={`flex items-center p-3 rounded-lg ${colors[index].bg}`}>
                          <span className={`h-2 w-2 rounded-full ${colors[index].dot} mr-2`}></span>
                          <span className={`text-sm font-medium ${colors[index].text}`}>{item.name}:</span>
                          <span className={`ml-2 text-sm ${colors[index].text}`}>{item.value}</span>
                          
                          {item.name === 'Expiring' && (
                            <span className="ml-auto text-xs bg-white dark:bg-gray-800 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                              Action needed
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                <div className="flex justify-end mt-4">
                  <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center">
                    Manage contracts
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold">System Categories</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow duration-200">
                <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center shadow-sm">
                      <Activity className="h-6 w-6" />
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-full px-2.5 py-1">
                      2 systems
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">Utilities</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Monitor electricity and water systems with real-time data.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <Zap className="h-5 w-5 text-amber-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Electricity System</span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <Droplet className="h-5 w-5 text-cyan-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Water System</span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="w-full mt-4 flex items-center justify-center text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 bg-blue-50 dark:bg-blue-900/10 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg py-2 transition-colors duration-200"
                    onClick={() => {
                      setActivePage('utilities');
                      setSelectedCategory('utilities');
                    }}
                  >
                    View all utilities
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow duration-200">
                <div className="h-2 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center shadow-sm">
                      <Home className="h-6 w-6" />
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-full px-2.5 py-1">
                      3 systems
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">Facilities</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Manage facilities including STP plant, pumping stations, and HVAC.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <Droplet className="h-5 w-5 text-green-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">STP Plant</span>
                          <span className="text-xs bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-2 py-0.5 rounded-full">
                            Critical
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <Activity className="h-5 w-5 text-blue-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Pumping Stations</span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="w-full mt-4 flex items-center justify-center text-sm text-emerald-600 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/10 hover:bg-emerald-100 dark:hover:bg-emerald-900/20 rounded-lg py-2 transition-colors duration-200"
                    onClick={() => {
                      setActivePage('facilities');
                      setSelectedCategory('facilities');
                    }}
                  >
                    View all facilities
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden group hover:shadow-md transition-shadow duration-200">
                <div className="h-2 bg-gradient-to-r from-purple-500 to-purple-600"></div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl flex items-center justify-center shadow-sm">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-medium rounded-full px-2.5 py-1">
                      4 systems
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">Management</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                    Track contracts, projects, assets, and generate reports.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <FileText className="h-5 w-5 text-purple-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Contracts</span>
                          <span className="text-xs bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                            Warning
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center py-2 px-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                      <BarChart2 className="h-5 w-5 text-purple-500 mr-3" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm">Projects</span>
                          <span className="text-xs bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    className="w-full mt-4 flex items-center justify-center text-sm text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/10 hover:bg-purple-100 dark:hover:bg-purple-900/20 rounded-lg py-2 transition-colors duration-200"
                    onClick={() => {
                      setActivePage('management');
                      setSelectedCategory('management');
                    }}
                  >
                    View all management
                    <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default OperationsDashboard;
