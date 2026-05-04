#!/usr/bin/env python3
"""Extract Frankfurt am Main Stadtverordnetenversammlung 2026 results.

Source: Stadt Frankfurt Statistikportal, https://statistikportal.frankfurt.de/fwa/kw2026/
Specifically the embedded plotly htmlwidgets in Kapitel_1_1.html, plus the
party-aggregate row from the Hessen-wide CSV at
https://wahlen.hessen-kw26.23degrees.eu/assets/Wahlergebnisse_Gemeindewahl2026_Hessen.csv

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

QUARTO_URL = "https://statistikportal.frankfurt.de/fwa/kw2026/Kapitel_1_1.html"
HESSEN_CSV_URL = (
    "https://wahlen.hessen-kw26.23degrees.eu/assets/"
    "Wahlergebnisse_Gemeindewahl2026_Hessen.csv"
)
PARTIES_JSON_URL = "https://wahlen.hessen-kw26.23degrees.eu/assets/parties.json"

# Frankfurt's Gebietsschlüssel for the Stadtverordnetenversammlung
FRANKFURT_KEY = "000412000"
ELECTION_SLUG = "frankfurt-stvv"
TOTAL_SEATS = 93

# Widget IDs in Kapitel_1_1.html (mapped during decoding)
W_CANDIDATES = "htmlwidget-b3fb547d350d8ce439f5"   # 17 traces, polar — elected with Stimmen
W_PARTY_PERCENT = "htmlwidget-09f565533ccb5313b386"  # 22 parties × %


def fetch(url: str) -> str:
    with urllib.request.urlopen(url) as r:
        return r.read().decode("utf-8")


def fetch_bytes(url: str) -> bytes:
    with urllib.request.urlopen(url) as r:
        return r.read()


def parse_widget_payloads(html: str) -> dict[str, dict]:
    """Return {widget_id: parsed_json} for every plotly htmlwidget in `html`."""
    pattern = re.compile(
        r'<script type="application/json" data-for="(htmlwidget-[a-zA-Z0-9]+)">'
        r'(.*?)</script>',
        re.DOTALL,
    )
    out: dict[str, dict] = {}
    for wid, payload in pattern.findall(html):
        out[wid] = json.loads(payload)
    return out


HOVER_RE = re.compile(
    r"<b>([^<]+)</b><br>([^<]+)<br>\s*([\d.]+)\s*Stimmen"
)


def parse_candidate_hover(text: str) -> tuple[str, str, int] | None:
    m = HOVER_RE.search(text)
    if not m:
        return None
    name = m.group(1).strip()
    party = m.group(2).strip()
    stimmen = int(m.group(3).replace(".", ""))
    return name, party, stimmen


def extract_elected_by_party(widget_data: list) -> dict[str, list[dict]]:
    """For each party trace, parse the hovertemplate(s) into elected-candidate dicts."""
    out: dict[str, list[dict]] = {}
    for trace in widget_data:
        party = trace.get("name", "").strip()
        ht = trace.get("hovertemplate")
        items: list[dict] = []
        # plotly serialises uniform single-element traces as a bare string
        # rather than a one-element list — handle both.
        if isinstance(ht, list):
            for h in ht:
                parsed = parse_candidate_hover(h)
                if parsed:
                    name, _p, stimmen = parsed
                    items.append({"name": name, "stimmen": stimmen})
        elif isinstance(ht, str):
            parsed = parse_candidate_hover(ht)
            if parsed:
                name, _p, stimmen = parsed
                items.append({"name": name, "stimmen": stimmen})
        # Sort by Stimmen desc just to be sure
        items.sort(key=lambda x: -x["stimmen"])
        out[party] = items
    return out


def extract_party_percent(widget_data: list) -> dict[str, float]:
    """Widget #0: a single bar trace with parties on y, percentages on x."""
    trace = widget_data[0]
    parties = trace["y"]
    percents = trace["x"]
    return {party: float(p) for party, p in zip(parties, percents)}


