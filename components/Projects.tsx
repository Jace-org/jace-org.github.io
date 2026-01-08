
import React from 'react';
import { PROJECTS } from '../constants';

const Projects: React.FC = () => {
  // Triple the projects to ensure seamless infinite scroll
  const marqueeProjects = [...PROJECTS, ...PROJECTS, ...PROJECTS];

  return (
    <section id="projects" className="py-32 px-6 bg-card/5 relative overflow-hidden border-y border-theme">
      <div className="max-w-7xl mx-auto mb-20 relative z-10">
        <h3 className="text-4xl md:text-6xl font-orbitron font-black text-theme flex items-center gap-6">
          <span className="text-red-600">03.</span> Field Operations
        </h3>
        <p className="text-sub font-orbitron tracking-[0.3em] uppercase text-xs mt-4 font-bold opacity-60">
          Deployed Systems & Digital Infrastructure
        </p>
      </div>
      
      {/* Autoscrolling Marquee Container */}
      <div className="relative w-screen left-1/2 right-1/2 -ml-[50vw] -mr-[50vw]">
        <div className="animate-marquee flex gap-12 py-10 px-6">
          {marqueeProjects.map((project, index) => (
            <div 
              key={`${project.title}-${index}`} 
              className="group relative w-[300px] md:w-[600px] shrink-0 transition-all duration-500 hover:scale-[1.02]"
            >
              {/* Device Mockup (Browser Window) */}
              <div className="bg-slate-900 rounded-xl overflow-hidden border-2 border-theme shadow-2xl relative">
                {/* Browser Header */}
                <div className="bg-slate-800/80 px-4 py-3 flex items-center gap-2 border-b border-theme backdrop-blur-md">
                   <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
                   </div>
                   <div className="mx-auto bg-black/40 px-3 py-1 rounded-md text-[9px] font-mono text-white/30 truncate max-w-[150px] md:max-w-[300px]">
                     https://ops.jk.dev/{project.title.toLowerCase().replace(/\s+/g, '-')}
                   </div>
                </div>

                {/* Project Image */}
                <div className="aspect-video overflow-hidden relative">
                  <img 
                    src={project.image} 
                    alt={project.title} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-1000"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-60" />
                  
                  {/* Hover Info Overlay */}
                  <div className="absolute inset-0 bg-blue-900/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-8">
                     <div className="flex gap-2 mb-4 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        {project.tags.map(tag => (
                          <span key={tag} className="text-[9px] font-black tracking-widest px-2 py-1 bg-red-600 text-white rounded">
                            {tag}
                          </span>
                        ))}
                     </div>
                     <h4 className="text-2xl font-orbitron font-black text-white mb-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-75">
                       {project.title}
                     </h4>
                     <p className="text-white/80 text-sm font-medium line-clamp-2 translate-y-4 group-hover:translate-y-0 transition-transform duration-500 delay-100">
                       {project.description}
                     </p>
                  </div>
                </div>
              </div>

              {/* External Link Indicator */}
              <div className="mt-6 flex justify-between items-center px-2">
                <span className="text-[10px] font-orbitron font-black tracking-[0.2em] text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  UPLINK ESTABLISHED
                </span>
                <button className="text-[10px] font-orbitron font-black tracking-[0.3em] text-theme uppercase hover:text-red-600 transition-colors flex items-center gap-2">
                  REVIEW LOGS
                  <div className="w-4 h-4 flex items-center justify-center border border-theme rounded-full">
                    <svg viewBox="0 0 24 24" className="w-2 h-2 fill-current">
                       <path d="M5 3l14 9-14 9V3z" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Background Cinematic Text */}
      <div className="absolute top-1/2 left-0 w-full text-[15rem] font-orbitron font-black text-white/5 whitespace-nowrap -translate-y-1/2 pointer-events-none select-none">
        OPERATIONAL DEPLOYMENT LOGS • CRITICAL ASSETS • 
      </div>

      <style>{`
        .text-theme { color: var(--text-color); }
        .text-sub { color: var(--subtext-color); }
        .border-theme { border-color: var(--border-color); }
      `}</style>
    </section>
  );
};

export default Projects;
