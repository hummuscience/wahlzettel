#!/usr/bin/env python3
"""
Parse Ausländerbeirat (KAV) candidate data for 8 Hessen cities.

Output: public/data/{city}-kav.json for each city.

Each city's PDF has a different layout, so each gets its own parser.
"""

import json
import os
import re
import subprocess
import tempfile
from pathlib import Path

import pdfplumber

PROJECT_ROOT = Path(__file__).parent.parent
OUTPUT_DIR = PROJECT_ROOT / "public" / "data"
PDF_DIR = Path("/tmp")


def clean_text(s):
    """Clean quadrupled/tripled chars from rendering artifacts."""
    if not s:
        return ""
    s = re.sub(r'(.)\1{3,}', r'\1', s)
    s = re.sub(r'(.)\1{2}', r'\1', s)
    return s.strip()


def write_json(slug, name, stimmen, parties, out_path):
    """Write election JSON and print summary."""
    data = {
        "election": slug,
        "name": name,
        "totalStimmen": stimmen,
        "maxPerCandidate": 3,
        "parties": parties,
    }
    total = sum(p["candidateCount"] for p in parties)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"\n{slug}: {len(parties)} parties, {total} candidates -> {out_path}")
    for p in parties:
        print(f"  Liste {p['listNumber']:2d} ({p['shortName']:25s}): {p['candidateCount']:3d} candidates")


def parse_table_split_cells(pdf_path, abbrev, party_defs):
    """Parse PDFs where tables have number in col 0, name in col 1.
    Also handles joined 'NNN Name, First' in col 0.
    party_defs: {list_num: (fullName, shortName)}
    """
    pdf = pdfplumber.open(str(pdf_path))
    all_tables = []
    for page in pdf.pages:
        tables = page.extract_tables()
        if tables:
            all_tables.extend(tables)
    pdf.close()

    parties = {}
    for table in all_tables:
        if not table or not table[0]:
            continue

        # Find list number from header row
        header = str(table[0][0] or "")
        # Clean artifacts
        header_clean = clean_text(header)
        # Remove common prefix junk like "e\nz\n", "l\ne\n", "t\nt\ne\nz\nm\n"
        header_clean = re.sub(r'^[a-z\s\n]+', '', header_clean).strip()

        # Extract list number
        list_match = re.match(r'(?:Wahlvorschlag\s+)?(\d+)\b', header_clean)
        if not list_match:
            continue
        list_num = int(list_match.group(1))

        if list_num not in party_defs:
            continue

        full_name, short_name = party_defs[list_num]
        candidates = []

        for row in table[1:]:
            if not row:
                continue

            # Strategy 1: number in col 0, name in col 1
            col0 = clean_text(str(row[0] or "")).strip()
            col1 = clean_text(str(row[1] or "")).strip() if len(row) > 1 else ""

            if col0 and col1 and re.match(r'^\d{2,4}$', col0) and re.search(r'[A-Za-zÀ-ÿ]', col1):
                num = int(col0)
                position = num % 100
                if position == 0:
                    position = num
                name_str = col1
                if ',' in name_str:
                    parts = name_str.split(',', 1)
                    last_name = parts[0].strip()
                    first_name = parts[1].strip()
                else:
                    last_name = name_str
                    first_name = ""
                candidates.append({
                    "id": f"{abbrev}-kav-{list_num}-{position}",
                    "position": position,
                    "lastName": last_name,
                    "firstName": first_name,
                    "profession": "",
                })
                continue

            # Strategy 2: joined "NNN Name, First" in col 0
            m = re.match(r'^(\d{2,4})\s+(.+)$', col0)
            if m:
                num = int(m.group(1))
                position = num % 100
                if position == 0:
                    position = num
                name_str = m.group(2).strip()
                if ',' in name_str:
                    parts = name_str.split(',', 1)
                    last_name = parts[0].strip()
                    first_name = parts[1].strip()
                else:
                    last_name = name_str
                    first_name = ""
                candidates.append({
                    "id": f"{abbrev}-kav-{list_num}-{position}",
                    "position": position,
                    "lastName": last_name,
                    "firstName": first_name,
                    "profession": "",
                })

        # Also check header cell for candidates (single-candidate lists like Gießen L1)
        for line in header.split('\n'):
            line = clean_text(line.strip())
            m = re.match(r'^(\d{3,4})\s+([A-ZÄÖÜa-zäöüÀ-ÿ].+)$', line)
            if m:
                num = int(m.group(1))
                position = num % 100
                name_str = m.group(2).strip()
                if not any(c['position'] == position for c in candidates):
                    if ',' in name_str:
                        parts = name_str.split(',', 1)
                        last_name = parts[0].strip()
                        first_name = parts[1].strip()
                    else:
                        last_name = name_str
                        first_name = ""
                    candidates.append({
                        "id": f"{abbrev}-kav-{list_num}-{position}",
                        "position": position,
                        "lastName": last_name,
                        "firstName": first_name,
                        "profession": "",
                    })

        # Sort and dedup
        candidates.sort(key=lambda c: c['position'])
        seen = set()
        deduped = []
        for c in candidates:
            if c['position'] not in seen:
                seen.add(c['position'])
                deduped.append(c)

        parties[list_num] = {
            "listNumber": list_num,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(deduped),
            "candidates": deduped,
        }

    return [parties[ln] for ln in sorted(parties.keys())]


