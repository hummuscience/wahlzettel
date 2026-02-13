#!/usr/bin/env python3
"""
Parse the Amtsblatt S2 PDF to extract STVV and KAV candidate data.

The PDF has a two-column layout. We use pdfplumber to crop each page into
left and right halves, extract text from each, and concatenate left+right
per page to get candidates in order.

Sections:
  I.  Wahl zur Stadtverordnetenversammlung (STVV) — pages 1–19 (before "II. Wahl")
  II. Wahl der Ortsbeiräte — skipped
  III. Wahl der KAV — pages 48–55 (after "III. Wahl" marker)

Output:
  public/data/stvv-candidates.json
  public/data/kav-candidates.json
"""

import json
import re
import sys
from pathlib import Path

import pdfplumber

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_DIR = SCRIPT_DIR.parent
PDF_PATH = PROJECT_DIR / "Amtsblatt S2 Wahlvorschlaege.pdf"
OUTPUT_DIR = PROJECT_DIR / "public" / "data"

# STVV pages to scan (0-indexed): pages 1–19 (indices 0–18)
STVV_PAGE_RANGE = range(0, 19)
# KAV pages to scan (0-indexed): pages 48–56 (indices 47–55)
KAV_PAGE_RANGE = range(47, 56)

# Section boundary markers in the extracted text
STVV_END_MARKER = "II. Wahl der Ortsbeiräte"
KAV_START_MARKER = "III. Wahl der Kommunalen"
KAV_END_MARKER = "Frankfurt am Main, 23.01.2026"

# Title prefixes to strip from candidate names (order matters: longest first)
TITLE_PREFIXES = [
    "Prof. Dr. Dr.",
    "Dr. Dr.",
    "Prof. Dr.",
    "Prof.",
    "Dr.",
]

# Lowercase name prefixes (nobility particles, etc.)
LOWERCASE_NAME_PREFIXES = [
    "von der", "von den", "van der", "van den",
    "von", "van", "de", "della", "del", "di", "el", "al",
]


# ---------------------------------------------------------------------------
# PDF text extraction
# ---------------------------------------------------------------------------

def extract_columns(page):
    """Extract text from left and right columns of a two-column page."""
    mid = page.width / 2
    left = page.crop((0, 0, mid, page.height))
    right = page.crop((mid, 0, page.width, page.height))
    lt = left.extract_text() or ""
    rt = right.extract_text() or ""
    return lt, rt


def get_section_text(pdf, page_range, start_marker=None, end_marker=None):
    """
    Concatenate column text for given pages, then optionally trim to
    the text between start_marker and end_marker.
    """
    all_text = ""
    for i in page_range:
        lt, rt = extract_columns(pdf.pages[i])
        all_text += lt + "\n" + rt + "\n"

    if start_marker:
        idx = all_text.find(start_marker)
        if idx >= 0:
            all_text = all_text[idx:]
        else:
            print(f"WARNING: Could not find start marker '{start_marker}'")

    if end_marker:
        idx = all_text.find(end_marker)
        if idx >= 0:
            all_text = all_text[:idx]
        else:
            print(f"WARNING: Could not find end marker '{end_marker}'")

    return all_text


# ---------------------------------------------------------------------------
# Parsing logic
# ---------------------------------------------------------------------------

def strip_title(name_str):
    """Remove academic/professional title prefixes from a name string."""
    s = name_str.strip()
    for prefix in TITLE_PREFIXES:
        if s.startswith(prefix + " "):
            s = s[len(prefix):].strip()
            break  # only strip the first (longest) matching prefix
    return s


def strip_nickname(name_str):
    """Remove parenthetical nicknames like (\u201eBäppi La Belle\u201c) from name."""
    # Match „..." style (German quotation marks inside parens)
    s = re.sub(r'\s*\(\u201e[^\u201c]*\u201c\)\s*', '', name_str)
    # Match ("...") style
    s = re.sub(r'\s*\(\u201e[^)]*\)\s*', '', s)
    return s.strip()


def parse_candidate_name(raw_text):
    """
    Parse a candidate name from the raw text after the position number.

    Input examples:
      "Dr. Kößler, Nils, Beamter,"
      "Gräfin zu Stolberg-Wernigerode, Annegret, Bankangestellte,"
      "Bäppler-Wolf, Thomas (\u201eBäppi La Belle\u201c), Schauspieler,"
      "von Ofen, Johannes, Student,"
      "della Peruta, Simona, Sachbearbeiterin,"

    Returns: dict with lastName, firstName, profession
    """
    # Keep academic titles (Dr., Prof.) as they appear on the official ballot
    text = raw_text.strip()
    # Strip nickname in parens
    text = strip_nickname(text)
    # Remove trailing comma if present
    text = text.rstrip(",").strip()

    # Split on commas
    parts = [p.strip() for p in text.split(",")]

    if len(parts) >= 3:
        return {
            "lastName": parts[0],
            "firstName": parts[1],
            "profession": parts[2],
        }
    elif len(parts) == 2:
        return {
            "lastName": parts[0],
            "firstName": parts[1],
            "profession": "",
        }
    else:
        return {
            "lastName": text,
            "firstName": "",
            "profession": "",
        }


