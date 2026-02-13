import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
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

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 8;
const ARROW_SIZE = 8;
const TOOLTIP_MAX_WIDTH = 340;
const TOOLTIP_MARGIN = 16;

function resolveTarget(selector: string): Element | null {
  // For party bookmarks, check which variant is visible
  if (selector === '[data-tour="party-bookmarks"]') {
    const desktop = document.querySelector('[data-tour="party-bookmarks"]') as HTMLElement | null;
    if (desktop && desktop.offsetParent !== null) return desktop;
    const mobile = document.querySelector('[data-tour="party-bookmarks-mobile"]');
    if (mobile) return mobile;
    return desktop;
  }
  return document.querySelector(selector);
}

function resolvePosition(
  preferred: TooltipPosition,
  targetRect: TargetRect,
  tooltipW: number,
  tooltipH: number,
): Exclude<TooltipPosition, 'auto'> {
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  if (preferred !== 'auto') return preferred;

  // Prefer bottom, then top, then right, then left
  const spaceBelow = vh - (targetRect.top + targetRect.height + PADDING);
  const spaceAbove = targetRect.top - PADDING;
  const spaceRight = vw - (targetRect.left + targetRect.width + PADDING);
  const spaceLeft = targetRect.left - PADDING;

  if (spaceBelow >= tooltipH + ARROW_SIZE + TOOLTIP_MARGIN) return 'bottom';
  if (spaceAbove >= tooltipH + ARROW_SIZE + TOOLTIP_MARGIN) return 'top';
  if (spaceRight >= tooltipW + ARROW_SIZE + TOOLTIP_MARGIN) return 'right';
  if (spaceLeft >= tooltipW + ARROW_SIZE + TOOLTIP_MARGIN) return 'left';
  return 'bottom';
}

