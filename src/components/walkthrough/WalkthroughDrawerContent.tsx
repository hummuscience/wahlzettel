import { useTranslation } from 'react-i18next';

const steps = [
  { key: 'step1', emoji: '📨' },
  { key: 'step2', emoji: '🔢' },
  { key: 'step3', emoji: '☑️' },
  { key: 'step4', emoji: '⬆️' },
  { key: 'step5', emoji: '↔️' },
  { key: 'step6', emoji: '🔀' },
  { key: 'step7', emoji: '⚠️' },
  { key: 'step8', emoji: '✏️' },
];

export function WalkthroughDrawerContent() {
  const { t } = useTranslation('walkthrough');

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">{t('title')}</h2>
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <div
            key={step.key}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{step.emoji}</span>
              <span className="text-[10px] font-semibold text-frankfurt-blue/60 uppercase tracking-wider">
                {i + 1}/{steps.length}
              </span>
            </div>
            <h3 className="text-xs font-bold text-gray-900 mb-0.5">
              {t(`${step.key}Title`)}
            </h3>
            <p className="text-[11px] text-gray-600 leading-relaxed">
              {t(`${step.key}Text`)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
