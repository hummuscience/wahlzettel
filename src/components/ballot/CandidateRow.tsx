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
  /** Citywide Stimmen this candidate received in the actual election. Null when no results data exists for this candidate. */
  actualStimmen?: number | null;
  /** Highest Stimmen any candidate of this party got — denominator for the meter. */
  partyMaxStimmen?: number | null;
  /** Resolved party color hex for tinting the meter bar. */
  partyColor?: string | null;
  /** True when this candidate ranks in the party's top-N (won a seat). */
  isElected?: boolean;
  /** Read-only post-election mode: hides strike button + VoteCircles and
   * shows the Stimmen meter in a dedicated zone instead of full-row shade. */
  readOnly?: boolean;
}

/** Format an integer with German thousands separators: 75628 → "75.628". */
function formatStimmen(n: number): string {
  return n.toLocaleString('de-DE');
}

const METER_ZONE_PX = 96;

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
  readOnly = false,
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

  // Meter fills relative to the party's top vote-getter (max-scaling). 0–100%.
  const meterPercent =
    actualStimmen !== null && actualStimmen !== undefined &&
    partyMaxStimmen && partyMaxStimmen > 0
      ? Math.max(0, Math.min(100, (actualStimmen / partyMaxStimmen) * 100))
      : null;

  // Subtler alpha for elected — see followup discussion. 0.30 reads as
  // "this row matters" without crushing dark text on dark party colours.
  const meterOpacity = isElected ? 0.3 : 0.15;

  return (
    <div
      className={`
        relative flex items-center gap-2 px-3 py-1.5 border-b border-gray-100
        transition-colors duration-100
        ${!readOnly && effectiveStimmen > 0 && !isStruck ? 'bg-election-primary-light/50' : ''}
        ${isStruck ? 'bg-gray-50' : ''}
      `}
    >
      {/* Pre-election: full-row background shade behind the candidate name.
          Hidden in read-only mode — the meter zone replaces it. */}
      {!readOnly && meterPercent !== null && !isStruck && (
        <div
          aria-hidden="true"
          className="absolute inset-y-0 left-0 pointer-events-none transition-[width,opacity] duration-300"
          style={{
            width: `${meterPercent}%`,
            backgroundColor: partyColor ?? '#9ca3af',
            opacity: meterOpacity,
          }}
        />
      )}

      <span className="relative w-9 text-right text-xs text-gray-400 font-ballot shrink-0 tabular-nums">
        {position}
      </span>

      {!readOnly && (
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
      )}

      <div className="relative flex-1 min-w-0">
        <div className={`font-ballot text-sm leading-tight truncate ${isStruck ? 'line-through text-gray-400' : ''}`}>
          {lastName}, {firstName}
        </div>
        <div className={`text-xs leading-tight truncate ${isStruck ? 'line-through text-gray-300' : 'text-gray-500'}`}>
          {profession}
        </div>
      </div>

      {/* Read-only mode: dedicated Stimmen-meter zone next to the number.
          Decouples the bar from the candidate name's contrast. */}
      {readOnly && meterPercent !== null && (
        <div
          className="relative shrink-0 h-3 rounded-sm bg-gray-100 overflow-hidden"
          style={{ width: METER_ZONE_PX }}
          aria-hidden="true"
        >
          <div
            className="h-full transition-[width,opacity] duration-300"
            style={{
              width: `${meterPercent}%`,
              backgroundColor: partyColor ?? '#9ca3af',
              opacity: meterOpacity,
            }}
          />
        </div>
      )}

      {actualStimmen !== null && actualStimmen !== undefined && (
        <span
          className="relative shrink-0 text-xs tabular-nums text-gray-500 px-1 font-ballot w-16 text-right"
          title={`${formatStimmen(actualStimmen)} Stimmen`}
        >
          {formatStimmen(actualStimmen)}
        </span>
      )}

      {!readOnly && (
        <VoteCircles
          stimmen={effectiveStimmen}
          maxReached={maxReached}
          isListVoteDisplay={isListVoteDisplay}
          dataTour={position === 1 ? 'vote-circles' : undefined}
          onChange={handleVoteChange}
        />
      )}
    </div>
  );
});
