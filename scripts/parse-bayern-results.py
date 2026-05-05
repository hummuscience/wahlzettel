#!/usr/bin/env python3
"""Bayern Kommunalwahl 2026 results extractor (party-level).

Source: Bayerisches Landesamt für Statistik, kommunalwahl2026.bayern.de.
Specifically the consolidated XML download at
  https://kommunalwahl2026.bayern.de/downloads/gremienwahl/Kommunalwahl_Gremien_Kreisfreie_Staedte.xml
which contains per-party totals + seats + percent (with deltas vs. prior
election) for every kreisfreie Stadt in Bayern.

For per-CANDIDATE Stimmen, run `parse-bayern-candidates.py` afterwards —
that companion scrapes the per-city result-portal HTML (movaplus
template) and enriches the existing results-{slug}.json files in place.

Usage:
  python3 scripts/parse-bayern-results.py [<slug>...]
    No args   → ingest every entry in BAYERN_CITIES.
    With args → only the listed slugs.

Out:  public/data/results-{slug}.json
"""

from __future__ import annotations

import json
import re
import sys
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "public" / "data"

XML_URL = (
    "https://kommunalwahl2026.bayern.de/downloads/gremienwahl/"
    "Kommunalwahl_Gremien_Kreisfreie_Staedte.xml"
)

# Bayern publishes its own Schluesselnummer (3-digit) per kreisfreie Stadt;
# unrelated to the federal AGS. Maps our slugs to that ID.
BAYERN_CITIES: dict[str, int] = {
    "amberg-stadtrat":        361,
    "ansbach-stadtrat":        561,  # not currently shipped, but here for parity
    "aschaffenburg-stadtrat":  661,
    "augsburg-stadtrat":       761,
    "bamberg-stadtrat":        461,
    "bayreuth-stadtrat":       462,
    "coburg-stadtrat":         463,
    "erlangen-stadtrat":       562,
    "fuerth-stadtrat":         563,
    "hof-stadtrat":            464,
    "ingolstadt-stadtrat":     161,
    "kaufbeuren-stadtrat":     762,
    "kempten-stadtrat":        763,
    "landshut-stadtrat":       261,
    "memmingen-stadtrat":      764,
    "muenchen-stadtrat":       162,
    "nuernberg-stadtrat":      564,
    "passau-stadtrat":         262,
    "regensburg-stadtrat":     362,
    "rosenheim-stadtrat":      163,
    "schwabach-stadtrat":      565,
    "schweinfurt-stadtrat":    662,
    "straubing-stadtrat":      263,
    "weiden-stadtrat":         363,
    "wuerzburg-stadtrat":      663,
}

# Editorial — same default order as Hessen, but annotated with Bayern parties
# (CSU has no Hessen counterpart; FW is large in Bayern).
DEFAULT_IDEOLOGICAL_ORDER = [
    "Die Linke", "ÖDP", "Die PARTEI",
    "SPD", "GRÜNE", "Volt",
    "Tierschutzpartei", "PIRATEN", "Gartenpartei",
    "FDP", "FREIE WÄHLER", "FW",
    "CSU", "CDU",
    "BSW",
    "AfD",
]


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
            ),
            "Accept": "application/xml, text/xml, */*;q=0.5",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


def parse_int(val: str | None) -> int | None:
    if val is None:
        return None
    val = val.strip().replace(".", "").replace(",", "")
    if not val:
        return None
    try:
        return int(val)
    except ValueError:
        return None


def parse_float(val: str | None) -> float | None:
    if val is None:
        return None
    val = val.strip().replace(",", ".")
    if not val:
        return None
    try:
        return float(val)
    except ValueError:
        return None


def text_of(el: ET.Element | None) -> str | None:
    if el is None:
        return None
    return el.text


def find_text(parent: ET.Element, tag: str) -> str | None:
    return text_of(parent.find(tag))


def normalize_party_short(label: str) -> str:
    """Bayern's party labels can be long ("FREIE WÄHLER/Freie Wähler Ingolstadt").
    Pick the canonical short form: take everything before the first '/'."""
    short = label.split("/")[0].strip()
    # Map known aliases to our canonical names
    return short


