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

  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <h2 className="text-xl font-bold mb-6">{t('title')}</h2>

      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {infoItems.map(item => (
          <div
            key={item.titleKey}
            className="bg-white rounded-lg border border-gray-200 p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-lg">{item.icon}</span>
              <h3 className="font-semibold text-sm">{t(item.titleKey)}</h3>
            </div>
            <p className="text-sm text-gray-600">{t(item.valueKey)}</p>
          </div>
        ))}

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🔗</span>
            <h3 className="font-semibold text-sm">{t('moreInfo')}</h3>
          </div>
          <a
            href="https://frankfurt.de/wahlen"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-frankfurt-blue hover:underline"
          >
            {t('moreInfoLink')}
          </a>
        </div>
      </div>
    </section>
  );
}
