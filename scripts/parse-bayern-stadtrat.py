#!/usr/bin/env python3
"""Parse Bayern Stadtrat Bekanntmachung PDFs to extract candidate data.

Supports all Bayern top-10 cities.
Usage: python parse-bayern-stadtrat.py <city>
"""

import json
import re
import sys
import os

try:
    import pdfplumber
except ImportError:
    os.system("pip install pdfplumber")
    import pdfplumber

SCRIPT_DIR = os.path.dirname(__file__)
OUTPUT_DIR = os.path.join(SCRIPT_DIR, "..", "public", "data")

CITIES = {
    "muenchen": {
        "pdf": "/tmp/muenchen-stadtrat-2026.pdf",
        "output": "muenchen-stadtrat.json",
        "stimmen": 80,
        "id_prefix": "m-sr",
        "parties": {
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
        },
    },
    "nuernberg": {
        "pdf": "/tmp/nuernberg-stadtrat-2026.pdf",
        "output": "nuernberg-stadtrat.json",
        "stimmen": 70,
        "id_prefix": "n-sr",
        "parties": {
            1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
            2:  ("FREIE WÄHLER", "FREIE WÄHLER Bayern"),
            3:  ("AfD", "Alternative für Deutschland"),
            4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
            5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
            6:  ("Die Linke", "Die Linke"),
            7:  ("ÖDP", "Ökologisch-Demokratische Partei"),
            8:  ("FDP", "Freie Demokratische Partei"),
            9:  ("politbande", "politbande"),
            10: ("LINKE LISTE", "LINKE LISTE Nürnberg"),
            11: ("Die Guten", "Wählergemeinschaft Die Guten e.V."),
            14: ("Tierschutzpartei", "Partei Mensch Umwelt Tierschutz"),
            15: ("PIRATEN", "PIRATEN & Humanisten e.V."),
            16: ("TSP", "Tierschutz, Steuerzahler und Patrioten"),
            17: ("Volt", "Volt Deutschland"),
        },
    },
    "augsburg": {
        "pdf": "/tmp/augsburg-stadtrat-2026.pdf",
        "output": "augsburg-stadtrat.json",
        "stimmen": 60,
        "id_prefix": "a-sr",
        "parties": {},  # Will be filled from PDF
    },
    "regensburg": {
        "pdf": "/tmp/regensburg-stadtrat-2026.pdf",
        "output": "regensburg-stadtrat.json",
        "stimmen": 50,
        "id_prefix": "r-sr",
        "parser": "standard_noyear",
        "parties": {
            1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
            2:  ("FREIE WÄHLER/FWR", "FREIE WÄHLER Bayern/Freie Wähler Regensburg e.V."),
            3:  ("AfD", "Alternative für Deutschland"),
            4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
            5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
            6:  ("BRÜCKE", "BRÜCKE – Ideen verbinden Menschen e.V."),
            7:  ("ÖDP", "Ökologisch-Demokratische Partei"),
            8:  ("FDP", "Freie Demokratische Partei"),
            9:  ("Die Linke", "Die Linke"),
            10: ("Die PARTEI", "Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative"),
            11: ("CSB", "Christlich-Soziale Bürger in Regensburg"),
            12: ("Ribisl", "Ribisl-Partie e.V."),
            13: ("Volt", "Volt Deutschland"),
            14: ("Zukunft", "Zukunft"),
        },
    },
    "ingolstadt": {
        "pdf": "/tmp/ingolstadt-stadtrat-2026-wahlvorschlaege.pdf",
        "output": "ingolstadt-stadtrat.json",
        "stimmen": 50,
        "id_prefix": "i-sr",
        "parser": "standard",
        "parties": {
            1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
            2:  ("FREIE WÄHLER/FW", "FREIE WÄHLER Bayern/Freie Wähler Ingolstadt"),
            3:  ("AfD", "Alternative für Deutschland"),
            4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
            5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
            6:  ("UWG", "Unabhängige Wählergemeinschaft Ingolstadt e.V."),
            7:  ("Die Linke", "Die Linke"),
            8:  ("ÖDP", "Ökologisch-Demokratische Partei"),
            9:  ("FDP", "Freie Demokratische Partei"),
        },
    },
    "wuerzburg": {
        "pdf": "/tmp/wuerzburg-stadtrat-2026.pdf",
        "output": "wuerzburg-stadtrat.json",
        "stimmen": 50,
        "id_prefix": "w-sr",
        "parser": "standard",
        "parties": {
            1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
            2:  ("FREIE WÄHLER/FWG", "FREIE WÄHLER/Freie Wähler - Freie Wählergemeinschaft Würzburg e.V."),
            3:  ("AfD", "Alternative für Deutschland"),
            4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
            5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
            6:  ("DIE LINKE", "DIE LINKE"),
            7:  ("ÖDP", "Ökologisch-Demokratische Partei"),
            8:  ("FDP", "Freie Demokratische Partei"),
            9:  ("WL", "WÜRZBURGER LISTE e.V."),
            10: ("ZfW", "Zukunft für Würzburg"),
            11: ("Volt", "Volt Deutschland"),
        },
    },
    "fuerth": {
        "pdf": "/tmp/fuerth-parts",  # directory with separate PDFs
        "output": "fuerth-stadtrat.json",
        "stimmen": 50,
        "id_prefix": "f-sr",
        "parser": "fuerth",
        "parties": {
            1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
            2:  ("FREIE WÄHLER", "FREIE WÄHLER"),
            3:  ("AfD", "Alternative für Deutschland"),
            4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
            5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
            6:  ("Die Linke", "Die Linke"),
            7:  ("FDP", "Freie Demokratische Partei"),
            8:  ("Tierschutzpartei", "PARTEI MENSCH UMWELT TIERSCHUTZ"),
        },
    },
    "erlangen": {
        "pdf": "/tmp/erlangen-stadtrat-2026.pdf",
        "output": "erlangen-stadtrat.json",
        "stimmen": 50,
        "id_prefix": "e-sr",
        "parser": "standard",
        "parties": {
            1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
            2:  ("FREIE WÄHLER/F.W.G.", "FREIE WÄHLER Bayern / Freie Wählergemeinschaft Erlangen"),
            3:  ("AfD", "Alternative für Deutschland"),
            4:  ("GRÜNE/GL", "BÜNDNIS 90/DIE GRÜNEN / Grüne Liste"),
            5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
            6:  ("ÖDP", "Ökologisch-Demokratische Partei"),
            7:  ("FDP", "Freie Demokratische Partei"),
            8:  ("erli", "Erlanger Linke"),
        },
    },
    "bamberg": {
        "pdf": "/tmp/bamberg-stadtrat-2026-wahlvorschlaege.pdf",
        "output": "bamberg-stadtrat.json",
        "stimmen": 44,
        "id_prefix": "b-sr",
        "parser": "standard",
        "parties": {
            1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
            2:  ("FREIE WÄHLER", "FREIE WÄHLER"),
            3:  ("AfD", "Alternative für Deutschland"),
            4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
            5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
            6:  ("BBB", "Bamberger-Bürgerblock"),
            7:  ("BuB", "BAMBERGS UNABHÄNGIGE BÜRGER"),
            8:  ("FDP", "Freie Demokratische Partei"),
            9:  ("ÖDP", "Ökologisch-Demokratische Partei"),
            10: ("Volt", "Volt Deutschland"),
            11: ("BM", "Bambergs Mitte"),
            12: ("Die Linke", "Die Linke"),
            13: ("Zwiebel", "Zwiebel - unabhängige Wähler:innenvereinigung Bamberg"),
        },
    },
    "bayreuth": {
        "pdf": "/tmp/bayreuth-stadtrat-2026.pdf",
        "output": "bayreuth-stadtrat.json",
        "stimmen": 44,
        "id_prefix": "bt-sr",
        "parser": "standard",
        "parties": {
            1:  ("CSU", "Christlich-Soziale Union in Bayern e.V."),
            2:  ("FREIE WÄHLER/BG", "FREIE WÄHLER Bayern / Bayreuther Gemeinschaft - Freie Wähler e.V."),
            3:  ("AfD", "Alternative für Deutschland"),
            4:  ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN"),
            5:  ("SPD", "Sozialdemokratische Partei Deutschlands"),
            6:  ("JB", "Junges Bayreuth e.V."),
            7:  ("FDP", "Freie Demokratische Partei"),
            8:  ("DU", "Die Unabhängigen (DU)"),
            9:  ("Die Linke", "Die Linke"),
            10: ("PRO BTH", "Wählergemeinschaft PRO Bayreuth e.V."),
        },
    },
}