def parse_kassel(pdf_path):
    """Parse Kassel KAV - text extraction with heavy artifact cleanup."""
    pdf = pdfplumber.open(str(pdf_path))
    full_text = ""
    for page in pdf.pages:
        text = page.extract_text()
        if text:
            full_text += text + "\n"
    pdf.close()

    cleaned = clean_text(full_text)

    party_defs = {
        1: ("Gemeinschaft 2000", "G 2000"),
        2: ("Der Kreis – Kassel", "Der Kreis"),
        3: ("EUROPA LISTE", "EUROPA LISTE"),
        4: ("Democratic World", "DW"),
        5: ("Migrantinnen und Migranten Liste Kassel", "MML Kassel"),
        6: ("ABK Liste", "ABK"),
    }

    parties = {}
    # Find NNN Name, First patterns
    for m in re.finditer(r'\b(\d{3})\s+([A-ZÄÖÜa-zäöüÀ-ÿ][\w\-\.\']+(?:\s+[\w\-\.\']+)*),\s*([A-ZÄÖÜa-zäöüÀ-ÿ][\w\-\.\'\s]*?)(?=\s+\d{3}\s|\s*\n|\s+[A-Z]{2,}|\s*$)', cleaned):
        num = int(m.group(1))
        list_num = num // 100
        position = num % 100
        if list_num not in party_defs or position < 1:
            continue
        if list_num not in parties:
            full, short = party_defs[list_num]
            parties[list_num] = {"listNumber": list_num, "fullName": full, "shortName": short, "candidates": []}
        parties[list_num]["candidates"].append({
            "id": f"ks-kav-{list_num}-{position}",
            "position": position,
            "lastName": m.group(2).strip(),
            "firstName": m.group(3).strip(),
            "profession": "",
        })

    result = []
    for ln in sorted(parties.keys()):
        p = parties[ln]
        p["candidates"].sort(key=lambda c: c["position"])
        seen = set()
        deduped = []
        for c in p["candidates"]:
            if c["position"] not in seen:
                seen.add(c["position"])
                deduped.append(c)
        p["candidates"] = deduped
        p["candidateCount"] = len(deduped)
        result.append(p)
    return result


def parse_marburg_ocr(pdf_path):
    """Parse Marburg KAV via OCR."""
    tmpdir = tempfile.mkdtemp()
    subprocess.run(
        ['pdftoppm', '-png', '-r', '300', '-f', '1', '-l', '2', str(pdf_path), f'{tmpdir}/page'],
        check=True, capture_output=True,
    )

    full_text = ""
    for img in sorted(os.listdir(tmpdir)):
        if img.endswith('.png'):
            result = subprocess.run(
                ['tesseract', os.path.join(tmpdir, img), '-', '-l', 'deu'],
                capture_output=True, text=True,
            )
            full_text += result.stdout + "\n"

    party_names = {
        1: ("Gruppe ohne Grenzen", "GOG"),
        2: ("Interkulturelle Liste", "IKL"),
        3: ("Verein Gießener Zugewanderter", "VGZ"),
    }

    parties = {}
    # The OCR output has 3 columns on one line: "101 Last, First 201 Last, First 301 Last, First"
    # Use a lookahead to stop before the next NNN pattern or end of line
    for m in re.finditer(r'(\d{3})\s+([A-ZÄÖÜa-zäöüÀ-ÿ][\w\-\.\']+(?:\s+[\w\-\.\']+)*?),\s*([A-ZÄÖÜa-zäöüÀ-ÿ][\w\-\.\' ]*?)(?=\s+\d{3}\s|\s*$|\s*\n)', full_text):
        num = int(m.group(1))
        list_num = num // 100
        position = num % 100
        if list_num < 1 or list_num > 3 or position < 1:
            continue
        if list_num not in parties:
            full, short = party_names.get(list_num, (f"Liste {list_num}", f"L{list_num}"))
            parties[list_num] = {"listNumber": list_num, "fullName": full, "shortName": short, "candidates": []}
        parties[list_num]["candidates"].append({
            "id": f"mr-kav-{list_num}-{position}",
            "position": position,
            "lastName": m.group(2).strip(),
            "firstName": m.group(3).strip(),
            "profession": "",
        })

    result = []
    for ln in sorted(parties.keys()):
        p = parties[ln]
        p["candidates"].sort(key=lambda c: c["position"])
        seen = set()
        deduped = []
        for c in p["candidates"]:
            if c["position"] not in seen:
                seen.add(c["position"])
                deduped.append(c)
        p["candidates"] = deduped
        p["candidateCount"] = len(deduped)
        result.append(p)
    return result