def get_frankfurt_csv_row(csv_text: str) -> tuple[list[str], list[str]]:
    """Return (header, frankfurt-row) tuple from the Hessen-wide CSV."""
    reader = csv.reader(io.StringIO(csv_text), delimiter=";")
    rows = list(reader)
    # Row 0: meta (election name, date, etc.)
    # Row 1: column headers
    # Row 2..N: per-Gemeinde data
    header = rows[1]
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


def parse_int(val: str | None) -> int | None:
    if val is None or val == "":
        return None
    try:
        return int(val.replace(".", "").replace(",", ""))
    except ValueError:
        return None


def parse_float(val: str | None) -> float | None:
    if val is None or val == "":
        return None
    try:
        return float(val.replace(",", "."))
    except ValueError:
        return None


def wg_alias_map(header: list[str], row: list[str]) -> dict[str, str]:
    """The Hessen-wide CSV uses generic `WG1..WG6` slots for Wählergruppen and
    records each city's actual short name in `WG<n> Kurzname`. Build a mapping
    {"WG1": "BFF", "WG2": "ELF", ...} so we can resolve those slots back to the
    real party names that the per-candidate plot uses.
    """
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
    """Parse all `<Party> Sitze` columns, resolving WGn slots to real names."""
    out: dict[str, int] = {}
    for i, col in enumerate(header):
        if col.endswith(" Sitze") and not col.endswith(" darunter Frauen"):
            party = resolve_alias(col[: -len(" Sitze")], aliases)
            n = parse_int(row[i])
            if n and n > 0:
                out[party] = n
    return out


def party_votes_absolute(
    header: list[str], row: list[str], aliases: dict[str, str]
) -> dict[str, int]:
    """Parse all `<Party> absolut` columns, resolving WGn slots."""
    out: dict[str, int] = {}
    for i, col in enumerate(header):
        if col.endswith(" absolut"):
            party = resolve_alias(col[: -len(" absolut")], aliases)
            n = parse_int(row[i])
            if n and n > 0:
                out[party] = n
    return out


def party_votes_weighted(
    header: list[str], row: list[str], aliases: dict[str, str]
) -> dict[str, int]:
    """Parse all `<Party> gewichtet` columns, resolving WGn slots."""
    out: dict[str, int] = {}
    for i, col in enumerate(header):
        if col.endswith(" gewichtet"):
            party = resolve_alias(col[: -len(" gewichtet")], aliases)
            n = parse_int(row[i])
            if n and n > 0:
                out[party] = n
    return out


