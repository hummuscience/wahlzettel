"""Shared helpers for votemanager-style result portals.

The Landeswahlleiter sites for Berlin (wahlen-berlin.de) and
Baden-Württemberg (wahlen.statistik-bw.de) use the same template:
  - an "Ergebnistabelle" whose <td data-sort="…"> cells hold unformatted
    numbers (absolute, percent, change vs. previous election),
  - chart configs as JSON in data-* attributes (seat pie, vote shares),
  - tables of elected members ("Gewählte").
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

# Row labels of the non-party rows at the top of every result table.
TOTAL_ROWS = {
    "Wahlberechtigte", "Wählende", "Wähler/-innen", "Wählerinnen und Wähler",
    "Ungültige Stimmen", "Gültige Stimmen",
}


def _ssl_context() -> ssl.SSLContext:
    # Prefer the system CA store: the institute firewall re-signs TLS with a
    # CA that only lives there (conda/certifi bundles reject it).
    system_ca = "/etc/ssl/certs/ca-certificates.crt"
    if os.path.exists(system_ca):
        return ssl.create_default_context(cafile=system_ca)
    return ssl.create_default_context()


SSL_CTX = _ssl_context()


def fetch(url: str, encoding: str = "utf-8") -> str:
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
        return r.read().decode(encoding)


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


def parse_stand(info: str, fallback_date: str | None = None) -> tuple[str, str]:
    """'Vorläufiges Ergebnis, 21.09.2026, 03:33:56' → ('2026-09-21', 'vorläufig').
    Some portals omit the date ("Endgültiges Ergebnis"); pass `fallback_date`."""
    status = "endgültig" if "ndgültig" in info else "vorläufig"
    m = re.search(r"(\d{2})\.(\d{2})\.(\d{4})", info)
    if m:
        return f"{m.group(3)}-{m.group(2)}-{m.group(1)}", status
    if fallback_date:
        return fallback_date, status
    raise ValueError(f"no date in stand text: {info!r}")


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
    """Every <table> on the page as rows of cleaned cell text (header rows
    starting with "Gebiet" dropped)."""
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


def totals_block(rows: dict[str, list[str]], col: int, valid_votes: int | None) -> dict:
    """ResultsTotals from the table's summary rows; `col` = the absolute-count
    column of the vote that decides seats."""
    waehler_key = next(k for k in ("Wählende", "Wähler/-innen", "Wählerinnen und Wähler") if k in rows)
    waehler = to_int(rows[waehler_key][col])
    ungueltig = to_int(rows["Ungültige Stimmen"][col])
    return {
        "validVotes": valid_votes,
        "validBallots": (waehler - ungueltig) if waehler is not None and ungueltig is not None else None,
        "wahlberechtigte": to_int(rows["Wahlberechtigte"][col]),
        "waehlerGesamt": waehler,
        "ungueltigeStimmzettel": ungueltig,
        "turnout": pct(rows[waehler_key][col + 1], 1),
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
