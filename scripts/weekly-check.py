#!/usr/bin/env python3
"""Weekly election watch — run by .github/workflows/weekly-check.yml.

Three checks, one markdown report:

1. Calendar   — scrape wahlrecht.de/termine.htm (rows carry stable ids like
                `ltw-nw-2027`) and compare with the configs in src/elections/.
                Flags upcoming elections nobody has scaffolded yet, and
                configs whose date disagrees with the calendar.
2. Results    — for past elections that have a results extractor
                (RESULTS_SOURCES) and whose results file is missing or still
                `vorläufig`, re-run the extractor. The extractors abort on
                inconsistent numbers, so a successful run is safe to publish;
                the workflow commits whatever changed under public/data/.
3. Candidates — upcoming configured elections whose data file has no
                candidates yet, with a nudge once the lists are due.

Anything that needs judgement (a new election, a new portal) only lands in
the report / GitHub issue; nothing here scaffolds elections on its own.

Usage:
  python3 scripts/weekly-check.py [--report PATH] [--no-refresh] [--today YYYY-MM-DD]
Exit code is 0 unless a results extractor failed.
"""

from __future__ import annotations

import argparse
import datetime as dt
import html
import json
import os
import re
import ssl
import subprocess
import sys
import urllib.request
from dataclasses import dataclass
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent
ELECTIONS_DIR = REPO_ROOT / "src" / "elections"
DATA_DIR = REPO_ROOT / "public" / "data"

CALENDAR_URL = "https://www.wahlrecht.de/termine.htm"

# Result extractors per election slug prefix. Each command must be idempotent
# and rewrite public/data/results-*.json for every slug it covers.
RESULTS_SOURCES: dict[str, list[str]] = {
    "berlin-": ["python3", "scripts/parse-berlin-results.py"],
    "bw-landtagswahl": ["python3", "scripts/parse-bw-results.py"],
}

# How far ahead an unscaffolded election is worth flagging, and when
# candidate lists are usually out (Landeswahlausschuss ~ 2–3 months before).
LOOKAHEAD_DAYS = 540
CANDIDATES_DUE_DAYS = 90

# wahlrecht.de row-id prefix → our ElectionBase.level values it corresponds to.
KIND_LEVELS: dict[str, tuple[str, ...]] = {
    "ltw": ("land",),
    "kw": ("kommunal", "sub-kommunal"),
    "btw": ("bund",),
    "ew": ("bund",),
}
KIND_LABEL = {
    "ltw": "Landtagswahl", "kw": "Kommunalwahlen", "btw": "Bundestagswahl",
    "ew": "Europawahl", "bpw": "Bundesversammlung",
}
# Not a public ballot — never flag.
IGNORED_KINDS = {"bpw"}

MONTHS = {
    "januar": 1, "februar": 2, "märz": 3, "april": 4, "mai": 5, "juni": 6,
    "juli": 7, "august": 8, "september": 9, "oktober": 10, "november": 11,
    "dezember": 12,
}


@dataclass
class Config:
    slug: str
    date: dt.date
    level: str
    land: str
    data_file: str
    results_file: str | None


@dataclass
class CalendarEntry:
    row_id: str
    kind: str
    land: str
    date: dt.date
    label: str


def _ssl_context() -> ssl.SSLContext:
    system_ca = "/etc/ssl/certs/ca-certificates.crt"
    if os.path.exists(system_ca):
        return ssl.create_default_context(cafile=system_ca)
    return ssl.create_default_context()


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": "wahlzettel-weekly-check"})
    with urllib.request.urlopen(req, timeout=30, context=_ssl_context()) as r:
        return r.read().decode("utf-8", errors="replace")


# ── configs ─────────────────────────────────────────────────────────────────

def _field(src: str, name: str) -> str | None:
    m = re.search(rf"\b{name}:\s*'([^']*)'", src)
    return m.group(1) if m else None


def load_configs() -> list[Config]:
    configs = []
    for path in sorted(ELECTIONS_DIR.glob("*/config.ts")):
        src = path.read_text(encoding="utf-8")
        date, level, land = _field(src, "date"), _field(src, "level"), _field(src, "land")
        if not (date and level and land):
            print(f"  ! skipping {path}: missing date/level/land", file=sys.stderr)
            continue
        configs.append(Config(
            slug=_field(src, "slug") or path.parent.name,
            date=dt.date.fromisoformat(date),
            level=level,
            land=land.upper(),
            data_file=_field(src, "dataFile") or f"{path.parent.name}.json",
            results_file=_field(src, "resultsFile"),
        ))
    return configs


def candidate_count(data_file: str) -> int:
    """Candidates in a data file, across the shapes the archetypes use."""
    path = DATA_DIR / data_file
    if not path.exists():
        return 0
    d = json.loads(path.read_text(encoding="utf-8"))
    n = 0
    for key in ("parties", "listen", "wahlkreise"):
        for group in d.get(key, []) or []:
            n += len(group.get("candidates", []) or [])
    return n


def results_status(results_file: str | None) -> str | None:
    """None = no file; else the file's status ('vorläufig' / 'endgültig')."""
    if not results_file:
        return None
    path = DATA_DIR / results_file
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8")).get("status", "endgültig")


# ── 1. calendar ─────────────────────────────────────────────────────────────

def parse_german_date(text: str) -> dt.date | None:
    m = re.search(r"(\d{1,2})\.\s*([A-Za-zäÄ]+)\s+(\d{4})", text)
    if not m or m.group(2).lower() not in MONTHS:
        return None
    return dt.date(int(m.group(3)), MONTHS[m.group(2).lower()], int(m.group(1)))


