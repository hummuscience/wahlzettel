import { useTranslation } from 'react-i18next';

interface SummaryPanelProps {
  stimmenPerParty: Record<number, number>;
  parties: { listNumber: number; shortName: string }[];
  totalUsed: number;
  totalMax: number;
  onReset: () => void;
}

export function SummaryPanel({
  stimmenPerParty,
  parties,
  totalUsed,
  totalMax,
  onReset,
}: SummaryPanelProps) {
  const { t } = useTranslation('ballot');

  // Build sorted list of parties with votes
  const partyVotes = parties
    .filter(p => (stimmenPerParty[p.listNumber] || 0) > 0)
    .map(p => ({
      shortName: p.shortName,
      listNumber: p.listNumber,
      count: stimmenPerParty[p.listNumber] || 0,
    }))
    .sort((a, b) => b.count - a.count);

  const maxCount = partyVotes.length > 0 ? Math.max(...partyVotes.map(p => p.count)) : 0;
  const remaining = totalMax - totalUsed;

  const handleReset = () => {
    if (window.confirm(t('resetConfirm'))) {
      onReset();
    }
  };

  return (
    <div className="border-t border-gray-200 bg-gray-50 px-4 py-3 max-w-5xl mx-auto">
      {partyVotes.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-2">
          Noch keine Stimmen vergeben
        </p>
      ) : (
        <div className="space-y-1.5">
          {partyVotes.map(pv => (
            <div key={pv.listNumber} className="flex items-center gap-2 text-sm">
              <span className="w-24 text-right font-medium truncate">{pv.shortName}</span>
              <div className="flex-1 h-4 bg-gray-200 rounded overflow-hidden">
                <div
                  className="h-full bg-frankfurt-blue rounded transition-all duration-300"
                  style={{ width: `${(pv.count / maxCount) * 100}%` }}
                />
              </div>
              <span className="w-8 text-right text-gray-600">{pv.count}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200">
        <span className="text-sm text-gray-500">
          {remaining > 0
            ? t('nichtVergeben', { count: remaining })
            : null
          }
        </span>
        <button
          onClick={handleReset}
          className="text-sm text-status-invalid hover:underline"
        >
          {t('stimmzettelZuruecksetzen')}
        </button>
      </div>
    </div>
  );
}
