#!/usr/bin/env python3
"""Parse the Amtsblatt S2 PDF to extract STVV candidate data."""

import json
import re
import sys
import os

try:
    import pdfplumber
except ImportError:
    os.system("pip install pdfplumber")
    import pdfplumber

PDF_PATH = os.path.join(os.path.dirname(__file__), "..", "Amtsblatt S2 Wahlvorschlaege.pdf")
OUTPUT_PATH = os.path.join(os.path.dirname(__file__), "..", "public", "data", "stvv-candidates.json")

# Expected party data for validation
PARTY_INFO = {
    1: ("CDU", "Christlich Demokratische Union Deutschlands", 93),
    2: ("AfD", "Alternative für Deutschland", 58),
    3: ("SPD", "Sozialdemokratische Partei Deutschlands", 93),
    4: ("GRÜNE", "BÜNDNIS 90/DIE GRÜNEN", 93),
    5: ("FDP", "Freie Demokratische Partei", 97),
    6: ("Die Linke", "Die Linke", 42),
    7: ("Volt", "Volt Deutschland", 39),
    8: ("BFF", "Bürger Für Frankfurt", 74),
    9: ("Die PARTEI", "Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative", 14),
    10: ("ÖkoLinX", "ÖkoLinX", 58),
    11: ("ELF", "EUROPA LISTE FÜR FRANKFURT", 46),
    12: ("IBF", "Ich bin ein Frankfurter", 46),
    13: ("BIG", "Bündnis für Innovation & Gerechtigkeit", 46),
    14: ("Gartenpartei Ffm", "Gartenpartei Frankfurt am Main", 25),
    15: ("PIRATEN", "Piratenpartei Deutschland", 7),
    16: ("FREIE WÄHLER", "FREIE WÄHLER", 90),
    17: ("DFRA", "DieFrankfurter", 32),
    18: ("MERA25", "MERA25 - Gemeinsam für Frieden, Solidarität und Freiheit", 32),
    19: ("Tierschutzpartei", "PARTEI MENSCH UMWELT TIERSCHUTZ", 27),
    20: ("GUG", "Global Unity in Germany", 3),
    21: ("Frankfurt-Sozial!", "Frankfurt-Sozial!", 34),
    22: ("BSW", "Bündnis Sahra Wagenknecht - Vernunft und Gerechtigkeit", 16),
}


def extract_text_columns(pdf_path):
    """Extract text from PDF, handling two-column layout."""
    all_text = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_num, page in enumerate(pdf.pages):

            width = page.width
            mid = width / 2

            # Extract left column
            left_bbox = (0, 0, mid, page.height)
            left_crop = page.within_bbox(left_bbox)
            left_text = left_crop.extract_text() or ""

            # Extract right column
            right_bbox = (mid, 0, width, page.height)
            right_crop = page.within_bbox(right_bbox)
            right_text = right_crop.extract_text() or ""

            # Add page header removal (page numbers etc)
            left_text = re.sub(r'^.*?Sonderausgabe Amtsblatt.*?\n', '', left_text)
            left_text = re.sub(r'^.*?26\.01\.2026.*?\n', '', left_text)
            right_text = re.sub(r'^.*?Sonderausgabe Amtsblatt.*?\n', '', right_text)
            right_text = re.sub(r'^.*?26\.01\.2026.*?\n', '', right_text)

            all_text.append(left_text)
            all_text.append(right_text)

            # Stop at Ortsbeirat section
            combined = left_text + right_text
            if "II. Wahl der Ortsbeiräte" in combined:
                break

    return "\n".join(all_text)


