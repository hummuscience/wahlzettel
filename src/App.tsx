import { useState, useEffect, useCallback, useRef } from 'react';
import type { ElectionData } from './types';
import type { ElectionType } from './utils/shareState';
import { useVoteState } from './hooks/useVoteState';
import { decodeVoteState, encodeVoteState } from './utils/shareState';
import { ShareDialog, buildPartySegments } from './components/ballot/ShareDialog';
import type { PartySegment } from './components/ballot/ShareDialog';
import { PrintSpickzettel } from './components/ballot/PrintSpickzettel';
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
import { CitizenshipChoice } from './components/CitizenshipChoice';

function App() {
  const [ballotType, setBallotType] = useState<ElectionType | null>(null);
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walkthroughOpen, setWalkthroughOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [shareData, setShareData] = useState<{
    url: string;
    segments: PartySegment[];
  } | null>(null);
  const [printUrl, setPrintUrl] = useState<string | null>(null);

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

  // Check URL hash for shared ballot on mount (before showing choice screen)
  useEffect(() => {
    if (hashLoaded.current) return;
    const hash = window.location.hash;
    const binaryMatch = hash.match(/^#b=(.+)$/);
    const jsonMatch = hash.match(/^#v=(.+)$/);
    const match = binaryMatch || jsonMatch;
    if (!match) return;
    hashLoaded.current = true;
    const format = binaryMatch ? 'binary' : 'json';
    decodeVoteState(match[1], format as 'binary' | 'json')
      .then(decoded => {
        setBallotType(decoded.electionType);
        // We'll load the state after election data arrives
        pendingState.current = decoded.state;
      })
      .catch(() => {
        // Invalid share link — silently ignore
      });
  }, []);

  const pendingState = useRef<import('./types').VoteState | null>(null);

  // Load election data when ballot type changes
  useEffect(() => {
    if (!ballotType) {
      setElectionData(null);
      return;
    }
    setError(null);
    fetch(import.meta.env.BASE_URL + `data/${ballotType}-candidates.json`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load candidate data');
        return res.json();
      })
      .then(data => {
        setElectionData(data);
      })
      .catch(err => setError(err.message));
  }, [ballotType]);

  // Apply pending shared state once election data arrives
  useEffect(() => {
    if (electionData && pendingState.current) {
      dispatch({ type: 'LOAD_STATE', state: pendingState.current });
      pendingState.current = null;
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
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
    if (!ballotType) return;
    const encoded = await encodeVoteState(state, ballotType);
    const url = `${window.location.origin}${window.location.pathname}#b=${encoded}`;
    const partyList = electionData?.parties.map(p => ({
      listNumber: p.listNumber,
      shortName: p.shortName,
    })) ?? [];
    const segments = buildPartySegments(
      derived.stimmenPerParty,
      partyList,
      derived.totalStimmenUsed,
    );
    setShareData({ url, segments });
  }, [state, ballotType, electionData, derived.stimmenPerParty, derived.totalStimmenUsed]);

  const handlePrint = useCallback(async () => {
    if (!ballotType) return;
    const encoded = await encodeVoteState(state, ballotType);
    const url = `${window.location.origin}${window.location.pathname}#b=${encoded}`;
    setPrintUrl(url);
    // Let React render the print component, then trigger print
    requestAnimationFrame(() => {
      window.print();
    });
  }, [state, ballotType]);

  const handleSwitchBallot = useCallback(() => {
    resetBallot();
    setElectionData(null);
    setBallotType(null);
  }, [resetBallot]);

  const handleChooseBallot = useCallback((type: ElectionType) => {
    resetBallot();
    setBallotType(type);
  }, [resetBallot]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-status-invalid">Fehler beim Laden: {error}</p>
      </div>
    );
  }

  // Show citizenship choice screen when no ballot type selected
  if (!ballotType) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <CitizenshipChoice onChoose={handleChooseBallot} />
        </main>
        <Footer />
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
        onPrint={handlePrint}
        onSwitchBallot={handleSwitchBallot}
        shouldPulse={tour.shouldPulse}
        allVotesUsed={derived.isComplete}
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
        electionType={ballotType}
      />

      <main className="flex-1">
        <div className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col lg:flex-row lg:gap-4 lg:items-start">
          <WalkthroughSection totalStimmen={electionData.totalStimmen} />

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
        <WalkthroughDrawerContent totalStimmen={electionData.totalStimmen} />
      </MobileDrawer>

      <MobileDrawer isOpen={infoOpen} onClose={() => setInfoOpen(false)} side="right">
        <PracticalInfoDrawerContent />
      </MobileDrawer>

      <GuidedTour
        isActive={tour.isActive}
        currentStep={tour.currentStep}
        totalStimmen={electionData.totalStimmen}
        onNext={tour.next}
        onPrev={tour.prev}
        onClose={tour.close}
      />

      {shareData && (
        <ShareDialog
          shareUrl={shareData.url}
          partySegments={shareData.segments}
          onClose={() => setShareData(null)}
        />
      )}

      <PrintSpickzettel
        electionData={electionData}
        state={state}
        derived={derived}
        shareUrl={printUrl}
      />
    </div>
  );
}

export default App;