export function GuidedTour({ isActive, currentStep, totalStimmen, onNext, onPrev, onClose }: GuidedTourProps) {
  const { t } = useTranslation('walkthrough');
  const tVars = { count: totalStimmen };
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);

  const step = tourSteps[currentStep];

  const positionTooltip = useCallback(() => {
    if (!step || !isActive) return;

    const el = resolveTarget(step.target);
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const tr: TargetRect = {
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
    };
    setTargetRect(tr);

    const tooltipEl = tooltipRef.current;
    if (!tooltipEl) return;

    const tooltipW = tooltipEl.offsetWidth;
    const tooltipH = tooltipEl.offsetHeight;
    const vw = window.innerWidth;

    const pos = resolvePosition(step.position, tr, tooltipW, tooltipH);
    let top = 0;
    let left = 0;
    const arrowPos: React.CSSProperties = {};

    switch (pos) {
      case 'bottom':
        top = tr.top + tr.height + PADDING + ARROW_SIZE;
        left = tr.left + tr.width / 2 - tooltipW / 2;
        arrowPos.top = -ARROW_SIZE;
        arrowPos.left = '50%';
        arrowPos.transform = 'translateX(-50%)';
        arrowPos.borderLeft = `${ARROW_SIZE}px solid transparent`;
        arrowPos.borderRight = `${ARROW_SIZE}px solid transparent`;
        arrowPos.borderBottom = `${ARROW_SIZE}px solid white`;
        break;
      case 'top':
        top = tr.top - PADDING - ARROW_SIZE - tooltipH;
        left = tr.left + tr.width / 2 - tooltipW / 2;
        arrowPos.bottom = -ARROW_SIZE;
        arrowPos.left = '50%';
        arrowPos.transform = 'translateX(-50%)';
        arrowPos.borderLeft = `${ARROW_SIZE}px solid transparent`;
        arrowPos.borderRight = `${ARROW_SIZE}px solid transparent`;
        arrowPos.borderTop = `${ARROW_SIZE}px solid white`;
        break;
      case 'right':
        top = tr.top + tr.height / 2 - tooltipH / 2;
        left = tr.left + tr.width + PADDING + ARROW_SIZE;
        arrowPos.left = -ARROW_SIZE;
        arrowPos.top = '50%';
        arrowPos.transform = 'translateY(-50%)';
        arrowPos.borderTop = `${ARROW_SIZE}px solid transparent`;
        arrowPos.borderBottom = `${ARROW_SIZE}px solid transparent`;
        arrowPos.borderRight = `${ARROW_SIZE}px solid white`;
        break;
      case 'left':
        top = tr.top + tr.height / 2 - tooltipH / 2;
        left = tr.left - PADDING - ARROW_SIZE - tooltipW;
        arrowPos.right = -ARROW_SIZE;
        arrowPos.top = '50%';
        arrowPos.transform = 'translateY(-50%)';
        arrowPos.borderTop = `${ARROW_SIZE}px solid transparent`;
        arrowPos.borderBottom = `${ARROW_SIZE}px solid transparent`;
        arrowPos.borderLeft = `${ARROW_SIZE}px solid white`;
        break;
    }

    // Clamp horizontal position to viewport
    left = Math.max(TOOLTIP_MARGIN, Math.min(left, vw - tooltipW - TOOLTIP_MARGIN));

    // Adjust arrow if tooltip was clamped horizontally (top/bottom positions)
    if (pos === 'bottom' || pos === 'top') {
      const targetCenterX = tr.left + tr.width / 2;
      const arrowLeft = targetCenterX - left;
      arrowPos.left = `${Math.max(20, Math.min(arrowLeft, tooltipW - 20))}px`;
      arrowPos.transform = 'translateX(-50%)';
    }

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      maxWidth: `min(${TOOLTIP_MAX_WIDTH}px, calc(100vw - ${TOOLTIP_MARGIN * 2}px))`,
    });
    setArrowStyle(arrowPos);
  }, [step, isActive]);

  // Scroll target into view and position tooltip
  useEffect(() => {
    if (!isActive || !step) return;

    const el = resolveTarget(step.target);
    if (!el) return;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Position after scroll settles
    const timer = setTimeout(() => {
      positionTooltip();
    }, 400);

    return () => clearTimeout(timer);
  }, [isActive, currentStep, step, positionTooltip]);

  // Reposition on scroll/resize
  useEffect(() => {
    if (!isActive) return;

    const handleUpdate = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(positionTooltip);
    };

    window.addEventListener('scroll', handleUpdate, true);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate, true);
      window.removeEventListener('resize', handleUpdate);
      cancelAnimationFrame(rafRef.current);
    };
  }, [isActive, positionTooltip]);

  // Keyboard navigation (capture phase to override BallotView's arrow keys)
  useEffect(() => {
    if (!isActive) return;

    const handler = (e: KeyboardEvent) => {
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
    };

    window.addEventListener('keydown', handler, true);
    return () => window.removeEventListener('keydown', handler, true);
  }, [isActive, onNext, onPrev, onClose]);

  if (!isActive || !step) return null;

  const spotlightRect = targetRect || { top: 0, left: 0, width: 0, height: 0 };

  return createPortal(
    <>
      {/* SVG overlay with spotlight cutout */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 100 }}
      >
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotlightRect.left - PADDING}
              y={spotlightRect.top - PADDING}
              width={spotlightRect.width + PADDING * 2}
              height={spotlightRect.height + PADDING * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto cursor-pointer"
          onClick={onClose}
        />
      </svg>

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed bg-white rounded-xl shadow-2xl border border-gray-200 p-4 pointer-events-auto"
        style={{ zIndex: 101, ...tooltipStyle }}
      >
        {/* Arrow */}
        <div className="absolute w-0 h-0" style={arrowStyle} />

        {/* Header: emoji + step counter */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xl">{step.emoji}</span>
          <span className="text-xs font-semibold text-frankfurt-blue/60 uppercase tracking-wider">
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
            className="text-xs px-3 py-1.5 rounded-lg bg-frankfurt-blue text-white hover:bg-frankfurt-blue/90 transition-colors"
          >
            {currentStep === tourSteps.length - 1
              ? t('tourFinish', { defaultValue: 'Fertig!' })
              : t('tourNext', { defaultValue: 'Weiter' })
            }
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