def parse_name(raw_name: str) -> tuple[str, str]:
    """Parse 'LastName FirstName' or 'LastName, FirstName' into (lastName, firstName)."""
    name = raw_name.strip().rstrip(",").strip()

    # Handle academic titles at the start
    title = ""
    title_pattern = r'^((?:Prof\.\s*)?Dr\.\s*)'
    m = re.match(title_pattern, name)
    if m:
        title = m.group(1).strip()
        name = name[m.end():].strip()

    # Try "LastName, FirstName" format first (Nürnberg uses this with bold)
    if "," in name:
        parts = name.split(",", 1)
        last_name = parts[0].strip()
        first_name = parts[1].strip() if len(parts) > 1 else ""
    else:
        # "LastName FirstName" format
        parts = name.split()
        if len(parts) == 1:
            last_name = parts[0]
            first_name = ""
        else:
            last_name = parts[0]
            first_name = " ".join(parts[1:])

    if title:
        last_name = f"{title} {last_name}"

    return last_name, first_name


def extract_text(pdf_path: str) -> str:
    """Extract all text from PDF."""
    with pdfplumber.open(pdf_path) as pdf:
        return "\n".join(page.extract_text() or "" for page in pdf.pages)


def parse_muenchen(text: str, city_config: dict) -> list[dict]:
    """Parse München format: two-line candidates (name on first, profession on second)."""
    parties = []

    party_sections = re.split(
        r'Für die Wahl des Stadtrats wurden beim Wahlvorschlag Nr\.\s*(\d+)',
        text
    )

    for i in range(1, len(party_sections), 2):
        party_num = int(party_sections[i])
        section = party_sections[i + 1] if i + 1 < len(party_sections) else ""

        short_name, full_name = city_config["parties"].get(party_num, (f"Liste {party_num}", f"Liste {party_num}"))

        candidates = []
        lines = section.split('\n')
        j = 0
        while j < len(lines):
            line = lines[j].strip()
            m = re.match(r'^(\d{1,2})\s+(.+?),?\s+(\d{4})\s*$', line)
            if m:
                pos = int(m.group(1))
                name_raw = m.group(2).strip()
                profession = ""
                if j + 1 < len(lines):
                    next_line = lines[j + 1].strip()
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
                    "id": f"{city_config['id_prefix']}-{party_num}-{pos}",
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


