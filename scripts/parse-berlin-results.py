#!/usr/bin/env python3
"""Berlin 2026 results extractor — Abgeordnetenhaus + 12 BVV.

Source: Der Landeswahlleiter für Berlin, wahlen-berlin.de (votemanager-style
result portal). Every result page carries
  - an "Ergebnistabelle" whose <td data-sort="…"> cells hold unformatted
    numbers (absolute, percent, change vs. 2023), and
  - the Sitzverteilung pie chart as JSON in a data-* attribute.
The "Gewählte" pages list every elected member (AGH: split into Wahlkreis
and Liste; BVV: in list order per Bezirk).

The per-Wahlbezirk CSV exports on the downloads pages hold the same numbers
at finer grain, but the aggregated page tables are the official totals, so
we read those.

Usage:
  python3 scripts/parse-berlin-results.py

Out:  public/data/results-berlin-abgh.json
      public/data/results-berlin-bvv-{bezirk}.json   (×12)
"""

from __future__ import annotations

import html
import json
import os
import re
import ssl
import sys
import urllib.request
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "public" / "data"

BASE = "https://wahlen-berlin.de/wahlen/BE2026/Afspraes"
AGH_URL = f"{BASE}/agh/ergebnisse.html"
AGH_GEWAEHLTE_URL = f"{BASE}/agh/gewaehlte.html"
BVV_URL = f"{BASE}/bvv/ergebnisse_bezirk_{{nr:02d}}.html"
BVV_GEWAEHLTE_URL = f"{BASE}/bvv/gewaehlte.html"

# Official Bezirk number → our slug suffix.
BEZIRKE: dict[int, str] = {
    1: "mitte",
    2: "friedrichshain-kreuzberg",
    3: "pankow",
    4: "charlottenburg-wilmersdorf",
    5: "spandau",
    6: "steglitz-zehlendorf",
    7: "tempelhof-schoeneberg",
    8: "neukoelln",
    9: "treptow-koepenick",
    10: "marzahn-hellersdorf",
    11: "lichtenberg",
    12: "reinickendorf",
}

BVV_SEATS = 55          # § 22 LWahlG: 55 Mitglieder, d'Hondt, 3 %-Hürde
BVV_THRESHOLD = 3.0

# Editorial — same default order as the Hessen/Bayern extractors.
DEFAULT_IDEOLOGICAL_ORDER = [
    "Die Linke", "DKP", "SGP", "Die PARTEI",
    "SPD", "GRÜNE", "Volt", "Die Urbane",
    "Tierschutzpartei", "ÖDP", "PdF",
    "FDP", "FREIE WÄHLER",
    "CDU",
    "BSW",
    "AfD", "HEIMAT",
]

TOTAL_ROWS = {"Wahlberechtigte", "Wählende", "Ungültige Stimmen", "Gültige Stimmen"}


def _ssl_context() -> ssl.SSLContext:
    # Prefer the system CA store: the institute firewall re-signs TLS with a
    # CA that only lives there (conda/certifi bundles reject it).
    system_ca = "/etc/ssl/certs/ca-certificates.crt"
    if os.path.exists(system_ca):
        return ssl.create_default_context(cafile=system_ca)
    return ssl.create_default_context()


SSL_CTX = _ssl_context()


def fetch(url: str) -> str:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
                "(KHTML, like Gecko) Chrome/120.0 Safari/537.36"
            ),
        },
    )
    with urllib.request.urlopen(req, timeout=30, context=SSL_CTX) as r:
        return r.read().decode("utf-8")


def clean(s: str) -> str:
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def num(v: str | None) -> float | None:
    if v is None or v.strip() in ("", "-"):
        return None
    return float(v)


def pct(v: str | None, digits: int = 2) -> float | None:
    f = num(v)
    return None if f is None else round(f, digits)


def to_int(v: str | None) -> int | None:
    f = num(v)
    return None if f is None else int(f)


