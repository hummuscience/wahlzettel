import { useCallback, memo } from 'react';
import { VoteCircles } from './VoteCircles';

interface CandidateRowProps {
  candidateId: string;
  position: number;
  lastName: string;
  firstName: string;
  profession: string;
  effectiveStimmen: number;
  isStruck: boolean;
  isListVoteActive: boolean;
  maxReached: boolean;
  hasIndividualVotes: boolean;
  onVoteChange: (candidateId: string, stimmen: number) => void;
  onStrike: (candidateId: string) => void;
  /** Citywide Stimmen this candidate received in the actual election. Null if not elected or no results data. */
  actualStimmen?: number | null;
  /** Highest Stimmen any elected candidate of this party got — denominator for the shade-bar. */
  partyMaxStimmen?: number | null;
  /** Resolved party color hex for tinting the shade-bar background. */
  partyColor?: string | null;
  /** True when this candidate ranks in the party's top-N (won a seat). */
  isElected?: boolean;
}

/** Format an integer with German thousands separators: 75628 → "75.628". */
function formatStimmen(n: number): string {
  return n.toLocaleString('de-DE');
}

export const CandidateRow = memo(function CandidateRow({
  candidateId,
  position,
  lastName,
  firstName,
  profession,
  effectiveStimmen,
  isStruck,
  isListVoteActive,
  maxReached,
  hasIndividualVotes,
  onVoteChange,
  onStrike,
  actualStimmen,
  partyMaxStimmen,
  partyColor,
  isElected,
}: CandidateRowProps) {
  const handleVoteChange = useCallback(
    (newStimmen: number) => {
      onVoteChange(candidateId, newStimmen);
    },
    [candidateId, onVoteChange],
  );

  const handleStrike = useCallback(() => {
    onStrike(candidateId);
  }, [candidateId, onStrike]);

  const isListVoteDisplay = isListVoteActive && !hasIndividualVotes && !isStruck;

  // Shade bar is shown only when results are available and this candidate
  // was elected. Width is the candidate's Stimmen as a fraction of the
  // top-vote-getter from the same party.
  const shadePercent =
    actualStimmen !== null && actualStimmen !== undefined &&
    partyMaxStimmen && partyMaxStimmen > 0
      ? Math.max(0, Math.min(100, (actualStimmen / partyMaxStimmen) * 100))
      : null;

  return (
    <div
      className={`
        relative flex items-center gap-2 px-3 py-1.5 border-b border-gray-100
        transition-colors duration-100
        ${effectiveStimmen > 0 && !isStruck ? 'bg-election-primary-light/50' : ''}
        ${isStruck ? 'bg-gray-50' : ''}
      `}
    >
      {shadePercent !== null && !isStruck && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pointer-events-none transition-[width,opacity] duration-300"
          style={{
            width: `${shadePercent}%`,
            backgroundColor: partyColor ?? '#9ca3af',
            opacity: isElected ? 0.5 : 0.18,
          }}
        />
      )}
      <span className="relative w-9 text-right text-xs text-gray-400 font-ballot shrink-0 tabular-nums">
        {position}
      </span>

      <button
        type="button"
        onClick={handleStrike}
        title={isStruck ? 'Wiederherstellen' : 'Streichen'}
        aria-label={isStruck ? `${lastName} wiederherstellen` : `${lastName} streichen`}
        className={`
          relative w-5 h-5 shrink-0 flex items-center justify-center rounded
          text-xs font-bold transition-all duration-150
          ${isStruck
            ? 'bg-red-100 text-red-500 hover:bg-red-200'
            : 'text-gray-300 hover:text-red-500 hover:bg-red-50'
          }
        `}
        {...(position === 1 ? { 'data-tour': 'strike-button' } : {})}
      >
        ✕
      </button>

      <div className="relative flex-1 min-w-0">
        <div className={`font-ballot text-sm leading-tight truncate ${isStruck ? 'line-through text-gray-400' : ''}`}>
          {lastName}, {firstName}
        </div>
        <div className={`text-xs leading-tight truncate ${isStruck ? 'line-through text-gray-300' : 'text-gray-500'}`}>
          {profession}
        </div>
      </div>

      {actualStimmen !== null && actualStimmen !== undefined && (
        <span
          className="relative shrink-0 text-xs tabular-nums text-gray-500 px-1 font-ballot"
          title={`${formatStimmen(actualStimmen)} Stimmen citywide`}
        >
          {formatStimmen(actualStimmen)}
        </span>
      )}

      <VoteCircles
        stimmen={effectiveStimmen}
        maxReached={maxReached}
        isListVoteDisplay={isListVoteDisplay}
        dataTour={position === 1 ? 'vote-circles' : undefined}
        onChange={handleVoteChange}
      />
    </div>
  );
});
