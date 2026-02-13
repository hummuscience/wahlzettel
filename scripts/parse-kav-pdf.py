#!/usr/bin/env python3
"""
Extract KAV (Kommunale Ausländer- und Ausländerinnenvertretung) candidate data
from KAV.pdf ballot sheet.

The PDF has a dense multi-column layout with 3 rows x 9 columns = 27 blocks
(26 parties + 1 overflow from GUG which is the largest party with 37 candidates).

Output: public/data/kav-candidates.json
"""

import pdfplumber
import re
import json
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
PDF_PATH = PROJECT_ROOT / "KAV.pdf"
OUTPUT_PATH = PROJECT_ROOT / "public" / "data" / "kav-candidates.json"

# Expected party info: list_number -> (shortName, fullName, expected_candidate_count)
# 26 parties total, 37 Stimmen
PARTY_INFO = {
    1:  ("SL", "Serbische Liste", 13),
    2:  ("DFRA", "DieFrankfurter", 3),
    3:  ("A.I.V.", "Ausländische Interessenvertretung", 20),
    4:  ("IFL", "Internationale Freie Liste", 13),
    5:  ("CDU", "Christlich Demokratische Union Deutschlands", 16),
    6:  ("LiberD", "Liberales Deutschland", 13),
    7:  ("GRÜNE", "Bündnis 90/Die Grünen", 15),
    8:  ("IBF", "Ich bin ein Frankfurter", 15),
    9:  ("UD", "Ukrainische-Diaspora-Frankfurt", 16),
    10: ("SPD", "Sozialdemokratische Partei Deutschlands", 15),
    11: ("GUG", "Global Unity in Germany", 37),
    12: ("BIG", "Bündnis für Innovation & Gerechtigkeit", 14),
    13: ("DABEI", "Deutsche und Ausländer für Bildung, Empowerment und Integration", 15),
    14: ("WIF", "Wir in Frankfurt", 20),
    15: ("LM", "Liste Mezopotamya", 18),
    16: ("PAU", "Progressive Ausländer Union", 12),
    17: ("IND/BHARAT", "BHARAT", 14),
    18: ("FREIE WÄHLER", "Freie Wähler", 18),
    19: ("FDP", "Freie Demokratische Partei", 24),
    20: ("ANA", "Liste Anadolu", 13),
    21: ("AFG", "Afghanische Liste", 16),
    22: ("BFF", "Bürger Für Frankfurt", 19),
    23: ("DIALOGINITIATIVE", "DAJ ZNAK Polnische Dialoginitiative für Frankfurt", 14),
    24: ("CL", "Chinesische Liste", 16),
    25: ("Volt", "Volt Deutschland", 13),
    26: ("Die Linke", "Die Linke", 9),
}


def extract_words_by_position(page):
    """Extract all words with their bounding box positions."""
    return page.extract_words(x_tolerance=2, y_tolerance=2)


def assign_to_columns(words, col_boundaries):
    """Assign each word to a column based on its x0 position."""
    columns = {i: [] for i in range(len(col_boundaries) - 1)}
    for w in words:
        x = w['x0']
        for i in range(len(col_boundaries) - 1):
            if col_boundaries[i] <= x < col_boundaries[i + 1]:
                columns[i].append(w)
                break
    return columns


def words_to_lines(words, y_tolerance=4):
    """Group words into text lines based on y-position."""
    if not words:
        return []
    sorted_words = sorted(words, key=lambda w: (w['top'], w['x0']))
    lines = []
    current_line = [sorted_words[0]]
    current_y = sorted_words[0]['top']

    for w in sorted_words[1:]:
        if abs(w['top'] - current_y) <= y_tolerance:
            current_line.append(w)
        else:
            current_line.sort(key=lambda w: w['x0'])
            lines.append(' '.join(w['text'] for w in current_line))
            current_line = [w]
            current_y = w['top']

    if current_line:
        current_line.sort(key=lambda w: w['x0'])
        lines.append(' '.join(w['text'] for w in current_line))

    return lines


