import type { ResultsData } from '../../types/results';
import { getPartyColor } from '../../data/partyColors';

interface ResultsSeatsPanelProps {
  results: ResultsData;
  partyColors: Record<string, string>;
}

/** Replaces PracticalInfo in post-election mode. Visualises the 93 seats as a
 * hemicycle of coloured dots (one dot per seat, left-to-right by party order),
 * with a legend below. */
export function ResultsSeatsPanel({ results, partyColors }: ResultsSeatsPanelProps) {
  const partiesWithSeats = results.parties.filter(p => p.seats > 0);
  const totalSeats = results.totalSeats;

  // Build a flat seat list in display order. Within a hemicycle the
  // convention is to show parties in the order they're listed (typically
  // left-to-right ideologically). We sort by seat count desc as a neutral
  // proxy since the data doesn't carry an ideological axis.
  const seatsFlat: { partyShort: string; color: string }[] = [];
  for (const p of partiesWithSeats) {
    const color = getPartyColor(p.shortName, partyColors);
    for (let i = 0; i < p.seats; i++) {
      seatsFlat.push({ partyShort: p.shortName, color });
    }
  }

  // Hemicycle layout: place each seat on a half-circle. Use a simple model
  // where seats are arranged in N concentric arcs, distributed proportionally
  // by available arc length so dots stay roughly evenly spaced.
  // For 93 seats, 5 rows works well: ~14, 16, 18, 21, 24 ≈ 93.
  const rows = 5;
  const seatsPerRow = computeSeatsPerRow(totalSeats, rows);
  const innerRadius = 40;   // inner arc radius
  const outerRadius = 88;   // outer arc radius
  const dotRadius = 4.0;
  const viewBoxW = 200;
  const viewBoxH = 110;
  const cx = viewBoxW / 2;
  const cy = viewBoxH - 4;  // baseline near bottom

  // Place each seat: assign rows in order, place left-to-right in each row.
  const placed: { x: number; y: number; color: string; partyShort: string }[] = [];
  let seatIdx = 0;
  for (let r = 0; r < rows; r++) {
    const radius = innerRadius + ((outerRadius - innerRadius) * r) / Math.max(rows - 1, 1);
    const seatsInRow = seatsPerRow[r];
    for (let s = 0; s < seatsInRow; s++) {
      // Half-circle: angle from π (left) to 0 (right), excluding endpoints
      // slightly so dots don't touch the baseline.
      const t = (s + 0.5) / seatsInRow; // 0..1 across the row
      const angle = Math.PI - t * Math.PI;
      const x = cx + radius * Math.cos(angle);
      const y = cy - radius * Math.sin(angle);
      const seat = seatsFlat[seatIdx++];
      if (!seat) break;
      placed.push({ x, y, color: seat.color, partyShort: seat.partyShort });
    }
  }

  return (
    <section className="hidden lg:block lg:w-64 lg:shrink-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
      <h2 className="text-lg font-bold mb-1">Sitzverteilung</h2>
      <p className="text-xs text-gray-500 mb-3">
        {totalSeats} Sitze · Hare-Niemeyer
      </p>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3 mb-3">
        <svg
          viewBox={`0 0 ${viewBoxW} ${viewBoxH}`}
          className="w-full"
          role="img"
          aria-label={`Sitzverteilung Hemizyklus: ${partiesWithSeats.map(p => `${p.shortName} ${p.seats}`).join(', ')}`}
        >
          {placed.map((seat, i) => (
            <circle
              key={i}
              cx={seat.x}
              cy={seat.y}
              r={dotRadius}
              fill={seat.color}
              stroke="#fff"
              strokeWidth="0.6"
            >
              <title>{seat.partyShort}</title>
            </circle>
          ))}
        </svg>
        <div className="text-center text-3xl font-bold tabular-nums mt-2">
          {totalSeats}
        </div>
        <div className="text-center text-[10px] text-gray-400 -mt-1">Sitze gesamt</div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-3">
        <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Legende</h3>
        <ul className="space-y-1">
          {partiesWithSeats.map(p => {
            const color = getPartyColor(p.shortName, partyColors);
            return (
              <li key={p.shortName} className="flex items-center gap-2 text-xs">
                <span className="w-3 h-3 rounded-sm shrink-0" style={{ backgroundColor: color }} aria-hidden />
                <span className="flex-1 min-w-0 truncate">{p.shortName}</span>
                <span className="tabular-nums font-semibold">{p.seats}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {results.sources.length > 0 && (
        <p className="text-[10px] text-gray-400 mt-3 leading-tight">
          Quelle:{' '}
          {results.sources.map((url, i) => {
            const host = (() => {
              try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
            })();
            return (
              <span key={url}>
                {i > 0 && ', '}
                <a href={url} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
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

/** Distribute `total` seats across `rows` arcs so the inner row is shortest
 * and the outer row is longest, with the count growing roughly linearly with
 * arc circumference. Returns an array of length `rows`. */
function computeSeatsPerRow(total: number, rows: number): number[] {
  // Weight by circumference of each row's arc (proportional to radius).
  const weights = Array.from({ length: rows }, (_, r) => 1 + r * 0.7);
  const sum = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => (total * w) / sum);
  const floored = raw.map(Math.floor);
  let running = floored.reduce((a, b) => a + b, 0);
  // Distribute the remainder by largest fractional part
  const remainders = raw.map((r, i) => ({ idx: i, frac: r - floored[i] }))
    .sort((a, b) => b.frac - a.frac);
  let i = 0;
  while (running < total) {
    floored[remainders[i % rows].idx]++;
    running++;
    i++;
  }
  return floored;
}
