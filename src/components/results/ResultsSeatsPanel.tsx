import { useMemo, useState } from 'react';
import type { ResultsData, ResultsParty } from '../../types/results';
import { getPartyColor } from '../../data/partyColors';

interface ResultsSeatsPanelProps {
  results: ResultsData;
  partyColors: Record<string, string>;
  /** When provided, hovering a seat highlights that party and clicking it
   * jumps the ballot's active party tab to the matching shortName. */
  onPickParty?: (shortName: string) => void;
}

/** Civic-style hemicycle Sitzverteilung — port of the design handoff's
 * `HemicyclePanel`. Seats are placed left-to-right by `ideologicalOrder`
 * (falling back to seat-count desc when absent). Hover any seat to "pop
 * out" its whole party radially; click to drive the ballot's active tab. */
export function ResultsSeatsPanel({
  results,
  partyColors,
  onPickParty,
}: ResultsSeatsPanelProps) {
  const totalSeats = results.totalSeats;
  const majority = Math.ceil(totalSeats / 2);
  const [hover, setHover] = useState<string | null>(null);

  const placed = useMemo(
    () => buildHemicycle(
      results.parties,
      results.ideologicalOrder ?? null,
      partyColors,
    ),
    [results.parties, results.ideologicalOrder, partyColors],
  );

  const hoveredParty = hover
    ? results.parties.find(p => p.shortName === hover)
    : null;

  // SVG geometry — matches the handoff: viewBox 0 0 440 220, origin (220, 195)
  const cx0 = 220;
  const cy0 = 195;
  const popKpx = 5;

  return (
    <section className="bg-white border border-gray-200 rounded-lg shadow-sm px-3.5 pt-4 pb-2">
      <div className="flex items-baseline justify-between mb-1.5">
        <h2 className="text-sm font-bold m-0">
          Sitzverteilung
          {hoveredParty && (
            <span className="ml-2 text-[11px] font-medium text-gray-500">
              · {hoveredParty.shortName} {hoveredParty.seats}
            </span>
          )}
        </h2>
        <span
          className="text-[10px] text-gray-500 tracking-wider"
          style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
        >
          {totalSeats} SITZE · HARE-NIEMEYER
        </span>
      </div>
      <svg
        viewBox="0 0 440 220"
        className="w-full block"
        role="img"
        aria-label={`Sitzverteilung Hemizyklus mit ${totalSeats} Sitzen`}
        onMouseLeave={() => setHover(null)}
      >
        {placed.map((s, i) => {
          const isHover = hover && s.partyShort === hover;
          const dimmed = hover && !isHover;
          const { x, y } = isHover
            ? popOffset(s.x, s.y, cx0, cy0, popKpx)
            : { x: s.x, y: s.y };
          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r={isHover ? 7.5 : 6.5}
              fill={s.color}
              stroke={isHover ? '#111827' : '#fff'}
              strokeWidth={isHover ? 1.2 : 0.8}
              opacity={dimmed ? 0.18 : 1}
              style={{
                cursor: onPickParty ? 'pointer' : 'default',
                transition: 'cx 140ms ease, cy 140ms ease, opacity 140ms ease, r 140ms ease',
              }}
              onMouseEnter={() => setHover(s.partyShort)}
              onClick={() => onPickParty?.(s.partyShort)}
            >
              <title>
                {s.partyShort}
                {onPickParty ? ' · klicken um zur Liste zu springen' : ''}
              </title>
            </circle>
          );
        })}
        <line
          x1={cx0} y1={cy0}
          x2={cx0} y2={20}
          stroke="#111827" strokeWidth={1}
          strokeDasharray="2 2" opacity={0.35}
        />
        <text
          x={cx0} y={14} textAnchor="middle"
          fontSize={9} fill="#6b7280"
          style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
        >
          MEHRHEIT · {majority}
        </text>
        <text
          x={cx0} y={180} textAnchor="middle"
          fontSize={36} fontWeight={500} fill="#111827"
          style={{ fontFamily: '"Fraunces", Georgia, serif' }}
        >
          {totalSeats}
        </text>
        <text
          x={cx0} y={195} textAnchor="middle"
          fontSize={9} fill="#6b7280"
          letterSpacing={1}
          style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace' }}
        >
          SITZE
        </text>
      </svg>
    </section>
  );
}