def candidate_from_roster(c: dict) -> dict:
    """Normalize a candidate dict from either roster format:
    - Hessen: {position, lastName, firstName, profession?}
    - Bayern: {id, name}, where id = listNumber*100 + position and
              `name` is "Firstname (titles) Lastname".
    Returns a candidate dict shaped for the results JSON.
    """
    if "lastName" in c and "firstName" in c:
        return {
            "position": c["position"],
            "lastName": c["lastName"],
            "firstName": c["firstName"],
            "profession": c.get("profession"),
            "stimmen": None,
        }
    # Bayern format
    cid = c.get("id")
    name = (c.get("name") or "").strip()
    # Position = id mod 100 (1..99)
    position = (cid % 100) if isinstance(cid, int) else 0
    # Best-effort split of "Vorname [Mittelnamen] Nachname". Take last token
    # as last name, the rest as first name. Titles like "Dr." stay attached
    # to the first name.
    parts = name.split()
    if len(parts) >= 2:
        last = parts[-1]
        first = " ".join(parts[:-1])
    else:
        last = name
        first = ""
    return {
        "position": position,
        "lastName": last,
        "firstName": first,
        "profession": None,
        "stimmen": None,
    }


def load_roster(slug: str) -> list[dict] | None:
    """Load the candidate roster, normalising both layouts:
    - Hessen: `{"parties": [...]}`
    - Bayern: `[...]` directly at the top level.
    Returns the parties list, or None when no roster exists."""
    p = DATA_DIR / f"{slug}.json"
    if not p.exists():
        return None
    data = json.loads(p.read_text(encoding="utf-8"))
    if isinstance(data, dict) and "parties" in data:
        return data["parties"]
    if isinstance(data, list):
        return data
    return None


def find_regionaleinheit(root: ET.Element, schluessel: int) -> ET.Element | None:
    for r in root.findall("Regionaleinheit"):
        if r.attrib.get("Schluesselnummer") == str(schluessel):
            return r
    return None


def party_color_lookup() -> dict[str, str]:
    """Use the existing partyColors.ts via a simple regex grab — that file is
    canonical for the app's color set."""
    pc_path = REPO_ROOT / "src" / "data" / "partyColors.ts"
    text = pc_path.read_text(encoding="utf-8")
    out: dict[str, str] = {}
    # Match lines like:  'CSU': '#000000',
    for m in re.finditer(r"'([^']+)':\s*'(#[0-9A-Fa-f]{6,8})'", text):
        out[m.group(1)] = m.group(2)
    return out