def parse_candidate_line(line, expected_list_prefix):
    """Parse a candidate line like '101 Višnjić, Kristina' into candidate dict.
    Also handles lines where PDF artifacts prefix the ID with a stray character,
    e.g., 'u516 Rakhamimov, Daniel' or 'r1105 Chandhok, Mohanlal'.
    """
    # Match: optional single lowercase letter prefix + number + name
    m = re.match(r'^[a-z]?(\d{3,4})\s+(.+)$', line.strip())
    if not m:
        return None

    id_num = int(m.group(1))
    list_num = id_num // 100
    if list_num != expected_list_prefix:
        return None

    name_str = m.group(2).strip()
    if ',' in name_str:
        parts = name_str.split(',', 1)
        last_name = parts[0].strip()
        first_name = parts[1].strip()
    else:
        last_name = name_str
        first_name = ""

    position = id_num % 100
    return {
        "id_num": id_num,
        "position": position,
        "lastName": last_name,
        "firstName": first_name,
    }


def main():
    pdf = pdfplumber.open(str(PDF_PATH))
    page = pdf.pages[0]
    words = extract_words_by_position(page)

    # 9 column boundaries
    col_boundaries = [0, 230, 470, 710, 950, 1190, 1430, 1670, 1910, 2200]

    # 3 row boundaries
    row_boundaries = [260, 730, 1200, 1600]

    # Layout: which (row, col) maps to which party list number
    grid_to_list = {
        (0, 0): 1,  (0, 1): 4,  (0, 2): 7,  (0, 3): 10, (0, 4): 12,
        (0, 5): 15, (0, 6): 18, (0, 7): 21, (0, 8): 24,
        (1, 0): 2,  (1, 1): 5,  (1, 2): 8,  (1, 3): 11, (1, 4): 13,
        (1, 5): 16, (1, 6): 19, (1, 7): 22, (1, 8): 25,
        (2, 0): 3,  (2, 1): 6,  (2, 2): 9,  (2, 3): 11, (2, 4): 14,
        (2, 5): 17, (2, 6): 20, (2, 7): 23, (2, 8): 26,
    }

    all_candidates = {}

    for row_idx in range(3):
        row_top = row_boundaries[row_idx]
        row_bottom = row_boundaries[row_idx + 1]
        row_words = [w for w in words if row_top <= w['top'] < row_bottom]
        columns = assign_to_columns(row_words, col_boundaries)

        for col_idx in range(9):
            if (row_idx, col_idx) not in grid_to_list:
                continue
            list_num = grid_to_list[(row_idx, col_idx)]
            col_words = columns.get(col_idx, [])
            lines = words_to_lines(col_words)

            if list_num not in all_candidates:
                all_candidates[list_num] = []

            for line in lines:
                parsed = parse_candidate_line(line, list_num)
                if parsed:
                    all_candidates[list_num].append(parsed)

    # Sort and deduplicate candidates within each list
    for list_num in all_candidates:
        all_candidates[list_num].sort(key=lambda c: c['position'])
        seen = set()
        deduped = []
        for c in all_candidates[list_num]:
            if c['position'] not in seen:
                seen.add(c['position'])
                deduped.append(c)
        all_candidates[list_num] = deduped

    # Build output JSON
    parties = []
    total_candidates = 0
    all_ok = True
    for list_num in sorted(PARTY_INFO.keys()):
        short_name, full_name, expected_count = PARTY_INFO[list_num]
        candidates_raw = all_candidates.get(list_num, [])

        found_count = len(candidates_raw)
        ok = found_count == expected_count
        status = "OK" if ok else f"MISMATCH (expected {expected_count}, found {found_count})"
        if not ok:
            all_ok = False
        print(f"Liste {list_num:2d} ({short_name:18s}): {found_count:3d} candidates {status}")

        candidates = []
        for c in candidates_raw:
            candidates.append({
                "id": f"kav-{list_num}-{c['position']}",
                "position": c['position'],
                "lastName": c['lastName'],
                "firstName": c['firstName'],
                "profession": "",
            })

        parties.append({
            "listNumber": list_num,
            "shortName": short_name,
            "fullName": full_name,
            "candidateCount": len(candidates),
            "candidates": candidates,
        })
        total_candidates += len(candidates)

    election_data = {
        "election": "kav",
        "name": "Kommunale Ausländer- und Ausländerinnenvertretung",
        "totalStimmen": 37,
        "maxPerCandidate": 3,
        "parties": parties,
    }

    print(f"\nTotal candidates: {total_candidates}")
    print(f"Total parties: {len(parties)}")

    if not all_ok:
        print("\nWARNING: Some counts don't match! Review the data.")

    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT_PATH, 'w', encoding='utf-8') as f:
        json.dump(election_data, f, ensure_ascii=False, indent=2)
    print(f"\nWritten to {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
