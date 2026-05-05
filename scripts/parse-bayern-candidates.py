#!/usr/bin/env python3
"""Bayern Stadtrat 2026 — per-candidate Stimmen scraper.

Fills in `stimmen` on each candidate in `public/data/results-{slug}.json`
by scraping the per-city result-portal HTML. All 24 of the 25 Bayern
kreisfreie Städte use the same vendor template ("movaplus") with an
accordion of `<table>`s — one per party — whose rows have:

  Nr. | Name, Vorname | Erreichter Platz / Rang | Stimmen | Gewählt

The party label is in the accordion-item title's `<abbr>` element.
We match accordion sections to roster parties by short-name; within a
section we match candidates by `position` (the table's "Nr." column).

Nürnberg lacks a per-candidate HTML page (only PDFs published by the
Wahlamt) so it stays party-level.

Heading variants observed:
  - "Bewerbende - Stimmen und Platzierung" (München)
  - "Einzelstimmen der Kandidierenden"     (Augsburg)
  - "Ergebnisse aller Bewerberinnen und Bewerber"
                                            (Amberg, Ansbach, Aschaffenburg,
                                             Bamberg, Erlangen, Hof,
                                             Ingolstadt, Kaufbeuren, Kempten,
                                             Memmingen, Passau, Regensburg,
                                             Rosenheim, Schweinfurt,
                                             Straubing, Würzburg)
  - "Kandidatenstimmen und Gewählte"        (Bayreuth, Coburg, Fürth,
                                             Landshut, Schwabach, Weiden)
  - "Einzelstimmen aller Bewerber"          (Hof)

Usage:
  python3 scripts/parse-bayern-candidates.py [<slug>...]
    No args   → enrich every entry in URLS.
    With args → only the listed slugs.

In-place updates: public/data/results-{slug}.json
"""

from __future__ import annotations

import json
import re
import ssl
import sys
import urllib.request
from html import unescape
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "public" / "data"

UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
)

# Per-city result-portal URLs verified to serve the per-candidate HTML.
URLS: dict[str, str] = {
    "amberg-stadtrat":         "https://wahl.amberg.de/2026/ergebnisse_stadtrat.html",
    "ansbach-stadtrat":        "https://wahlen2026.ansbach.de/kommunal/index.html",
    "aschaffenburg-stadtrat":  "https://wahl.aschaffenburg.de/stadtratswahl2026/index.html",
    "augsburg-stadtrat":       "https://www.augsburg.de/fileadmin/user_upload/verwaltungswegweiser/buergeramt/wahlen/kommunalwahlen/2026/sr/index.html",
    "bamberg-stadtrat":        "https://wahlen.bamberg.de/Stadtratswahl_2026/index.html",
    "bayreuth-stadtrat":       "https://online-dienste.bayreuth.de/wahlen/stadtratswahlen/2026/ergebnisse.html",
    "coburg-stadtrat":         "https://coburg-waehlt.de/STR2026/index.html",
    "erlangen-stadtrat":       "https://erlangen.de/wahlen/kw2026/index.html",
    "fuerth-stadtrat":         "https://www.wahl-fuerth.de/_SR_2026_IVU/index.html",
    "hof-stadtrat":            "https://www.wahl-hof.de/sr2026/index.html",
    "ingolstadt-stadtrat":     "https://wahlen.ingolstadt.de/index.html",
    "kaufbeuren-stadtrat":     "https://wahlen.osrz-akdb.de/sw-p/762000/1/20260308/gemeinderatswahl_gemeinde/ergebnisse.html",
    "kempten-stadtrat":        "https://wahlen.osrz-akdb.de/sw-p/763000/2/20260308/gemeinderatswahl_gemeinde/ergebnisse.html",
    "landshut-stadtrat":       "https://landshut.de/wahlen/Stadtratswahl-2026/ergebnisse.html",
    "memmingen-stadtrat":      "https://www.memmingen.de/fileadmin/wahl/2026_Stadtrat/stadtratswahl_memmingen_2026_ergebnisse.html",
    "muenchen-stadtrat":       "https://www.wahlen-muenchen.de/ergebnisse/1_20260308stadtratswahl/index.html",
    "passau-stadtrat":         "https://wahl.passau.de/stadtrat2026/index.html",
    "regensburg-stadtrat":     "https://www.regensburg.de/wahlen/stadtratswahl/index.html",
    "rosenheim-stadtrat":      "https://www.rosenheim.de/wahl/2026_strwahl/ergebnisse.html",
    "schwabach-stadtrat":      "https://www.schwabach.de/de/politik/wahlen/wahlergebnisse/kommunalwahlen-2026.html",
    "schweinfurt-stadtrat":    "https://wahlen.osrz-akdb.de/uf-p/662000/2/20260308/gemeinderatswahl_gemeinde/ergebnisse.html",
    "straubing-stadtrat":      "https://wahlen.straubing.de/stadtrat2026/index.html",
    "weiden-stadtrat":         "https://www.wahlen.weiden.de/20260308/106039/",
    "wuerzburg-stadtrat":      "https://wahlen.wuerzburg.de/Wahl2026-08-03/Kommunalwahl/ergebnisse.html",
    # nuernberg-stadtrat: no per-candidate HTML page exists; only PDFs.
}

