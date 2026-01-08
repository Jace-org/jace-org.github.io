
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 border-t border-white/5 bg-black/80">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="flex flex-col items-center md:items-start">
          <span className="font-orbitron font-black text-2xl tracking-tighter text-red-900/40 mb-2">JK</span>
          <p className="text-slate-600 text-[10px] uppercase tracking-[0.2em] font-bold">© 2024 Jhapendra Kandel. Protocols Active.</p>
        </div>
        
        <div className="flex gap-8">
          {['LinkedIn', 'GitHub', 'Twitter', 'Instagram'].map(platform => (
            <a 
              key={platform} 
              href="#" 
              className="text-slate-500 hover:text-red-500 text-[10px] font-orbitron uppercase tracking-[0.2em] transition-colors font-bold"
            >
              {platform}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