/** Place each of `totalSeats` dots on a half-circle, ordered ideologically
 * left-to-right. Mirrors `buildHemicycleO()` from the design handoff. */
function buildHemicycle(
  parties: ResultsParty[],
  ideologicalOrder: string[] | null,
  partyColors: Record<string, string>,
): Array<{ x: number; y: number; color: string; partyShort: string }> {
  // Resolve party order: ideologicalOrder when provided, then any unlisted
  // parties with seats appended by seat count desc (so we never silently
  // drop a party that wasn't in the editorial array).
  const seatfulParties = parties.filter(p => p.seats > 0);
  let ordered: ResultsParty[];
  if (ideologicalOrder && ideologicalOrder.length > 0) {
    const byName = new Map(seatfulParties.map(p => [p.shortName, p]));
    ordered = [];
    for (const name of ideologicalOrder) {
      const p = byName.get(name);
      if (p) ordered.push(p);
    }
    // Append any seatful party not in the order (sorted by seats desc)
    const placed = new Set(ordered.map(p => p.shortName));
    const leftovers = seatfulParties
      .filter(p => !placed.has(p.shortName))
      .sort((a, b) => b.seats - a.seats);
    ordered.push(...leftovers);
  } else {
    ordered = [...seatfulParties].sort((a, b) => b.seats - a.seats);
  }

  // Flat seat list in order
  type FlatSeat = { color: string; partyShort: string };
  const flat: FlatSeat[] = [];
  for (const p of ordered) {
    const color = getPartyColor(p.shortName, partyColors);
    for (let i = 0; i < p.seats; i++) {
      flat.push({ color, partyShort: p.shortName });
    }
  }

  // Geometry — handoff values: 6 rows, inner 95, outer 175, origin (220, 195)
  const rows = 6;
  const innerR = 95;
  const outerR = 175;
  const cx = 220;
  const cy = 195;
  const totalSeats = flat.length;

  // Distribute seats across rows weighted by 1 + r*0.55 (matches handoff)
  const weights = Array.from({ length: rows }, (_, r) => 1 + r * 0.55);
  const sumW = weights.reduce((a, b) => a + b, 0);
  const raw = weights.map(w => (totalSeats * w) / sumW);
  const floored = raw.map(Math.floor);
  let running = floored.reduce((a, b) => a + b, 0);
  const remainders = raw
    .map((v, i) => ({ i, f: v - floored[i] }))
    .sort((a, b) => b.f - a.f);
  let k = 0;
  while (running < totalSeats) {
    floored[remainders[k % rows].i]++;
    running++;
    k++;
  }

  const placed: Array<{ x: number; y: number; color: string; partyShort: string }> = [];
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    const radius = innerR + ((outerR - innerR) * r) / Math.max(rows - 1, 1);
    for (let s = 0; s < floored[r]; s++) {
      const t = (s + 0.5) / floored[r];
      const angle = Math.PI - t * Math.PI;
      const seat = flat[idx++];
      if (!seat) break;
      placed.push({
        x: cx + radius * Math.cos(angle),
        y: cy - radius * Math.sin(angle),
        color: seat.color,
        partyShort: seat.partyShort,
      });
    }
  }
  return placed;
}

/** Push a point radially outward from the hemicycle origin by `k` px. */
function popOffset(x: number, y: number, cx: number, cy: number, k: number) {
  const dx = x - cx;
  const dy = y - cy;
  const len = Math.hypot(dx, dy) || 1;
  return { x: x + (dx / len) * k, y: y + (dy / len) * k };
}
