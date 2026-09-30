#!/usr/bin/env python3
"""Berlin 2026 results extractor — Abgeordnetenhaus + 12 BVV.

Source: Der Landeswahlleiter für Berlin, wahlen-berlin.de (votemanager-style
result portal). Every result page carries
  - an "Ergebnistabelle" whose <td data-sort="…"> cells hold unformatted
    numbers (absolute, percent, change vs. 2023), and
  - the Sitzverteilung pie chart as JSON in a data-* attribute.
The "Gewählte" pages list every elected member (AGH: split into Wahlkreis
and Liste; BVV: in list order per Bezirk).

The per-Wahlbezirk CSV exports on the downloads pages hold the same numbers
at finer grain, but the aggregated page tables are the official totals, so
we read those.

Usage:
  python3 scripts/parse-berlin-results.py

Out:  public/data/results-berlin-abgh.json
      public/data/results-berlin-bvv-{bezirk}.json   (×12)
"""

from __future__ import annotations

import re
import sys

from wahlportal import (
    TOTAL_ROWS, dhondt, fetch, gewaehlte_tables, num, parse_stand, party_meta,
    pct, result_rows, seat_chart, split_name, to_int, totals_block, write,
)

BASE ="https://wahlen-berlin.de/wahlen/BE2026/Afspraes"
AGH_URL = f"{BASE}/agh/ergebnisse.html"
AGH_GEWAEHLTE_URL = f"{BASE}/agh/gewaehlte.html"
BVV_URL = f"{BASE}/bvv/ergebnisse_bezirk_{{nr:02d}}.html"
BVV_GEWAEHLTE_URL = f"{BASE}/bvv/gewaehlte.html"

# Official Bezirk number → our slug suffix.
BEZIRKE: dict[int, str] = {
    1: "mitte",
    2: "friedrichshain-kreuzberg",
    3: "pankow",
    4: "charlottenburg-wilmersdorf",
    5: "spandau",
    6: "steglitz-zehlendorf",
    7: "tempelhof-schoeneberg",
    8: "neukoelln",
    9: "treptow-koepenick",
    10: "marzahn-hellersdorf",
    11: "lichtenberg",
    12: "reinickendorf",
}

BVV_SEATS = 55          # § 22 LWahlG: 55 Mitglieder, d'Hondt, 3 %-Hürde
BVV_THRESHOLD = 3.0

# Editorial — same default order as the Hessen/Bayern extractors.
DEFAULT_IDEOLOGICAL_ORDER = [
    "Die Linke", "DKP", "SGP", "Die PARTEI",
    "SPD", "GRÜNE", "Volt", "Die Urbane",
    "Tierschutzpartei", "ÖDP", "PdF",
    "FDP", "FREIE WÄHLER",
    "CDU",
    "BSW",
    "AfD", "HEIMAT",
]

# ── Abgeordnetenhaus ────────────────────────────────────────────────────────

def ingest_agh() -> None:
    print("Abgeordnetenhaus…", file=sys.stderr)
    page = fetch(AGH_URL)
    seats, total_seats, info = seat_chart(page)
    stand, status = parse_stand(info)
    meta = party_meta(page)

    rows = result_rows(page)
    by_label = {label: vals for label, vals in rows}
    # Columns: Erst (abs, %, Δ), Zweit (abs, %, Δ)

    tables = gewaehlte_tables(fetch(AGH_GEWAEHLTE_URL))
    wk_rows, list_rows = tables[0], tables[1]
    elected: dict[str, list[dict]] = {}
    wahlkreise = []
    for gebiet, name, party in (r[:3] for r in wk_rows):
        last, first = split_name(name)
        code, _, wk_name = gebiet.partition(" - ")
        wahlkreise.append({
            "id": code,
            "name": wk_name,
            "bezirk": re.sub(r"\s+\d+$", "", wk_name),
            "winner": {"lastName": last, "firstName": first, "party": party},
        })
        elected.setdefault(party, []).append(
            {"lastName": last, "firstName": first, "via": "wahlkreis", "wahlkreis": wk_name})
    for _gebiet, name, party in (r[:3] for r in list_rows):
        last, first = split_name(name)
        elected.setdefault(party, []).append({"lastName": last, "firstName": first, "via": "liste"})

    parties = []
    list_no = 0
    for label, vals in rows:
        if label in TOTAL_ROWS:
            continue
        zweit = to_int(vals[3]) if len(vals) > 3 else None
        erst = to_int(vals[0]) if vals else None
        if zweit is None:
            continue  # Einzelbewerber:innen (Erststimme only) — no list
        list_no += 1
        members = elected.get(label, [])
        parties.append({
            "listNumber": list_no,
            "shortName": label,
            "fullName": seats.get(label, {}).get("fullName") or meta.get(label, {}).get("fullName") or label,
            "color": seats.get(label, {}).get("color") or meta.get(label, {}).get("color"),
            "percent": pct(vals[4]),
            "percentChange": pct(vals[5]),
            "votesAbsolute": zweit,
            "votesWeighted": None,
            "seats": seats.get(label, {}).get("seats", 0),
            "direktmandate": sum(1 for m in members if m["via"] == "wahlkreis"),
            "erststimmen": None if erst is None else {
                "votesAbsolute": erst,
                "percent": pct(vals[1]),
                "percentChange": pct(vals[2]),
            },
            "candidates": [
                {"position": i + 1, "stimmen": None, "elected": True, "profession": None, **m}
                for i, m in enumerate(members)
            ],
        })

    # Sanity: seats per party must equal elected members per party.
    for p in parties:
        if p["seats"] != len(p["candidates"]):
            raise SystemExit(f"AGH {p['shortName']}: {p['seats']} seats but "
                             f"{len(p['candidates'])} elected members")
    if sum(p["seats"] for p in parties) != total_seats:
        raise SystemExit("AGH seat total mismatch")

    parties.sort(key=lambda p: (-p["seats"], -(p["percent"] or 0)))
    write("berlin-abgh", {
        "election": "berlin-abgh",
        "stand": stand,
        "status": status,
        "previousYear": 2023,
        "totalSeats": total_seats,
        "totals": totals_block(by_label, 3, to_int(by_label["Gültige Stimmen"][3])),
        "parties": parties,
        "wahlkreise": wahlkreise,
        "ideologicalOrder": DEFAULT_IDEOLOGICAL_ORDER,
        "sources": [AGH_URL, AGH_GEWAEHLTE_URL],
    })


