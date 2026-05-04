import { useState, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ElectionData, VoteAction, CandidateVote, ListSelection } from '../../types';
import type { DerivedVoteState } from '../../types';
import type { ResultsData, ResultsParty } from '../../types/results';
import { PartyBookmarks } from '../../components/ballot/PartyBookmarks';
import { PartyPage } from '../../components/ballot/PartyPage';
import { indexResultsParty } from '../../utils/candidateMatch';

interface BallotViewProps {
  electionData: ElectionData;
  electionResults?: ResultsData | null;
  candidateVotes: Record<string, CandidateVote>;
  listSelections: Record<number, ListSelection>;
  derived: DerivedVoteState;
  dispatch: React.Dispatch<VoteAction>;
  isListVoteActive: (partyListNumber: number) => boolean;
  getListAllocation: (partyListNumber: number) => Record<string, number> | null;
}

export function BallotView({
  electionData,
  electionResults,
  candidateVotes,
  listSelections,
  derived,
  dispatch,
  isListVoteActive,
  getListAllocation,
}: BallotViewProps) {
  const { t } = useTranslation('ballot');
  const { t: te } = useTranslation('election');
  const [activeIndex, setActiveIndex] = useState(0);

  const parties = electionData.parties;
  const activeParty = parties[activeIndex];

  const handlePrev = useCallback(() => {
    setActiveIndex(i => Math.max(0, i - 1));
  }, []);

  const handleNext = useCallback(() => {
    setActiveIndex(i => Math.min(parties.length - 1, i + 1));
  }, [parties.length]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handlePrev, handleNext]);

  const listActive = isListVoteActive(activeParty.listNumber);
  const listAlloc = getListAllocation(activeParty.listNumber);
  const struckIds = listSelections[activeParty.listNumber]?.struckCandidateIds || [];

  // Look up the results for the active party (may be missing if party didn't
  // win seats, or absent entirely if no results are configured for this election).
  const activePartyResults = useMemo<ResultsParty | null>(() => {
    if (!electionResults) return null;
    return (
      electionResults.parties.find(p => p.shortName === activeParty.shortName) ?? null
    );
  }, [electionResults, activeParty.shortName]);

  const resultsIndex = useMemo(() => {
    if (!activePartyResults) return null;
    return indexResultsParty(activePartyResults);
  }, [activePartyResults]);

  // Per-party shade-bar denominator: the highest Stimmen any elected member of
  // this party received. Falls back to null when this party didn't elect anyone.
  const partyMaxStimmen = useMemo(() => {
    if (!activePartyResults || activePartyResults.elected.length === 0) return null;
    return Math.max(...activePartyResults.elected.map(c => c.stimmen));
  }, [activePartyResults]);

  // When a list vote is active, individual votes reduce the list allocation,
  // so we only block when individual votes alone reach totalStimmen.
  const hasActiveList = Object.values(listSelections).some(s => s.isSelected);
  let maxReached: boolean;
  if (hasActiveList) {
    let individualTotal = 0;
    for (const vote of Object.values(candidateVotes)) {
      individualTotal += vote.stimmen;
    }
    maxReached = individualTotal >= electionData.totalStimmen;
  } else {
    maxReached = derived.stimmenRemaining <= 0;
  }

  return (
    <div data-tour="ballot" className="py-4" id="ballot">
      <div className="text-center mb-3">
        <h2 className="text-lg font-bold">{t('stimmzettel')}</h2>
        <p className="text-sm text-gray-500">
          {te('ballotBodyPreposition', { defaultValue: t('fuerDieWahlDer') })}{' '}
          {te('ballotBodyName', { defaultValue: t('stadtverordnetenversammlung') })}
        </p>
        <p className="text-xs text-gray-400">{te('ballotSubtitle', { defaultValue: t('am15Maerz') })}</p>
      </div>

      <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden flex flex-col lg:flex-row" style={{ height: 'min(75vh, 700px)' }}>
        <PartyBookmarks
          parties={parties.map(p => ({ listNumber: p.listNumber, shortName: p.shortName }))}
          activeIndex={activeIndex}
          stimmenPerParty={derived.stimmenPerParty}
          onSelectParty={setActiveIndex}
        />

        <div className="flex-1 flex flex-col min-h-0">
          <PartyPage
            party={activeParty}
            isListVoteActive={listActive}
            listAllocation={listAlloc}
            candidateVotes={candidateVotes}
            struckCandidateIds={struckIds}
            maxReached={maxReached}
            dispatch={dispatch}
            onPrev={handlePrev}
            onNext={handleNext}
            hasPrev={activeIndex > 0}
            hasNext={activeIndex < parties.length - 1}
            prevName={activeIndex > 0 ? parties[activeIndex - 1].shortName : undefined}
            nextName={activeIndex < parties.length - 1 ? parties[activeIndex + 1].shortName : undefined}
            resultsIndex={resultsIndex}
            partyMaxStimmen={partyMaxStimmen}
          />
        </div>
      </div>
    </div>
  );
}
