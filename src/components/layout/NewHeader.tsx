
import React from 'react';
import { Bell, Menu, Settings } from 'lucide-react';
import { useApp } from '@/context/AppContext';

const NewHeader = () => {
  const { toggleSidebar } = useApp();
  
  return (
    <header className="bg-gradient-to-r from-[#4E4456] to-[#6a5f7a] text-white shadow-md sticky top-0 z-30">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <button onClick={toggleSidebar} className="mr-4 p-2 rounded-md hover:bg-white/20 md:hidden">
            <Menu size={24} />
          </button>
          <h1 className="text-xl md:text-2xl font-bold">Muscat Bay AOMS</h1>
        </div>
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-full hover:bg-white/20">
            <Bell size={20} />
            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
          </button>
          <button className="p-2 rounded-full hover:bg-white/20">
            <Settings size={20} />
          </button>
          <div className="flex items-center">
            <img src="https://placehold.co/40x40/E2E8F0/4A5568?text=OP" alt="User" className="w-8 h-8 rounded-full mr-2 border-2 border-white/50" />
            <span className="hidden md:inline">Operations Manager</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default NewHeader;