# Party-name normalization.  The portal shows whatever the local party
# uses on its Wahlvorschlag (e.g. "JU Bayern", "Amberger Bunt", "FREIE
# WÄHLER/ FW Amberg") which doesn't always match our roster's shortName.
# Map both directions to a canonical key for comparison.
_CANON_ALIASES = {
    "BÜNDNIS 90/DIE GRÜNEN": "GRÜNE",
    "FREIE WÄHLER": "FW",
    "JUNGE UNION": "JU",
    "DIE LINKE": "DIE LINKE",
    "DIE LINKE LANDESVERBAND": "DIE LINKE",
    "ALTERNATIVE FÜR DEUTSCHLAND": "AFD",
    "FREIE DEMOKRATISCHE PARTEI": "FDP",
    "SOZIALDEMOKRATISCHE PARTEI DEUTSCHLANDS": "SPD",
    "SOZIALDEMOKRATISCHE PARTEI DEUTSCHLAND": "SPD",
    "CHRISTLICH-SOZIALE UNION IN BAYERN": "CSU",
    "ÖKOLOGISCH-DEMOKRATISCHE PARTEI": "ÖDP",
    "BÜNDNIS SAHRA WAGENKNECHT": "BSW",
    "BAYERNPARTEI": "BP",
}


def canon(short: str) -> str:
    s = unescape(short).strip().upper()
    s = re.sub(r"\s+", " ", s)
    # Apply known aliases on the FULL untruncated string first — many of
    # them embed slashes ("BÜNDNIS 90/DIE GRÜNEN") which the slash-strip
    # below would otherwise nuke.
    for src, dst in _CANON_ALIASES.items():
        if s == src or s.startswith(src + " ") or s.startswith(src + ","):
            return dst
    # Drop everything after first slash (Bayern's "FREIE WÄHLER/Freie Wähler X" form)
    s = s.split("/")[0].strip()
    # Strip generic legal suffixes
    s = re.sub(r"\s+E\.\s*V\.\s*$", "", s)
    # Strip "IN" preposition before BAYERN ("CHRISTLICH-SOZIALE UNION IN BAYERN")
    s = re.sub(r"\s+IN\s+BAYERN\b.*$", "", s)
    # Strip city suffixes (with optional preceding hyphen) and "BAYERN"
    s = re.sub(
        r"[\s\-]+(BAYERN|LANDESVERBAND|KREISVERBAND|KV|AMBERG|ANSBACH|ASCHAFFENBURG|AUGSBURG|BAMBERG|BAYREUTH|COBURG|ERLANGEN|FÜRTH|HOF|INGOLSTADT|KAUFBEUREN|KEMPTEN|LANDSHUT|MEMMINGEN|MÜNCHEN|MUENCHEN|PASSAU|REGENSBURG|ROSENHEIM|SCHWABACH|SCHWEINFURT|STRAUBING|WEIDEN|WÜRZBURG|WUERZBURG)\b.*$",
        "", s,
    )
    s = s.strip()
    # Re-apply aliases after stripping (catches partials like "FREIE WÄHLER" after strip)
    for src, dst in _CANON_ALIASES.items():
        if s == src or s.startswith(src + " ") or s.startswith(src + ","):
            return dst
    return s