def load_calendar() -> list[CalendarEntry]:
    page = html.unescape(fetch(CALENDAR_URL)).replace("\xa0", " ")
    entries = []
    for row_id, row in re.findall(r'<tr id="([a-z]+-[a-z]{2}-\d{4})"[^>]*>(.*?)</tr>', page, flags=re.S):
        cells = [re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", c)).strip()
                 for c in re.findall(r"<td[^>]*>(.*?)</td>", row, flags=re.S)]
        if len(cells) < 4:
            continue
        date = parse_german_date(cells[1])
        if not date:
            continue  # "Frühjahr 2028" etc. — no fixed date yet
        kind, land = row_id.split("-")[:2]
        entries.append(CalendarEntry(
            row_id=row_id, kind=kind, land=land.upper(), date=date,
            # Organ column: "Landtag", "Bürgerschaft", "Kreistage, Stadträte, …"
            label=f"{cells[3].split(',')[0] or KIND_LABEL.get(kind, kind)} · {cells[2]}",
        ))
    if not entries:
        raise RuntimeError("calendar page parsed to zero entries — layout changed?")
    return entries


def check_calendar(configs: list[Config], today: dt.date) -> tuple[list[str], list[str]]:
    """→ (unscaffolded upcoming elections, date mismatches)."""
    missing, mismatched = [], []
    for e in load_calendar():
        if e.kind in IGNORED_KINDS or e.kind not in KIND_LEVELS:
            continue
        if not (today <= e.date <= today + dt.timedelta(days=LOOKAHEAD_DAYS)):
            continue
        matches = [c for c in configs
                   if c.level in KIND_LEVELS[e.kind]
                   and (c.land == e.land or e.land == "DE")
                   and c.date.year == e.date.year]
        days = (e.date - today).days
        if not matches:
            missing.append(f"- **{e.label}** — {e.date:%d.%m.%Y} (in {days} Tagen) · `{e.row_id}`")
        for c in matches:
            if c.date != e.date:
                mismatched.append(f"- `{c.slug}`: config {c.date:%d.%m.%Y}, "
                                  f"Kalender {e.date:%d.%m.%Y} (`{e.row_id}`)")
    return missing, mismatched


# ── 2. results ──────────────────────────────────────────────────────────────

def refresh_results(configs: list[Config], today: dt.date) -> tuple[list[str], list[str]]:
    """Re-run extractors for past elections with missing/preliminary results.
    → (report lines, failures)."""
    due: dict[str, list[str]] = {}
    for c in configs:
        if c.date >= today:
            continue
        status = results_status(c.results_file)
        if status == "endgültig" or (status is None and c.results_file is None):
            continue
        for prefix in RESULTS_SOURCES:
            if c.slug.startswith(prefix):
                due.setdefault(prefix, []).append(f"{c.slug} ({status or 'fehlt'})")

    lines, failures = [], []
    for prefix, slugs in due.items():
        cmd = RESULTS_SOURCES[prefix]
        proc = subprocess.run(cmd, cwd=REPO_ROOT, capture_output=True, text=True)
        tail = (proc.stderr or proc.stdout).strip().splitlines()[-1:] or [""]
        if proc.returncode == 0:
            lines.append(f"- `{' '.join(cmd)}` — {len(slugs)} Wahl(en) aktualisiert · {tail[0]}")
        else:
            failures.append(f"- ❌ `{' '.join(cmd)}` (exit {proc.returncode}): {tail[0]}")

    # Past elections that nobody can refresh automatically.
    for c in configs:
        if c.date < today and not c.results_file \
                and not any(c.slug.startswith(p) for p in RESULTS_SOURCES):
            lines.append(f"- `{c.slug}` ({c.date:%d.%m.%Y}): keine Ergebnisse, kein Extraktor")
    return lines, failures


# ── 3. candidates ───────────────────────────────────────────────────────────

def check_candidates(configs: list[Config], today: dt.date) -> list[str]:
    lines = []
    for c in sorted(configs, key=lambda c: c.date):
        if c.date < today or candidate_count(c.data_file) > 0:
            continue
        days = (c.date - today).days
        due = " — ⚠️ **Listen sollten jetzt veröffentlicht sein**" if days <= CANDIDATES_DUE_DAYS else ""
        lines.append(f"- `{c.slug}` — {c.date:%d.%m.%Y} (in {days} Tagen){due}")
    return lines


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--report", default="weekly-report.md")
    ap.add_argument("--no-refresh", action="store_true", help="skip running result extractors")
    ap.add_argument("--today", type=dt.date.fromisoformat, default=dt.date.today())
    args = ap.parse_args()

    configs = load_configs()
    out = [f"# Wöchentlicher Wahl-Check · {args.today:%d.%m.%Y}", ""]
    failed = False

    try:
        missing, mismatched = check_calendar(configs, args.today)
        out += ["## Neue Wahlen ohne Konfiguration", *(missing or ["_Keine._"]), ""]
        if mismatched:
            out += ["## Abweichende Wahltermine", *mismatched, ""]
    except Exception as exc:  # the calendar is best-effort; keep the other checks
        out += ["## Neue Wahlen ohne Konfiguration", f"- ❌ Kalender nicht lesbar: {exc}", ""]

    if args.no_refresh:
        out += ["## Ergebnisse", "_Übersprungen (--no-refresh)._", ""]
    else:
        lines, failures = refresh_results(configs, args.today)
        out += ["## Ergebnisse", *(failures + lines or ["_Nichts zu tun._"]), ""]
        failed = bool(failures)

    out += ["## Wahlen ohne Kandidat:innen", *(check_candidates(configs, args.today) or ["_Keine._"]), ""]
    out += [f"<sub>Quelle Kalender: {CALENDAR_URL}</sub>", ""]

    Path(args.report).write_text("\n".join(out), encoding="utf-8")
    print("\n".join(out))
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
