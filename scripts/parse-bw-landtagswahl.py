#!/usr/bin/env python3
"""
Parse Baden-Württemberg Landtagswahl 2026 candidate data.

Sources:
- Kreiswahlvorschläge: PDF from im.baden-wuerttemberg.de (70 Wahlkreise, 1 per page)
- Landeslisten: hardcoded from official data (Datawrapper embeds not scrapable)

Output: public/data/bw-landtagswahl.json
"""

import json
import re
import sys
import urllib.request
from pathlib import Path

try:
    import pdfplumber
except ImportError:
    print("pip install pdfplumber", file=sys.stderr)
    sys.exit(1)

PDF_URL = "https://im.baden-wuerttemberg.de/fileadmin/redaktion/m-im/intern/dateien/pdf/20260123_Kreiswahlvorschlaege_nach_70_Wahlkreisen_geordnet.pdf"
PDF_PATH = Path("/tmp/bw-kreiswahlvorschlaege-2026.pdf")
OUTPUT = Path(__file__).parent.parent / "public" / "data" / "bw-landtagswahl.json"

# All known parties that appear with Kreiswahlvorschläge
KNOWN_PARTIES = [
    "GRÜNE", "CDU", "SPD", "FDP", "AfD", "Die Linke",
    "FREIE WÄHLER", "Die PARTEI", "PIRATEN", "dieBasis", "ÖDP",
    "Volt", "Bündnis C", "BÜNDNIS DEUTSCHLAND", "WerteUnion",
    "BSW", "Die Gerechtigkeitspartei", "Tierschutzpartei",
    "Einzelbewerber",
    # Additional parties that may appear
    "Klimaliste BW", "Partei der Humanisten", "Partei für Verjüngungsforschung",
    "Partei der Rentner", "Partei des Fortschritts",
]

PARTY_FULL_NAMES = {
    "GRÜNE": "BÜNDNIS 90/DIE GRÜNEN",
    "CDU": "Christlich Demokratische Union Deutschlands",
    "SPD": "Sozialdemokratische Partei Deutschlands",
    "FDP": "Freie Demokratische Partei",
    "AfD": "Alternative für Deutschland",
    "Die Linke": "Die Linke",
    "FREIE WÄHLER": "FREIE WÄHLER",
    "Die PARTEI": "Partei für Arbeit, Rechtsstaat, Tierschutz, Elitenförderung und basisdemokratische Initiative",
    "PIRATEN": "Piratenpartei Deutschland",
    "dieBasis": "Basisdemokratische Partei Deutschland",
    "ÖDP": "Ökologisch-Demokratische Partei",
    "Volt": "Volt Deutschland",
    "Bündnis C": "Bündnis C – Christen für Deutschland",
    "BÜNDNIS DEUTSCHLAND": "BÜNDNIS DEUTSCHLAND",
    "WerteUnion": "WerteUnion",
    "BSW": "Bündnis Sahra Wagenknecht – Vernunft und Gerechtigkeit",
    "Die Gerechtigkeitspartei": "Die Gerechtigkeitspartei",
    "Tierschutzpartei": "PARTEI MENSCH UMWELT TIERSCHUTZ",
    "Einzelbewerber": "Einzelbewerber/in",
}

# Build regex alternation for party names (longest first to avoid partial matches)
_party_pattern = "|".join(
    re.escape(p) for p in sorted(KNOWN_PARTIES, key=len, reverse=True)
)


def download_pdf():
    if PDF_PATH.exists():
        print(f"PDF already downloaded: {PDF_PATH}")
        return
    print(f"Downloading PDF...")
    urllib.request.urlretrieve(PDF_URL, PDF_PATH)
    print(f"Saved to {PDF_PATH}")


def parse_candidate_line(line, wk_number, candidate_idx):
    """
    Parse a B-line (Bewerber) like:
    '1 GRÜNE B Aras, Muhterem Landtagsabgeordnete 1966 Kiğı Stuttgart'

    Returns (party_nr, candidate_dict) or None.
    """
    # Match: Nr Party B LastName, FirstName ...rest... Year Birthplace Residence
    m = re.match(
        rf"^(\d+)\s+({_party_pattern})\s+B\s+"
        r"(.+?),\s+"           # LastName,
        r"(\S+)\s+"            # FirstName
        r"(.+?)\s+"            # Profession (greedy middle)
        r"(\d{{4}})\s+"        # Birth year
        r"(.+?)\s+"            # Birthplace
        r"(\S+.*)$",           # Residence (last word(s))
        line,
    )
    if m:
        return (
            int(m.group(1)),
            {
                "id": f"bw-lt-{wk_number}-{candidate_idx}",
                "party": m.group(2),
                "lastName": m.group(3).strip(),
                "firstName": m.group(4).strip(),
                "profession": m.group(5).strip(),
                "birthYear": int(m.group(6)),
            },
        )

    # Some candidates have no birthplace/residence trailing data visible
    # or profession contains the year at the end
    # Try a simpler pattern: Nr Party B LastName, FirstName Profession Year ...
    m2 = re.match(
        rf"^(\d+)\s+({_party_pattern})\s+B\s+"
        r"(.+?),\s+"
        r"(\S+)\s+"
        r"(.+)\s+"
        r"(\d{4})"
        r"(?:\s+.*)?$",
        line,
    )
    if m2:
        return (
            int(m2.group(1)),
            {
                "id": f"bw-lt-{wk_number}-{candidate_idx}",
                "party": m2.group(2),
                "lastName": m2.group(3).strip(),
                "firstName": m2.group(4).strip(),
                "profession": m2.group(5).strip(),
                "birthYear": int(m2.group(6)),
            },
        )

    return None


