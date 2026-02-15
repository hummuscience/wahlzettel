#!/usr/bin/env python3
"""Parse Wiesbaden Wahlvorschläge PDF to extract STVV candidates."""

import json
import re
import sys

import pdfplumber

PDF_PATH = "/tmp/wiesbaden-wahlvorschlaege.pdf"

# Wiesbaden STVV parties from the PDF (Section I, pages 1-11)
PARTIES = [
    (1, "Christlich Demokratische Union Deutschlands", "CDU"),
    (2, "Alternative für Deutschland", "AfD"),
    (3, "Sozialdemokratische Partei Deutschlands", "SPD"),
    (4, "BÜNDNIS 90/DIE GRÜNEN", "GRÜNE"),
    (5, "Freie Demokratische Partei", "FDP"),
    (6, "DIE LINKE", "DIE LINKE"),
    (7, "Volt Deutschland", "Volt"),
    (8, "PRO AUTO – Die Bürgerlichen!", "PRO AUTO"),
    (9, "Bürgerliste Wiesbaden", "BLW"),
    (10, "Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative", "Die PARTEI"),
    (11, "Die Gerechtigkeitspartei – Team Todenhöfer", "Die Gerechtigkeitspartei"),
    (12, "Bündnis Sahra Wagenknecht – Vernunft und Gerechtigkeit", "BSW"),
    (13, "FWG Wiesbaden e.V.", "FWG"),
    (14, "Partei des Fortschritts", "PdF"),
    (15, "FREIE WÄHLER", "FREIE WÄHLER"),
]

# Expected candidate counts per party (from the PDF, candidates numbered X01-X81 etc.)
EXPECTED_COUNTS = {
    1: 81,   # CDU: 101-181
    2: 35,   # AfD: 201-235
    3: 81,   # SPD: 301-381
    4: 54,   # GRÜNE: 401-454
    5: 79,   # FDP: 501-579
    6: 36,   # DIE LINKE: 601-636
    7: 28,   # Volt: 701-728
    8: 40,   # PRO AUTO: 801-840
    9: 28,   # BLW: 901-928
    10: 18,  # Die PARTEI: 1001-1018
    11: 39,  # Die Gerechtigkeitspartei: 1101-1139
    12: 29,  # BSW: 1201-1229
    13: 37,  # FWG: 1301-1337
    14: 3,   # PdF: 1401-1403
    15: 74,  # FREIE WÄHLER: 1501-1574
}


def parse_candidate_line(line, party_num):
    """Parse a candidate line like '101 Georgi, Daniela, Beamtin, geb. 1979 in Tettnang, Wiesbaden'"""
    # Match: number, last name, first name, profession, geb. year in birthplace, residence
    # The number prefix is party_num * 100 + position
    m = re.match(
        r'(\d+)\s+'            # candidate number
        r'(.+?),\s+'           # last name (may include titles like "Dr.")
        r'(.+?),\s+'           # first name
        r'(.+?),\s+'           # profession
        r'geb\.\s+(\d{4})',    # birth year
        line.strip()
    )
    if not m:
        return None

    cand_num = int(m.group(1))
    last_name = m.group(2).strip()
    first_name = m.group(3).strip()
    profession = m.group(4).strip()

    # Calculate position from candidate number
    base = party_num * 100
    if party_num >= 10:
        base = party_num * 100
    position = cand_num - base

    return {
        "id": f"wi-stvv-{party_num}-{position}",
        "position": position,
        "lastName": last_name,
        "firstName": first_name,
        "profession": profession,
    }


def main():
    pdf = pdfplumber.open(PDF_PATH)

    # Extract text from pages 1-11 (Section I: Stadtverordnetenwahl)
    # Page 12+ is Section II: Ausländerbeiratswahl
    all_text = ""
    for page_num in range(11):  # pages 0-10 (1-11 in PDF)
        page = pdf.pages[page_num]
        text = page.extract_text()
        if text:
            all_text += text + "\n"

    # Split into lines
    lines = all_text.split('\n')

    # Parse candidates by party
    parties_data = []
    current_party_idx = -1
    candidates = []

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # Check if this is a party header line
        # e.g., "Nr. 1 Christlich Demokratische Union Deutschlands CDU"
        party_header = re.match(r'Nr\.\s+(\d+)\s+', line)
        if party_header:
            party_num = int(party_header.group(1))
            # Save previous party's candidates
            if current_party_idx >= 0 and candidates:
                parties_data.append(candidates)
                candidates = []
            current_party_idx = party_num - 1
            continue

        # Skip non-candidate lines
        if current_party_idx < 0:
            continue

        # Skip header/title lines
        if line.startswith('Kommunalwahlen 2026') or line.startswith('I Stadtverordnetenwahl'):
            continue
        if line.startswith('Die Bewerberinnen und Bewerber sind:'):
            continue
        if re.match(r'^(CDU|AfD|SPD|GRÜNE|FDP|DIE LINKE|Volt|PRO AUTO|BLW|Die PARTEI|Die Gerechtigkeitspartei|BSW|FWG|PdF|FREIE WÄHLER)$', line):
            continue

        # Try to parse as candidate
        party_num = PARTIES[current_party_idx][0]
        cand = parse_candidate_line(line, party_num)
        if cand:
            candidates.append(cand)

    # Don't forget the last party
    if candidates:
        parties_data.append(candidates)

    # Build the final JSON structure
    result = {
        "election": "wiesbaden-stvv",
        "name": "Stadtverordnetenversammlung Wiesbaden",
        "totalStimmen": 81,
        "maxPerCandidate": 3,
        "parties": [],
    }

    for i, (list_num, full_name, short_name) in enumerate(PARTIES):
        if i < len(parties_data):
            cands = parties_data[i]
        else:
            cands = []

        party = {
            "listNumber": list_num,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(cands),
            "candidates": cands,
        }
        result["parties"].append(party)

    # Validation
    print("=== Wiesbaden STVV Candidate Counts ===", file=sys.stderr)
    total = 0
    for party in result["parties"]:
        count = party["candidateCount"]
        expected = EXPECTED_COUNTS.get(party["listNumber"], "?")
        status = "✓" if count == expected else f"✗ (expected {expected})"
        print(f"  Nr. {party['listNumber']:2d} {party['shortName']:25s}: {count:3d} candidates {status}", file=sys.stderr)
        total += count
    print(f"  Total: {total} candidates", file=sys.stderr)

    # Output JSON
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
    print()


if __name__ == "__main__":
    main()
