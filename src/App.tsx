import { useState, useEffect, useCallback, useRef } from 'react';
import type { ElectionData } from './types';
import type { ElectionType } from './utils/shareState';
import type { ElectionConfig } from './elections/types';
import { getElectionBySlug } from './elections/registry';
import { ElectionProvider } from './elections/ElectionContext';
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
import { ElectionPicker } from './components/ElectionPicker';
import { LandtagswahlBallot } from './components/ballot/LandtagswahlBallot';
import i18n, { loadElectionI18n } from './i18n';

function getSlugFromPath(): string | null {
  // Handle GitHub Pages SPA redirect from 404.html
  const params = new URLSearchParams(window.location.search);
  const redirectedPath = params.get('p');
  if (redirectedPath) {
    const slug = redirectedPath.replace(/^\/+|\/+$/g, '');
    // Clean up the URL
    history.replaceState(null, '', `/${slug}${window.location.hash}`);
    return slug || null;
  }
  const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
  return path || null;
}

function App() {
  const [electionConfig, setElectionConfig] = useState<ElectionConfig | null>(null);
  const [electionData, setElectionData] = useState<ElectionData | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [landtagswahlData, setLandtagswahlData] = useState<any>(null);
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
  const pendingState = useRef<import('./types').VoteState | null>(null);
  const pendingSlug = useRef<string | null>(null);

  // Check URL hash for shared ballot on mount
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
        pendingState.current = decoded.state;
        pendingSlug.current = decoded.electionType;
        // Load the config for this election
        const entry = getElectionBySlug(decoded.electionType);
        if (entry) {
          entry.load().then(config => setElectionConfig(config));
        }
      })
      .catch(() => {
        // Invalid share link — silently ignore
      });
  }, []);

  // On mount, read slug from URL path (if no share link is being processed)
  useEffect(() => {
    if (hashLoaded.current) return; // share link takes priority
    const slug = getSlugFromPath();
    if (!slug) return;
    const entry = getElectionBySlug(slug);
    if (entry) {
      entry.load().then(config => setElectionConfig(config));
    }
  }, []);

  // Apply theme colors and load election i18n when config changes
  useEffect(() => {
    if (!electionConfig) return;
    const root = document.documentElement;
    root.style.setProperty('--color-election-primary', electionConfig.themeColor);
    root.style.setProperty('--color-election-primary-light', electionConfig.themeColorLight);
    root.style.setProperty('--color-election-primary-dark', electionConfig.themeColorDark);
    loadElectionI18n(electionConfig.id).then(() => {
      const title = i18n.t('title', { ns: 'election', defaultValue: electionConfig.id });
      document.title = `Wahlzettel – ${title}`;
    });
  }, [electionConfig]);

  // Load election data when config changes
  useEffect(() => {
    if (!electionConfig) {
      setElectionData(null);
      setLandtagswahlData(null);
      return;
    }
    setError(null);
    fetch(import.meta.env.BASE_URL + `data/${electionConfig.dataFile}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load candidate data');
        return res.json();
      })
      .then(data => {
        if (electionConfig.type === 'landtagswahl') {
          setLandtagswahlData(data);
          setElectionData(null);
        } else {
          setElectionData(data);
          setLandtagswahlData(null);
        }
      })
      .catch(err => setError(err.message));
  }, [electionConfig]);

  // Apply pending shared state once election data arrives
  useEffect(() => {
    if (electionData && pendingState.current) {
      dispatch({ type: 'LOAD_STATE', state: pendingState.current });
      pendingState.current = null;
      pendingSlug.current = null;
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

  const currentElectionType: ElectionType = electionConfig?.slug ?? '';

  const handleShare = useCallback(async () => {
    if (!currentElectionType) return;
    const encoded = await encodeVoteState(state, currentElectionType);
    const url = `${window.location.origin}/${currentElectionType}#b=${encoded}`;
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
  }, [state, currentElectionType, electionData, derived.stimmenPerParty, derived.totalStimmenUsed]);

  const handlePrint = useCallback(async () => {
    if (!currentElectionType) return;
    const encoded = await encodeVoteState(state, currentElectionType);
    const url = `${window.location.origin}/${currentElectionType}#b=${encoded}`;
    setPrintUrl(url);
    requestAnimationFrame(() => {
      window.print();
    });
  }, [state, currentElectionType]);

  const handleSwitchBallot = useCallback(() => {
    resetBallot();
    setElectionData(null);
    setLandtagswahlData(null);
    setElectionConfig(null);
    history.pushState(null, '', '/');
    document.title = 'Wahlzettel – Wahl üben';
  }, [resetBallot]);

  const handleChooseElection = useCallback((slug: string) => {
    resetBallot();
    const entry = getElectionBySlug(slug);
    if (entry) {
      history.pushState(null, '', `/${slug}`);
      entry.load().then(config => setElectionConfig(config));
    }
  }, [resetBallot]);

  // Handle browser back/forward
  useEffect(() => {
    const handler = () => {
      const slug = getSlugFromPath();
      if (!slug) {
        resetBallot();
        setElectionData(null);
        setLandtagswahlData(null);
        setElectionConfig(null);
      } else {
        const entry = getElectionBySlug(slug);
        if (entry) {
          resetBallot();
          entry.load().then(config => setElectionConfig(config));
        }
      }
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [resetBallot]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-status-invalid">Fehler beim Laden: {error}</p>
      </div>
    );
  }

  // Show election picker when no config selected
  if (!electionConfig) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">
          <ElectionPicker onChoose={handleChooseElection} />
        </main>
        <Footer />
      </div>
    );
  }

  // Landtagswahl: separate render path
  if (electionConfig.type === 'landtagswahl') {
    if (!landtagswahlData) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-gray-500">Lade Kandidatendaten...</p>
        </div>
      );
    }
    return (
      <ElectionProvider config={electionConfig}>
        <div className="min-h-screen flex flex-col">
          <Header onSwitchBallot={handleSwitchBallot} />
          <main className="flex-1">
            <LandtagswahlBallot data={landtagswahlData} />
          </main>
          <Footer />
        </div>
      </ElectionProvider>
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
    <ElectionProvider config={electionConfig}>
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
          electionType={currentElectionType}
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
    </ElectionProvider>
  );
}

export default App;