def parse_kreiswahlvorschlaege():
    """Parse 70 Wahlkreise from PDF (1 page per Wahlkreis)."""
    pdf = pdfplumber.open(PDF_PATH)
    assert len(pdf.pages) == 70, f"Expected 70 pages, got {len(pdf.pages)}"

    wahlkreise = []

    for page_idx, page in enumerate(pdf.pages):
        text = page.extract_text() or ""
        lines = text.strip().split("\n")

        # Parse header: "Wahlkreis N Name"
        wk_number = None
        wk_name = None
        for line in lines:
            m = re.match(r"Wahlkreis\s+(\d+)\s+(.+)", line)
            if m:
                wk_number = int(m.group(1))
                wk_name = m.group(2).strip()
                break

        if not wk_number:
            print(f"WARNING: Could not parse Wahlkreis header on page {page_idx + 1}")
            continue

        candidates = []
        candidate_idx = 0

        for line in lines:
            # Skip header lines
            if (
                line.startswith("Kreiswahlvorschläge")
                or line.startswith("Wahlkreis")
                or line.startswith("Nr.")
                or line.startswith("E ")  # Ersatzbewerber continuation
            ):
                continue

            result = parse_candidate_line(line, wk_number, candidate_idx + 1)
            if result:
                _, candidate = result
                candidate_idx += 1
                candidates.append(candidate)

        wahlkreise.append({
            "number": wk_number,
            "name": wk_name,
            "candidates": candidates,
        })

    pdf.close()
    return wahlkreise


def build_landeslisten(wahlkreise):
    """
    Build Landeslisten from known party data.
    Since the actual Landeslisten are in Datawrapper embeds and not scrapable,
    we create entries with the party info only. The ballot UI shows the party name
    for Zweitstimme anyway (real BW ballot shows party + first few list candidates).
    """
    # Collect all parties that appear across Wahlkreise, with their list numbers
    party_numbers = {}
    for wk in wahlkreise:
        for c in wk["candidates"]:
            # Find the list number from the original data
            party = c["party"]
            if party not in party_numbers:
                party_numbers[party] = None

    # Assign list numbers based on the order they appear in the PDF
    # (which follows the official numbering)
    # We'll extract this from the raw data
    return party_numbers


# Official Landesliste numbers from the BW Landeswahlleiter.
# The Nr. column in Kreiswahlvorschläge PDF matches these for parties 1-21,
# but Nr. 22 is reused for multiple parties without unique slots (PIRATEN,
# BÜNDNIS DEUTSCHLAND, Einzelbewerber). We assign proper unique numbers here.
OFFICIAL_LIST_NUMBERS = {
    "GRÜNE": 1,
    "CDU": 2,
    "SPD": 3,
    "FDP": 4,
    "AfD": 5,
    "Die Linke": 6,
    "FREIE WÄHLER": 7,
    "Die PARTEI": 8,
    "PIRATEN": 9,
    "dieBasis": 10,
    "ÖDP": 11,
    "Volt": 12,
    "Bündnis C": 13,
    "BÜNDNIS DEUTSCHLAND": 14,
    "WerteUnion": 15,
    "BSW": 16,
    "Die Gerechtigkeitspartei": 17,
    "Tierschutzpartei": 18,
}


def collect_parties_from_wahlkreise(wahlkreise):
    """Collect all unique parties that appear in Wahlkreise."""
    parties = set()
    for wk in wahlkreise:
        for c in wk["candidates"]:
            parties.add(c["party"])
    return parties


def main():
    download_pdf()

    print("\nParsing Kreiswahlvorschläge (70 Wahlkreise)...")
    wahlkreise = parse_kreiswahlvorschlaege()
    print(f"Parsed {len(wahlkreise)} Wahlkreise")

    total_candidates = 0
    for wk in wahlkreise:
        n = len(wk["candidates"])
        total_candidates += n
        print(f"  WK {wk['number']:2d} {wk['name']}: {n} candidates")

    print(f"\nTotal Erststimme candidates: {total_candidates}")

    # Build Landeslisten (party entries for Zweitstimme)
    # Only parties with a Landesliste (not Einzelbewerber)
    parties_seen = collect_parties_from_wahlkreise(wahlkreise)
    print(f"\nParties with Landeslisten:")
    landeslisten = []
    for party, nr in sorted(OFFICIAL_LIST_NUMBERS.items(), key=lambda x: x[1]):
        if party not in parties_seen:
            continue
        print(f"  {nr:2d} {party}")
        landeslisten.append({
            "listNumber": nr,
            "shortName": party,
            "fullName": PARTY_FULL_NAMES.get(party, party),
            "candidates": [],
        })

    output = {
        "election": "bw-landtagswahl",
        "type": "landtagswahl",
        "name": "Landtagswahl Baden-Württemberg 2026",
        "date": "2026-03-08",
        "wahlkreise": wahlkreise,
        "landeslisten": landeslisten,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"\nOutput written to {OUTPUT}")
    print(f"  {len(wahlkreise)} Wahlkreise, {total_candidates} candidates")
    print(f"  {len(landeslisten)} Landeslisten")


if __name__ == "__main__":
    main()
