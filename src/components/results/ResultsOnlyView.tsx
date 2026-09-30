import { useState } from 'react';
import type { ElectionConfig } from '../../elections/types';
import type { ResultsData } from '../../types/results';
import { ResultsPartyTable } from './ResultsPartyTable';
import { ResultsWahlkreise } from './ResultsWahlkreise';
import { ResultsSeatsPanel } from './ResultsSeatsPanel';
import { ResultsSummary } from './ResultsSummary';
import { ResultsCoalitionsPanel } from './ResultsCoalitionsPanel';

const SEAT_METHOD_LABEL = {
  dhondt: "D'HONDT",
  hareNiemeyer: 'HARE-NIEMEYER',
  sainteLague: 'SAINTE-LAGUË',
} as const;

/** Post-election screen for archetypes whose ballot has no results mode
 * (mmp-2vote, closed-list): party table + Direktmandate on the left, the
 * same right rail as the sued-kommunal results screen. */
export function ResultsOnlyView({ config, results }: { config: ElectionConfig; results: ResultsData }) {
  const [activeParty, setActiveParty] = useState<string | null>(null);
  const seatMethod = 'seatMethod' in config ? SEAT_METHOD_LABEL[config.seatMethod] : undefined;
  const threshold = 'threshold' in config ? config.threshold : undefined;

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-4 flex flex-col lg:flex-row lg:gap-4 lg:items-start">
      <div className="flex-1 min-w-0 order-2 lg:order-1 flex flex-col gap-4">
        <ResultsPartyTable
          results={results}
          partyColors={config.partyColors}
          threshold={threshold}
          activeParty={activeParty}
          onActivePartyChange={setActiveParty}
        />
        {results.wahlkreise && results.wahlkreise.length > 0 && (
          <ResultsWahlkreise
            wahlkreise={results.wahlkreise}
            partyColors={config.partyColors}
            activeParty={activeParty}
          />
        )}
      </div>
      <aside className="flex flex-col gap-3.5 mb-4 order-1 lg:order-2 lg:mb-0 lg:w-[360px] lg:shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <ResultsSeatsPanel
          results={results}
          partyColors={config.partyColors}
          seatMethodLabel={seatMethod}
          onPickParty={shortName => setActiveParty(shortName)}
        />
        <ResultsSummary results={results} electionConfig={config} />
        <ResultsCoalitionsPanel results={results} partyColors={config.partyColors} />
      </aside>
    </div>
  );
}
