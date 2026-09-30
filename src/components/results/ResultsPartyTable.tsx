import { useState } from 'react';
import type { ResultsData, ResultsParty } from '../../types/results';
import { getPartyColor } from '../../data/partyColors';

interface ResultsPartyTableProps {
  results: ResultsData;
  partyColors: Record<string, string>;
  /** Sperrklausel in percent, drawn as a tick on every bar. */
  threshold?: number;
  /** Highlighted party (e.g. hovered/clicked in the hemicycle). */
  activeParty?: string | null;
  onActivePartyChange?: (shortName: string | null) => void;
}

type VoteKind = 'zweit' | 'erst';

function fmt(n: number | null | undefined): string {
  return n == null ? '–' : n.toLocaleString('de-DE');
}

function fmtPct(n: number | null | undefined): string {
  return n == null
    ? '–'
    : n.toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function fmtDelta(n: number | null | undefined): string {
  if (n == null) return '';
  const s = fmtPct(Math.abs(n));
  return n > 0 ? `+${s}` : n < 0 ? `−${s}` : `±${s}`;
}

function share(p: ResultsParty, kind: VoteKind) {
  return kind === 'erst' && p.erststimmen
    ? { percent: p.erststimmen.percent, votes: p.erststimmen.votesAbsolute, delta: p.erststimmen.percentChange }
    : { percent: p.percent, votes: p.votesAbsolute, delta: p.percentChange ?? null };
}

/** Party-level result table for archetypes without a per-candidate ballot
 * (Berlin AGH + BVV). One row per list: bar, share, change vs. last
 * election, seats. Clicking a row with seats expands its elected members. */
export function ResultsPartyTable({
  results,
  partyColors,
  threshold,
  activeParty,
  onActivePartyChange,
}: ResultsPartyTableProps) {
  const hasErst = results.parties.some(p => p.erststimmen);
  const [kind, setKind] = useState<VoteKind>('zweit');
  const [showAll, setShowAll] = useState(false);

  const rows = [...results.parties].sort(
    (a, b) => b.seats - a.seats || (share(b, kind).percent ?? 0) - (share(a, kind).percent ?? 0),
  );
  const visible = showAll ? rows : rows.filter(p => p.seats > 0 || (share(p, kind).percent ?? 0) >= 1);
  const hiddenCount = rows.length - visible.length;
  const maxPct = Math.max(...rows.map(p => share(p, kind).percent ?? 0), threshold ?? 0);
  const hasDelta = rows.some(p => share(p, kind).delta != null);

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <div className="px-4 pt-3.5 pb-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="text-base font-bold m-0">Ergebnis</h2>
        {results.status === 'vorläufig' && (
          <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
            Vorläufig
          </span>
        )}
        {hasErst && (
          <div className="ml-auto inline-flex rounded-md border border-gray-200 p-0.5 text-xs" role="tablist">
            {(['zweit', 'erst'] as const).map(k => (
              <button
                key={k}
                role="tab"
                aria-selected={kind === k}
                onClick={() => setKind(k)}
                className={`px-2.5 py-1 rounded ${kind === k ? 'bg-gray-900 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
              >
                {k === 'zweit' ? 'Zweitstimmen' : 'Erststimmen'}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] text-xs">
        <div className="contents text-[10px] uppercase tracking-wider text-gray-400">
          <span className="px-4 py-1 border-b border-gray-100">Partei</span>
          <span className="px-2 py-1 border-b border-gray-100 text-right">%</span>
          <span className="px-2 py-1 border-b border-gray-100 text-right">{hasDelta ? `± ${results.previousYear ?? ''}`.trim() : ''}</span>
          <span className="pl-2 pr-4 py-1 border-b border-gray-100 text-right">Sitze</span>
        </div>
        {visible.map(p => {
          const s = share(p, kind);
          const color = getPartyColor(p.shortName, partyColors);
          const open = activeParty === p.shortName;
          const out = p.seats === 0;
          const toggle = () => onActivePartyChange?.(open ? null : p.shortName);
          return (
            <div key={p.shortName} className="contents">
              <button
                onClick={toggle}
                disabled={p.candidates.length === 0}
                aria-expanded={open}
                className={`col-span-4 grid grid-cols-subgrid items-center text-left border-b border-gray-100 enabled:hover:bg-gray-50 enabled:cursor-pointer ${open ? 'bg-gray-50' : ''} ${out ? 'text-gray-400' : ''}`}
              >
                <span className="px-4 py-2 min-w-0">
                  <span className="flex items-baseline gap-2 min-w-0">
                    <span className="font-semibold text-gray-900 shrink-0" style={out ? { color: '#9ca3af' } : undefined}>
                      {p.shortName}
                    </span>
                    {p.fullName !== p.shortName && (
                      <span className="truncate text-[11px] text-gray-400">{p.fullName}</span>
                    )}
                  </span>
                  <span className="relative block h-2 mt-1.5 rounded-sm bg-gray-100" aria-hidden>
                    <span
                      className="absolute inset-y-0 left-0 rounded-sm"
                      style={{
                        width: `${((s.percent ?? 0) / maxPct) * 100}%`,
                        backgroundColor: color,
                        opacity: out ? 0.35 : 1,
                      }}
                    />
                    {threshold != null && (
                      <span
                        className="absolute -inset-y-0.5 w-px bg-gray-500"
                        style={{ left: `${(threshold / maxPct) * 100}%` }}
                      />
                    )}
                  </span>
                </span>
                <span className="px-2 py-2 text-right tabular-nums font-semibold" title={`${fmt(s.votes)} Stimmen`}>
                  {fmtPct(s.percent)}
                </span>
                <span
                  className={`px-2 py-2 text-right tabular-nums text-[11px] ${
                    s.delta == null ? '' : s.delta > 0 ? 'text-emerald-700' : s.delta < 0 ? 'text-rose-700' : 'text-gray-400'
                  }`}
                >
                  {fmtDelta(s.delta)}
                </span>
                <span className="pl-2 pr-4 py-2 text-right tabular-nums">
                  <span className="font-bold text-sm">{p.seats || '–'}</span>
                  {!!p.direktmandate && (
                    <span className="block text-[10px] text-gray-400">{p.direktmandate} direkt</span>
                  )}
                </span>
              </button>
              {open && <ElectedList party={p} color={color} />}
            </div>
          );
        })}
      </div>

      <div className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500">
        {threshold != null && (
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-px h-3 bg-gray-500" /> {fmtPct(threshold)} %-Hürde
          </span>
        )}
        <span>Gültige Stimmen: {fmt(results.totals.validVotes)}</span>
        {hiddenCount > 0 && (
          <button onClick={() => setShowAll(true)} className="ml-auto underline hover:text-gray-800">
            {hiddenCount} weitere unter 1 %
          </button>
        )}
      </div>
    </section>
  );
}

function ElectedList({ party, color }: { party: ResultsParty; color: string }) {
  const direkt = party.candidates.filter(c => c.via === 'wahlkreis');
  const liste = party.candidates.filter(c => c.via !== 'wahlkreis');
  const groups = [
    { title: 'Direktmandate', items: direkt },
    { title: direkt.length ? 'Über die Liste' : 'Gewählt', items: liste },
  ].filter(g => g.items.length);
  return (
    <div className="col-span-4 px-4 py-3 border-b border-gray-100 bg-gray-50" style={{ boxShadow: `inset 3px 0 0 ${color}` }}>
      {groups.map(g => (
        <div key={g.title} className="mb-2 last:mb-0">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">
            {g.title} · {g.items.length}
          </div>
          <ol className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-0.5 text-xs list-none p-0 m-0">
            {g.items.map(c => (
              <li key={`${c.lastName}-${c.firstName}-${c.position}`} className="flex items-baseline gap-1.5 min-w-0">
                <span className="truncate">
                  <span className="font-medium text-gray-900">{c.lastName}</span>
                  <span className="text-gray-500">, {c.firstName}</span>
                </span>
                {c.wahlkreis && <span className="shrink-0 text-[10px] text-gray-400">{c.wahlkreis}</span>}
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
