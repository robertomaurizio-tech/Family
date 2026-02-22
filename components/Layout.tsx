
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/spese', label: 'Spese', icon: '💸' },
    { path: '/lista-spesa', label: 'Lista Spesa', icon: '🛒' },
    { path: '/conto-sandro', label: 'Conto Sandro', icon: '👤' },
    { path: '/categorie', label: 'Categorie', icon: '🏷️' },
    { path: '/garage', label: 'Garage', icon: '🚗' },
    { path: '/settings', label: 'Impostazioni', icon: '⚙️' },
  ];

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      <div className="md:hidden bg-white border-b border-slate-200 p-4 flex justify-between items-center z-30 sticky top-0">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          <span>🏠</span> FinanceHub
        </h1>
        <button 
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
        >
          {isMenuOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
            </svg>
          )}
        </button>
      </div>

      {isMenuOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-20 md:hidden" onClick={closeMenu} />}

      <nav className={`
        fixed inset-y-0 left-0 w-64 bg-white border-r border-slate-200 shadow-xl md:shadow-none z-30 transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 
        ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-indigo-600 flex items-center gap-2">
            <span>🏠</span> FinanceHub
          </h1>
        </div>
        <div className="px-3 space-y-1 mt-4 md:mt-0">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={closeMenu}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                location.pathname === item.path
                  ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-100'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
