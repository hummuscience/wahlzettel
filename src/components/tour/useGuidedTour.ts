import { useState, useCallback, useEffect } from 'react';
import { tourSteps } from './tourSteps';

const STORAGE_KEY = 'wahlguide-tour-completed';
const MOBILE_BREAKPOINT = 1024; // matches lg: breakpoint

export interface GuidedTourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  shouldPulse: boolean;
  next: () => void;
  prev: () => void;
  close: () => void;
  restart: () => void;
}

export function useGuidedTour(): GuidedTourState {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [shouldPulse, setShouldPulse] = useState(false);

  // Highlight ? button on first visit; auto-start tour on desktop
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      setShouldPulse(true);
      const isMobile = window.innerWidth < MOBILE_BREAKPOINT;
      if (!isMobile) {
        const timer = setTimeout(() => setIsActive(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const close = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
    setShouldPulse(false);
    localStorage.setItem(STORAGE_KEY, 'true');
  }, []);

  const next = useCallback(() => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      close();
    }
  }, [currentStep, close]);

  const prev = useCallback(() => {
    setCurrentStep(s => Math.max(0, s - 1));
  }, []);

  const restart = useCallback(() => {
    setCurrentStep(0);
    setIsActive(true);
    setShouldPulse(false);
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: tourSteps.length,
    shouldPulse,
    next,
    prev,
    close,
    restart,
  };
}