def parse_candidates(text):
    """Parse the extracted text into structured candidate data."""
    parties = []
    current_party = None
    current_candidates = []

    lines = text.split("\n")
    i = 0

    while i < len(lines):
        line = lines[i].strip()

        # Skip empty lines and page headers
        if not line or line.startswith("Seite") or "Sonderausgabe" in line:
            i += 1
            continue

        # Check for "Liste N" header
        liste_match = re.match(r'^Liste\s+(\d+)$', line)
        if liste_match:
            # Save previous party
            if current_party is not None:
                parties.append((current_party, current_candidates))

            list_num = int(liste_match.group(1))

            # Stop at Liste numbers beyond 22 or at section II
            if list_num > 22:
                break

            # Read full name and short name from next lines
            # Skip lines until we hit a candidate number
            i += 1
            header_lines = []
            while i < len(lines):
                l = lines[i].strip()
                if not l:
                    i += 1
                    continue
                # Check if this is a candidate line (starts with number)
                if re.match(r'^\d+\s+\S', l):
                    break
                header_lines.append(l)
                i += 1

            info = PARTY_INFO.get(list_num)
            if info:
                current_party = {
                    "listNumber": list_num,
                    "shortName": info[0],
                    "fullName": info[1],
                }
            else:
                current_party = {
                    "listNumber": list_num,
                    "shortName": header_lines[-1] if header_lines else f"Liste {list_num}",
                    "fullName": header_lines[0] if header_lines else f"Liste {list_num}",
                }
            current_candidates = []
            continue

        # Check for section II (Ortsbeirat) - stop
        if "II. Wahl der Ortsbeiräte" in line:
            if current_party is not None:
                parties.append((current_party, current_candidates))
            break

        # Check for candidate line: "N  Name, First, Profession,"
        candidate_match = re.match(r'^(\d+)\s+(.+)', line)
        if candidate_match and current_party is not None:
            pos = int(candidate_match.group(1))
            rest = candidate_match.group(2).strip()

            # Collect continuation lines (geb. line and possibly multi-line profession)
            full_text = rest
            i += 1
            while i < len(lines):
                next_line = lines[i].strip()
                if not next_line:
                    i += 1
                    continue
                # If next line is a new candidate, Liste header, or section header, stop
                if re.match(r'^\d+\s+\S', next_line) and not next_line.startswith("geb."):
                    # Check if it's actually a candidate number (not part of address)
                    num_match = re.match(r'^(\d+)\s', next_line)
                    if num_match:
                        test_num = int(num_match.group(1))
                        if test_num == pos + 1 or test_num > 1900:  # 1900+ is a year in geb. line
                            if test_num < 1900:
                                break
                    break
                if re.match(r'^Liste\s+\d+$', next_line):
                    break
                if "II. Wahl der Ortsbeiräte" in next_line:
                    break
                full_text += " " + next_line
                i += 1
                # Stop after geb. line
                if "geb." in next_line:
                    break

            # Parse candidate: "LastName, FirstName, Profession, geb. YEAR in PLACE"
            # Remove "geb." part
            geb_match = re.search(r',?\s*geb\.\s*\d{4}\s*(in\s*.+)?$', full_text)
            if geb_match:
                main_text = full_text[:geb_match.start()].strip()
            else:
                main_text = full_text.strip()

            # Remove trailing comma
            main_text = main_text.rstrip(',').strip()

            # Split by commas: lastName, firstName, profession(s)
            parts = [p.strip() for p in main_text.split(',') if p.strip()]

            if len(parts) >= 2:
                last_name = parts[0]
                first_name = parts[1]
                profession = ", ".join(parts[2:]) if len(parts) > 2 else ""
            elif len(parts) == 1:
                last_name = parts[0]
                first_name = ""
                profession = ""
            else:
                last_name = main_text
                first_name = ""
                profession = ""

            candidate = {
                "id": f"stvv-{current_party['listNumber']}-{pos}",
                "position": pos,
                "lastName": last_name,
                "firstName": first_name,
                "profession": profession,
            }
            current_candidates.append(candidate)
            continue

        i += 1

    # Don't forget last party
    if current_party is not None and current_candidates:
        parties.append((current_party, current_candidates))

    return parties


def main():
    print(f"Reading PDF: {PDF_PATH}")
    text = extract_text_columns(PDF_PATH)

    print(f"Extracted {len(text)} characters")

    # Debug: save extracted text
    debug_path = os.path.join(os.path.dirname(__file__), "extracted_text.txt")
    with open(debug_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print(f"Saved extracted text to {debug_path}")

    parties = parse_candidates(text)

    print(f"\nFound {len(parties)} parties:")

    result = {
        "election": "stvv",
        "name": "Stadtverordnetenversammlung",
        "totalStimmen": 93,
        "maxPerCandidate": 3,
        "parties": [],
    }

    all_ok = True
    for party_info, candidates in parties:
        list_num = party_info["listNumber"]
        expected = PARTY_INFO.get(list_num, (None, None, None))
        expected_count = expected[2]
        actual_count = len(candidates)

        status = "✓" if actual_count == expected_count else "✗"
        if actual_count != expected_count:
            all_ok = False

        print(f"  {status} Liste {list_num} ({party_info['shortName']}): {actual_count} candidates (expected {expected_count})")

        # Show first and last candidate
        if candidates:
            first = candidates[0]
            last = candidates[-1]
            print(f"    First: {first['lastName']}, {first['firstName']} ({first['profession']})")
            print(f"    Last:  {last['lastName']}, {last['firstName']} ({last['profession']})")

        result["parties"].append({
            **party_info,
            "candidateCount": actual_count,
            "candidates": candidates,
        })

    # Write output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(f"\nOutput written to {OUTPUT_PATH}")

    total_candidates = sum(len(c) for _, c in parties)
    print(f"Total candidates: {total_candidates}")

    if not all_ok:
        print("\n⚠️  Some party counts don't match! Manual review needed.")
        return 1
    else:
        print("\n✓ All party counts match!")
        return 0


if __name__ == "__main__":
    sys.exit(main())