def is_candidate_start(line):
    """
    Check if a line starts a new candidate entry (number + name).

    Returns (is_candidate, position_number, rest_of_line).
    """
    m = re.match(r'^(\d+)\s+(.+)', line)
    if not m:
        return False, 0, ""

    pos = int(m.group(1))
    rest = line[m.start(2):]

    # Must look like a name: starts with uppercase letter, title, or
    # lowercase nobility prefix followed by an uppercase letter
    # Uppercase start (including accented chars and special chars like Ö, Ä, etc.)
    if re.match(r'[A-ZÄÖÜ\u00C0-\u024F]', rest):
        return True, pos, rest
    # Title prefix
    if rest.startswith("Dr.") or rest.startswith("Prof."):
        return True, pos, rest
    # Lowercase nobility/name prefixes: von, van, de, della, etc.
    for prefix in LOWERCASE_NAME_PREFIXES:
        if rest.startswith(prefix + " "):
            return True, pos, rest

    return False, 0, ""


def is_page_header(line):
    """Check if a line is a page header/footer that should be skipped."""
    if re.match(r'^Seite \d+', line):
        return True
    if re.match(r'^\d{2}\.\d{2}\.\d{4}\s*/\s*Nr\.', line):
        return True
    if re.match(r'^26\.01\.2026\s*/\s*Nr\.', line):
        return True
    if re.match(r'^26\.01\.2026\s*/\s*Nr', line):
        return True
    # Page header on right column: "26.01.2026 / Nr. S2, 157. Jhg"
    if "Sonderausgabe Amtsblatt" in line:
        return True
    return False


def parse_parties(section_text, election_type):
    """
    Parse all parties and their candidates from section text.

    Returns a list of party dicts.
    """
    # Find all "Liste N" headers and their positions
    liste_pattern = re.compile(r'^Liste (\d+)$', re.MULTILINE)
    matches = list(liste_pattern.finditer(section_text))

    if not matches:
        print(f"ERROR: No 'Liste N' headers found in {election_type} section")
        return []

    parties = []

    for i, m in enumerate(matches):
        list_num = int(m.group(1))
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(section_text)
        chunk = section_text[start:end]

        # Parse party name and abbreviation
        lines = chunk.split("\n")
        non_empty = [l.strip() for l in lines if l.strip()]

        # Filter out page headers
        non_empty = [l for l in non_empty if not is_page_header(l)]

        full_name_parts = []
        candidate_start_idx = 0

        # Lines before the first candidate are party name + abbreviation
        for j, line in enumerate(non_empty):
            is_cand, _, _ = is_candidate_start(line)
            if is_cand:
                candidate_start_idx = j
                break
            full_name_parts.append(line)

        # The last item in full_name_parts is typically the short name
        if len(full_name_parts) >= 2:
            short_name = full_name_parts[-1]
            full_name = " ".join(full_name_parts[:-1])
            # Handle hyphenated line breaks in full name
            full_name = re.sub(r'- ', '-', full_name)
            full_name = re.sub(r'\s+', ' ', full_name).strip()
        elif len(full_name_parts) == 1:
            full_name = full_name_parts[0]
            short_name = full_name_parts[0]
        else:
            full_name = f"Unknown Party {list_num}"
            short_name = f"UNK{list_num}"

        # Parse candidates
        candidate_lines = non_empty[candidate_start_idx:]
        candidates = parse_candidates(candidate_lines, election_type, list_num)

        parties.append({
            "listNumber": list_num,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(candidates),
            "candidates": candidates,
        })

    return parties


def parse_candidates(lines, election_type, list_num):
    """
    Parse candidate entries from a list of text lines.

    Candidate entries look like:
      "1 Dr. Kößler, Nils, Beamter,"
      "geb. 1977 in Frankfurt am Main"

    Some candidates have multi-line names/professions:
      "33 Gräfin zu Stolberg-Wernigerode, Annegret,"
      "Bankangestellte,"
      "geb. 1964 in Ottersweier"
    """
    candidates = []
    i = 0

    while i < len(lines):
        line = lines[i]
        is_cand, pos, name_part = is_candidate_start(line)

        if is_cand:
            # Collect continuation lines until next candidate or geb. line
            j = i + 1
            while j < len(lines):
                next_line = lines[j].strip()
                # Skip page headers
                if is_page_header(next_line):
                    j += 1
                    continue
                # Stop at next candidate
                next_is_cand, _, _ = is_candidate_start(next_line)
                if next_is_cand:
                    break
                # Stop at and skip geb. line
                if next_line.startswith("geb."):
                    j += 1
                    break
                # It's a continuation (profession line, etc.)
                name_part += ", " + next_line
                j += 1

            parsed = parse_candidate_name(name_part)
            cid = f"{election_type}-{list_num}-{pos}"
            candidates.append({
                "id": cid,
                "position": pos,
                "lastName": parsed["lastName"],
                "firstName": parsed["firstName"],
                "profession": parsed["profession"],
            })
            i = j
        else:
            i += 1

    return candidates


