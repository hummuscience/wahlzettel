import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SummaryPanel } from './SummaryPanel';
import { getPartyColor } from '../../data/partyColors';
import type { VoteState } from '../../types';

interface VoteStatusBarProps {
  totalUsed: number;
  totalMax: number;
  isComplete: boolean;
  isOverLimit: boolean;
  stimmenPerParty: Record<number, number>;
  parties: { listNumber: number; shortName: string }[];
  onReset: () => void;
  voteState: VoteState;
}

export function VoteStatusBar({
  totalUsed,
  totalMax,
  isComplete,
  isOverLimit,
  stimmenPerParty,
  parties,
  onReset,
  voteState,
}: VoteStatusBarProps) {
  const { t } = useTranslation('ballot');
  const [isExpanded, setIsExpanded] = useState(false);

  let textColor = 'text-gray-700';
  let statusText = t('stimmenVergeben', { count: totalUsed, total: totalMax });

  if (isOverLimit) {
    textColor = 'text-status-invalid font-bold';
    statusText = t('ungueltig', { total: totalMax });
  } else if (isComplete) {
    textColor = 'text-status-complete font-semibold';
    statusText = t('alleStimmenVergeben', { total: totalMax });
  }

  // Build stacked bar segments from parties with votes
  const segments = parties
    .filter(p => (stimmenPerParty[p.listNumber] || 0) > 0)
    .map(p => ({
      shortName: p.shortName,
      count: stimmenPerParty[p.listNumber] || 0,
      color: getPartyColor(p.shortName),
    }))
    .sort((a, b) => b.count - a.count);

  const remainingPct = Math.max(0, ((totalMax - totalUsed) / totalMax) * 100);

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

        {/* Stacked progress bar */}
        <div className="h-2.5 bg-gray-200 rounded-full overflow-hidden flex mt-1">
          {isOverLimit ? (
            <div className="h-full w-full bg-status-invalid" />
          ) : (
            <>
              {segments.map(seg => (
                <div
                  key={seg.shortName}
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(seg.count / totalMax) * 100}%`,
                    backgroundColor: seg.color,
                  }}
                />
              ))}
              {remainingPct > 0 && (
                <div
                  className="h-full bg-gray-200 transition-all duration-300"
                  style={{ width: `${remainingPct}%` }}
                />
              )}
            </>
          )}
        </div>

        {isComplete && !isOverLimit && (
          <p className="text-xs text-status-complete mt-1">
            {t('alleStimmenVergeben', { total: totalMax })}
          </p>
        )}
      </div>

      {/* Collapsible Summary Panel */}
      <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
        <SummaryPanel
          stimmenPerParty={stimmenPerParty}
          parties={parties}
          totalUsed={totalUsed}
          totalMax={totalMax}
          onReset={onReset}
          voteState={voteState}
        />
      </div>
    </div>
  );
}
