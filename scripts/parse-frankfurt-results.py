#!/usr/bin/env python3
"""Extract Frankfurt am Main Stadtverordnetenversammlung 2026 results.

Primary source: Frankfurt's votemanager Open-Data CSV at
https://votemanager-ffm.ekom21cdn.de/2026-03-15/06412000/daten/opendata/
which has per-Stimmbezirk and per-Gemeinde breakdowns including
**per-candidate Stimmen for every one of the 1,120 candidates** — winners
AND non-winners. Cross-referenced with the Hessen-wide CSV at
https://wahlen.hessen-kw26.23degrees.eu/ for verification.

The candidate-position-to-Stimmen map is direct: column D{listNumber}_{position}
gives that candidate's citywide Stimmen, where listNumber/position match
src/elections/frankfurt-stvv/parties.json's structure.

Run:  python3 scripts/parse-frankfurt-results.py
Out:  public/data/results-frankfurt-stvv.json
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
OUT = REPO_ROOT / "public" / "data" / "results-frankfurt-stvv.json"
CANDIDATES_JSON = REPO_ROOT / "public" / "data" / "frankfurt-stvv.json"

# Frankfurt-specific votemanager open-data CSV. ekom21 hosts these for
# every Hessen Kommunalwahl participant — the only changing pieces are
# the date prefix and the AGS (Allgemeiner Gemeindeschlüssel).
VOTEMANAGER_CSV_URL = (
    "https://votemanager-ffm.ekom21cdn.de/2026-03-15/06412000/daten/opendata/"
    "Open-Data-06412000-Stadtverordnetenwahl-Gemeinde.csv"
)

# Aggregate (Hessen-wide) results — used for verification + party metadata
HESSEN_CSV_URL = (
    "https://wahlen.hessen-kw26.23degrees.eu/assets/"
    "Wahlergebnisse_Gemeindewahl2026_Hessen.csv"
)
PARTIES_JSON_URL = "https://wahlen.hessen-kw26.23degrees.eu/assets/parties.json"

ELECTION_SLUG = "frankfurt-stvv"
FRANKFURT_KEY = "000412000"
TOTAL_SEATS = 93


# ekom21's Cloudflare-fronted server requires a real User-Agent header.
def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
            ),
            "Accept": "text/csv, application/json, text/html;q=0.9, */*;q=0.5",
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def parse_int(val: str | None) -> int | None:
    if val is None or val == "":
        return None
    try:
        return int(val.replace(".", "").replace(",", "").strip())
    except ValueError:
        return None


def parse_float(val: str | None) -> float | None:
    if val is None or val == "":
        return None
    try:
        return float(val.replace(",", ".").strip())
    except ValueError:
        return None


def parse_votemanager_row(csv_text: str) -> tuple[dict[str, str], dict[str, str]]:
    """Parse the single-row votemanager CSV into a {column: value} dict."""
    reader = csv.reader(io.StringIO(csv_text), delimiter=";")
    rows = list(reader)
    if len(rows) < 2:
        raise RuntimeError("votemanager CSV has no data row")
    header = rows[0]
    data = rows[1]
    if len(header) != len(data):
        raise RuntimeError(
            f"header/data length mismatch: {len(header)} vs {len(data)}"
        )
    cells = dict(zip(header, data))
    # Cell index by column name (just the dict above) is enough for everything.
    return cells, cells  # second value kept for API symmetry


def per_candidate_stimmen(
    cells: dict[str, str], list_number: int, position: int
) -> int | None:
    """Return D{listNumber}_{position} as an int, or None if absent/empty."""
    return parse_int(cells.get(f"D{list_number}_{position}"))


def per_party_total(cells: dict[str, str], list_number: int) -> int | None:
    """Return the per-party total D{listNumber} (sum of votes for that party)."""
    return parse_int(cells.get(f"D{list_number}"))


def get_frankfurt_hessen_row(csv_text: str) -> tuple[list[str], list[str]]:
    """Return (header, frankfurt-row) from the Hessen-wide aggregate CSV."""
    reader = csv.reader(io.StringIO(csv_text), delimiter=";")
    rows = list(reader)
    header = rows[1]  # row 0 is meta, row 1 is header
    for row in rows[2:]:
        if row[0].strip('"') == FRANKFURT_KEY or row[1].startswith("Frankfurt am Main"):
            return header, row
    raise RuntimeError("Frankfurt row not found in Hessen CSV")


def csv_field(header: list[str], row: list[str], col: str) -> str | None:
    try:
        idx = header.index(col)
    except ValueError:
        return None
    val = row[idx]
    return val.strip() if val.strip() else None


def wg_alias_map(header: list[str], row: list[str]) -> dict[str, str]:
    """Hessen CSV uses generic WG1..WG6 slots for Wählergruppen and records
    the actual short name in `WG<n> Kurzname`. Build a {WGn: actual} map."""
    out: dict[str, str] = {}
    for i, col in enumerate(header):
        if col.endswith(" Kurzname"):
            wg_label = col[: -len(" Kurzname")]
            actual = row[i].strip().strip('"')
            if actual:
                out[wg_label] = actual
    return out


def resolve_alias(party: str, aliases: dict[str, str]) -> str:
    return aliases.get(party, party)


def party_seats_from_csv(
    header: list[str], row: list[str], aliases: dict[str, str]
) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, col in enumerate(header):
        if col.endswith(" Sitze") and not col.endswith(" darunter Frauen"):
            party = resolve_alias(col[: -len(" Sitze")], aliases)
            n = parse_int(row[i])
            if n and n > 0:
                out[party] = n
    return out


def party_votes_weighted(
    header: list[str], row: list[str], aliases: dict[str, str]
) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, col in enumerate(header):
        if col.endswith(" gewichtet"):
            party = resolve_alias(col[: -len(" gewichtet")], aliases)
            n = parse_int(row[i])
            if n and n > 0:
                out[party] = n
    return out


def party_percent_from_csv(
    header: list[str], row: list[str], aliases: dict[str, str]
) -> dict[str, float]:
    out: dict[str, float] = {}
    for i, col in enumerate(header):
        if col.endswith(" (%)"):
            party = resolve_alias(col[: -len(" (%)")], aliases)
            v = parse_float(row[i])
            if v is not None:
                out[party] = v
    return out


def main() -> None:
    print(f"[1/4] Fetching votemanager per-candidate CSV", file=sys.stderr)
    vm_text = fetch(VOTEMANAGER_CSV_URL)
    cells, _ = parse_votemanager_row(vm_text)

    # Stand date from the votemanager CSV's `datum` field (DD.MM.YYYY)
    raw_datum = cells.get("datum", "").strip()
    stand = "unknown"
    m = re.match(r"^(\d{2})\.(\d{2})\.(\d{4})$", raw_datum)
    if m:
        stand = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

    print(f"[2/4] Fetching Hessen aggregate CSV (for seats + percent)", file=sys.stderr)
    hessen_text = fetch(HESSEN_CSV_URL)
    h_header, h_row = get_frankfurt_hessen_row(hessen_text)
    aliases = wg_alias_map(h_header, h_row)

    seats_by_short = party_seats_from_csv(h_header, h_row, aliases)
    weighted_by_short = party_votes_weighted(h_header, h_row, aliases)
    percent_by_short = party_percent_from_csv(h_header, h_row, aliases)

    print(f"[3/4] Fetching party metadata", file=sys.stderr)
    parties_meta = json.loads(fetch(PARTIES_JSON_URL))
    party_long = {p["name"]: p["longName"] for p in parties_meta}
    party_color = {p["name"]: p["color"] for p in parties_meta}

    # Authoritative party + candidate list comes from the existing app data
    # file. Each `parties[i]` has listNumber, shortName, fullName, candidates[]
    # with position/firstName/lastName/profession.
    print(f"[3.5/4] Loading candidate roster from {CANDIDATES_JSON.name}", file=sys.stderr)
    with CANDIDATES_JSON.open(encoding="utf-8") as f:
        roster = json.load(f)

    parties_out: list[dict] = []
    expected_total_candidates = 0
    matched_total_candidates = 0
    for party in roster["parties"]:
        list_number = party["listNumber"]
        short_name = party["shortName"]

        candidates_with_votes: list[dict] = []
        for c in party["candidates"]:
            stimmen = per_candidate_stimmen(cells, list_number, c["position"])
            expected_total_candidates += 1
            if stimmen is not None:
                matched_total_candidates += 1
            candidates_with_votes.append({
                "position": c["position"],
                "lastName": c["lastName"],
                "firstName": c["firstName"],
                "profession": c.get("profession"),
                "stimmen": stimmen,
            })

        # Stable order by ballot position. (UI may sort by stimmen if it wants.)
        candidates_with_votes.sort(key=lambda x: x["position"])

        absolute_total = per_party_total(cells, list_number)

        parties_out.append({
            "listNumber": list_number,
            "shortName": short_name,
            "fullName": party["fullName"],
            "color": party_color.get(short_name),
            "percent": percent_by_short.get(short_name),
            "votesAbsolute": absolute_total,
            "votesWeighted": weighted_by_short.get(short_name),
            "seats": seats_by_short.get(short_name, 0),
            "candidates": candidates_with_votes,
        })

    # Sort parties: largest seat-winners first, then by percent
    parties_out.sort(
        key=lambda p: (-(p["seats"] or 0), -(p["percent"] or 0))
    )

    # Aggregate totals — taken from the votemanager CSV's standard columns:
    # A1=Wahlberechtigte, B=Wähler:innen (gesamt), B1=Briefwahl, C=Ungültige,
    # D=gültige Stimmen.  (Per the votemanager OpenData spec.)
    totals = {
        "validVotes": parse_int(cells.get("D")),  # 22.300.148 ✓
        "validBallots": parse_int(cells.get("B"))   # Wähler insg.
                        and (parse_int(cells.get("B")) or 0) - (parse_int(cells.get("C")) or 0),
        "wahlberechtigte": parse_int(cells.get("A1")),
        "waehlerGesamt": parse_int(cells.get("B")),
        "ungueltigeStimmzettel": parse_int(cells.get("C")),
        "kandidatenInsgesamt": expected_total_candidates,
        # The Hessen aggregate CSV is authoritative for women-count + Listenkreuz
        "frauenInsgesamt": parse_int(csv_field(h_header, h_row, "Bewerberinnen")),
        "ballotsWithListenkreuz": parse_int(
            csv_field(h_header, h_row, "Stimmzettel mit Listenkreuz")
        ),
        "ballotsWithListenkreuzPercent": parse_float(
            csv_field(h_header, h_row, "Stimmzettel mit Listenkreuz (%)")
        ),
        "turnout": parse_float(csv_field(h_header, h_row, "Wahlbeteiligung")),
    }

    out = {
        "election": ELECTION_SLUG,
        "stand": stand,
        "totalSeats": TOTAL_SEATS,
        "totals": totals,
        "parties": parties_out,
        "sources": [
            VOTEMANAGER_CSV_URL,
            HESSEN_CSV_URL,
            PARTIES_JSON_URL,
        ],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")

    seat_total = sum(p["seats"] or 0 for p in parties_out)
    print(
        f"[4/4] Wrote {OUT.relative_to(REPO_ROOT)}\n"
        f"      parties={len(parties_out)}  candidates={expected_total_candidates}  "
        f"with_votes={matched_total_candidates}  seats={seat_total}  stand={stand}",
        file=sys.stderr,
    )

    if seat_total != TOTAL_SEATS:
        print(
            f"WARNING: expected {TOTAL_SEATS} seats; got {seat_total}",
            file=sys.stderr,
        )
        sys.exit(1)
    if matched_total_candidates < expected_total_candidates:
        missing = expected_total_candidates - matched_total_candidates
        print(
            f"WARNING: {missing} candidates have no Stimmen in the votemanager CSV",
            file=sys.stderr,
        )


if __name__ == "__main__":
    main()
