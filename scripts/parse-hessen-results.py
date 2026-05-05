#!/usr/bin/env python3
"""Generic Hessen Kommunalwahl 2026 results extractor.

Pulls per-candidate Stimmen for any Hessen election that ekom21's votemanager
publishes Open-Data CSVs for (effectively all of them). Generalizes
parse-frankfurt-results.py: looks up host by AGS, probes filename variants
(Stadtverordnetenwahl vs Wahl-zur-Stadtverordnetenversammlung; KAV;
Kreiswahl), reuses the same D{listNum}_{position} candidate-vote schema.

Usage:
  python3 scripts/parse-hessen-results.py [<slug>...]
    No args   → ingest every entry in HESSEN_CITIES below.
    With args → ingest only the listed slugs.

Out:  public/data/results-{slug}.json
"""

from __future__ import annotations

import csv
import io
import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "public" / "data"
ELECTION_DATE = "2026-03-15"

# All ekom21 votemanager hosts that serve Hessen 2026 Kommunalwahl results.
# These are regionally sliced — `da` covers the Darmstadt region, `ks` covers
# the north, `gi` covers Mittelhessen, etc. Each AGS lives on exactly one host.
VOTEMANAGER_HOSTS = ["ffm", "wi", "da", "ks", "gi"]

# Hessen-wide aggregate CSV (used for seats + percent + women count etc.) —
# unchanged from the Frankfurt extractor.
HESSEN_CSV_URL = (
    "https://wahlen.hessen-kw26.23degrees.eu/assets/"
    "Wahlergebnisse_Gemeindewahl2026_Hessen.csv"
)
PARTIES_JSON_URL = "https://wahlen.hessen-kw26.23degrees.eu/assets/parties.json"

# Per-slug ingestion config: AGS, election kind, expected total seats.
# (Election kind picks which CSV filename to fetch; total seats is editorial /
# read from the dest config file later if we want it driven from there.)
HESSEN_CITIES: dict[str, dict] = {
    # Kreisfreie Städte
    "frankfurt-stvv":  {"ags": "06412000", "kind": "stadtverordnete"},
    "frankfurt-kav":   {"ags": "06412000", "kind": "kav"},
    "wiesbaden-stvv":  {"ags": "06414000", "kind": "stadtverordnete"},
    "wiesbaden-kav":   {"ags": "06414000", "kind": "kav"},
    "darmstadt-stvv":  {"ags": "06411000", "kind": "stadtverordnete"},
    "darmstadt-kav":   {"ags": "06411000", "kind": "kav"},
    "kassel-stvv":     {"ags": "06611000", "kind": "stadtverordnete"},
    "kassel-kav":      {"ags": "06611000", "kind": "kav"},
    "offenbach-stvv":  {"ags": "06413000", "kind": "stadtverordnete"},
    "offenbach-kav":   {"ags": "06413000", "kind": "kav"},
    # Kreisangehörige Städte
    "hanau-stvv":         {"ags": "06415000", "kind": "stadtverordnete"},
    "hanau-kav":          {"ags": "06415000", "kind": "kav"},
    "giessen-stvv":       {"ags": "06531005", "kind": "stadtverordnete"},
    "giessen-kav":        {"ags": "06531005", "kind": "kav"},
    "marburg-stvv":       {"ags": "06534014", "kind": "stadtverordnete"},
    "marburg-kav":        {"ags": "06534014", "kind": "kav"},
    "fulda-stvv":         {"ags": "06631009", "kind": "stadtverordnete"},
    "fulda-kav":          {"ags": "06631009", "kind": "kav"},
    "bad-homburg-stvv":   {"ags": "06434001", "kind": "stadtverordnete"},
    "ruesselsheim-stvv":  {"ags": "06433012", "kind": "stadtverordnete"},
    "ruesselsheim-kav":   {"ags": "06433012", "kind": "kav"},
    "wetzlar-stvv":       {"ags": "06532023", "kind": "stadtverordnete"},
    # Kreistage
    "dadi-kreistag":      {"ags": "06432002", "kind": "kreis"},
}

# Ideological ordering applied to all Hessen Kommunalwahl results. Editorial
# best-guess; placement of local Wählergruppen is approximate.
DEFAULT_IDEOLOGICAL_ORDER = [
    "Die Linke", "ÖkoLinX", "MERA25", "Die PARTEI", "Frankfurt-Sozial!",
    "SPD", "GRÜNE", "Volt",
    "Tierschutzpartei", "Gartenpartei Ffm", "PIRATEN", "GUG",
    "FDP", "FREIE WÄHLER",
    "CDU",
    "BFF", "IBF", "ELF", "DFRA", "BIG", "BSW",
    "AfD",
]