def fetch(url: str) -> str:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=20, context=ctx) as r:
        return r.read().decode("utf-8", errors="replace")


# A "section" = an accordion-item containing one party's per-candidate
# table.  We need the (party-short, party-fullname, [(position, stimmen,
# elected)…]) tuples from each section.
ACCORDION_RX = re.compile(
    r'<article[^>]*class="[^"]*accordion-item[^"]*"[^>]*>(.*?)</article>',
    re.DOTALL,
)
PARTEI_RX = re.compile(
    r'<abbr\s+title="([^"]*)"[^>]*>([^<]+)</abbr>',
    re.DOTALL,
)
ROW_RX = re.compile(
    r'<tr\b[^>]*>(.*?)</tr>',
    re.DOTALL,
)
DATA_SORT_RX = re.compile(r'data-sort="([^"]*)"')


def parse_int(s: str) -> int | None:
    s = (s or "").strip().replace(".", "").replace(",", "")
    if not s:
        return None
    try:
        return int(s)
    except ValueError:
        return None


def extract_sections(html: str) -> list[dict]:
    """Pull each accordion section that contains a per-candidate table.
    Most cities have 5 columns (Nr., Name, Rang, Stimmen, Gewählt) but
    Fürth uses 4 (Gewählt column omitted). Handle both."""
    sections: list[dict] = []
    for m in ACCORDION_RX.finditer(html):
        block = m.group(1)
        if 'data-sort="Stimmen"' not in block:
            continue
        # Identify column layout from the header row
        thead = re.search(r"<thead.*?</thead>", block, re.DOTALL)
        if not thead:
            continue
        header_cols = DATA_SORT_RX.findall(thead.group(0))
        # Locate column indices by header label
        header_lower = [unescape(h).strip().lower() for h in header_cols]
        try:
            nr_idx = next(i for i, h in enumerate(header_lower) if h in ("nr.", "nummer"))
        except StopIteration:
            continue
        try:
            stimmen_idx = next(i for i, h in enumerate(header_lower) if h == "stimmen")
        except StopIteration:
            continue
        gew_idx = next(
            (i for i, h in enumerate(header_lower) if h.startswith("gew") and h != "stimmen"),
            None,
        )
        ncols = len(header_cols)

        pm = PARTEI_RX.search(block)
        if not pm:
            continue
        full_name = unescape(pm.group(1)).strip()
        short_name = unescape(pm.group(2)).strip()

        # Need to extract the candidate first/last names too — Ansbach &
        # Fürth ship per-candidate Stimmen but no separate roster file, so
        # we'll use the portal as the source of truth for those cities.
        try:
            name_idx = next(i for i, h in enumerate(header_lower) if "name" in h)
        except StopIteration:
            name_idx = None

        tbody_match = re.search(r"<tbody[^>]*>(.*?)</tbody>", block, re.DOTALL)
        if not tbody_match:
            continue
        candidates: list[dict] = []
        for rm in ROW_RX.finditer(tbody_match.group(1)):
            cell_values = DATA_SORT_RX.findall(rm.group(1))
            if len(cell_values) < ncols:
                continue
            position = parse_int(cell_values[nr_idx])
            stimmen = parse_int(cell_values[stimmen_idx])
            if gew_idx is not None:
                elected = unescape(cell_values[gew_idx]).strip().lower().startswith("gew")
            else:
                elected = None  # caller can infer from rank vs seats
            name_raw = (
                unescape(cell_values[name_idx]).strip() if name_idx is not None else ""
            )
            # Bayern format is "Lastname[, suffix] Firstname [Middle…]"
            # but the data-sort value is sortable form: "Lastname Firstname".
            parts = name_raw.split()
            if len(parts) >= 2:
                last_name, first_name = parts[0], " ".join(parts[1:])
            else:
                last_name, first_name = name_raw, ""
            if position is None:
                continue
            candidates.append({
                "position": position,
                "lastName": last_name,
                "firstName": first_name,
                "stimmen": stimmen,
                "elected": elected,
            })
        if candidates:
            sections.append({
                "shortName": short_name,
                "fullName": full_name,
                "candidates": candidates,
            })
    return sections


