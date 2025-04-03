
import React, { useState } from 'react';
import Dashboard from '@/components/asset-reserve-fund/Dashboard';
import Calculator from '@/components/asset-reserve-fund/Calculator';
import GlobalStyles from '@/components/asset-reserve-fund/GlobalStyles';
import Transition from '@/components/asset-reserve-fund/Transition';

const AssetReserveFund: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [menuOpen, setMenuOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [compactView, setCompactView] = useState(false);

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-800'} flex flex-col transition-colors duration-300`}>
      {/* Header */}
      <header className={`bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] text-white shadow-lg sticky top-0 z-10 transition-all duration-300 ${compactView ? 'py-1' : 'py-3'}`}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 flex-shrink-0">
              <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6z" />
                  <path d="M3 6h18v4H3z" />
                  <path d="M9 14h6" />
                  <path d="M9 18h6" />
                </svg>
              </div>
              <h1 className={`font-bold tracking-tight transition-all duration-300 ${compactView ? 'text-lg' : 'text-xl'}`}>
                Muscat Bay Reserve Fund
              </h1>
            </div>
            
            <nav className="hidden md:flex space-x-1 flex-grow justify-center px-4">
              {['dashboard', 'calculator', 'reports', 'assets'].map((tab) => (
                <button
                  key={tab}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 whitespace-nowrap ${
                    activeTab === tab
                      ? 'bg-white/20 text-white'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
            
            <div className="flex items-center space-x-2 flex-shrink-0">
              <button
                className="md:flex hidden items-center p-2 rounded-md text-white hover:bg-white/20 transition-colors"
                onClick={() => setShowSettings(!showSettings)}
                aria-label="Settings"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              <button
                className="md:hidden p-2 rounded-md text-white hover:bg-white/20 transition-colors"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Open Menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          <Transition
            show={menuOpen}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <div className="md:hidden px-2 pt-2 pb-3 space-y-1 bg-[#4E4456]/90 backdrop-blur-sm">
              {['dashboard', 'calculator', 'reports', 'assets'].map((tab) => (
                <button
                  key={tab}
                  className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md transition-all duration-200 ${
                    activeTab === tab
                      ? 'bg-white/20 text-white'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => {
                    setActiveTab(tab);
                    setMenuOpen(false);
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
              <button
                className="block w-full text-left px-3 py-2 text-base font-medium rounded-md text-white/70 hover:bg-white/10 hover:text-white transition-all duration-200"
                onClick={() => {
                  setShowSettings(!showSettings);
                  setMenuOpen(false);
                }}
              >
                Settings
              </button>
            </div>
          </Transition>
          
          <Transition
            show={showSettings}
            enter="transition ease-out duration-200"
            enterFrom="transform opacity-0 -translate-y-4"
            enterTo="transform opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="transform opacity-100 translate-y-0"
            leaveTo="transform opacity-0 -translate-y-4"
            className="absolute right-4 top-16 z-20"
            unmount={false}
          >
            <div className={`rounded-lg shadow-xl p-4 ${darkMode ? 'bg-gray-800' : 'bg-white'} w-64`}>
              <h3 className="font-medium mb-3">Settings</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Dark Mode</span>
                  <button
                    onClick={() => setDarkMode(!darkMode)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                      darkMode ? 'bg-[#6D5D7B]' : 'bg-gray-300'
                    }`}
                    aria-pressed={darkMode}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                        darkMode ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Compact View</span>
                  <button
                    onClick={() => setCompactView(!compactView)}
                    className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none ${
                      compactView ? 'bg-[#6D5D7B]' : 'bg-gray-300'
                    }`}
                    aria-pressed={compactView}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform transition-transform bg-white rounded-full ${
                        compactView ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    className="text-sm text-[#4E4456] dark:text-[#AD9BBD] hover:text-[#6D5D7B] dark:hover:text-[#E9D7F5] transition-colors"
                    onClick={() => setShowSettings(false)}
                  >
                    Close Settings
                  </button>
                </div>
              </div>
            </div>
          </Transition>
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 container mx-auto px-4 transition-all duration-300 ${compactView ? 'py-3' : 'py-6'} relative`}>
        {/* Dashboard Tab */}
        <Transition
          show={activeTab === 'dashboard'}
          unmount={false}
          className={`transition-opacity duration-300 ${
            activeTab !== 'dashboard' ? 'absolute top-0 left-0 right-0 opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          enter="ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Dashboard compactView={compactView} darkMode={darkMode} />
        </Transition>
        
        {/* Calculator Tab */}
        <Transition
          show={activeTab === 'calculator'}
          unmount={false}
          className={`transition-opacity duration-300 ${
            activeTab !== 'calculator' ? 'absolute top-0 left-0 right-0 opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          enter="ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <Calculator compactView={compactView} darkMode={darkMode} />
        </Transition>
        
        {/* Reports Tab (Placeholder) */}
        <Transition
          show={activeTab === 'reports'}
          unmount={false}
          className={`transition-opacity duration-300 ${
            activeTab !== 'reports' ? 'absolute top-0 left-0 right-0 opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          enter="ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="text-center py-20">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              Reports Module
            </h2>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              This module will be available in the next update.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] text-white rounded-md hover:opacity-90 transition-opacity"
              onClick={() => setActiveTab('dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </Transition>
        
        {/* Assets Tab (Placeholder) */}
        <Transition
          show={activeTab === 'assets'}
          unmount={false}
          className={`transition-opacity duration-300 ${
            activeTab !== 'assets' ? 'absolute top-0 left-0 right-0 opacity-0 pointer-events-none' : 'opacity-100'
          }`}
          enter="ease-out"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="text-center py-20">
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
              Asset Management
            </h2>
            <p className={`mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              This module will be available in the next update.
            </p>
            <button
              className="mt-4 px-4 py-2 bg-gradient-to-r from-[#4E4456] to-[#6D5D7B] text-white rounded-md hover:opacity-90 transition-opacity"
              onClick={() => setActiveTab('dashboard')}
            >
              Return to Dashboard
            </button>
          </div>
        </Transition>
      </main>

      {/* Footer Section */}
      <footer className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-t py-4 transition-colors duration-300`}>
        <div className="container mx-auto px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>© {new Date().getFullYear()} Muscat Bay Reserve Fund Management</p>
          <p className="text-xs mt-1">Version 1.0.3</p>
        </div>
      </footer>
      
      {/* Include GlobalStyles for animations */}
      <GlobalStyles />
    </div>
  );
};

export default AssetReserveFund;
