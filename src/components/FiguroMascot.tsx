
import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

const FiguroMascot = ({ className = "", size = 150 }: { className?: string, size?: number }) => {
  return (
    <div className={`${className}`} style={{ width: size, height: size }}>
      <DotLottieReact
        src="https://lottie.host/f21a498b-743d-4cb6-9996-312267a43787/MpH3sNFzjp.lottie"
        loop
        autoplay
      />
    </div>
  );
};

export default FiguroMascot;
