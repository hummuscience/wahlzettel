import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SummaryPanel } from './SummaryPanel';

interface VoteStatusBarProps {
  totalUsed: number;
  totalMax: number;
  isComplete: boolean;
  isOverLimit: boolean;
  stimmenPerParty: Record<number, number>;
  parties: { listNumber: number; shortName: string }[];
  onReset: () => void;
}

export function VoteStatusBar({
  totalUsed,
  totalMax,
  isComplete,
  isOverLimit,
  stimmenPerParty,
  parties,
  onReset,
}: VoteStatusBarProps) {
  const { t } = useTranslation('ballot');
  const [isExpanded, setIsExpanded] = useState(false);

  const percentage = Math.min((totalUsed / totalMax) * 100, 100);
  const isWarning = totalUsed >= 80 && totalUsed < totalMax;

  let barColor = 'bg-status-ok';
  let textColor = 'text-gray-700';
  let statusText = t('stimmenVergeben', { count: totalUsed, total: totalMax });

  if (isOverLimit) {
    barColor = 'bg-status-invalid';
    textColor = 'text-status-invalid font-bold';
    statusText = t('ungueltig', { total: totalMax });
  } else if (isComplete) {
    barColor = 'bg-status-complete animate-pulse';
    textColor = 'text-status-complete font-semibold';
    statusText = t('alleStimmenVergeben', { total: totalMax });
  } else if (isWarning) {
    barColor = 'bg-status-warning';
  }

  return (
    <div data-tour="vote-counter" className={`sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm ${isOverLimit ? 'animate-shake' : ''}`}>
      <div className="max-w-5xl mx-auto px-4 py-2">
        <div className="flex items-center gap-3">
          {/* Vote count */}
          <div className={`text-sm whitespace-nowrap ${textColor}`}>
            {isOverLimit ? statusText : (
              <>
                <span className="font-bold">{totalUsed}</span> / {totalMax} {t('stimmen')}
              </>
            )}
          </div>

          {/* Progress bar */}
          <div className="flex-1 h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${barColor}`}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {/* Summary toggle */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-sm text-frankfurt-blue hover:underline whitespace-nowrap flex items-center gap-1"
          >
            {t('zusammenfassung')}
            <span className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
              ▾
            </span>
          </button>
        </div>

        {isComplete && !isOverLimit && (
          <p className="text-xs text-status-complete mt-1">
            {t('alleStimmenVergeben', { total: totalMax })}
          </p>
        )}
      </div>

      {/* Summary Panel */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
        <SummaryPanel
          stimmenPerParty={stimmenPerParty}
          parties={parties}
          totalUsed={totalUsed}
          totalMax={totalMax}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