def parse_ruesselsheim_hardcoded():
    """Return Rüsselsheim KAV data.

    The Rüsselsheim Bekanntmachung PDF uses a multi-column newspaper layout
    that defeats all automated extraction (pdfplumber, tesseract, LLM).
    Data was extracted from the official Musterstimmzettel PDF via Gemini Flash
    and manually verified against the Bekanntmachung.
    """
    def cands(abbrev, ln, entries):
        return [
            {"id": f"rs-kav-{ln}-{i+1}", "position": i+1,
             "lastName": last, "firstName": first, "profession": ""}
            for i, (last, first) in enumerate(entries)
        ]

    parties_data = [
        (1, "Aktive Bürgerinitiative", "Abi", [
            ("Yildiz", "Muhammed Ali"), ("Alp", "Bilal"),
            ("El Hallaoui", "Yusuf"), ("Coskun", "Emre"),
            ("Tokat", "Mirac"), ("Coskun", "Berdan"),
            ("Can", "Mahmut Mustafa"), ("Akcakin", "Emre"),
        ]),
        (2, "Liste 2000", "L2000", [
            ("Dayankaç", "Neslihan Vildan"), ("Chrominska", "Oliwia Katarzyna"),
            ("Dayankaç", "Adnan"), ("Safel", "Yıldıray"),
            ("Bakışkan", "Rafet"), ("Göktürk", "Ayşe"),
            ("Efe", "Mustafa"), ("Pomak", "Mümin"),
            ("Schiliro", "Angelo"), ("Denysenko", "Mykhailo"),
            ("Kellecioglu", "Kamil"), ("Keser", "Ünsal"),
            ("Bostan", "Yılmaz"), ("Cevik", "Ibrahim"),
            ("Safel", "Coskun"),
        ]),
        (3, "Freie Liste", "FL", [
            ("Sevimli-Allali", "Meltem"), ("Bouyardan", "Mohamed"),
            ("Ünal", "Hakan"), ("Lhajiui", "Mohamed"),
            ("Belli", "Alperen"), ("Boussof", "Ali"),
            ("Keskin", "Fatih"), ("Koca", "Erdal"),
            ("Irmak", "Cuma Burak"),
        ]),
        (4, "Solidaritätsliste", "So-Li", [
            ("Çelik", "Ümit"), ("Agatay", "Ahmet"),
            ("Yildiz", "Alkan"), ("Çelik", "Oktay"),
            ("Akbas", "Helin"), ("Bostan", "Sabri"),
            ("Aydın", "Ali Kemal"),
        ]),
        (5, "Internationale Demokraten", "ID", [
            ("Safi", "Nektaria"), ("Froudaki Kessidou", "Melina Angelina"),
            ("Dimitropoulou", "Panagiota"), ("Kalpinis", "Anastasios"),
            ("Soka", "Christina"), ("Athinioti", "Ermioni"),
            ("Veloni", "Maria"), ("Veloni", "Magdalini"),
        ]),
        (6, "Aktive Liste", "Ali", [
            ("Selvi", "Ugur"), ("Kahraman", "Hüseyin"),
            ("Memiş", "Alaettin"), ("Selvi", "Ibrahim"),
            ("Özgeniş", "Hanzala"), ("Aksüt", "Ibrahim"),
            ("Memiş", "Meryem"), ("Billor", "Fadime"),
            ("Akpinar", "Adem"), ("Harputluogullari", "Elif"),
        ]),
        # Only 6 Wahlvorschläge per official Musterstimmzettel.
        # "Wahlvorschlag 7/8" in the Bekanntmachung belong to Ortsbeirat/STVV.
    ]

    result = []
    for ln, full_name, short_name, entries in parties_data:
        c = cands("rs", ln, entries)
        result.append({
            "listNumber": ln,
            "fullName": full_name,
            "shortName": short_name,
            "candidateCount": len(c),
            "candidates": c,
        })
    return result


