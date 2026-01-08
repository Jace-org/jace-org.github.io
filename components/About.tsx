
import React from 'react';

const About: React.FC = () => {
  return (
    <section id="about" className="py-32 px-6 relative bg-theme-overlay backdrop-blur-sm">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row gap-16 items-center">
          <div className="relative w-64 h-64 shrink-0">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-800 to-red-700 rounded-2xl rotate-6 blur-md opacity-30" />
            <div className="relative w-full h-full border border-theme bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center group shadow-2xl">
               <img src="https://picsum.photos/seed/jhapendra/400/400" alt="Jhapendra" className="object-cover w-full h-full grayscale group-hover:grayscale-0 transition-all duration-500" />
               <div className="absolute inset-0 bg-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            {/* Nickname Tag */}
            <div className="absolute -bottom-4 -right-4 bg-red-600 text-white px-6 py-2 font-orbitron font-bold text-sm transform -rotate-2 shadow-2xl z-10">
              Uki
            </div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-4xl font-orbitron mb-8 flex items-center gap-4">
              <span className="text-red-600">01.</span> About Me
            </h3>
            <div className="space-y-6 leading-relaxed text-lg font-medium">
              <p className="text-subtheme">
                Hello! I'm <span className="text-theme font-bold">Jhapendra Kandel</span>, also known as <span className="text-red-600">Uki</span>. 
                I am a passionate <span className="text-blue-700 font-black">Full Stack Developer</span> with a hunger for building secure, efficient, and visually stunning digital experiences.
              </p>
              <p className="text-subtheme">
                My journey in tech is fueled by a dual fascination: crafting robust web architectures and understanding the intricacies of digital security. This unique perspective allows me to build applications that are not only high-performing but resilient by design.
              </p>
              <p className="text-subtheme">
                Currently, I am deep-diving into <span className="text-red-600 font-bold">Cybersecurity and Ethical Hacking</span>, integrating these critical safety paradigms into my full-stack development workflow.
              </p>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        .text-theme { color: var(--text-color); }
        .text-subtheme { color: var(--subtext-color); }
        .bg-theme-overlay { background-color: rgba(var(--bg-color-rgb, 1, 4, 9), 0.9); }
      `}</style>
    </section>
  );
};

export default About;
