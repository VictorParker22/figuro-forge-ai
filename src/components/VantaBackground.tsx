
import React, { useEffect, useRef, useState } from 'react';

// Import types for the VANTA object which we'll add to the window
declare global {
  interface Window {
    VANTA: any;
    THREE: any;
    p5: any;
  }
}

interface VantaBackgroundProps {
  children: React.ReactNode;
}

const VantaBackground: React.FC<VantaBackgroundProps> = ({ children }) => {
  const vantaRef = useRef<HTMLDivElement>(null);
  const [vantaEffect, setVantaEffect] = useState<any>(null);

  useEffect(() => {
    // Load Three.js
    const threeScript = document.createElement('script');
    threeScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js';
    threeScript.async = true;
    document.body.appendChild(threeScript);
    
    // Load p5.js (required for TRUNK effect)
    threeScript.onload = () => {
      const p5Script = document.createElement('script');
      p5Script.src = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.4.0/p5.min.js';
      p5Script.async = true;
      document.body.appendChild(p5Script);
      
      // Load VANTA.TRUNK after dependencies are loaded
      p5Script.onload = () => {
        const vantaScript = document.createElement('script');
        vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.trunk.min.js';
        vantaScript.async = true;
        document.body.appendChild(vantaScript);
        
        // Initialize VANTA effect once the script is loaded
        vantaScript.onload = () => {
          if (!vantaEffect && vantaRef.current) {
            const effect = window.VANTA.TRUNK({
              el: vantaRef.current,
              mouseControls: true,
              touchControls: true,
              gyroControls: false,
              minHeight: 200.00,
              minWidth: 200.00,
              scale: 1.00,
              scaleMobile: 1.00,
              color: 0x7522c0,           // Purple color matching figuro-accent
              backgroundColor: 0x09090f, // Dark background to match our theme
            });
            setVantaEffect(effect);
          }
        };
      };
    };
    
    // Cleanup function
    return () => {
      if (vantaEffect) vantaEffect.destroy();
      // Remove scripts when component unmounts
      const scripts = document.querySelectorAll('script[src*="vanta"], script[src*="three"], script[src*="p5"]');
      scripts.forEach(script => script.remove());
    };
  }, [vantaEffect]);

  return (
    <div ref={vantaRef} className="absolute inset-0 z-0">
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default VantaBackground;
