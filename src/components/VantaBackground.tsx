
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
    
    // Load VANTA.NET after Three.js is loaded
    threeScript.onload = () => {
      const vantaScript = document.createElement('script');
      vantaScript.src = 'https://cdn.jsdelivr.net/npm/vanta@latest/dist/vanta.net.min.js';
      vantaScript.async = true;
      document.body.appendChild(vantaScript);
      
      // Initialize VANTA effect once the script is loaded
      vantaScript.onload = () => {
        if (!vantaEffect && vantaRef.current) {
          const effect = window.VANTA.NET({
            el: vantaRef.current,
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x9b87f5,           // Purple color matching figuro-accent
            backgroundColor: 0x09090f,  // Dark background to match our theme
            points: 8.00,
            maxDistance: 25.00,
            spacing: 18.00,
            showDots: false
          });
          setVantaEffect(effect);
        }
      };
    };
    
    // Cleanup function
    return () => {
      if (vantaEffect) vantaEffect.destroy();
      // Remove scripts when component unmounts
      document.querySelectorAll('script[src*="vanta"], script[src*="three"]')
        .forEach(script => script.remove());
    };
  }, [vantaEffect]);

  return (
    <div ref={vantaRef} className="absolute inset-0 z-0 min-h-screen">
      <div className="relative z-10 min-h-screen">
        {children}
      </div>
    </div>
  );
};

export default VantaBackground;
