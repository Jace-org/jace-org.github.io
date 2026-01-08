
import React, { useState, useEffect } from 'react';

interface HeroProps {
  onReveal: () => void;
  isRevealed: boolean;
}

const Hero: React.FC<HeroProps> = ({ onReveal, isRevealed }) => {
  const [isFlashing, setIsFlashing] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    const handleEvent = () => { if (!isRevealed) onReveal(); };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleEvent);
    window.addEventListener('mousedown', handleEvent);
    
    const flashTimer = setInterval(() => {
      if (!isRevealed) {
        // First Strike
        setTimeout(() => setIsFlashing(true), 420);
        setTimeout(() => setIsFlashing(false), 750);
        // Second Strike
        setTimeout(() => setIsFlashing(true), 4200);
        setTimeout(() => setIsFlashing(false), 4550);
      }
    }, 7000);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleEvent);
      window.removeEventListener('mousedown', handleEvent);
      clearInterval(flashTimer);
    };
  }, [isRevealed, onReveal]);

  const contentOpacity = Math.max(0, 1 - scrollY / 600);
  const contentTranslate = scrollY * 0.5;

  return (
    <div 
      className={`fixed inset-0 transition-all duration-1000 ease-in-out ${isRevealed ? 'z-0' : 'z-50 bg-black'}`}
    >
      {/* Background White Flash - Z-Index 900 */}
      {!isRevealed && <div className="lightning-white-overlay" />}

      {/* Decorative Lightning at the edges */}
      {!isRevealed && isFlashing && (
        <div className="absolute inset-0 z-[950] pointer-events-none opacity-40">
           <svg className="absolute top-0 left-0 w-1/3 h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M10 0 L30 30 L10 50 L40 100" stroke="white" strokeWidth="0.5" fill="none" className="animate-pulse" />
           </svg>
           <svg className="absolute top-0 right-0 w-1/3 h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
             <path d="M90 0 L70 40 L90 60 L60 100" stroke="white" strokeWidth="0.5" fill="none" className="animate-pulse" />
           </svg>
        </div>
      )}

      {/* The Central JK Logo Container */}
      <div 
        className={`absolute inset-0 flex items-center justify-center transition-all duration-1000 
          ${isRevealed ? 'opacity-20 scale-125 blur-[2px]' : 'opacity-100 scale-100'}`}
        style={{ zIndex: 1000 }}
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          {/* SVG JK Logo with Precise Outline */}
          <svg 
            viewBox="0 0 800 500" 
            className="w-full h-auto max-w-[95vw] max-h-[80vh] pointer-events-none select-none"
          >
            <defs>
              {/* RGB Gradient for the stroke */}
              <linearGradient id="neon-rgb-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff0000" />
                <stop offset="20%" stopColor="#ffff00" />
                <stop offset="40%" stopColor="#00ff00" />
                <stop offset="60%" stopColor="#00ffff" />
                <stop offset="80%" stopColor="#0000ff" />
                <stop offset="100%" stopColor="#ff00ff" />
                <animateTransform 
                  attributeName="gradientTransform" 
                  type="rotate" 
                  from="0 400 250" to="360 400 250" 
                  dur="4s" 
                  repeatCount="indefinite" 
                />
              </linearGradient>

              {/* Sharper Glow Filter - Contained to the letters */}
              <filter id="precise-glow" x="-10%" y="-10%" width="120%" height="120%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* The JK Text Shape with Liquid Flow Effect */}
            <text
              x="50%"
              y="55%"
              textAnchor="middle"
              dominantBaseline="middle"
              className="font-orbitron font-black"
              style={{
                fontSize: '420px',
                letterSpacing: '-25px',
                // Fill behavior: Silent when revealed, Black silhouette when flashing
                fill: isRevealed 
                  ? (document.body.classList.contains('light-mode') ? '#1e40af' : '#3b82f6') 
                  : (isFlashing ? '#000000' : 'transparent'),
                
                // Stroke behavior: Animated RGB Liquid Neon when idle
                stroke: (!isRevealed && !isFlashing) ? 'url(#neon-rgb-gradient)' : 'none',
                strokeWidth: '3px',
                strokeLinejoin: 'round',
                strokeLinecap: 'round',
                
                // Clockwise "Liquid" Animation
                strokeDasharray: '2500', 
                strokeDashoffset: '2500',
                animation: (!isRevealed && !isFlashing) ? 'liquid-neon-flow 8s linear infinite' : 'none',
                filter: (!isRevealed && !isFlashing) ? 'url(#precise-glow)' : 'none',
                
                transition: 'fill 0.05s ease, opacity 1s ease',
                opacity: isRevealed ? contentOpacity : 1
              }}
            >
              JK
            </text>
          </svg>
        </div>
      </div>

      {/* Main Content (Revealed State) */}
      {isRevealed && (
        <div 
          className="h-screen flex flex-col items-center justify-center relative z-[1100] pointer-events-none"
          style={{ 
            opacity: contentOpacity,
            transform: `translateY(${-contentTranslate}px)`,
            transition: 'opacity 0.2s ease-out'
          }}
        >
           <div className="text-center px-6">
              <h1 className="text-4xl md:text-9xl font-orbitron font-black text-theme mb-6 tracking-tighter drop-shadow-[0_0_30px_rgba(225,29,72,0.4)]">
                JHAPENDRA<br/><span className="text-red-600">KANDEL</span>
              </h1>
              
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-4 md:gap-10">
                  <div className="h-[2px] w-8 md:w-24 bg-gradient-to-r from-transparent to-red-600" />
                  <p className="text-blue-600 dark:text-blue-400 font-orbitron tracking-[0.3em] md:tracking-[0.5em] uppercase text-sm md:text-4xl whitespace-nowrap font-black drop-shadow-xl">
                    Full Stack Developer
                  </p>
                  <div className="h-[2px] w-8 md:w-24 bg-gradient-to-l from-transparent to-blue-600" />
                </div>
                
                <div className="inline-block px-8 py-2 border-2 border-red-600/30 bg-red-600/10 rounded-full backdrop-blur-md">
                   <p className="text-red-600 dark:text-red-500 font-orbitron tracking-[0.25em] uppercase text-[10px] md:text-xl font-bold">
                     Cybersecurity & Ethical Hacker
                   </p>
                </div>
              </div>
           </div>
        </div>
      )}

      {/* Call to Action - Red & Bold */}
      {!isRevealed && (
        <div className="absolute bottom-16 w-full flex flex-col items-center gap-6 z-[1200]">
           <div className="flex flex-col items-center group cursor-pointer" onClick={onReveal}>
               <span className="text-[14px] font-orbitron tracking-[0.6em] text-red-600 uppercase mb-4 font-black animate-pulse group-hover:text-red-500 transition-colors drop-shadow-[0_0_10px_rgba(225,29,72,0.5)]">
                 CLICK ANYWHERE TO CONTINUE
               </span>
               <div className="w-[1.5px] h-20 bg-gradient-to-b from-red-600 via-red-500 to-transparent shadow-[0_0_15px_rgba(225,29,72,0.8)]"></div>
           </div>
           <span className="text-[10px] font-orbitron tracking-[1em] text-white/20 uppercase mt-4">
             PROTOCOL STANDBY
           </span>
        </div>
      )}

      <style>{`
        @keyframes liquid-neon-flow {
          0% { stroke-dashoffset: 5000; }
          100% { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
};

export default Hero;
