
import React, { useEffect, useState, useRef } from 'react';
import { SKILLS } from '../constants';

const Skills: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section id="skills" ref={sectionRef} className="py-24 px-6 relative z-20 overflow-hidden">
        <div className="absolute inset-0 bg-card opacity-40"></div>
      <div className="max-w-5xl mx-auto relative z-10">
        <h3 className="text-4xl font-orbitron mb-12 flex items-center gap-4">
          <span className="text-red-600">02.</span> Core Arsenal
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12">
          {SKILLS.map((skill) => (
            <div key={skill.name} className="group">
              <div className="flex justify-between items-center mb-3">
                <span className="font-orbitron text-sm tracking-widest group-hover:text-red-600 transition-colors uppercase font-black text-theme">{skill.name}</span>
                <span className="text-sm font-mono text-red-600 font-black">{skill.proficiency}%</span>
              </div>
              <div className="h-3 w-full bg-slate-900/10 dark:bg-slate-900/50 rounded-full overflow-hidden border border-theme backdrop-blur-sm">
                <div 
                  className="h-full bg-gradient-to-r from-blue-700 to-red-600 relative transition-all duration-[2000ms] ease-out shadow-[0_0_20px_rgba(225,29,72,0.5)]"
                  style={{ width: isVisible ? `${skill.proficiency}%` : '0%' }}
                >
                  <div className="absolute inset-0 bg-[length:20px_20px] bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] animate-[move_2s_linear_infinite]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <style>{`
        .text-theme { color: var(--text-color); }
        .border-theme { border-color: var(--border-color); }
        .bg-card { background-color: var(--card-bg); }
        @keyframes move {
          0% { background-position: 0 0; }
          100% { background-position: 40px 0; }
        }
      `}</style>
    </section>
  );
};

export default Skills;
