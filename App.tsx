
import React, { useState, useEffect } from 'react';
import BackgroundEffects from './components/BackgroundEffects';
import Hero from './components/Hero';
import Navbar from './components/Navbar';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Education from './components/Education';
import Contact from './components/Contact';
import Footer from './components/Footer';
import Resources from './components/Resources';

const App: React.FC = () => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [currentView, setCurrentView] = useState<'home' | 'resources'>('home');

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-mode');
      document.documentElement.style.setProperty('--bg-color-rgb', '1, 4, 9');
    } else {
      document.body.classList.add('light-mode');
      document.documentElement.style.setProperty('--bg-color-rgb', '248, 250, 252');
    }
  }, [isDark]);

  return (
    <main className="relative min-h-screen">
      {/* 1. Global Cinematic Visuals */}
      <BackgroundEffects />
      
      {/* 2. Hero Layer (Fixed in Background when revealed) */}
      <Hero isRevealed={isRevealed} onReveal={handleReveal} />

      {/* 3. Content Layer (Revealed and Scrollable) */}
      <div className={`relative z-10 reveal-site ${isRevealed ? 'visible-state' : 'hidden-state'}`}>
        <Navbar 
          isDark={isDark} 
          onToggleTheme={toggleTheme} 
          onViewChange={setCurrentView} 
          currentView={currentView}
        />
        
        {currentView === 'home' ? (
          <>
            {/* Transparent Spacer so we can see the Hero underneath initially */}
            <div className="h-screen pointer-events-none" />
            
            {/* Main Content Containers */}
            <div className="relative z-20">
              <About />
              <Skills />
              <Projects />
              <Education />
              <Contact />
              <Footer />
            </div>
          </>
        ) : (
          <Resources />
        )}
      </div>

      {/* 4. Click-to-Start Trigger (Overlay for unrevealed state) */}
      {!isRevealed && (
        <div 
          className="fixed inset-0 z-[100] cursor-pointer"
          onClick={handleReveal}
        />
      )}
    </main>
  );
};

export default App;
