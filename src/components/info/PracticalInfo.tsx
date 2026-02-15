import { useTranslation } from 'react-i18next';

const infoItems = [
  { titleKey: 'electionDate', valueKey: 'electionDateValue', icon: '📅' },
  { titleKey: 'whoCanVote', valueKey: 'whoCanVoteValue', icon: '👤' },
  { titleKey: 'whatToBring', valueKey: 'whatToBringValue', icon: '🪪' },
  { titleKey: 'postalVote', valueKey: 'postalVoteValue', icon: '✉️' },
  { titleKey: 'hotline', valueKey: 'hotlineValue', icon: '📞' },
];

export function PracticalInfo() {
  const { t } = useTranslation('info');
  const { t: te } = useTranslation('election');

  // Election-overridable value getter: try election namespace first, fall back to info namespace
  const v = (key: string) => te(key, { defaultValue: t(key) });

  return (
    <section className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <h2 className="text-lg font-bold text-center mb-3">{t('title')}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-1 gap-2">
        {infoItems.map(item => (
          <div
            key={item.titleKey}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{item.icon}</span>
              <h3 className="font-semibold text-xs">{t(item.titleKey)}</h3>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">{v(item.valueKey)}</p>
          </div>
        ))}

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">🔗</span>
            <h3 className="font-semibold text-xs">{t('moreInfo')}</h3>
          </div>
          <a
            href={te('moreInfoUrl', { defaultValue: 'https://frankfurt.de/wahlen' })}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-election-primary hover:underline"
          >
            {v('moreInfoLink')}
          </a>
        </div>
      </div>
    </section>
  );
}