def enrich(slug: str, url: str) -> bool:
    out_path = DATA_DIR / f"results-{slug}.json"
    if not out_path.exists():
        print(f"  [{slug}] no results-*.json file — skipping", file=sys.stderr)
        return False

    print(f"\n[{slug}] {url}", file=sys.stderr)
    html = fetch(url)
    print(f"  fetched {len(html)} bytes", file=sys.stderr)

    sections = extract_sections(html)
    print(f"  found {len(sections)} candidate-table sections", file=sys.stderr)

    if not sections:
        print(f"  WARN: no sections extracted", file=sys.stderr)
        return False

    # Index sections by canonical short and full names — try both directions.
    by_short: dict[str, dict] = {}
    by_full: dict[str, dict] = {}
    for s in sections:
        by_short[canon(s["shortName"])] = s
        by_full[canon(s["fullName"])] = s

    data = json.loads(out_path.read_text(encoding="utf-8"))

    matched_parties = 0
    matched_candidates = 0
    skipped_parties = []
    for party in data.get("parties", []):
        # Match strategy: short→short, then full→full, then short→full and full→short
        sec = by_short.get(canon(party["shortName"]))
        if sec is None:
            sec = by_full.get(canon(party.get("fullName", "")))
        if sec is None:
            sec = by_full.get(canon(party["shortName"]))
        if sec is None:
            sec = by_short.get(canon(party.get("fullName", "")))
        if sec is None:
            skipped_parties.append(party["shortName"])
            continue
        matched_parties += 1
        # If the roster has no candidates (no .json roster file shipped
        # for that city), populate them from the portal.
        if not party.get("candidates"):
            party["candidates"] = [
                {
                    "position": c["position"],
                    "lastName": c["lastName"],
                    "firstName": c["firstName"],
                    "profession": None,
                    "stimmen": c["stimmen"],
                }
                for c in sorted(sec["candidates"], key=lambda x: x["position"])
            ]
            matched_candidates += sum(1 for c in sec["candidates"] if c["stimmen"] is not None)
            continue
        # Otherwise enrich existing roster entries by position
        by_pos = {c["position"]: c for c in sec["candidates"]}
        for cand in party.get("candidates", []):
            pos = cand.get("position")
            sc = by_pos.get(pos)
            if sc is None:
                continue
            if sc["stimmen"] is not None:
                cand["stimmen"] = sc["stimmen"]
                matched_candidates += 1

    # Recompute kandidatenInsgesamt (don't overwrite if already set; just log)
    print(
        f"  matched parties={matched_parties}/{len(data.get('parties', []))}, "
        f"candidates={matched_candidates}",
        file=sys.stderr,
    )
    if skipped_parties:
        print(f"  unmatched parties: {skipped_parties}", file=sys.stderr)

    # Add scraper source
    sources = data.get("sources", [])
    if url not in sources:
        sources.append(url)
        data["sources"] = sources

    out_path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"  wrote {out_path.name}", file=sys.stderr)
    return matched_candidates > 0


def main() -> None:
    requested = sys.argv[1:] or list(URLS.keys())
    ok, fail = [], []
    for slug in requested:
        if slug not in URLS:
            print(f"\n[{slug}] not in URLS map — skipping", file=sys.stderr)
            fail.append(slug)
            continue
        try:
            if enrich(slug, URLS[slug]):
                ok.append(slug)
            else:
                fail.append(slug)
        except Exception as e:
            print(f"  ERROR: {e}", file=sys.stderr)
            fail.append(slug)

    print(f"\n=== Done ===", file=sys.stderr)
    print(f"  succeeded: {len(ok)} ({', '.join(ok)})", file=sys.stderr)
    if fail:
        print(f"  failed:    {len(fail)} ({', '.join(fail)})", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