def parse_nuernberg(text: str, city_config: dict) -> list[dict]:
    """Parse Nürnberg format: 'Lfd.Nr. LastName, FirstName, Profession Year'
    Candidates numbered 101+. Folgeblatt pages repeat headers so we merge."""
    # Collect all candidate lines per party number
    party_candidates: dict[int, list[dict]] = {}

    # Split by party headers — each "Wahlvorschlag: N Kennwort: ..." starts a section
    party_sections = re.split(
        r'Wahlvorschlag:?\s*(\d+)\s+Kennwort:?\s*',
        text
    )

    for i in range(1, len(party_sections), 2):
        party_num = int(party_sections[i])
        section = party_sections[i + 1] if i + 1 < len(party_sections) else ""

        if party_num not in party_candidates:
            party_candidates[party_num] = []

        for line in section.split('\n'):
            line = line.strip()
            # Match 3 or 4 digit candidate numbers (101-9999)
            m = re.match(r'^(\d{3,4})\s+(.+?)\s+(\d{4})\s*$', line)
            if not m:
                continue
            raw_num = int(m.group(1))
            year = m.group(3)
            # Position: last 2 digits, 0 means 100
            pos = raw_num % 100
            if pos == 0:
                pos = 100
            content = m.group(2).strip()

            # Split "LastName, FirstName, Profession"
            parts = content.split(",")
            if len(parts) >= 2:
                last_name = parts[0].strip()
                first_name = parts[1].strip()
                profession = ",".join(parts[2:]).strip().rstrip(",") if len(parts) > 2 else ""
            else:
                last_name = content
                first_name = ""
                profession = ""

            # Handle title prefix (Dr., Prof. Dr.)
            title_match = re.match(r'^((?:apl\.\s*)?(?:Prof\.\s*)?Dr\.(?:\s*med\.)?\s*)', last_name)
            if title_match:
                title = title_match.group(1).strip()
                last_name = last_name[title_match.end():].strip()
                last_name = f"{title} {last_name}"

            # Skip if we already have this position (from Folgeblatt duplicate)
            if any(c["position"] == pos for c in party_candidates[party_num]):
                continue

            party_candidates[party_num].append({
                "id": f"{city_config['id_prefix']}-{party_num}-{pos}",
                "position": pos,
                "lastName": last_name,
                "firstName": first_name,
                "profession": profession,
            })

    parties = []
    for party_num in sorted(party_candidates.keys()):
        short_name, full_name = city_config["parties"].get(party_num, (f"Liste {party_num}", f"Liste {party_num}"))
        candidates = sorted(party_candidates[party_num], key=lambda c: c["position"])
        parties.append({
            "listNumber": party_num,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(candidates),
            "candidates": candidates,
        })
        print(f"  Liste {party_num}: {short_name} — {len(candidates)} candidates")

    return parties


