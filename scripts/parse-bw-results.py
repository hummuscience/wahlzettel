#!/usr/bin/env python3
"""Baden-Württemberg Landtagswahl 2026 results extractor.

Source: Statistisches Landesamt BW, wahlen.statistik-bw.de/ltw26/ — the same
votemanager template as Berlin (see wahlportal.py). The Land page carries
  - the Ergebnistabelle (Erst- and Zweitstimmen, change vs. 2021),
  - the seat pie (incl. Überhang-/Ausgleichsmandate),
  - "Gewählte in Wahlkreisen" (70 rows) and one "Gewählte auf Landeslisten"
    table per party, each preceded by a heading with the party name.

The page shows only "Endgültiges Ergebnis" without a date; STAND is the date
of the Landeswahlleiterin's final seat allocation (ltw26-sitzverteilung.pdf).

Usage:
  python3 scripts/parse-bw-results.py

Out:  public/data/results-bw-landtagswahl.json
"""

from __future__ import annotations

import re
import sys

from wahlportal import (
    TOTAL_ROWS, clean, fetch, gewaehlte_tables, parse_stand, party_meta, pct,
    result_rows, seat_chart, split_name, to_int, totals_block, write,
)

SLUG = "bw-landtagswahl"
URL = "https://wahlen.statistik-bw.de/ltw26/ergebnispraesentation.html"
STAND = "2026-03-27"

DEFAULT_IDEOLOGICAL_ORDER = [
    "Die Linke", "Die PARTEI",
    "SPD", "GRÜNE", "Volt", "KlimalisteBW",
    "Tierschutzpartei", "ÖDP",
    "FDP", "FREIE WÄHLER",
    "CDU", "Bündnis C", "Werteunion",
    "BSW", "dieBasis",
    "AfD",
]


def list_tables_by_party(page: str) -> dict[str, list[list[str]]]:
    """"Gewählte auf Landeslisten" tables, keyed by the party heading that
    precedes each one (the table itself has no party column)."""
    out: dict[str, list[list[str]]] = {}
    headings = [(m.start(), clean(m.group(1)))
                for m in re.finditer(r"<h[23][^>]*>(.*?)</h[23]>", page, flags=re.S)]
    for m in re.finditer(r"<table.*?</table>", page, flags=re.S):
        if "auf Landeslisten" not in m.group(0):  # raw HTML: "Gew&auml;hlte auf …"
            continue
        party = [h for pos, h in headings if pos < m.start()][-1]
        rows = gewaehlte_tables(m.group(0))[0]
        out[party] = [r for r in rows if r and r[0].isdigit()]
    return out


def main() -> None:
    print("BW Landtagswahl…", file=sys.stderr)
    page = fetch(URL)
    seats, total_seats, info = seat_chart(page)
    stand, status = parse_stand(info, fallback_date=STAND)
    meta = party_meta(page)
    rows = result_rows(page)
    by_label = {label: vals for label, vals in rows}

    # Direktmandate: first table whose rows look like "01 - Stuttgart I | Name | Partei | …"
    wk_rows = next(t for t in gewaehlte_tables(page)
                   if len(t) == 70 and re.match(r"\d{2} - ", t[0][0]))
    elected: dict[str, list[dict]] = {}
    wahlkreise = []
    for gebiet, name, party, *_ in sorted(wk_rows, key=lambda r: r[0]):
        last, first = split_name(name)
        code, _, wk_name = gebiet.partition(" - ")
        wahlkreise.append({
            "id": code, "name": wk_name, "bezirk": "",
            "winner": {"lastName": last, "firstName": first, "party": party},
        })
        elected.setdefault(party, []).append(
            {"lastName": last, "firstName": first, "via": "wahlkreis", "wahlkreis": wk_name})
    for party, lrows in list_tables_by_party(page).items():
        for _listenplatz, name, *_ in lrows:
            last, first = split_name(name)
            elected.setdefault(party, []).append({"lastName": last, "firstName": first, "via": "liste"})

    parties = []
    list_no = 0
    for label, vals in rows:
        if label in TOTAL_ROWS or len(vals) < 6 or to_int(vals[3]) is None:
            continue  # Einzelbewerber:innen / Kreiswahlvorschläge without a Landesliste
        list_no += 1
        members = elected.get(label, [])
        parties.append({
            "listNumber": list_no,
            "shortName": label,
            "fullName": seats.get(label, {}).get("fullName") or meta.get(label, {}).get("fullName") or label,
            "color": seats.get(label, {}).get("color") or meta.get(label, {}).get("color"),
            "percent": pct(vals[4]),
            "percentChange": pct(vals[5]),
            "votesAbsolute": to_int(vals[3]),
            "votesWeighted": None,
            "seats": seats.get(label, {}).get("seats", 0),
            "direktmandate": sum(1 for m in members if m["via"] == "wahlkreis"),
            "erststimmen": None if to_int(vals[0]) is None else {
                "votesAbsolute": to_int(vals[0]),
                "percent": pct(vals[1]),
                "percentChange": pct(vals[2]),
            },
            "candidates": [
                {"position": i + 1, "stimmen": None, "elected": True, "profession": None, **m}
                for i, m in enumerate(members)
            ],
        })

    for p in parties:
        if p["seats"] != len(p["candidates"]):
            raise SystemExit(f"BW {p['shortName']}: {p['seats']} seats but "
                             f"{len(p['candidates'])} elected members")
    if sum(p["seats"] for p in parties) != total_seats:
        raise SystemExit("BW seat total mismatch")
    if len(wahlkreise) != 70:
        raise SystemExit(f"BW: expected 70 Wahlkreise, got {len(wahlkreise)}")

    parties.sort(key=lambda p: (-p["seats"], -(p["percent"] or 0)))
    write(SLUG, {
        "election": SLUG,
        "stand": stand,
        "status": status,
        "previousYear": 2021,
        "totalSeats": total_seats,
        "totals": totals_block(by_label, 3, to_int(by_label["Gültige Stimmen"][3])),
        "parties": parties,
        "wahlkreise": wahlkreise,
        "ideologicalOrder": DEFAULT_IDEOLOGICAL_ORDER,
        "sources": [URL],
    })


if __name__ == "__main__":
    main()