def result_rows(page: str) -> list[tuple[str, list[str]]]:
    """(row label, raw data-sort values) for every body row of the first table."""
    i = page.find("<table")
    seg = page[i:page.find("</table>", i)]
    body = seg[seg.find("<tbody>"):]
    out = []
    for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", body, flags=re.S):
        th = re.search(r"<th[^>]*>(.*?)</th>", tr, flags=re.S)
        if not th:
            continue
        vals = [html.unescape(v) for v in re.findall(r'<td[^>]*data-sort="([^"]*)"', tr)]
        out.append((clean(th.group(1)), vals))
    return out


def charts(page: str) -> list[dict]:
    res = []
    for m in re.finditer(r'data-[a-z-]+="(\{[^"]*\})"', page):
        try:
            res.append(json.loads(html.unescape(m.group(1))))
        except json.JSONDecodeError:
            pass
    return res


def seat_chart(page: str) -> tuple[dict[str, dict], int, str]:
    """Seat pie → ({label: {seats, fullName, color}}, total seats, stand text).
    The page emits the data object immediately before its config object."""
    cs = charts(page)
    for data, conf in zip(cs, cs[1:]):
        center = conf.get("pie", {}).get("centerLabel", "") if conf.get("type") == "sitze" else ""
        if center.endswith("Sitze"):
            seats = {
                d["label"]: {
                    "seats": int(d["value"]),
                    "fullName": d["tooltipData"]["headlineBold"],
                    "color": d["color"],
                }
                for d in data["dataSets"]
            }
            return seats, int(center.split()[0]), conf["texte"]["info"]
    raise ValueError("no seat chart on page")


def party_meta(page: str) -> dict[str, dict]:
    """Full names + official colors for every party in the vote-share charts."""
    meta: dict[str, dict] = {}
    for c in charts(page):
        for series in c.get("dataSeries", []):
            for d in series.get("dataSets", []):
                tt = d.get("tooltipData", {})
                full = tt.get("headlineNotBold", "").strip("()") or tt.get("headlineBold") or d["label"]
                meta.setdefault(d["label"], {"fullName": full, "color": d.get("color")})
    return meta


def parse_stand(info: str) -> tuple[str, str]:
    """'Vorläufiges Ergebnis, 21.09.2026, 03:33:56' → ('2026-09-21', 'vorläufig')."""
    m = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", info)
    if not m:
        raise ValueError(f"no date in stand text: {info!r}")
    status = "endgültig" if "ndgültig" in info else "vorläufig"
    return f"{m.group(3)}-{m.group(2)}-{m.group(1)}", status


def split_name(raw: str) -> tuple[str, str]:
    """'Dr. Umgelter, Andreas' → ('Umgelter', 'Dr. Andreas')."""
    last, _, first = raw.partition(",")
    last, first = last.strip(), first.strip()
    title = re.match(r"((?:(?:Prof|Dr)\.\s*)+)(.*)", last)
    if title:
        last = title.group(2).strip()
        first = f"{title.group(1).strip()} {first}".strip()
    return last, first


def gewaehlte_tables(page: str) -> list[list[list[str]]]:
    tables = []
    for tb in re.findall(r"<table.*?</table>", page, flags=re.S):
        rows = []
        for tr in re.findall(r"<tr[^>]*>(.*?)</tr>", tb, flags=re.S):
            cells = [clean(c) for c in re.findall(r"<t[hd][^>]*>(.*?)</t[hd]>", tr, flags=re.S)]
            if cells and cells[0] != "Gebiet":
                rows.append(cells)
        tables.append(rows)
    return tables


def dhondt(votes: dict[str, int], seats: int) -> dict[str, int]:
    out = {p: 0 for p in votes}
    for _ in range(seats):
        best = max(votes, key=lambda p: votes[p] / (out[p] + 1))
        out[best] += 1
    return out