def fetch(url: str) -> str:
    """Fetch a URL with a real User-Agent (ekom21 fronted by Cloudflare)."""
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
            ),
            "Accept": "text/csv, text/html, application/json, */*;q=0.5",
            "Accept-Language": "de-DE,de;q=0.9,en;q=0.8",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.read().decode("utf-8")


# ──────────────────────────── helpers (Frankfurt extractor) ────────────────────


def parse_int(val: str | None) -> int | None:
    if val is None or val == "":
        return None
    try:
        return int(val.replace(".", "").replace(",", "").strip())
    except ValueError:
        return None


def parse_float(val: str | None) -> float | None:
    if val is None or val == "":
        return None
    try:
        return float(val.replace(",", ".").strip())
    except ValueError:
        return None


def per_candidate_stimmen(
    cells: dict[str, str], list_number: int, position: int
) -> int | None:
    return parse_int(cells.get(f"D{list_number}_{position}"))


def per_party_total(cells: dict[str, str], list_number: int) -> int | None:
    return parse_int(cells.get(f"D{list_number}"))


def parse_votemanager_row(csv_text: str) -> dict[str, str]:
    reader = csv.reader(io.StringIO(csv_text), delimiter=";")
    rows = list(reader)
    if len(rows) < 2:
        raise RuntimeError("votemanager CSV has no data row")
    header = rows[0]
    data = rows[1]
    if len(header) != len(data):
        raise RuntimeError(
            f"header/data length mismatch: {len(header)} vs {len(data)}"
        )
    return dict(zip(header, data))


def get_hessen_row(
    csv_text: str, ags: str
) -> tuple[list[str], list[str]] | tuple[None, None]:
    """Look up a row by AGS. The Hessen-wide CSV stores AGS without the
    state prefix (`000412000` for Frankfurt, where the leading `0` group
    is the state-and-kreis padding rather than `06-`), while votemanager
    and our code use the canonical 8-digit form `06412000`. Compare the
    last 6 digits (kreis + gemeinde) which are equal across both."""
    reader = csv.reader(io.StringIO(csv_text), delimiter=";")
    rows = list(reader)
    header = rows[1]
    # Last 6 digits of the canonical 8-digit AGS = kreis(3) + gemeinde(3)
    target_tail = ags[-6:]
    for row in rows[2:]:
        cell = row[0].strip().strip('"')
        if cell.endswith(target_tail) and len(cell) >= 6:
            return header, row
    return None, None


def csv_field(header: list[str], row: list[str], col: str) -> str | None:
    try:
        idx = header.index(col)
    except ValueError:
        return None
    val = row[idx]
    return val.strip() if val.strip() else None


def wg_alias_map(header: list[str], row: list[str]) -> dict[str, str]:
    out: dict[str, str] = {}
    for i, col in enumerate(header):
        if col.endswith(" Kurzname"):
            wg_label = col[: -len(" Kurzname")]
            actual = row[i].strip().strip('"')
            if actual:
                out[wg_label] = actual
    return out


def resolve_alias(party: str, aliases: dict[str, str]) -> str:
    return aliases.get(party, party)


def party_seats_from_csv(
    header: list[str], row: list[str], aliases: dict[str, str]
) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, col in enumerate(header):
        if col.endswith(" Sitze") and not col.endswith(" darunter Frauen"):
            party = resolve_alias(col[: -len(" Sitze")], aliases)
            n = parse_int(row[i])
            if n and n > 0:
                out[party] = n
    return out


def party_votes_weighted(
    header: list[str], row: list[str], aliases: dict[str, str]
) -> dict[str, int]:
    out: dict[str, int] = {}
    for i, col in enumerate(header):
        if col.endswith(" gewichtet"):
            party = resolve_alias(col[: -len(" gewichtet")], aliases)
            n = parse_int(row[i])
            if n and n > 0:
                out[party] = n
    return out


def party_percent_from_csv(
    header: list[str], row: list[str], aliases: dict[str, str]
) -> dict[str, float]:
    out: dict[str, float] = {}
    for i, col in enumerate(header):
        if col.endswith(" (%)"):
            party = resolve_alias(col[: -len(" (%)")], aliases)
            v = parse_float(row[i])
            if v is not None:
                out[party] = v
    return out


# ──────────────────────────────── ekom21 discovery ─────────────────────────────


_HOST_BY_AGS: dict[str, str] | None = None


