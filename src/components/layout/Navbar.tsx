
import React, { useState } from 'react';
import { Bell, Search, Settings, User, Menu, X } from 'lucide-react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="fixed top-0 right-0 left-0 z-50 border-b bg-white/80 backdrop-blur-md border-muscat-primary/10 animate-fade-in">
      <div className="flex items-center justify-between h-16 px-4 md:px-6">
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center">
            <img 
              alt="Muscat Bay Logo" 
              className="h-8 w-auto mr-2" 
              src="/lovable-uploads/a4c6f994-ae31-40c5-a0c0-0314f091a04d.jpg" 
              style={{ objectFit: 'contain' }}
            />
            <h1 className="text-lg md:text-xl font-semibold text-muscat-primary">
              Muscat Bay <span className="hidden ml-1 text-muscat-primary sm:inline">Asset Manager</span>
            </h1>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          {searchOpen ? (
            <div className="absolute left-0 right-0 top-0 z-50 bg-white flex items-center px-4 h-16 md:relative md:bg-transparent md:left-auto md:right-auto md:top-auto md:z-auto md:h-auto">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-muscat-primary/50 md:left-3" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-full py-2 pl-10 pr-4 text-sm transition-all border rounded-full focus:outline-none focus:ring-2 focus:ring-muscat-primary/20 border-muscat-primary/10 bg-muscat-light md:w-56 md:w-64" 
                autoFocus
              />
              <button 
                onClick={() => setSearchOpen(false)} 
                className="ml-2 p-2 md:hidden"
              >
                <X className="w-5 h-5 text-muscat-primary/80" />
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setSearchOpen(true)} 
                className="p-2 transition-all rounded-full hover:bg-muscat-light md:hidden"
              >
                <Search className="w-5 h-5 text-muscat-primary/80" />
              </button>
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muscat-primary/50" />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  className="w-56 md:w-64 py-2 pl-10 pr-4 text-sm transition-all border rounded-full focus:outline-none focus:ring-2 focus:ring-muscat-primary/20 border-muscat-primary/10 bg-muscat-light" 
                />
              </div>
            </>
          )}
          
          {!searchOpen && (
            <>
              <button className="relative p-2 transition-all rounded-full hover:bg-muscat-light">
                <Bell className="w-5 h-5 text-muscat-primary/80" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-muscat-teal rounded-full"></span>
              </button>
              
              <button className="p-2 transition-all rounded-full hover:bg-muscat-light">
                <Settings className="w-5 h-5 text-muscat-primary/80" />
              </button>
              
              <div className="flex items-center gap-3 pl-2 md:pl-4 border-l border-muscat-primary/10">
                <div className="hidden text-right md:block">
                  <p className="text-sm font-medium text-muscat-primary">Abdulrahim Al Balushi</p>
                  <p className="text-xs text-muscat-primary/60">Assets & Operations</p>
                </div>
                <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 overflow-hidden transition-all bg-muscat-lavender/20 rounded-full hover:ring-2 hover:ring-muscat-primary/20">
                  <User className="w-4 h-4 md:w-5 md:h-5 text-muscat-primary/80" />
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
