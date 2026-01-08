
import React from 'react';
import { EDUCATION } from '../constants';

const Education: React.FC = () => {
  return (
    <section id="education" className="py-24 px-6 bg-black/30">
      <div className="max-w-4xl mx-auto">
        <h3 className="text-3xl font-orbitron mb-12 flex items-center gap-4">
          <span className="text-red-600">04.</span> Intelligence Brief
        </h3>
        
        <div className="relative pl-12 border-l border-blue-900/50 py-4">
           {/* Cyber Education */}
           <div className="absolute left-[-9px] top-4 w-4 h-4 rounded-full bg-red-600 border-4 border-[#010409] shadow-[0_0_15px_#e11d48]" />
           
           <div className="bg-gradient-to-r from-red-900/10 to-transparent p-8 border border-white/5 rounded-xl hover:bg-white/[0.03] transition-colors group">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start mb-4">
                <div>
                  <h4 className="text-xl font-orbitron text-red-500 mb-1 group-hover:text-red-400 transition-colors">{EDUCATION.degree}</h4>
                  <p className="text-slate-300 font-medium">{EDUCATION.institution}</p>
                </div>
                <div className="mt-2 md:mt-0 px-3 py-1 bg-blue-900/20 border border-blue-800/30 text-blue-400 text-xs font-orbitron uppercase tracking-widest rounded-full font-bold">
                  {EDUCATION.status}
                </div>
              </div>
              <p className="text-slate-400 text-sm italic border-l-2 border-red-600/30 pl-4">
                "Developing a defensive and offensive mindset to engineer next-generation secure systems and networks."
              </p>
           </div>
        </div>
      </div>
    </section>
  );
};

export default Education;