def discover_host(ags: str) -> str | None:
    """Find which votemanager host serves a given AGS by enumerating each host's
    /2026-03-15/ index. Memoised. Returns short host like 'ffm' or None."""
    global _HOST_BY_AGS
    if _HOST_BY_AGS is None:
        print("  [discover] indexing all votemanager hosts...", file=sys.stderr)
        _HOST_BY_AGS = {}
        for h in VOTEMANAGER_HOSTS:
            try:
                body = fetch(f"https://votemanager-{h}.ekom21cdn.de/{ELECTION_DATE}/")
            except Exception:
                continue
            for hosted in set(re.findall(r'href="(0\d{7})/"', body)):
                _HOST_BY_AGS[hosted] = h
        print(f"  [discover] {len(_HOST_BY_AGS)} AGS hosted across {len(VOTEMANAGER_HOSTS)} hosts", file=sys.stderr)
    return _HOST_BY_AGS.get(ags)


# Election kind → list of CSV filename infixes to try (first match wins).
ELECTION_FILENAMES: dict[str, list[str]] = {
    "stadtverordnete": ["Stadtverordnetenwahl", "Wahl-zur-Stadtverordnetenversammlung"],
    "kav":             ["Auslaenderbeiratswahl"],
    "kreis":           ["Kreiswahl"],
}


def fetch_votemanager_csv(host: str, ags: str, kind: str) -> tuple[str, str]:
    """Try each filename variant for the given election kind. Returns
    (csv_text, url_used). Raises if none match."""
    base = f"https://votemanager-{host}.ekom21cdn.de/{ELECTION_DATE}/{ags}/daten/opendata"
    last_err: Exception | None = None
    for infix in ELECTION_FILENAMES[kind]:
        url = f"{base}/Open-Data-{ags}-{infix}-Gemeinde.csv"
        try:
            return fetch(url), url
        except urllib.error.HTTPError as e:
            if e.code == 404:
                last_err = e
                continue
            raise
    raise RuntimeError(
        f"No CSV found for ags={ags} kind={kind} on host={host} "
        f"(last error: {last_err})"
    )


# ─────────────────────────────────── main ─────────────────────────────────────


def load_roster(slug: str) -> dict | None:
    """Load the candidate roster from public/data/{slug}.json. Returns None
    when no roster exists (we'll skip per-candidate Stimmen but still emit
    party-level results from the Hessen CSV)."""
    p = DATA_DIR / f"{slug}.json"
    if not p.exists():
        return None
    return json.loads(p.read_text(encoding="utf-8"))


