import React, { useEffect, useRef, useState } from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const FiguroMascot = ({ className = "", size = 150 }: { className?: string, size?: number }) => {
  const [isClient, setIsClient] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Only render Lottie on client-side to avoid SSR issues
  useEffect(() => {
    setIsClient(true);
    
    // Set up intersection observer to only load when visible
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      observer.disconnect();
    };
  }, []);

  // Error handling function
  const handleLottieError = (error: any) => {
    console.error("Lottie animation error:", error);
    setHasError(true);
  };

  return (
    <div 
      className={`${className}`} 
      style={{ width: size, height: size }}
      ref={containerRef}
    >
      {isClient && isVisible && !hasError && (
        <React.Suspense fallback={<div className="w-full h-full bg-figuro-accent/20 rounded-full animate-pulse"></div>}>
          <DotLottieReact
            src="https://lottie.host/f21a498b-743d-4cb6-9996-312267a43787/MpH3sNFzjp.lottie"
            loop
            autoplay
            onError={handleLottieError}
          />
        </React.Suspense>
      )}
      
      {hasError && (
        <div className="w-full h-full flex items-center justify-center bg-figuro-accent/20 rounded-full">
          <span className="text-white font-bold">FG</span>
        </div>
      )}
    </div>
  );
};

export default React.memo(FiguroMascot);