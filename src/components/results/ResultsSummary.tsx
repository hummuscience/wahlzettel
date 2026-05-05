import type { ResultsData } from '../../types/results';

interface ResultsSummaryProps {
  results: ResultsData;
  electionConfig: {
    region: { gemeinde?: string; bezirk?: string; land: string };
  };
}

/** German thousands-separator formatter. */
function fmt(n: number | null | undefined): string {
  if (n == null) return '–';
  return n.toLocaleString('de-DE');
}

function fmtPercent(n: number | null | undefined): string {
  if (n == null) return '–';
  return `${n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`;
}

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return d.toLocaleDateString('de-DE', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
  });
}

/** Right-rail summary card. Shows turnout, totals, candidate counts.
 * The seat list is intentionally NOT shown — that information lives in
 * the ballot's per-party rail and the hemicycle, so it would be redundant
 * (per the design handoff). */
export function ResultsSummary({ results, electionConfig }: ResultsSummaryProps) {
  const place = electionConfig.region.gemeinde
    ?? electionConfig.region.bezirk
    ?? electionConfig.region.land;
  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm p-3.5">
      <div className="flex items-baseline justify-between mb-2">
        <h2 className="text-sm font-bold m-0">{place} hat gewählt</h2>
        <span className="text-[10px] text-gray-400">{fmtDate(results.stand)}</span>
      </div>
      <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-1.5 text-xs">
        <span className="text-gray-500">Wahlbeteiligung</span>
        <span className="text-right tabular-nums font-semibold">
          {fmtPercent(results.totals.turnout)}
        </span>
        {results.totals.waehlerGesamt != null && (
          <>
            <span className="text-gray-500">Wähler:innen</span>
            <span className="text-right tabular-nums">{fmt(results.totals.waehlerGesamt)}</span>
          </>
        )}
        <span className="text-gray-500">Gültige Stimmzettel</span>
        <span className="text-right tabular-nums">{fmt(results.totals.validBallots)}</span>
        <span className="text-gray-500">Gültige Stimmen</span>
        <span className="text-right tabular-nums">{fmt(results.totals.validVotes)}</span>
        <span className="text-gray-500">Bewerber:innen</span>
        <span className="text-right tabular-nums">
          {fmt(results.totals.kandidatenInsgesamt)}
          {results.totals.frauenInsgesamt != null && (
            <span className="text-gray-400"> · {fmt(results.totals.frauenInsgesamt)} ♀</span>
          )}
        </span>
        {results.totals.ballotsWithListenkreuzPercent != null && (
          <>
            <span className="text-gray-500">Listenkreuz</span>
            <span className="text-right tabular-nums">
              {fmtPercent(results.totals.ballotsWithListenkreuzPercent)}
            </span>
          </>
        )}
      </div>

      {results.sources.length > 0 && (
        <p className="mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-400 leading-tight">
          Quelle:{' '}
          {results.sources.map((url, i) => {
            let host = url;
            try { host = new URL(url).hostname.replace(/^www\./, ''); } catch { /* keep as-is */ }
            return (
              <span key={url}>
                {i > 0 && ', '}
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600"
                >
                  {host}
                </a>
              </span>
            );
          })}
        </p>
      )}
    </section>
  );
}
