export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right' | 'auto';

export interface TourStep {
  target: string;
  emoji: string;
  titleKey: string;
  bodyKey: string;
  position: TooltipPosition;
}

export const tourSteps: TourStep[] = [
  {
    target: '[data-tour="ballot"]',
    emoji: '📨',
    titleKey: 'step1Title',
    bodyKey: 'step1Text',
    position: 'bottom',
  },
  {
    target: '[data-tour="vote-counter"]',
    emoji: '🔢',
    titleKey: 'step2Title',
    bodyKey: 'step2Text',
    position: 'bottom',
  },
  {
    target: '[data-tour="kopfleiste"]',
    emoji: '☑️',
    titleKey: 'step3Title',
    bodyKey: 'step3Text',
    position: 'bottom',
  },
  {
    target: '[data-tour="vote-circles"]',
    emoji: '⬆️',
    titleKey: 'step4Title',
    bodyKey: 'step4Text',
    position: 'auto',
  },
  {
    target: '[data-tour="party-bookmarks"]',
    emoji: '↔️',
    titleKey: 'step5Title',
    bodyKey: 'step5Text',
    position: 'auto',
  },
  {
    target: '[data-tour="ballot"]',
    emoji: '🔀',
    titleKey: 'step6Title',
    bodyKey: 'step6Text',
    position: 'bottom',
  },
  {
    target: '[data-tour="vote-counter"]',
    emoji: '⚠️',
    titleKey: 'step7Title',
    bodyKey: 'step7Text',
    position: 'bottom',
  },
  {
    target: '[data-tour="ballot"]',
    emoji: '✏️',
    titleKey: 'step8Title',
    bodyKey: 'step8Text',
    position: 'bottom',
  },
];
