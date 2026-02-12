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
}: CandidateRowProps) {
  const handleVoteChange = useCallback(
    (newStimmen: number) => {
      onVoteChange(candidateId, newStimmen);
    },
    [candidateId, onVoteChange],
  );

  const handleNameClick = useCallback(() => {
    if (isListVoteActive) {
      onStrike(candidateId);
    }
  }, [candidateId, isListVoteActive, onStrike]);

  const isListVoteDisplay = isListVoteActive && !hasIndividualVotes && !isStruck;

  return (
    <div
      className={`
        flex items-center gap-2 px-3 py-1.5 border-b border-gray-100
        transition-colors duration-100
        ${effectiveStimmen > 0 && !isStruck ? 'bg-frankfurt-blue-light/50' : ''}
        ${isStruck ? 'bg-gray-50' : ''}
      `}
    >
      <span className="w-7 text-right text-xs text-gray-400 font-ballot shrink-0">
        {position}
      </span>

      <div
        className={`flex-1 min-w-0 ${isListVoteActive ? 'cursor-pointer' : ''}`}
        onClick={handleNameClick}
        title={isListVoteActive ? (isStruck ? 'Klicken zum Wiederherstellen' : 'Klicken zum Streichen') : undefined}
      >
        <div className={`font-ballot text-sm leading-tight truncate ${isStruck ? 'line-through text-gray-400' : ''}`}>
          {lastName}, {firstName}
        </div>
        <div className={`text-xs leading-tight truncate ${isStruck ? 'line-through text-gray-300' : 'text-gray-500'}`}>
          {profession}
        </div>
      </div>

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