def parse_augsburg(text: str, city_config: dict) -> list[dict]:
    """Parse Augsburg format: 'LastName FirstName, Profession Year' on one line,
    or multi-line where name is above and 'NNN YYYY' is below.
    Candidates numbered 101+ (4 digits for lists 10+)."""
    parties = []

    # Split by party headers
    party_sections = re.split(
        r'Für die Wahl des Stadtrats wurden beim Wahlvorschlag Nr\.\s*(\d+)',
        text
    )

    for i in range(1, len(party_sections), 2):
        party_num = int(party_sections[i])
        section = party_sections[i + 1] if i + 1 < len(party_sections) else ""

        # Extract Kennwort — may or may not have "Kennwort" keyword
        # Try "Kennwort ..." first, then fall back to first non-header line
        kennwort_match = re.search(r'Kennwort\s+(.+?)(?:\n|folgende)', section)
        if kennwort_match:
            kennwort = kennwort_match.group(1).strip()
        else:
            # First meaningful line is the party name (e.g. list 2)
            first_lines = section.strip().split('\n')
            kennwort = first_lines[0].strip() if first_lines else f"Liste {party_num}"
            # Clean up if it ends with common suffixes
            kennwort = re.sub(r'\s*folgende.*$', '', kennwort).strip()

        # Map known full names to short names
        name_map = {
            "Christlich-Soziale Union in Bayern e. V.": "CSU",
            "Christlich-Soziale Union in Bayern e.V.": "CSU",
            "FREIE WÄHLER": "FREIE WÄHLER",
            "Alternative für Deutschland": "AfD",
            "BÜNDNIS 90 / DIE GRÜNEN": "GRÜNE",
            "BÜNDNIS 90/DIE GRÜNEN": "GRÜNE",
            "Sozialdemokratische Partei Deutschlands": "SPD",
            "Die Linke": "Die Linke",
            "Ökologisch-Demokratische Partei": "ÖDP",
            "Freie Demokratische Partei": "FDP",
            "Volt Deutschland": "Volt",
            "Bayernpartei": "BP",
            "V-Partei³": "V-Partei³",
            "Generation AUX": "Generation AUX",
            "Augsburg in Bürgerhand": "AiB",
            "WSA": "WSA",
            "Partei für Arbeit, Rechtsstaat, Tierschutz": "Die PARTEI",
        }
        short_name = kennwort
        full_name = kennwort
        for pattern, short in name_map.items():
            if pattern in kennwort:
                short_name = short
                full_name = kennwort
                break

        city_config["parties"][party_num] = (short_name, full_name)

        candidates = []
        lines = section.split('\n')
        j = 0
        while j < len(lines):
            line = lines[j].strip()

            # Case 1: Normal single-line "NNN Name ..., Profession YYYY"
            m = re.match(r'^(\d{3,4})\s+(.+?)\s+(\d{4})\s*$', line)
            if m:
                raw_num = int(m.group(1))
                content = m.group(2).strip()
                pos = raw_num % 100
                if pos == 0:
                    pos = 100

                comma_idx = content.find(",")
                if comma_idx >= 0:
                    name_part = content[:comma_idx].strip()
                    profession = content[comma_idx + 1:].strip()
                else:
                    name_part = content
                    profession = ""

                last_name, first_name = parse_name(name_part)
                candidates.append({
                    "id": f"{city_config['id_prefix']}-{party_num}-{pos}",
                    "position": pos,
                    "lastName": last_name,
                    "firstName": first_name,
                    "profession": profession,
                })
                j += 1
                continue

            # Case 2: Multi-line — name on current line, "NNN YYYY" on next line
            # e.g. "Hintersberger Ruth, M.A., Leiterin Akademie für"
            #      "103 1984"
            #      "Gesundheitsberufe UKA, Stadträtin"
            if j + 1 < len(lines):
                next_line = lines[j + 1].strip()
                m2 = re.match(r'^(\d{3,4})\s+(\d{4})\s*$', next_line)
                if m2 and line and not re.match(r'^\d{3,4}\s', line) and \
                   'Wahlvorschlag' not in line and 'Kennwort' not in line and \
                   'folgende' not in line and 'Familienname' not in line and \
                   'Lfd.' not in line and 'Absenderamt' not in line:
                    raw_num = int(m2.group(1))
                    pos = raw_num % 100
                    if pos == 0:
                        pos = 100

                    # Name and partial profession are on this line
                    full_content = line
                    # Check if there's a continuation line after "NNN YYYY"
                    if j + 2 < len(lines):
                        cont_line = lines[j + 2].strip()
                        if cont_line and not re.match(r'^\d{3,4}\s', cont_line) and \
                           'Wahlvorschlag' not in cont_line and 'Absenderamt' not in cont_line and \
                           'Kennwort' not in cont_line and 'folgende' not in cont_line and \
                           'Familienname' not in cont_line and 'Lfd.' not in cont_line:
                            full_content = f"{line} {cont_line}"
                            j += 1  # skip continuation line too

                    comma_idx = full_content.find(",")
                    if comma_idx >= 0:
                        name_part = full_content[:comma_idx].strip()
                        profession = full_content[comma_idx + 1:].strip()
                    else:
                        name_part = full_content
                        profession = ""

                    last_name, first_name = parse_name(name_part)
                    candidates.append({
                        "id": f"{city_config['id_prefix']}-{party_num}-{pos}",
                        "position": pos,
                        "lastName": last_name,
                        "firstName": first_name,
                        "profession": profession,
                    })
                    j += 2  # skip past "NNN YYYY" line
                    continue

            j += 1

        candidates.sort(key=lambda c: c["position"])
        parties.append({
            "listNumber": party_num,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(candidates),
            "candidates": candidates,
        })
        print(f"  Liste {party_num}: {short_name} — {len(candidates)} candidates")

    return parties


