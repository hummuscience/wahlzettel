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

export function WalkthroughSection() {
  const { t } = useTranslation('walkthrough');

  return (
    <section className="max-w-5xl mx-auto px-4 py-8" id="walkthrough">
      <h2 className="text-2xl font-bold text-center mb-6">{t('title')}</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((step, i) => (
          <div
            key={step.key}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{step.emoji}</span>
              <span className="text-xs font-semibold text-frankfurt-blue/60 uppercase tracking-wider">
                {i + 1} / {steps.length}
              </span>
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1.5">
              {t(`${step.key}Title`)}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed flex-1">
              {t(`${step.key}Text`)}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
