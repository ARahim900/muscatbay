import React from 'react';
import { Bell, Search, Settings, User } from 'lucide-react';
import { Link } from 'react-router-dom';
const Navbar = () => {
  return <header className="fixed top-0 right-0 left-0 z-50 border-b bg-white/80 backdrop-blur-md border-muscat-primary/10 animate-fade-in">
      <div className="flex items-center justify-between h-16 px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <h1 className="text-xl font-semibold text-muscat-primary">
              Muscat Bay <span className="hidden ml-1 text-muscat-primary sm:inline">Asset Manager</span>
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muscat-primary/50" />
            <input type="text" placeholder="Search..." className="w-64 py-2 pl-10 pr-4 text-sm transition-all border rounded-full focus:outline-none focus:ring-2 focus:ring-muscat-primary/20 border-muscat-primary/10 bg-muscat-light" />
          </div>
          
          <button className="relative p-2 transition-all rounded-full hover:bg-muscat-light">
            <Bell className="w-5 h-5 text-muscat-primary/80" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-muscat-teal rounded-full"></span>
          </button>
          
          <button className="p-2 transition-all rounded-full hover:bg-muscat-light">
            <Settings className="w-5 h-5 text-muscat-primary/80" />
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-muscat-primary/10">
            <div className="hidden text-right md:block">
              <p className="text-sm font-medium text-muscat-primary">Abdulrahim Al Balushi</p>
              <p className="text-xs text-muscat-primary/60">Assets & Operations</p>
            </div>
            <div className="flex items-center justify-center w-10 h-10 overflow-hidden transition-all bg-muscat-lavender/20 rounded-full hover:ring-2 hover:ring-muscat-primary/20">
              <User className="w-5 h-5 text-muscat-primary/80" />
            </div>
          </div>
        </div>
      </div>
    </header>;
};
export default Navbar;