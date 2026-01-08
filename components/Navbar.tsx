
import React from 'react';
import { Sun, Moon, Database } from 'lucide-react';

interface NavbarProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onViewChange: (view: 'home' | 'resources') => void;
  currentView: 'home' | 'resources';
}

const Navbar: React.FC<NavbarProps> = ({ isDark, onToggleTheme, onViewChange, currentView }) => {
  return (
    <nav className="fixed top-0 left-0 w-full z-50 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center bg-black/40 backdrop-blur-lg border border-white/10 rounded-full px-6 md:px-8 py-3 shadow-2xl">
        <div 
          className="font-orbitron font-bold text-2xl text-red-600 cursor-pointer" 
          onClick={() => onViewChange('home')}
        >
          JK
        </div>
        
        <div className="flex items-center gap-4 md:gap-8">
          <div className="hidden md:flex gap-8 text-[10px] md:text-sm font-orbitron tracking-widest uppercase text-slate-300 font-medium">
            <button onClick={() => onViewChange('home')} className={`hover:text-red-600 transition-colors ${currentView === 'home' ? 'text-red-600' : ''}`}>Home</button>
            <button onClick={() => onViewChange('resources')} className={`hover:text-red-600 transition-colors flex items-center gap-2 ${currentView === 'resources' ? 'text-red-600' : ''}`}>
              <Database className="w-4 h-4" />
              Resources
            </button>
          </div>

          <button 
            onClick={onToggleTheme}
            className={`relative w-14 h-7 rounded-full p-1 transition-colors duration-300 flex items-center ${isDark ? 'bg-slate-800' : 'bg-blue-500'}`}
          >
            <div 
              className={`absolute w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 transform flex items-center justify-center ${isDark ? 'translate-x-7' : 'translate-x-0'}`}
            >
              {isDark ? <Moon className="w-3 h-3 text-slate-900" /> : <Sun className="w-3 h-3 text-orange-500" />}
            </div>
            <div className="flex justify-between w-full px-1.5 pointer-events-none">
              <Sun className={`w-3 h-3 ${isDark ? 'text-slate-600' : 'text-white'}`} />
              <Moon className={`w-3 h-3 ${isDark ? 'text-white' : 'text-blue-200'}`} />
            </div>
          </button>

          <a href="#contact" className="hidden md:block text-white transition-all duration-300 bg-red-700/80 hover:bg-red-600 px-6 py-1.5 rounded-full text-xs font-orbitron tracking-widest uppercase border border-red-500/30">
            Contact
          </a>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