def ingest(
    slug: str,
    ags: str,
    kind: str,
    hessen_csv_text: str,
    parties_meta: list[dict],
) -> bool:
    """Ingest one election. Returns True on success."""
    print(f"\n[{slug}] AGS={ags} kind={kind}", file=sys.stderr)

    host = discover_host(ags)
    if host is None:
        print(f"  ERROR: no votemanager host serves {ags}", file=sys.stderr)
        return False
    print(f"  host: votemanager-{host}", file=sys.stderr)

    try:
        vm_text, vm_url = fetch_votemanager_csv(host, ags, kind)
    except Exception as e:
        print(f"  ERROR fetching CSV: {e}", file=sys.stderr)
        return False
    cells = parse_votemanager_row(vm_text)
    print(f"  fetched {len(vm_text)} bytes from {vm_url.rsplit('/', 1)[-1]}", file=sys.stderr)

    # Stand date
    stand = "unknown"
    raw_datum = cells.get("datum", "").strip()
    m = re.match(r"^(\d{2})\.(\d{2})\.(\d{4})$", raw_datum)
    if m:
        stand = f"{m.group(3)}-{m.group(2)}-{m.group(1)}"

    # Hessen-wide aggregate
    h_header, h_row = get_hessen_row(hessen_csv_text, ags)
    aliases: dict[str, str] = {}
    seats_by_short: dict[str, int] = {}
    weighted_by_short: dict[str, int] = {}
    percent_by_short: dict[str, float] = {}
    if h_header is not None:
        aliases = wg_alias_map(h_header, h_row)
        seats_by_short = party_seats_from_csv(h_header, h_row, aliases)
        weighted_by_short = party_votes_weighted(h_header, h_row, aliases)
        percent_by_short = party_percent_from_csv(h_header, h_row, aliases)
    else:
        print(f"  warning: AGS {ags} not in Hessen CSV — seats/percent will be missing",
              file=sys.stderr)

    party_long = {p["name"]: p["longName"] for p in parties_meta}
    party_color = {p["name"]: p["color"] for p in parties_meta}

    # Roster — when present, we get full per-candidate Stimmen; otherwise
    # emit party-only results.
    roster = load_roster(slug)

    parties_out: list[dict] = []
    expected_total_candidates = 0
    matched_total_candidates = 0
    if roster:
        for party in roster["parties"]:
            list_number = party["listNumber"]
            short_name = party["shortName"]
            cands_out: list[dict] = []
            for c in party["candidates"]:
                stimmen = per_candidate_stimmen(cells, list_number, c["position"])
                expected_total_candidates += 1
                if stimmen is not None:
                    matched_total_candidates += 1
                cands_out.append({
                    "position": c["position"],
                    "lastName": c["lastName"],
                    "firstName": c["firstName"],
                    "profession": c.get("profession"),
                    "stimmen": stimmen,
                })
            cands_out.sort(key=lambda x: x["position"])
            parties_out.append({
                "listNumber": list_number,
                "shortName": short_name,
                "fullName": party["fullName"],
                "color": party_color.get(short_name),
                "percent": percent_by_short.get(short_name),
                "votesAbsolute": per_party_total(cells, list_number),
                "votesWeighted": weighted_by_short.get(short_name),
                "seats": seats_by_short.get(short_name, 0),
                "candidates": cands_out,
            })
        parties_out.sort(
            key=lambda p: (-(p["seats"] or 0), -(p["percent"] or 0))
        )

    # Totals
    totals = {
        "validVotes": parse_int(cells.get("D")),
        "validBallots": (parse_int(cells.get("B")) or 0) - (parse_int(cells.get("C")) or 0)
                        if cells.get("B") and cells.get("C") else None,
        "wahlberechtigte": parse_int(cells.get("A1")),
        "waehlerGesamt": parse_int(cells.get("B")),
        "ungueltigeStimmzettel": parse_int(cells.get("C")),
        "kandidatenInsgesamt": expected_total_candidates if roster else None,
        "frauenInsgesamt": parse_int(csv_field(h_header, h_row, "Bewerberinnen"))
                          if h_header is not None else None,
        "ballotsWithListenkreuz": parse_int(
            csv_field(h_header, h_row, "Stimmzettel mit Listenkreuz")
        ) if h_header is not None else None,
        "ballotsWithListenkreuzPercent": parse_float(
            csv_field(h_header, h_row, "Stimmzettel mit Listenkreuz (%)")
        ) if h_header is not None else None,
        "turnout": parse_float(csv_field(h_header, h_row, "Wahlbeteiligung"))
                   if h_header is not None else None,
    }

    seat_total = sum(p["seats"] or 0 for p in parties_out) if parties_out else 0
    out = {
        "election": slug,
        "stand": stand,
        "totalSeats": seat_total or None,  # null if we couldn't compute it
        "totals": totals,
        "parties": parties_out,
        "ideologicalOrder": DEFAULT_IDEOLOGICAL_ORDER,
        "sources": [
            vm_url,
            HESSEN_CSV_URL,
            PARTIES_JSON_URL,
        ],
    }

    out_path = DATA_DIR / f"results-{slug}.json"
    with out_path.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(
        f"  wrote {out_path.name} — parties={len(parties_out)} "
        f"candidates={expected_total_candidates} "
        f"with_votes={matched_total_candidates} seats={seat_total}",
        file=sys.stderr,
    )
    return True


def main() -> None:
    requested = sys.argv[1:] or list(HESSEN_CITIES.keys())
    print(f"Ingesting {len(requested)} Hessen elections...", file=sys.stderr)
    print(f"  fetching Hessen-wide aggregate CSV...", file=sys.stderr)
    hessen_text = fetch(HESSEN_CSV_URL)
    print(f"  fetching party metadata...", file=sys.stderr)
    parties_meta = json.loads(fetch(PARTIES_JSON_URL))

    results = {"ok": [], "fail": []}
    for slug in requested:
        if slug not in HESSEN_CITIES:
            print(f"\n[{slug}] not in HESSEN_CITIES map — skipping", file=sys.stderr)
            results["fail"].append(slug)
            continue
        cfg = HESSEN_CITIES[slug]
        ok = ingest(slug, cfg["ags"], cfg["kind"], hessen_text, parties_meta)
        (results["ok"] if ok else results["fail"]).append(slug)

    print(f"\n=== Done ===", file=sys.stderr)
    print(f"  succeeded: {len(results['ok'])} ({', '.join(results['ok'])})", file=sys.stderr)
    if results["fail"]:
        print(f"  failed:    {len(results['fail'])} ({', '.join(results['fail'])})", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