# ── Bezirksverordnetenversammlungen ─────────────────────────────────────────

def ingest_bvv() -> None:
    print("BVV…", file=sys.stderr)
    gew = gewaehlte_tables(fetch(BVV_GEWAEHLTE_URL))[0]
    members_by_bezirk: dict[int, dict[str, list[dict]]] = {}
    for gebiet, name, party, *_ in gew:
        nr = int(gebiet.split(" - ")[0])
        last, first = split_name(name)
        members_by_bezirk.setdefault(nr, {}).setdefault(party, []).append(
            {"lastName": last, "firstName": first})

    for nr, suffix in BEZIRKE.items():
        slug = f"berlin-bvv-{suffix}"
        url = BVV_URL.format(nr=nr)
        page = fetch(url)
        seats, total_seats, info = seat_chart(page)
        stand, status = parse_stand(info)
        meta = party_meta(page)
        rows = result_rows(page)
        by_label = {label: vals for label, vals in rows}
        members = members_by_bezirk.get(nr, {})

        parties = []
        list_no = 0
        for label, vals in rows:
            if label in TOTAL_ROWS or not vals or to_int(vals[0]) is None:
                continue
            list_no += 1
            elected = members.get(label, [])
            parties.append({
                "listNumber": list_no,
                "shortName": label,
                "fullName": seats.get(label, {}).get("fullName") or meta.get(label, {}).get("fullName") or label,
                "color": seats.get(label, {}).get("color") or meta.get(label, {}).get("color"),
                "percent": pct(vals[1]),
                "percentChange": pct(vals[2]),
                "votesAbsolute": to_int(vals[0]),
                "votesWeighted": None,
                "seats": seats.get(label, {}).get("seats", 0),
                "candidates": [
                    {"position": i + 1, "stimmen": None, "elected": True, "profession": None, **m}
                    for i, m in enumerate(elected)
                ],
            })

        # Sanity 1: seats = elected members, sum = chart total.
        for p in parties:
            if p["seats"] != len(p["candidates"]):
                raise SystemExit(f"{slug} {p['shortName']}: {p['seats']} seats but "
                                 f"{len(p['candidates'])} elected members")
        if sum(p["seats"] for p in parties) != total_seats:
            raise SystemExit(f"{slug}: seat total mismatch")
        # Sanity 2: recompute d'Hondt over parties ≥ 3 %. A mismatch is only a
        # warning — an exhausted list legally shrinks the BVV (§ 22 LWahlG).
        eligible = {p["shortName"]: p["votesAbsolute"] for p in parties
                    if (p["percent"] or 0) >= BVV_THRESHOLD}
        recomputed = dhondt(eligible, BVV_SEATS)
        diff = {k: (v, next(p["seats"] for p in parties if p["shortName"] == k))
                for k, v in recomputed.items()
                if v != next(p["seats"] for p in parties if p["shortName"] == k)}
        if diff or total_seats != BVV_SEATS:
            print(f"  ! {slug}: d'Hondt check differs {diff} (total {total_seats})", file=sys.stderr)

        parties.sort(key=lambda p: (-p["seats"], -(p["percent"] or 0)))
        write(slug, {
            "election": slug,
            "stand": stand,
            "status": status,
            "previousYear": 2023,
            "totalSeats": total_seats,
            "totals": totals_block(by_label, 0, to_int(by_label["Gültige Stimmen"][0])),
            "parties": parties,
            "ideologicalOrder": DEFAULT_IDEOLOGICAL_ORDER,
            "sources": [url, BVV_GEWAEHLTE_URL],
        })


def main() -> None:
    ingest_agh()
    ingest_bvv()


if __name__ == "__main__":
    main()
