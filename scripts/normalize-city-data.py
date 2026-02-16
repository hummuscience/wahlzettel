#!/usr/bin/env python3
"""Normalize city STVV JSON files to match the app's expected format."""

import json
from pathlib import Path

DATA_DIR = Path(__file__).parent.parent / "public" / "data"

CITIES = {
    "kassel": "ks-stvv",
    "hanau": "hu-stvv",
    "offenbach": "of-stvv",
    "giessen": "gi-stvv",
    "marburg": "mr-stvv",
    "fulda": "fd-stvv",
    "ruesselsheim": "rue-stvv",
}

for city, prefix in CITIES.items():
    path = DATA_DIR / f"{city}-stvv.json"
    with open(path) as f:
        data = json.load(f)

    new_parties = []
    for party in data["parties"]:
        list_number = party["id"]
        candidates = []
        for c in party["candidates"]:
            pos = c["id"]
            name = c["name"]
            if "," in name:
                last, first = name.split(",", 1)
                last = last.strip()
                first = first.strip()
            else:
                last = name.strip()
                first = ""
            candidates.append({
                "id": f"{prefix}-{list_number}-{pos}",
                "position": pos,
                "lastName": last,
                "firstName": first,
                "profession": "",
            })
        new_parties.append({
            "listNumber": list_number,
            "fullName": party["name"],
            "shortName": party["name"],
            "candidateCount": len(candidates),
            "candidates": candidates,
        })

    output = {
        "totalStimmen": data["totalStimmen"],
        "maxPerCandidate": data["maxPerCandidate"],
        "parties": new_parties,
    }

    with open(path, "w") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
        f.write("\n")

    print(f"{city}: {len(new_parties)} parties, {sum(p['candidateCount'] for p in new_parties)} candidates")

print("\nDone.")