def main() -> None:
    print(f"[1/4] Fetching Quarto page: {QUARTO_URL}", file=sys.stderr)
    html = fetch(QUARTO_URL)
    widgets = parse_widget_payloads(html)
    print(f"      → {len(widgets)} widgets parsed", file=sys.stderr)

    # Detect Stand date from the Quarto page
    stand = "unknown"
    m = re.search(r"Stand[:\s]+([0-9]{4}-[0-9]{2}-[0-9]{2})", html)
    if m:
        stand = m.group(1)

    print(f"[2/4] Fetching Hessen-wide CSV: {HESSEN_CSV_URL}", file=sys.stderr)
    csv_text = fetch(HESSEN_CSV_URL)
    header, frankfurt = get_frankfurt_csv_row(csv_text)

    # Use the CSV's own Stand timestamp if available
    csv_stand = csv_field(header, frankfurt, "Zeitstempel")
    if csv_stand and stand == "unknown":
        stand = csv_stand[:10]

    print(f"[3/4] Fetching official party metadata: {PARTIES_JSON_URL}", file=sys.stderr)
    parties_meta = json.loads(fetch(PARTIES_JSON_URL))
    party_long = {p["name"]: p["longName"] for p in parties_meta}
    party_color = {p["name"]: p["color"] for p in parties_meta}

    # Per-elected-candidate Stimmen from the polar widget
    elected_by_party = extract_elected_by_party(
        widgets[W_CANDIDATES]["x"]["data"]
    )

    # Per-party percentages from widget #0
    party_percent = extract_party_percent(widgets[W_PARTY_PERCENT]["x"]["data"])

    # The Hessen CSV uses generic WG1..WG6 slots for Wählergruppen; map them
    # back to Frankfurt's actual short names (BFF, ELF, IBF, DFRA, ...).
    aliases = wg_alias_map(header, frankfurt)

    # Per-party absolute and weighted votes + seats from CSV
    seats = party_seats_from_csv(header, frankfurt, aliases)
    votes_abs = party_votes_absolute(header, frankfurt, aliases)
    votes_wt = party_votes_weighted(header, frankfurt, aliases)

    # Merge: build the parties array, ranked by seats then vote share.
    # Use union of all party names that appear in any source (seats / percent / elected).
    all_names: set[str] = (
        set(seats.keys()) | set(party_percent.keys()) | set(elected_by_party.keys())
    )
    # Some sources spell things differently — normalise a few obvious aliases:
    aliases = {
        # CSV / parties.json sometimes use the long form, the Quarto plot the short
        "Die Linke": "Die Linke",
        "FREIE WÄHLER": "FREIE WÄHLER",
        "Tierschutzpartei": "Tierschutzpartei",
    }

    def short(s: str) -> str:
        return aliases.get(s, s)

    parties_out: list[dict] = []
    for name in all_names:
        n = short(name)
        entry = {
            "shortName": n,
            "fullName": party_long.get(n, n),
            "color": party_color.get(n),
            "percent": party_percent.get(n),
            "votesAbsolute": votes_abs.get(n),
            "votesWeighted": votes_wt.get(n),
            "seats": seats.get(n, 0),
            "elected": elected_by_party.get(n, []),
        }
        parties_out.append(entry)

    parties_out.sort(
        key=lambda p: (-(p["seats"] or 0), -(p["percent"] or 0))
    )

    totals = {
        "validVotes": parse_int(csv_field(header, frankfurt, "Gültige Stimmen")),
        "validBallots": parse_int(csv_field(header, frankfurt, "Gültige Stimmzettel")),
        "turnout": parse_float(csv_field(header, frankfurt, "Wahlbeteiligung")),
        "kandidatenInsgesamt": parse_int(
            csv_field(header, frankfurt, "Bewerberinnen und Bewerber insgesamt")
        ),
        "frauenInsgesamt": parse_int(csv_field(header, frankfurt, "Bewerberinnen")),
        "ballotsWithListenkreuz": parse_int(
            csv_field(header, frankfurt, "Stimmzettel mit Listenkreuz")
        ),
        "ballotsWithListenkreuzPercent": parse_float(
            csv_field(header, frankfurt, "Stimmzettel mit Listenkreuz (%)")
        ),
    }

    out = {
        "election": ELECTION_SLUG,
        "stand": stand,
        "totalSeats": TOTAL_SEATS,
        "totals": totals,
        "parties": parties_out,
        "sources": [
            QUARTO_URL,
            HESSEN_CSV_URL,
            PARTIES_JSON_URL,
        ],
    }

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")

    elected_total = sum(len(p["elected"]) for p in parties_out)
    seats_total = sum((p["seats"] or 0) for p in parties_out)
    print(f"[4/4] Wrote {OUT.relative_to(REPO_ROOT)}", file=sys.stderr)
    print(
        f"      parties={len(parties_out)}  elected_with_votes={elected_total}  "
        f"seat_total={seats_total}  stand={stand}",
        file=sys.stderr,
    )

    if elected_total != TOTAL_SEATS or seats_total != TOTAL_SEATS:
        print(
            f"WARNING: expected {TOTAL_SEATS} elected and {TOTAL_SEATS} seats; "
            f"got {elected_total} elected and {seats_total} seats",
            file=sys.stderr,
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
