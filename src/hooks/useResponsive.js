import { useState, useEffect, useCallback } from 'react';

/**
 * Hook for responsive behavior
 * Detects mobile, manages canvas sizing, auto-adapts resolution
 */
export function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 });
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      setWindowSize({ width: w, height: h });
      setIsMobile(w < 768);
    };

    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const togglePanel = useCallback(() => {
    setPanelOpen(prev => !prev);
  }, []);

  // Provide recommended font size based on screen
  const recommendedFontSize = isMobile ? 6 : 10;

  // Recommended resolution multiplier
  const resolutionMultiplier = isMobile ? 0.6 : 1.0;

  return {
    isMobile,
    windowSize,
    panelOpen,
    setPanelOpen,
    togglePanel,
    recommendedFontSize,
    resolutionMultiplier,
  };
}
