import type { ResultsWahlkreis } from '../../types/results';
import { getPartyColor } from '../../data/partyColors';

interface ResultsWahlkreiseProps {
  wahlkreise: ResultsWahlkreis[];
  partyColors: Record<string, string>;
  activeParty?: string | null;
}

/** Direktmandate per Wahlkreis, grouped by Bezirk: one tile per Wahlkreis
 * in the winner's party color. The active party stays saturated while the
 * rest fade, mirroring the hemicycle hover. */
export function ResultsWahlkreise({ wahlkreise, partyColors, activeParty }: ResultsWahlkreiseProps) {
  const byBezirk = new Map<string, ResultsWahlkreis[]>();
  for (const wk of wahlkreise) {
    byBezirk.set(wk.bezirk, [...(byBezirk.get(wk.bezirk) ?? []), wk]);
  }

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm px-4 py-3.5">
      <div className="flex items-baseline justify-between mb-2.5">
        <h2 className="text-base font-bold m-0">Direktmandate</h2>
        <span className="text-[11px] text-gray-400">{wahlkreise.length} Wahlkreise</span>
      </div>
      <div className="flex flex-col gap-2">
        {[...byBezirk].map(([bezirk, wks]) => (
          <div
            key={bezirk}
            className={bezirk
              ? 'grid grid-cols-[9.5rem_1fr] gap-2 items-center max-sm:grid-cols-1 max-sm:gap-1'
              : ''}
          >
            {/* Flat grid when the Land has no Bezirke (e.g. BW) */}
            {bezirk && <span className="text-xs text-gray-600 truncate">{bezirk}</span>}
            <div className="flex flex-wrap gap-1">
              {wks.map(wk => {
                const w = wk.winner;
                const dim = activeParty && activeParty !== w.party;
                // Berlin: "Mitte 5" → 5 within its Bezirk; elsewhere the Land-wide number
                const nr = bezirk ? (wk.name.match(/\d+$/)?.[0] ?? wk.id) : String(Number(wk.id));
                return (
                  <span
                    key={wk.id}
                    title={`${wk.name}: ${w.firstName} ${w.lastName} (${w.party})`}
                    className="w-7 h-7 rounded grid place-items-center text-[10px] font-semibold text-white tabular-nums transition-opacity"
                    style={{
                      backgroundColor: getPartyColor(w.party, partyColors),
                      opacity: dim ? 0.2 : 1,
                      textShadow: '0 0 2px rgba(0,0,0,.35)',
                    }}
                  >
                    {nr}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