def parse_standard(text: str, city_config: dict, has_year: bool = True) -> list[dict]:
    """Parse standard Bayern format: 'NNN LastName FirstName, Profession YYYY'
    Used by most cities. Set has_year=False for Regensburg (no birth years)."""
    party_candidates: dict[int, list[dict]] = {}

    party_sections = re.split(
        r'Wahlvorschlag Nr\.?\s*(\d+)\s+Kennwort\s+',
        text
    )

    for i in range(1, len(party_sections), 2):
        party_num = int(party_sections[i])
        section = party_sections[i + 1] if i + 1 < len(party_sections) else ""

        if party_num not in party_candidates:
            party_candidates[party_num] = []

        lines = section.split('\n')
        j = 0
        while j < len(lines):
            line = lines[j].strip()

            # Try matching with year first, then without
            m = re.match(r'^(\d{3,4})\s+(.+?)\s+(\d{4})\s*$', line)
            if not m and (not has_year or True):
                # Fallback: match without year (Regensburg, or mixed like Bamberg)
                m_noyear = re.match(r'^(\d{3,4})\s+([A-ZÄÖÜ].+)$', line)
                if m_noyear:
                    # Make sure it's not a header line
                    content = m_noyear.group(2).strip()
                    if not any(kw in content for kw in ['Familienname', 'Beruf oder', 'Lfd', 'folgende', 'Geburt']):
                        m = m_noyear

            if m:
                raw_num = int(m.group(1))
                content = m.group(2).strip()
                pos = raw_num % 100
                if pos == 0:
                    pos = 100

                # Skip if duplicate (Folgeblatt)
                if any(c["position"] == pos for c in party_candidates[party_num]):
                    j += 1
                    continue

                # Strip leading title prefix before name detection
                title = ""
                title_pattern = r'^((?:apl\.\s*)?(?:Prof\.\s*)?Dr\.(?:\s*(?:med|phil|jur|rer|Ing)\.)?\s*(?:habil\.\s*)?)'
                tm = re.match(title_pattern, content)
                if tm:
                    title = tm.group(1).strip()
                    content = content[tm.end():].strip()

                # Detect format:
                # A) "LastName, FirstName, Profession" (Bayreuth/Nürnberg-style)
                # B) "LastName FirstName, Profession" (Würzburg/Erlangen-style)
                parts = content.split(",")
                if len(parts) >= 2:
                    first_part = parts[0].strip()
                    second_part = parts[1].strip()
                    # Strip nobiliary particles from space check
                    name_core = re.sub(r'^(von|van|de|zu)\s+', '', first_part)
                    has_space = " " in name_core
                    if not has_space and second_part and second_part[0].isupper() and \
                       not any(second_part.startswith(p) for p in ['Mitglied', 'Dipl', 'M.', 'B.']):
                        # Format A: LastName, FirstName, Profession
                        last_name = first_part
                        first_name = second_part
                        profession = ", ".join(p.strip() for p in parts[2:]).rstrip(",") if len(parts) > 2 else ""
                    else:
                        # Format B: Name Part, Profession
                        name_part = first_part
                        profession = ", ".join(p.strip() for p in parts[1:]).rstrip(",")
                        last_name, first_name = parse_name(name_part)
                else:
                    last_name, first_name = parse_name(content.strip())
                    profession = ""

                if title:
                    last_name = f"{title} {last_name}"
                party_candidates[party_num].append({
                    "id": f"{city_config['id_prefix']}-{party_num}-{pos}",
                    "position": pos,
                    "lastName": last_name,
                    "firstName": first_name,
                    "profession": profession,
                })
            else:
                # Check for multi-line: name on this line, number+year on next
                if j + 1 < len(lines) and has_year:
                    next_line = lines[j + 1].strip()
                    m2 = re.match(r'^(\d{3,4})\s+(\d{4})\s*$', next_line)
                    if m2 and line and not re.match(r'^\d{3,4}\s', line) and \
                       'Wahlvorschlag' not in line and 'Kennwort' not in line and \
                       'folgende' not in line and 'Familienname' not in line and \
                       'Lfd' not in line and 'Seite' not in line:
                        raw_num = int(m2.group(1))
                        pos = raw_num % 100
                        if pos == 0:
                            pos = 100

                        if not any(c["position"] == pos for c in party_candidates[party_num]):
                            # May have continuation line after NNN YYYY
                            full_content = line
                            if j + 2 < len(lines):
                                cont = lines[j + 2].strip()
                                if cont and not re.match(r'^\d{3,4}\s', cont) and \
                                   'Wahlvorschlag' not in cont and 'Kennwort' not in cont and \
                                   'folgende' not in cont and 'Familienname' not in cont and \
                                   'Lfd' not in cont and 'Seite' not in cont:
                                    full_content = f"{line} {cont}"
                                    j += 1

                            comma_idx = full_content.find(",")
                            if comma_idx >= 0:
                                name_part = full_content[:comma_idx].strip()
                                profession = full_content[comma_idx + 1:].strip().rstrip(",")
                            else:
                                name_part = full_content.strip()
                                profession = ""

                            last_name, first_name = parse_name(name_part)
                            party_candidates[party_num].append({
                                "id": f"{city_config['id_prefix']}-{party_num}-{pos}",
                                "position": pos,
                                "lastName": last_name,
                                "firstName": first_name,
                                "profession": profession,
                            })
                        j += 2
                        continue

            j += 1

    parties = []
    for party_num in sorted(party_candidates.keys()):
        short_name, full_name = city_config["parties"].get(party_num, (f"Liste {party_num}", f"Liste {party_num}"))
        candidates = sorted(party_candidates[party_num], key=lambda c: c["position"])
        parties.append({
            "listNumber": party_num,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(candidates),
            "candidates": candidates,
        })
        print(f"  Liste {party_num}: {short_name} — {len(candidates)} candidates")

    return parties


