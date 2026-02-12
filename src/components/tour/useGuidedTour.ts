import { useState, useCallback, useEffect } from 'react';
import { tourSteps } from './tourSteps';

const STORAGE_KEY = 'wahlguide-tour-completed';

export interface GuidedTourState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  next: () => void;
  prev: () => void;
  close: () => void;
  restart: () => void;
}

export function useGuidedTour(): GuidedTourState {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Auto-start on first visit after DOM is ready
  useEffect(() => {
    const completed = localStorage.getItem(STORAGE_KEY);
    if (!completed) {
      const timer = setTimeout(() => setIsActive(true), 800);
      return () => clearTimeout(timer);
    }
  }, []);

  const close = useCallback(() => {
    setIsActive(false);
    setCurrentStep(0);
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
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: tourSteps.length,
    next,
    prev,
    close,
    restart,
  };
}
