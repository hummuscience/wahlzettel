import { useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { Party, VoteAction, CandidateVote } from '../../types';
import { CandidateRow } from './CandidateRow';
import { KopfleisteCheckbox } from './KopfleisteCheckbox';

interface PartyPageProps {
  party: Party;
  isListVoteActive: boolean;
  listAllocation: Record<string, number> | null;
  candidateVotes: Record<string, CandidateVote>;
  struckCandidateIds: string[];
  maxReached: boolean;
  dispatch: React.Dispatch<VoteAction>;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  prevName?: string;
  nextName?: string;
}

export function PartyPage({
  party,
  isListVoteActive,
  listAllocation,
  candidateVotes,
  struckCandidateIds,
  maxReached,
  dispatch,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
  prevName,
  nextName,
}: PartyPageProps) {
  const { t } = useTranslation('ballot');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
  }, [party.listNumber]);

  const struckSet = new Set(struckCandidateIds);

  const handleVoteChange = useCallback(
    (candidateId: string, stimmen: number) => {
      dispatch({
        type: 'SET_CANDIDATE_VOTES',
        candidateId,
        partyListNumber: party.listNumber,
        stimmen,
      });
    },
    [dispatch, party.listNumber],
  );

  const handleStrike = useCallback(
    (candidateId: string) => {
      dispatch({
        type: 'STRIKE_CANDIDATE',
        candidateId,
        partyListNumber: party.listNumber,
      });
    },
    [dispatch, party.listNumber],
  );

  const handleToggleList = useCallback(() => {
    dispatch({ type: 'TOGGLE_LIST_VOTE', partyListNumber: party.listNumber });
  }, [dispatch, party.listNumber]);

  let stimmenFromList = 0;
  if (listAllocation) {
    for (const v of Object.values(listAllocation)) {
      stimmenFromList += v;
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 bg-gray-50 border-b-2 border-gray-300">
        <div className="text-xs text-gray-500 font-ballot">
          {t('liste')} {party.listNumber}
        </div>
        <h2 className="font-bold text-lg leading-tight">
          {party.fullName}
        </h2>
        <div className="text-sm font-semibold text-frankfurt-blue">
          {party.shortName}
        </div>
      </div>

      <KopfleisteCheckbox
        isChecked={isListVoteActive}
        onToggle={handleToggleList}
        stimmenFromList={stimmenFromList}
      />

      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {party.candidates.map(candidate => {
          const individualVote = candidateVotes[candidate.id];
          const hasIndividualVotes = (individualVote?.stimmen || 0) > 0;
          const isStruck = struckSet.has(candidate.id);
          const listVotes = listAllocation?.[candidate.id] || 0;
          const effectiveStimmen = isStruck
            ? 0
            : hasIndividualVotes
              ? individualVote.stimmen
              : listVotes;

          return (
            <CandidateRow
              key={candidate.id}
              candidateId={candidate.id}
              position={candidate.position}
              lastName={candidate.lastName}
              firstName={candidate.firstName}
              profession={candidate.profession}
              effectiveStimmen={effectiveStimmen}
              isStruck={isStruck}
              isListVoteActive={isListVoteActive}
              maxReached={maxReached && effectiveStimmen === 0}
              hasIndividualVotes={hasIndividualVotes}
              onVoteChange={handleVoteChange}
              onStrike={handleStrike}
            />
          );
        })}
      </div>

      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-gray-50">
        <button
          onClick={onPrev}
          disabled={!hasPrev}
          className={`text-sm font-medium ${hasPrev ? 'text-frankfurt-blue hover:underline' : 'text-gray-300'}`}
        >
          ‹ {prevName || t('prevParty')}
        </button>
        <span className="text-xs text-gray-400">{party.shortName}</span>
        <button
          onClick={onNext}
          disabled={!hasNext}
          className={`text-sm font-medium ${hasNext ? 'text-frankfurt-blue hover:underline' : 'text-gray-300'}`}
        >
          {nextName || t('nextParty')} ›
        </button>
      </div>
    </div>
  );
}
