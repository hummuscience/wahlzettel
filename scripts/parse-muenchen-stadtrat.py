#!/usr/bin/env python3
"""Parse the München Stadtrat 2026 Bekanntmachung PDF to extract candidate data."""

import json
import re
import sys
import os

try:
    import pdfplumber
except ImportError:
    os.system("pip install pdfplumber")
    import pdfplumber

PDF_PATH = os.environ.get(
    "PDF_PATH",
    "/tmp/muenchen-stadtrat-2026.pdf",
)
OUTPUT_PATH = os.path.join(
    os.path.dirname(__file__), "..", "public", "data", "muenchen-stadtrat.json"
)

# 14 parties from the Bekanntmachung, page 1
PARTY_INFO = {
    1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
    2:  ("FREIE WÄHLER", "FREIE WÄHLER Bayern / FW FREIE WÄHLER München"),
    3:  ("AfD", "Alternative für Deutschland"),
    4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
    5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
    6:  ("ÖDP", "Ökologisch-Demokratische Partei"),
    7:  ("FDP", "Freie Demokratische Partei"),
    8:  ("Die Linke", "Die Linke"),
    9:  ("Volt", "Volt Deutschland"),
    10: ("Die PARTEI", "Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative"),
    11: ("Rosa Liste", "Wähler*inneninitiative Rosa Liste München e.V."),
    12: ("München-Liste", "München-Liste"),
    13: ("BP", "Bayernpartei"),
    14: ("BK", "Bündnis Kultur"),
}

# Kennwort as it appears in bold in the PDF header lines
KENNWORT_MAP = {
    "Christlich-Soziale Union in Bayern e.V.": 1,
    "FREIE WÄHLER Bayern / FW FREIE WÄHLER München": 2,
    "Alternative für Deutschland": 3,
    "BÜNDNIS 90/DIE GRÜNEN": 4,
    "Sozialdemokratische Partei Deutschlands": 5,
    "Ökologisch-Demokratische Partei": 6,
    "Freie Demokratische Partei": 7,
    "Die Linke": 8,
    "Volt Deutschland": 9,
    "Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative": 10,
    # Shorter variants that may appear
    "Rosa Liste München e.V.": 11,
    "München-Liste": 12,
    "Bayernpartei": 13,
    "Bündnis Kultur": 14,
}


def parse_name(raw_name: str) -> tuple[str, str]:
    """Parse 'LastName FirstName' or 'Dr. LastName FirstName' into (lastName, firstName).

    The PDF format is: "Familienname, Vorname, evtl.: Geburtsname und akademische Grade..."
    First line: "Baumgärtner Clemens,"
    So format is: LastName FirstName, (with comma at end, profession on next line)

    Handle titles like Dr., Prof., etc.
    """
    # Remove trailing comma if present
    name = raw_name.strip().rstrip(",").strip()

    # Handle academic titles at the start
    title = ""
    title_pattern = r'^((?:Prof\.\s*)?Dr\.\s*)'
    m = re.match(title_pattern, name)
    if m:
        title = m.group(1).strip()
        name = name[m.end():].strip()

    # Split on first space: "LastName FirstName" or "LastName-Part FirstName"
    # But be careful with multi-part last names like "Spiegel-Luttringer Annamaria"
    # or "Dueñas Martin Del Campo Alejandro"
    parts = name.split()
    if len(parts) == 1:
        last_name = parts[0]
        first_name = ""
    else:
        last_name = parts[0]
        first_name = " ".join(parts[1:])

    # Prepend title to lastName
    if title:
        last_name = f"{title} {last_name}"

    return last_name, first_name


def extract_candidates(pdf_path: str) -> list[dict]:
    """Extract all parties and candidates from the PDF."""
    parties = []
    current_party_num = None
    current_candidates = []

    with pdfplumber.open(pdf_path) as pdf:
        full_text = ""
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text += text + "\n"

    # Split by party headers
    # Pattern: "Für die Wahl des Stadtrats wurden beim Wahlvorschlag Nr. X"
    # followed by "Kennwort PARTY NAME"
    party_sections = re.split(
        r'Für die Wahl des Stadtrats wurden beim Wahlvorschlag Nr\.\s*(\d+)',
        full_text
    )

    # party_sections[0] is preamble (page 1 summary), then alternating: number, content
    for i in range(1, len(party_sections), 2):
        party_num = int(party_sections[i])
        section = party_sections[i + 1] if i + 1 < len(party_sections) else ""

        # Extract Kennwort from the section
        kennwort_match = re.search(r'Kennwort\s+(.+?)(?:\n|folgende)', section)
        kennwort = kennwort_match.group(1).strip() if kennwort_match else f"Party {party_num}"

        short_name, full_name = PARTY_INFO.get(party_num, (kennwort, kennwort))

        # Extract candidates from lines matching position number pattern
        # Format in extracted text: "1 Baumgärtner Clemens, 1976\nBerufsmäßiger Stadtrat..."
        # Or sometimes: "1 Baumgärtner Clemens, 1976 Berufsmäßiger Stadtrat..."

        candidates = []
        lines = section.split('\n')

        j = 0
        while j < len(lines):
            line = lines[j].strip()

            # Match candidate line: starts with position number
            # "1 Baumgärtner Clemens, 1976"
            # or "1 Baumgärtner Clemens, 1976"
            m = re.match(r'^(\d{1,2})\s+(.+?),?\s+(\d{4})\s*$', line)
            if not m:
                # Try: "1 Dr. Menges Evelyne, 1959"
                m = re.match(r'^(\d{1,2})\s+(.+?),\s*(\d{4})\s*$', line)

            if m:
                pos = int(m.group(1))
                name_raw = m.group(2).strip()
                # birth_year = m.group(3)  # We don't use birth year

                # Next line should be profession
                profession = ""
                if j + 1 < len(lines):
                    next_line = lines[j + 1].strip()
                    # Profession line should NOT start with a number (next candidate)
                    # and should not be a party header
                    if next_line and not re.match(r'^\d{1,2}\s+\S', next_line) and \
                       'Wahlvorschlag' not in next_line and \
                       'Kennwort' not in next_line and \
                       'Lfd.-' not in next_line and \
                       'Familienname' not in next_line and \
                       'folgende' not in next_line:
                        profession = next_line.rstrip(',').strip()
                        j += 1

                last_name, first_name = parse_name(name_raw)

                candidates.append({
                    "id": f"m-sr-{party_num}-{pos}",
                    "position": pos,
                    "lastName": last_name,
                    "firstName": first_name,
                    "profession": profession,
                })

            j += 1

        parties.append({
            "listNumber": party_num,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(candidates),
            "candidates": candidates,
        })

        print(f"  Liste {party_num}: {short_name} — {len(candidates)} candidates")

    return parties


def main():
    print(f"Parsing: {PDF_PATH}")
    parties = extract_candidates(PDF_PATH)

    total_candidates = sum(p["candidateCount"] for p in parties)
    print(f"\nTotal: {len(parties)} parties, {total_candidates} candidates")

    # Validate
    if len(parties) != 14:
        print(f"WARNING: Expected 14 parties, got {len(parties)}")

    for p in parties:
        if p["candidateCount"] == 0:
            print(f"WARNING: {p['shortName']} has 0 candidates!")
        # Verify positions are sequential
        positions = [c["position"] for c in p["candidates"]]
        expected = list(range(1, len(positions) + 1))
        if positions != expected:
            print(f"WARNING: {p['shortName']} positions not sequential: {positions[:5]}...")

    output = {
        "totalStimmen": 80,
        "maxPerCandidate": 3,
        "parties": parties,
    }

    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nOutput: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
