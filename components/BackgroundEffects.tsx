
import React, { useEffect, useState } from 'react';

const BackgroundEffects: React.FC = () => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden bg-[#010409]">
      {/* Dynamic Mouse Glow Trail - Royal Blue */}
      <div 
        className="absolute w-[800px] h-[800px] rounded-full blur-[150px] bg-blue-800/10 transition-transform duration-1000 ease-out"
        style={{
          transform: `translate(${mousePos.x - 400}px, ${mousePos.y - 400}px)`
        }}
      />
      
      {/* Constant Ambient Cinematic Glows - Red & Royal Blue */}
      <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-red-900/10 blur-[180px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-900/10 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />

      {/* Grid Pattern Overlay - Royal Blue Tint */}
      <div className="absolute inset-0 opacity-[0.04] bg-[linear-gradient(to_right,#1e40af_1px,transparent_1px),linear-gradient(to_bottom,#1e40af_1px,transparent_1px)] bg-[size:60px_60px]" />

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {[...Array(30)].map((_, i) => (
          <div 
            key={i}
            className="absolute bg-white/10 rounded-full animate-pulse"
            style={{
              width: Math.random() * 2 + 1 + 'px',
              height: Math.random() * 2 + 1 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animationDelay: Math.random() * 8 + 's',
              animationDuration: Math.random() * 4 + 2 + 's'
            }}
          />
        ))}
      </div>

      {/* Global Cinematic Elements */}
      <div className="lightning-overlay" />
      <div className="scanlines" />
      <div className="vignette" />
    </div>
  );
};

export default BackgroundEffects;
