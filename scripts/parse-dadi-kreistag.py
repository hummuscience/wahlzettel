#!/usr/bin/env python3
"""Parse Kreistagswahl Darmstadt-Dieburg candidate data from PDF.

Source: https://www.ladadi.de/medien/pdfs/fb-102-buero-des-landrats/kommunalwahl-2026/012-bekanntmachung-zugelassene-wahlvorschlaege.pdf
Output: public/data/dadi-kreistag.json
"""

import json
import os
import re

try:
    import pdfplumber
except ImportError:
    os.system("pip install pdfplumber")
    import pdfplumber

SCRIPT_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "data")

PDF_PATH = "/tmp/dadi-kreistag.pdf"
OUTPUT_FILE = "dadi-kreistag.json"
TOTAL_STIMMEN = 81
ID_PREFIX = "dd-kt"

# Party info from the official Bekanntmachung
PARTIES = {
    1:  ("CDU", "Christlich Demokratische Union Deutschlands"),
    2:  ("AfD", "Alternative für Deutschland"),
    3:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
    4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
    5:  ("FDP", "Freie Demokratische Partei"),
    6:  ("Die Linke", "Die Linke"),
    7:  ("UWG", "Unabhängige Wählergemeinschaften Darmstadt-Dieburg"),
    8:  ("FREIE WÄHLER", "FREIE WÄHLER"),
    9:  ("Die PARTEI", "Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative"),
    10: ("Volt", "Volt Deutschland"),
    11: ("Tierschutzpartei", "PARTEI MENSCH UMWELT TIERSCHUTZ"),
    12: ("BSW", "Bündnis Sahra Wagenknecht - Vernunft und Gerechtigkeit"),
}


def main():
    print(f"Parsing: {PDF_PATH}")
    pdf = pdfplumber.open(PDF_PATH)

    # Strategy: iterate pages, track current party via "Wahlvorschlag N:" headers,
    # extract all table rows for each party.
    party_candidates: dict[int, list[dict]] = {n: [] for n in PARTIES}
    current_party_num = None

    for page_idx, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        tables = page.extract_tables()

        # Find all party headers on this page with their approximate position
        headers_on_page = []
        for line in text.split("\n"):
            m = re.match(r"Wahlvorschlag\s+(\d+):", line)
            if m:
                headers_on_page.append(int(m.group(1)))

        if len(headers_on_page) == 0:
            # Continuation page — all tables belong to current_party_num
            for table in tables:
                _extract_candidates(table, current_party_num, party_candidates)
        elif len(tables) == len(headers_on_page):
            # Each table matches a new party header
            for table, party_num in zip(tables, headers_on_page):
                current_party_num = party_num
                _extract_candidates(table, current_party_num, party_candidates)
        elif len(tables) == len(headers_on_page) + 1:
            # First table is continuation of previous party, rest are new parties
            _extract_candidates(tables[0], current_party_num, party_candidates)
            for table, party_num in zip(tables[1:], headers_on_page):
                current_party_num = party_num
                _extract_candidates(table, current_party_num, party_candidates)
        else:
            # Fallback: assign first table to previous, rest sequentially
            _extract_candidates(tables[0], current_party_num, party_candidates)
            for i, party_num in enumerate(headers_on_page):
                current_party_num = party_num
                if i + 1 < len(tables):
                    _extract_candidates(tables[i + 1], current_party_num, party_candidates)

    # Build output
    parties = []
    for party_num in sorted(PARTIES.keys()):
        short_name, full_name = PARTIES[party_num]
        candidates = sorted(party_candidates[party_num], key=lambda c: c["position"])
        parties.append({
            "listNumber": party_num,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(candidates),
            "candidates": candidates,
        })
        print(f"  Liste {party_num}: {short_name} — {len(candidates)} candidates")

    total_candidates = sum(p["candidateCount"] for p in parties)
    print(f"\nTotal: {len(parties)} parties, {total_candidates} candidates")

    for p in parties:
        if p["candidateCount"] == 0:
            print(f"WARNING: {p['shortName']} has 0 candidates!")

    output = {
        "totalStimmen": TOTAL_STIMMEN,
        "maxPerCandidate": 3,
        "parties": parties,
    }

    output_path = os.path.join(OUTPUT_DIR, OUTPUT_FILE)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nOutput: {output_path}")


def _extract_candidates(table: list[list], party_num: int, party_candidates: dict):
    """Extract candidate rows from a pdfplumber table."""
    for row in table:
        if not row or not row[0]:
            continue
        lfd_nr = row[0].strip().replace("\n", "")
        if not lfd_nr.isdigit():
            continue  # header row

        pos = int(lfd_nr)
        # Skip duplicates (from repeated headers on continuation pages)
        if any(c["position"] == pos for c in party_candidates[party_num]):
            continue

        last_name = (row[1] or "").strip()
        first_name = (row[2] or "").strip()
        profession = (row[3] or "").strip()

        party_candidates[party_num].append({
            "id": f"{ID_PREFIX}-{party_num}-{pos}",
            "position": pos,
            "lastName": last_name,
            "firstName": first_name,
            "profession": profession,
        })


if __name__ == "__main__":
    main()
