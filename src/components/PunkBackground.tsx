import React from 'react';
import punkBgImage from '../assets/images/punk_background_1787240548458.jpg';

interface PunkBackgroundProps {
  theme?: 'dark' | 'light';
}

export const PunkBackground: React.FC<PunkBackgroundProps> = () => {
  return (
    <div 
      className="fixed inset-0 w-full h-full min-h-[100dvh] pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* Background Punk Rock Collage Image - Stable dimensions, edge-to-edge coverage */}
      <img
        src={punkBgImage}
        alt="Green Daze Punk Atmosphere"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-center opacity-[0.22] sm:opacity-[0.28] dark:opacity-[0.45] dark:sm:opacity-[0.58] filter contrast-125 brightness-100 dark:brightness-105 grayscale-[10%] dark:grayscale-0 mix-blend-multiply dark:mix-blend-lighten"
      />

      {/* Gentle vignette overlay to preserve full edge-to-edge art without dark side bars */}
      <div 
        className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(241,245,249,0.65)_100%)] dark:bg-[radial-gradient(circle_at_center,_transparent_20%,_rgba(18,21,28,0.45)_100%)] pointer-events-none" 
      />

      {/* Subtle green ambient light glow in corners */}
      <div className="absolute -top-24 -left-24 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-green/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