# ---------------------------------------------------------------------------
# Validation
# ---------------------------------------------------------------------------

def validate_candidates(parties):
    """Check that candidate positions are sequential starting from 1."""
    issues = []
    for party in parties:
        positions = [c["position"] for c in party["candidates"]]
        if not positions:
            issues.append(
                f"  Liste {party['listNumber']} ({party['shortName']}): NO CANDIDATES"
            )
            continue
        expected = list(range(1, max(positions) + 1))
        if positions != expected:
            missing = set(expected) - set(positions)
            extra = set(positions) - set(expected)
            issues.append(
                f"  Liste {party['listNumber']} ({party['shortName']}): "
                f"expected 1-{max(positions)}, got {len(positions)} entries. "
                f"Missing: {sorted(missing)}, Extra: {sorted(extra)}"
            )
    return issues


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    if not PDF_PATH.exists():
        print(f"ERROR: PDF not found at {PDF_PATH}")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    pdf = pdfplumber.open(str(PDF_PATH))
    print(f"Opened PDF: {PDF_PATH.name} ({len(pdf.pages)} pages)")

    # --- STVV Section ---
    print("\n=== Parsing STVV (Stadtverordnetenversammlung) ===")
    stvv_text = get_section_text(pdf, STVV_PAGE_RANGE, end_marker=STVV_END_MARKER)
    stvv_parties = parse_parties(stvv_text, "stvv")

    print(f"\nSTVV Parties found: {len(stvv_parties)}")
    print(f"{'Liste':>6} {'Short':>20} {'Full Name':<55} {'Candidates':>10}")
    print("-" * 95)
    total_stvv = 0
    for p in stvv_parties:
        count = len(p["candidates"])
        total_stvv += count
        print(
            f"{p['listNumber']:>6} {p['shortName']:>20} "
            f"{p['fullName']:<55} {count:>10}"
        )
    print(f"{'TOTAL':>28} {'':<55} {total_stvv:>10}")

    issues = validate_candidates(stvv_parties)
    if issues:
        print("\nSTVV Validation Issues:")
        for issue in issues:
            print(issue)
    else:
        print("\nSTVV: All candidate positions are sequential. OK.")

    # --- KAV Section ---
    print("\n=== Parsing KAV (Kommunale Ausländer- und Ausländerinnenvertretung) ===")
    kav_text = get_section_text(
        pdf, KAV_PAGE_RANGE, start_marker=KAV_START_MARKER, end_marker=KAV_END_MARKER
    )
    kav_parties = parse_parties(kav_text, "kav")

    print(f"\nKAV Parties found: {len(kav_parties)}")
    print(f"{'Liste':>6} {'Short':>20} {'Full Name':<55} {'Candidates':>10}")
    print("-" * 95)
    total_kav = 0
    for p in kav_parties:
        count = len(p["candidates"])
        total_kav += count
        print(
            f"{p['listNumber']:>6} {p['shortName']:>20} "
            f"{p['fullName']:<55} {count:>10}"
        )
    print(f"{'TOTAL':>28} {'':<55} {total_kav:>10}")

    issues = validate_candidates(kav_parties)
    if issues:
        print("\nKAV Validation Issues:")
        for issue in issues:
            print(issue)
    else:
        print("\nKAV: All candidate positions are sequential. OK.")

    # --- Write JSON ---
    # STVV: 93 seats (voters get 93 Stimmen)
    # KAV: 37 seats (voters get 37 Stimmen)
    stvv_json = {
        "election": "stvv",
        "name": "Stadtverordnetenversammlung",
        "totalStimmen": 93,
        "maxPerCandidate": 3,
        "parties": stvv_parties,
    }

    kav_json = {
        "election": "kav",
        "name": "Kommunale Ausländer- und Ausländerinnenvertretung",
        "totalStimmen": 37,
        "maxPerCandidate": 3,
        "parties": kav_parties,
    }

    stvv_path = OUTPUT_DIR / "stvv-candidates.json"
    kav_path = OUTPUT_DIR / "kav-candidates.json"

    with open(stvv_path, "w", encoding="utf-8") as f:
        json.dump(stvv_json, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {stvv_path}")

    with open(kav_path, "w", encoding="utf-8") as f:
        json.dump(kav_json, f, ensure_ascii=False, indent=2)
    print(f"Wrote {kav_path}")

    # --- Print a few sample candidates for verification ---
    print("\n=== Sample STVV candidates ===")
    for p in stvv_parties[:3]:
        print(f"  {p['shortName']}:")
        for c in p["candidates"][:3]:
            print(f"    {c['id']}: {c['position']}. {c['lastName']}, {c['firstName']} — {c['profession']}")

    print("\n=== Sample KAV candidates ===")
    for p in kav_parties[:3]:
        print(f"  {p['shortName']}:")
        for c in p["candidates"][:3]:
            print(f"    {c['id']}: {c['position']}. {c['lastName']}, {c['firstName']} — {c['profession']}")

    pdf.close()


if __name__ == "__main__":
    main()
