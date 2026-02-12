import { useTranslation } from 'react-i18next';

const infoItems = [
  { titleKey: 'electionDate', valueKey: 'electionDateValue', icon: '📅' },
  { titleKey: 'whoCanVote', valueKey: 'whoCanVoteValue', icon: '👤' },
  { titleKey: 'whatToBring', valueKey: 'whatToBringValue', icon: '🪪' },
  { titleKey: 'postalVote', valueKey: 'postalVoteValue', icon: '✉️' },
  { titleKey: 'hotline', valueKey: 'hotlineValue', icon: '📞' },
];

export function PracticalInfoDrawerContent() {
  const { t } = useTranslation('info');

  return (
    <div>
      <h2 className="text-lg font-bold mb-3">{t('title')}</h2>
      <div className="flex flex-col gap-2">
        {infoItems.map(item => (
          <div
            key={item.titleKey}
            className="bg-white rounded-lg border border-gray-200 shadow-sm p-3"
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{item.icon}</span>
              <h3 className="font-semibold text-xs">{t(item.titleKey)}</h3>
            </div>
            <p className="text-[11px] text-gray-600 leading-relaxed">{t(item.valueKey)}</p>
          </div>
        ))}

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-base">🔗</span>
            <h3 className="font-semibold text-xs">{t('moreInfo')}</h3>
          </div>
          <a
            href="https://frankfurt.de/wahlen"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] text-frankfurt-blue hover:underline"
          >
            {t('moreInfoLink')}
          </a>
        </div>
      </div>
    </div>
  );
}
