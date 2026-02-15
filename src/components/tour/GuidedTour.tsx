import { useEffect, useCallback, useRef, useState } from 'react';
import {
  useFloating,
  offset,
  flip,
  shift,
  limitShift,
  arrow,
  autoUpdate,
  FloatingPortal,
  FloatingArrow,
} from '@floating-ui/react';
import { useTranslation } from 'react-i18next';
import { tourSteps } from './tourSteps';
import type { TooltipPosition } from './tourSteps';

interface GuidedTourProps {
  isActive: boolean;
  currentStep: number;
  totalStimmen: number;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

const PADDING = 8;

/** Map tourSteps position names to Floating UI placement strings. */
function toPlacement(pos: TooltipPosition) {
  if (pos === 'auto') return 'bottom' as const;
  return pos;
}

function resolveTarget(selector: string): Element | null {
  if (selector === '[data-tour="party-bookmarks"]') {
    const desktop = document.querySelector('[data-tour="party-bookmarks"]') as HTMLElement | null;
    if (desktop && desktop.offsetParent !== null) return desktop;
    const mobile = document.querySelector('[data-tour="party-bookmarks-mobile"]');
    if (mobile) return mobile;
    return desktop;
  }
  return document.querySelector(selector);
}

export function GuidedTour({ isActive, currentStep, totalStimmen, onNext, onPrev, onClose }: GuidedTourProps) {
  const { t } = useTranslation('walkthrough');
  const tVars = { count: totalStimmen };
  const step = tourSteps[currentStep];
  const arrowRef = useRef<SVGSVGElement>(null);

  // Track target rect for the overlay spotlight
  const [spotRect, setSpotRect] = useState<DOMRect | null>(null);

  const { refs, floatingStyles, context } = useFloating({
    placement: step ? toPlacement(step.position) : 'bottom',
    middleware: [
      offset(PADDING + 8), // padding around target + arrow height
      flip({ fallbackAxisSideDirection: 'start', padding: 16 }),
      shift({ padding: 16, crossAxis: true, limiter: limitShift() }),
      arrow({ element: arrowRef, padding: 12 }),
    ],
    whileElementsMounted: autoUpdate,
  });

  // Anchor to the data-tour target via a virtual element.
  // For elements taller than half the viewport, use a small rect at the
  // top of the visible portion so the tooltip stays on-screen.
  useEffect(() => {
    if (!step) return;
    refs.setPositionReference({
      getBoundingClientRect() {
        const el = resolveTarget(step.target);
        if (!el) return new DOMRect();
        const rect = el.getBoundingClientRect();
        const vh = window.innerHeight;
        // If the element fits comfortably, use it as-is
        if (rect.height <= vh * 0.5) return rect;
        // For oversized targets, anchor to a small rect at the top of
        // the visible portion so there's room for the tooltip below
        const visTop = Math.max(rect.top, 0);
        return new DOMRect(rect.left, visTop, rect.width, Math.min(80, vh * 0.15));
      },
    });
  }, [step, refs]);

  // Scroll target into view when step changes
  useEffect(() => {
    if (!isActive || !step) return;

    const el = resolveTarget(step.target);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Update spotlight rect after scroll settles
    const timer = setTimeout(() => {
      const r = el.getBoundingClientRect();
      setSpotRect(r);
    }, 400);
    return () => clearTimeout(timer);
  }, [isActive, currentStep, step]);

  // Keep spotlight rect in sync on scroll/resize
  useEffect(() => {
    if (!isActive || !step) return;

    const update = () => {
      const el = resolveTarget(step.target);
      if (el) setSpotRect(el.getBoundingClientRect());
    };

    window.addEventListener('scroll', update, true);
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', update, true);
      window.removeEventListener('resize', update);
    };
  }, [isActive, step]);

  // Keyboard navigation (capture phase to override BallotView's arrow keys)
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowRight':
      case 'Enter':
        e.preventDefault();
        e.stopPropagation();
        onNext();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.stopPropagation();
        onPrev();
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        onClose();
        break;
    }
  }, [onNext, onPrev, onClose]);

  useEffect(() => {
    if (!isActive) return;
    window.addEventListener('keydown', handleKeydown, true);
    return () => window.removeEventListener('keydown', handleKeydown, true);
  }, [isActive, handleKeydown]);

  if (!isActive || !step) return null;

  // Build clip-path polygon that covers the full screen with a rectangular cutout
  const clipPath = spotRect
    ? buildClipPath(spotRect)
    : 'none';

  return (
    <FloatingPortal>
      {/* Backdrop overlay with spotlight cutout */}
      <div
        className="fixed inset-0 bg-black/50 cursor-pointer"
        style={{ zIndex: 9998, clipPath }}
        onClick={onClose}
      />

      {/* Tooltip */}
      <div
        ref={refs.setFloating}
        className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-[min(340px,calc(100vw-32px))] animate-in fade-in-0 zoom-in-95"
        style={{ ...floatingStyles, zIndex: 9999 }}
      >
        <FloatingArrow
          ref={arrowRef}
          context={context}
          className="fill-white [&>path:first-of-type]:stroke-gray-200"
          width={16}
          height={8}
        />

        {/* Header: emoji + step counter */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{step.emoji}</span>
          <span className="text-xs font-semibold text-election-primary/60 uppercase tracking-wider">
            {currentStep + 1} / {tourSteps.length}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-gray-900 mb-1.5">
          {t(step.titleKey, tVars)}
        </h3>

        {/* Body */}
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          {t(step.bodyKey, tVars)}
        </p>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={onPrev}
            disabled={currentStep === 0}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('tourBack', { defaultValue: 'Zurück' })}
          </button>

          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            {t('tourSkip', { defaultValue: 'Überspringen' })}
          </button>

          <button
            onClick={onNext}
            className="text-xs px-3 py-1.5 rounded-lg bg-election-primary text-white hover:bg-election-primary/90 transition-colors"
          >
            {currentStep === tourSteps.length - 1
              ? t('tourFinish', { defaultValue: 'Fertig!' })
              : t('tourNext', { defaultValue: 'Weiter' })
            }
          </button>
        </div>
      </div>
    </FloatingPortal>
  );
}

/**
 * Build a CSS clip-path polygon that covers the entire viewport
 * with a rectangular cutout around the target element.
 *
 * The polygon traces the outer edge of the viewport, then traces
 * the cutout rectangle in reverse (counter-clockwise) to create a hole.
 */
function buildClipPath(rect: DOMRect): string {
  const pad = PADDING;
  const top = Math.max(0, rect.top - pad);
  const left = Math.max(0, rect.left - pad);
  const bottom = rect.bottom + pad;
  const right = rect.right + pad;

  // Outer rectangle (viewport) clockwise, then cutout counter-clockwise
  // evenodd fill rule: outer clockwise + inner counter-clockwise = hole
  return `polygon(evenodd,
    0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%,
    ${left}px ${top}px,
    ${left}px ${bottom}px,
    ${right}px ${bottom}px,
    ${right}px ${top}px,
    ${left}px ${top}px
  )`;
}