def totals_block(rows: dict[str, list[str]], col: int, valid_votes: int | None,
                 seat_parties: list[dict]) -> dict:
    waehler = to_int(rows["Wählende"][col])
    ungueltig = to_int(rows["Ungültige Stimmen"][col])
    return {
        "validVotes": valid_votes,
        "validBallots": (waehler - ungueltig) if waehler is not None and ungueltig is not None else None,
        "wahlberechtigte": to_int(rows["Wahlberechtigte"][col]),
        "waehlerGesamt": waehler,
        "ungueltigeStimmzettel": ungueltig,
        "turnout": pct(rows["Wählende"][col + 1], 1),
        "kandidatenInsgesamt": None,
        "frauenInsgesamt": None,
        "ballotsWithListenkreuz": None,
        "ballotsWithListenkreuzPercent": None,
    }


def write(slug: str, out: dict) -> None:
    path = DATA_DIR / f"results-{slug}.json"
    with path.open("w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    seats = sum(p["seats"] for p in out["parties"])
    print(f"  wrote {path.name} — parties={len(out['parties'])} seats={seats}/{out['totalSeats']} "
          f"stand={out['stand']} ({out['status']})", file=sys.stderr)


# ── Abgeordnetenhaus ────────────────────────────────────────────────────────

def ingest_agh() -> None:
    print("Abgeordnetenhaus…", file=sys.stderr)
    page = fetch(AGH_URL)
    seats, total_seats, info = seat_chart(page)
    stand, status = parse_stand(info)
    meta = party_meta(page)

    rows = result_rows(page)
    by_label = {label: vals for label, vals in rows}
    # Columns: Erst (abs, %, Δ), Zweit (abs, %, Δ)

    tables = gewaehlte_tables(fetch(AGH_GEWAEHLTE_URL))
    wk_rows, list_rows = tables[0], tables[1]
    elected: dict[str, list[dict]] = {}
    wahlkreise = []
    for gebiet, name, party in (r[:3] for r in wk_rows):
        last, first = split_name(name)
        code, _, wk_name = gebiet.partition(" - ")
        wahlkreise.append({
            "id": code,
            "name": wk_name,
            "bezirk": re.sub(r"\s+\d+$", "", wk_name),
            "winner": {"lastName": last, "firstName": first, "party": party},
        })
        elected.setdefault(party, []).append(
            {"lastName": last, "firstName": first, "via": "wahlkreis", "wahlkreis": wk_name})
    for _gebiet, name, party in (r[:3] for r in list_rows):
        last, first = split_name(name)
        elected.setdefault(party, []).append({"lastName": last, "firstName": first, "via": "liste"})

    parties = []
    list_no = 0
    for label, vals in rows:
        if label in TOTAL_ROWS:
            continue
        zweit = to_int(vals[3]) if len(vals) > 3 else None
        erst = to_int(vals[0]) if vals else None
        if zweit is None:
            continue  # Einzelbewerber:innen (Erststimme only) — no list
        list_no += 1
        members = elected.get(label, [])
        parties.append({
            "listNumber": list_no,
            "shortName": label,
            "fullName": seats.get(label, {}).get("fullName") or meta.get(label, {}).get("fullName") or label,
            "color": seats.get(label, {}).get("color") or meta.get(label, {}).get("color"),
            "percent": pct(vals[4]),
            "percentChange": pct(vals[5]),
            "votesAbsolute": zweit,
            "votesWeighted": None,
            "seats": seats.get(label, {}).get("seats", 0),
            "direktmandate": sum(1 for m in members if m["via"] == "wahlkreis"),
            "erststimmen": None if erst is None else {
                "votesAbsolute": erst,
                "percent": pct(vals[1]),
                "percentChange": pct(vals[2]),
            },
            "candidates": [
                {"position": i + 1, "stimmen": None, "elected": True, "profession": None, **m}
                for i, m in enumerate(members)
            ],
        })

    # Sanity: seats per party must equal elected members per party.
    for p in parties:
        if p["seats"] != len(p["candidates"]):
            raise SystemExit(f"AGH {p['shortName']}: {p['seats']} seats but "
                             f"{len(p['candidates'])} elected members")
    if sum(p["seats"] for p in parties) != total_seats:
        raise SystemExit("AGH seat total mismatch")

    parties.sort(key=lambda p: (-p["seats"], -(p["percent"] or 0)))
    write("berlin-abgh", {
        "election": "berlin-abgh",
        "stand": stand,
        "status": status,
        "totalSeats": total_seats,
        "totals": totals_block(by_label, 3, to_int(by_label["Gültige Stimmen"][3]), parties),
        "parties": parties,
        "wahlkreise": wahlkreise,
        "ideologicalOrder": DEFAULT_IDEOLOGICAL_ORDER,
        "sources": [AGH_URL, AGH_GEWAEHLTE_URL],
    })


# ── Bezirksverordnetenversammlungen ─────────────────────────────────────────

def ingest_bvv() -> None:
    print("BVV…", file=sys.stderr)
    gew = gewaehlte_tables(fetch(BVV_GEWAEHLTE_URL))[0]
    members_by_bezirk: dict[int, dict[str, list[dict]]] = {}
    for gebiet, name, party, *_ in gew:
        nr = int(gebiet.split(" - ")[0])
        last, first = split_name(name)
        members_by_bezirk.setdefault(nr, {}).setdefault(party, []).append(
            {"lastName": last, "firstName": first})

    for nr, suffix in BEZIRKE.items():
        slug = f"berlin-bvv-{suffix}"
        url = BVV_URL.format(nr=nr)
        page = fetch(url)
        seats, total_seats, info = seat_chart(page)
        stand, status = parse_stand(info)
        meta = party_meta(page)
        rows = result_rows(page)
        by_label = {label: vals for label, vals in rows}
        members = members_by_bezirk.get(nr, {})

        parties = []
        list_no = 0
        for label, vals in rows:
            if label in TOTAL_ROWS or not vals or to_int(vals[0]) is None:
                continue
            list_no += 1
            elected = members.get(label, [])
            parties.append({
                "listNumber": list_no,
                "shortName": label,
                "fullName": seats.get(label, {}).get("fullName") or meta.get(label, {}).get("fullName") or label,
                "color": seats.get(label, {}).get("color") or meta.get(label, {}).get("color"),
                "percent": pct(vals[1]),
                "percentChange": pct(vals[2]),
                "votesAbsolute": to_int(vals[0]),
                "votesWeighted": None,
                "seats": seats.get(label, {}).get("seats", 0),
                "candidates": [
                    {"position": i + 1, "stimmen": None, "elected": True, "profession": None, **m}
                    for i, m in enumerate(elected)
                ],
            })

        # Sanity 1: seats = elected members, sum = chart total.
        for p in parties:
            if p["seats"] != len(p["candidates"]):
                raise SystemExit(f"{slug} {p['shortName']}: {p['seats']} seats but "
                                 f"{len(p['candidates'])} elected members")
        if sum(p["seats"] for p in parties) != total_seats:
            raise SystemExit(f"{slug}: seat total mismatch")
        # Sanity 2: recompute d'Hondt over parties ≥ 3 %. A mismatch is only a
        # warning — an exhausted list legally shrinks the BVV (§ 22 LWahlG).
        eligible = {p["shortName"]: p["votesAbsolute"] for p in parties
                    if (p["percent"] or 0) >= BVV_THRESHOLD}
        recomputed = dhondt(eligible, BVV_SEATS)
        diff = {k: (v, next(p["seats"] for p in parties if p["shortName"] == k))
                for k, v in recomputed.items()
                if v != next(p["seats"] for p in parties if p["shortName"] == k)}
        if diff or total_seats != BVV_SEATS:
            print(f"  ! {slug}: d'Hondt check differs {diff} (total {total_seats})", file=sys.stderr)

        parties.sort(key=lambda p: (-p["seats"], -(p["percent"] or 0)))
        write(slug, {
            "election": slug,
            "stand": stand,
            "status": status,
            "totalSeats": total_seats,
            "totals": totals_block(by_label, 0, to_int(by_label["Gültige Stimmen"][0]), parties),
            "parties": parties,
            "ideologicalOrder": DEFAULT_IDEOLOGICAL_ORDER,
            "sources": [url, BVV_GEWAEHLTE_URL],
        })


def main() -> None:
    ingest_agh()
    ingest_bvv()


if __name__ == "__main__":
    main()