def ingest(slug: str, schluessel: int, root: ET.Element, colors: dict[str, str]) -> bool:
    print(f"\n[{slug}] Schluesselnummer={schluessel}", file=sys.stderr)

    region = find_regionaleinheit(root, schluessel)
    if region is None:
        print(f"  ERROR: not found in XML", file=sys.stderr)
        return False

    wahl = region.find("Wahl")
    if wahl is None:
        print(f"  ERROR: no <Wahl> element", file=sys.stderr)
        return False

    allg = wahl.find("Allgemeine_Angaben")
    erg = wahl.find("Stimmenergebnis")
    if allg is None or erg is None:
        print(f"  ERROR: missing Allgemeine_Angaben or Stimmenergebnis", file=sys.stderr)
        return False

    name = find_text(allg, "Name_der_Regionaleinheit") or slug
    stand_date = find_text(allg, "Stand_Tagesdatum") or "unknown"

    # Aggregates
    stimmberechtigte = parse_int(find_text(allg, "Stimmberechtigte"))
    waehler = parse_int(find_text(allg, "Waehler"))
    turnout = parse_float(find_text(allg, "Wahlbeteiligung_aktuell"))
    ungueltig = erg.find("Ungueltige_Stimmzettel")
    ungueltig_n = parse_int(find_text(ungueltig, "Anzahl")) if ungueltig is not None else None

    zusammen = erg.find("Wahlvorschlaege_zusammen")
    valid_votes = parse_int(find_text(zusammen, "Stimmen")) if zusammen is not None else None
    total_seats = parse_int(find_text(zusammen, "Sitze")) if zusammen is not None else None

    # Per-party
    parties_out: list[dict] = []
    list_number = 1
    for wv in erg.findall("Wahlvorschlag"):
        bezeichnung = find_text(wv, "Bezeichnung") or "?"
        short = normalize_party_short(bezeichnung)
        seats = parse_int(find_text(wv, "Sitze")) or 0
        absolute = parse_int(find_text(wv, "Stimmen_absolut"))
        weighted = parse_int(find_text(wv, "Gewichtete_Stimmen_absolut"))
        percent = parse_float(find_text(wv, "Gewichtete_Stimmen_Anteil"))
        parties_out.append({
            "listNumber": list_number,
            "shortName": short,
            "fullName": bezeichnung,
            "color": colors.get(short),
            "percent": percent,
            "votesAbsolute": absolute,
            "votesWeighted": weighted,
            "seats": seats,
            "candidates": [],   # No per-candidate data in this source
        })
        list_number += 1

    parties_out.sort(key=lambda p: (-(p["seats"] or 0), -(p["percent"] or 0)))

    # If we have a roster, fill in candidate names + positions WITHOUT Stimmen
    # so the read-only ballot can still display the lists. Match by listNumber
    # — but Bayern's XML order won't match our roster's listNumber order
    # exactly. Match by shortName instead.
    roster = load_roster(slug)
    if roster:
        # Bayern roster entries use `name` (not `shortName`) as the canonical
        # short label. Try both keys to be permissive.
        def short_of(party_dict: dict) -> str:
            return party_dict.get("shortName") or party_dict.get("name") or ""
        roster_by_short = {short_of(p): p for p in roster}
        for p in parties_out:
            r = roster_by_short.get(p["shortName"])
            if r:
                p["listNumber"] = r["listNumber"]  # use canonical roster numbering
                p["candidates"] = [
                    candidate_from_roster(c)
                    for c in r["candidates"]
                ]
        # Re-sort after listNumber updates if any (we still want seats-desc display)
        parties_out.sort(key=lambda p: (-(p["seats"] or 0), -(p["percent"] or 0)))

    out = {
        "election": slug,
        "stand": stand_date,
        "totalSeats": total_seats,
        "totals": {
            "validVotes": valid_votes,
            "validBallots": (waehler - (ungueltig_n or 0)) if waehler is not None else None,
            "wahlberechtigte": stimmberechtigte,
            "waehlerGesamt": waehler,
            "ungueltigeStimmzettel": ungueltig_n,
            "kandidatenInsgesamt": (
                sum(len(p["candidates"]) for p in parties_out) or None
            ),
            "frauenInsgesamt": None,
            "ballotsWithListenkreuz": None,
            "ballotsWithListenkreuzPercent": None,
            "turnout": turnout,
        },
        "parties": parties_out,
        "ideologicalOrder": DEFAULT_IDEOLOGICAL_ORDER,
        "sources": [XML_URL],
    }

    out_path = DATA_DIR / f"results-{slug}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    seat_total = sum(p["seats"] or 0 for p in parties_out)
    print(
        f"  wrote {out_path.name} — name={name!r} parties={len(parties_out)} "
        f"seats={seat_total} stand={stand_date}",
        file=sys.stderr,
    )
    return True


def main() -> None:
    requested = sys.argv[1:] or list(BAYERN_CITIES.keys())
    print(f"Fetching Bayern XML...", file=sys.stderr)
    xml_text = fetch(XML_URL)
    print(f"  {len(xml_text)} bytes", file=sys.stderr)
    root = ET.fromstring(xml_text)
    colors = party_color_lookup()
    print(f"  loaded {len(colors)} party colors from partyColors.ts", file=sys.stderr)

    ok, fail = [], []
    for slug in requested:
        if slug not in BAYERN_CITIES:
            print(f"\n[{slug}] not in BAYERN_CITIES — skipping", file=sys.stderr)
            fail.append(slug)
            continue
        if ingest(slug, BAYERN_CITIES[slug], root, colors):
            ok.append(slug)
        else:
            fail.append(slug)

    print(f"\n=== Done ===", file=sys.stderr)
    print(f"  succeeded: {len(ok)} ({', '.join(ok)})", file=sys.stderr)
    if fail:
        print(f"  failed:    {len(fail)} ({', '.join(fail)})", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
