#!/usr/bin/env python3
"""Parse Marburg voteIT Probestimmzettel HTML into JSON."""

import json
import re

with open("/tmp/marburg-probe.html", "r", encoding="utf-8") as f:
    html = f.read()

parties = []

# Split HTML by party sections
party_sections = re.split(r'(?=<table class="stz-klassisch-wahlvorschlag" id="wahlvorschlag-liste-)', html)

for section in party_sections:
    name_match = re.search(r'id="name-liste-(\d+)">([^<]+)</small>', section)
    if not name_match:
        continue

    liste_id = name_match.group(1)
    party_name = name_match.group(2).strip()

    candidates = []
    cand_pattern = re.compile(
        r'id="stimmzettelpos' + liste_id + r'-kandidat\d+-nr">(\d+)\s*</td>\s*'
        r'<td>\s*<div class="stz-kandidat-streichen-btn\s*"?\s*id="stimmzettelpos' + liste_id + r'-kandidat\d+-nennung1">([^<]+)</div>',
        re.DOTALL
    )

    for m in cand_pattern.finditer(section):
        name = m.group(2).strip()
        candidates.append({"id": len(candidates) + 1, "name": name})

    parties.append({
        "id": len(parties) + 1,
        "name": party_name,
        "candidates": candidates
    })

result = {
    "totalStimmen": 59,
    "maxPerCandidate": 3,
    "parties": parties
}

output_path = "/home/muad/cloud/brain/projects/wahlzettel/public/data/marburg-stvv.json"
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(result, f, ensure_ascii=False, indent=2)

print(f"Wrote {output_path}")
print(f"\n{'Party':<25} {'Candidates':>10}")
print("-" * 37)
total = 0
for p in parties:
    print(f"{p['name']:<25} {len(p['candidates']):>10}")
    total += len(p['candidates'])
print("-" * 37)
print(f"{'TOTAL':<25} {total:>10}")
print(f"Parties: {len(parties)}")