def main():
    # ============================================================
    # DARMSTADT (21 Stimmen, 6 lists)
    # ============================================================
    da_parties = {
        1: ("Liste der Vielfalt Darmstadt", "LDV Darmstadt"),
        2: ("Liste der Solidarität", "LdS"),
        3: ("Die Internationalen", "Die Internationalen"),
        4: ("POLONIA DARMSTADT", "POLONIA DARMSTADT"),
        5: ("Stimme für Darmstadt", "SfD"),
        6: ("Progressive Ausländer Union", "PAU"),
    }
    darmstadt = parse_table_split_cells(PDF_DIR / "darmstadt-kav.pdf", "da", da_parties)
    write_json("darmstadt-kav", "Ausländerbeirat", 21, darmstadt, OUTPUT_DIR / "darmstadt-kav.json")

    # ============================================================
    # FULDA (11 Stimmen, 5 lists)
    # ============================================================
    fu_parties = {
        1: ("Internationale Gruppe Ausländerbeirat", "IGA"),
        2: ("Friedensbrücke", "FB"),
        3: ("Alternative für Deutschland", "AfD"),
        4: ("Internationale Sozialdemokratische Liste", "ISL"),
        5: ("Demokratische Union Fulda", "DUF"),
    }
    fulda = parse_table_split_cells(PDF_DIR / "fulda-kav.pdf", "fu", fu_parties)
    write_json("fulda-kav", "Ausländerbeirat", 11, fulda, OUTPUT_DIR / "fulda-kav.json")

    # ============================================================
    # GIEßEN (31 Stimmen, 5 lists)
    # ============================================================
    gi_parties = {
        1: ("Avramkina, Daria (Einzelbewerberin)", "Avramkina"),
        2: ("Gießen International", "GI"),
        3: ("Liste für Vielfalt und Teilhabe", "ViT"),
        4: ("Kurdistan Liste", "KURD"),
        5: ("Ukraine Liste", "UL"),
    }
    giessen = parse_table_split_cells(PDF_DIR / "giessen-kav.pdf", "gi", gi_parties)
    write_json("giessen-kav", "Ausländerbeirat", 31, giessen, OUTPUT_DIR / "giessen-kav.json")

    # ============================================================
    # HANAU (15 Stimmen, 2 lists)
    # ============================================================
    ha_parties = {
        1: ("Die Gerechtigkeitspartei - Team Todenhöfer", "Gerechtigkeitspartei"),
        2: ("Sozialdemokratische Partei Deutschlands", "SPD"),
    }
    hanau = parse_table_split_cells(PDF_DIR / "hanau-kav.pdf", "ha", ha_parties)
    write_json("hanau-kav", "Ausländerbeirat", 15, hanau, OUTPUT_DIR / "hanau-kav.json")

    # ============================================================
    # KASSEL (37 Stimmen, 6 lists)
    # ============================================================
    kassel = parse_kassel(PDF_DIR / "kassel-kav.pdf")
    write_json("kassel-kav", "Ausländerbeirat", 37, kassel, OUTPUT_DIR / "kassel-kav.json")

    # ============================================================
    # MARBURG (15 Stimmen, 3 lists)
    # ============================================================
    marburg = parse_marburg_ocr(PDF_DIR / "marburg-kav.pdf")
    write_json("marburg-kav", "Ausländerbeirat", 15, marburg, OUTPUT_DIR / "marburg-kav.json")

    # ============================================================
    # OFFENBACH (25 Stimmen, 9 lists)
    # ============================================================
    of_parties = {
        1: ("Offenbach Türk Birliği – Türkische Union Offenbach", "TUO"),
        2: ("Progressive Ausländer Union", "PAU"),
        3: ("Miteinander Offenbach", "MEO"),
        4: ("Multikulturelle Liste", "ML"),
        5: ("Offenbach für alle e.V.", "Ofa e.V."),
        6: ("Piratenpartei Deutschland", "PIRATEN"),
        7: ("Serbische Liste", "SL"),
        8: ("Griechische Gemeinschaft Offenbach", "GGO"),
        9: ("Türkische Gemeinschaft", "TG"),
    }
    offenbach = parse_table_split_cells(PDF_DIR / "offenbach-kav.pdf", "of", of_parties)
    write_json("offenbach-kav", "Ausländerbeirat", 25, offenbach, OUTPUT_DIR / "offenbach-kav.json")

    # ============================================================
    # RÜSSELSHEIM (21 Stimmen)
    # ============================================================
    ruesselsheim = parse_ruesselsheim_hardcoded()
    write_json("ruesselsheim-kav", "Ausländerbeirat", 21, ruesselsheim, OUTPUT_DIR / "ruesselsheim-kav.json")


if __name__ == "__main__":
    main()