def parse_fuerth(text_parts: dict[int, str], city_config: dict) -> list[dict]:
    """Parse Fürth format: separate PDFs merged, München-style multi-line.
    Name line: 'NNN LastName FirstName [YYYY]'
    Next line: profession (if present)."""
    parties = []

    for party_num in sorted(text_parts.keys()):
        text = text_parts[party_num]
        short_name, full_name = city_config["parties"].get(party_num, (f"Liste {party_num}", f"Liste {party_num}"))

        candidates = []
        lines = text.split('\n')
        j = 0
        while j < len(lines):
            line = lines[j].strip()

            # Match "NNN LastName FirstName [YYYY]"
            m = re.match(r'^(\d{3,4})\s+(.+?)(?:\s+(\d{4}))?\s*$', line)
            if m:
                raw_num = int(m.group(1))
                name_raw = m.group(2).strip()
                pos = raw_num % 100
                if pos == 0:
                    pos = 100

                # Skip header lines
                if 'Familienname' in name_raw or 'Lfd' in name_raw or 'folgende' in name_raw:
                    j += 1
                    continue

                # Skip duplicates (Folgeblatt continuation pages)
                if any(c["position"] == pos for c in candidates):
                    j += 1
                    continue

                # Next line may be profession
                profession = ""
                if j + 1 < len(lines):
                    next_line = lines[j + 1].strip()
                    if next_line and not re.match(r'^\d{3,4}\s+\S', next_line) and \
                       'Wahlvorschlag' not in next_line and \
                       'Kennwort' not in next_line and \
                       'Lfd' not in next_line and \
                       'Familienname' not in next_line and \
                       'folgende' not in next_line and \
                       'Für die Wahl' not in next_line:
                        profession = next_line.rstrip(',').strip()
                        j += 1

                last_name, first_name = parse_name(name_raw)
                candidates.append({
                    "id": f"{city_config['id_prefix']}-{party_num}-{pos}",
                    "position": pos,
                    "lastName": last_name,
                    "firstName": first_name,
                    "profession": profession,
                })
            j += 1

        candidates.sort(key=lambda c: c["position"])
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
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <city>")
        print(f"  city: {', '.join(CITIES.keys())}")
        sys.exit(1)

    city = sys.argv[1].lower()
    if city not in CITIES:
        print(f"Unknown city: {city}")
        print(f"Available: {', '.join(CITIES.keys())}")
        sys.exit(1)

    config = CITIES[city]
    pdf_path = config["pdf"]
    print(f"Parsing: {pdf_path}")

    parser_type = config.get("parser", city)

    if parser_type == "fuerth":
        # Fürth has separate PDFs per party
        pdf_dir = config["pdf"]
        pdf_files = {
            "CSU.pdf": 1, "FW.pdf": 2, "AfD.pdf": 3, "Gruene.pdf": 4,
            "SPD.pdf": 5, "Die-Linke.pdf": 6, "FDP.pdf": 7, "Tierschutzpartei.pdf": 8,
        }
        text_parts: dict[int, str] = {}
        for fname, pnum in pdf_files.items():
            fpath = os.path.join(pdf_dir, fname)
            text_parts[pnum] = extract_text(fpath)
        parties = parse_fuerth(text_parts, config)
    else:
        text = extract_text(pdf_path)
        if parser_type == "muenchen":
            parties = parse_muenchen(text, config)
        elif parser_type == "nuernberg":
            parties = parse_nuernberg(text, config)
        elif parser_type == "augsburg":
            parties = parse_augsburg(text, config)
        elif parser_type == "standard":
            parties = parse_standard(text, config, has_year=True)
        elif parser_type == "standard_noyear":
            parties = parse_standard(text, config, has_year=False)

    total_candidates = sum(p["candidateCount"] for p in parties)
    print(f"\nTotal: {len(parties)} parties, {total_candidates} candidates")

    for p in parties:
        if p["candidateCount"] == 0:
            print(f"WARNING: {p['shortName']} has 0 candidates!")

    output = {
        "totalStimmen": config["stimmen"],
        "maxPerCandidate": 3,
        "parties": parties,
    }

    output_path = os.path.join(OUTPUT_DIR, config["output"])
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nOutput: {output_path}")


if __name__ == "__main__":
    main()
