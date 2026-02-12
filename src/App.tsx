import { useState, useEffect, useCallback, useRef } from 'react';
import type { ElectionData } from './types';
import { useVoteState } from './hooks/useVoteState';
import { decodeVoteState, encodeVoteState } from './utils/shareState';
import { ShareDialog, buildPartySegments } from './components/ballot/ShareDialog';
import type { PartySegment } from './components/ballot/ShareDialog';
import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { MobileDrawer } from './components/layout/MobileDrawer';
import { VoteStatusBar } from './components/ballot/VoteStatusBar';
import { BallotView } from './components/ballot/BallotView';
import { WalkthroughSection } from './components/walkthrough/WalkthroughSection';
import { WalkthroughDrawerContent } from './components/walkthrough/WalkthroughDrawerContent';
import { PracticalInfo } from './components/info/PracticalInfo';
import { PracticalInfoDrawerContent } from './components/info/PracticalInfoDrawerContent';
import { GuidedTour } from './components/tour/GuidedTour';
import { useGuidedTour } from './components/tour/useGuidedTour';

function App() {
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareData, setShareData] = useState<{
    url: string;
    segments: PartySegment[];
    totalUsed: number;
    totalMax: number;
  } | null>(null);

  const {
    state,
    derived,
    dispatch,
    isListVoteActive,
    getListAllocation,
    resetBallot,
  } = useVoteState(electionData);

  const tour = useGuidedTour();
  const hashLoaded = useRef(false);

  // Restore vote state from URL hash (#v=...)
  useEffect(() => {
    if (hashLoaded.current || !electionData) return;
    const hash = window.location.hash;
    const match = hash.match(/^#v=(.+)$/);
    if (!match) return;
    hashLoaded.current = true;
    decodeVoteState(match[1])
      .then(loadedState => {
        dispatch({ type: 'LOAD_STATE', state: loadedState });
        history.replaceState(null, '', window.location.pathname + window.location.search);
      })
      .catch(() => {
        // Invalid share link — silently ignore
      });
  }, [electionData, dispatch]);

  const toggleWalkthrough = useCallback(() => {
    setWalkthroughOpen(prev => !prev);
    setInfoOpen(false);
  }, []);

  const toggleInfo = useCallback(() => {
    setInfoOpen(prev => !prev);
    setWalkthroughOpen(false);
  }, []);

  const handleShare = useCallback(async () => {
    const encoded = await encodeVoteState(state);
    const url = `${window.location.origin}${window.location.pathname}#v=${encoded}`;
    const partyList = electionData?.parties.map(p => ({
      listNumber: p.listNumber,
      shortName: p.shortName,
    })) ?? [];
    const segments = buildPartySegments(
      derived.stimmenPerParty,
      partyList,
      derived.totalStimmenUsed,
    );
    setShareData({
      url,
      segments,
      totalUsed: derived.totalStimmenUsed,
      totalMax: electionData?.totalStimmen ?? 93,
    });
  }, [state, electionData, derived.stimmenPerParty, derived.totalStimmenUsed]);

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + 'data/stvv-candidates.json')
      .then(res => {
        if (!res.ok) throw new Error('Failed to load candidate data');
        return res.json();
      })
      .then(data => setElectionData(data))
      .catch(err => setError(err.message));
  }, []);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-status-invalid">Fehler beim Laden: {error}</p>
      </div>
    );
  }

  if (!electionData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Lade Kandidatendaten...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onTourRestart={tour.restart}
        onWalkthroughToggle={toggleWalkthrough}
        onInfoToggle={toggleInfo}
        onShare={handleShare}
        shouldPulse={tour.shouldPulse}
      />

      <VoteStatusBar
        totalUsed={derived.totalStimmenUsed}
        totalMax={electionData.totalStimmen}
        isComplete={derived.isComplete}
        isOverLimit={derived.isOverLimit}
        stimmenPerParty={derived.stimmenPerParty}
        parties={electionData.parties.map(p => ({
          listNumber: p.listNumber,
          shortName: p.shortName,
        }))}
        onReset={resetBallot}
        voteState={state}
      />

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col lg:flex-row lg:gap-4 lg:items-start">
          <WalkthroughSection />

          <div className="flex-1 min-w-0">
            <BallotView
              electionData={electionData}
              candidateVotes={state.candidateVotes}
              listSelections={state.listSelections}
              derived={derived}
              dispatch={dispatch}
              isListVoteActive={isListVoteActive}
              getListAllocation={getListAllocation}
            />
          </div>

          <PracticalInfo />
        </div>
      </main>

      <Footer />

      {/* Mobile drawers */}
      <MobileDrawer isOpen={walkthroughOpen} onClose={() => setWalkthroughOpen(false)} side="left">
        <WalkthroughDrawerContent />
      </MobileDrawer>

      <MobileDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} side="right">
        <PracticalInfoDrawerContent />
      </MobileDrawer>

      <GuidedTour
        isActive={tour.isActive}
        currentStep={tour.currentStep}
        onNext={tour.next}
        onPrev={tour.prev}
        onClose={tour.close}
      />

      {shareData && (
        <ShareDialog
          shareUrl={shareData.url}
          partySegments={shareData.segments}
          totalUsed={shareData.totalUsed}
          totalMax={shareData.totalMax}
          onClose={() => setShareData(null)}
        />
      )}
    </div>
  );
}

export default App;
