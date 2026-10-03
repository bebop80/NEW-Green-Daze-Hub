import React, { useState, useEffect } from 'react';
import punkBgImage from '../assets/images/punk_background_1787240548458.jpg';

interface PunkBackgroundProps {
  theme?: 'dark' | 'light';
}

export const PunkBackground: React.FC<PunkBackgroundProps> = () => {
  // Lock container height on mount to device screen height so mobile browser address bar collapse NEVER resizes or zooms the background
  const [lockedHeight, setLockedHeight] = useState<string>('100vh');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Use maximum of screen height and innerHeight to cover entire viewport stably
      const screenH = Math.max(window.screen?.height || 0, window.innerHeight || 0);
      if (screenH > 0) {
        setLockedHeight(`${screenH}px`);
      }
    }
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 w-full pointer-events-none z-0 overflow-hidden select-none"
      style={{ height: lockedHeight }}
      aria-hidden="true"
    >
      {/* Background Punk Rock Collage Image - Stable dimensions, no mobile scroll zoom */}
      <img
        src={punkBgImage}
        alt="Green Daze Punk Atmosphere"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center opacity-[0.32] sm:opacity-[0.40] dark:opacity-[0.45] dark:sm:opacity-[0.58] filter contrast-125 brightness-95 dark:brightness-105 grayscale-[10%] dark:grayscale-0 mix-blend-multiply dark:mix-blend-lighten"
      />

      {/* Gentle vignette overlay to preserve full edge-to-edge art without dark side bars */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(244,244,245,0.4)_100%)] dark:bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(18,21,28,0.45)_100%)] pointer-events-none" 
      />

      {/* Subtle green ambient light glow in corners */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

