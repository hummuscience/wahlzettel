# Wahlguide 2026

Interactive practice ballot for the 2026 Hessian municipal elections (Kommunalwahl). Practice the complex cumulative and split voting system before election day.

**Live at [whlztl.de](https://whlztl.de)**

## Supported Elections

12 elections across 10 cities in Hessen:

| City | Election | Stimmen |
|------|----------|---------|
| Frankfurt | Stadtverordnetenversammlung | 93 |
| Frankfurt | Kommunale Ausländervertretung (KAV) | 37 |
| Wiesbaden | Stadtverordnetenversammlung | 81 |
| Wiesbaden | Ausländerbeirat | 31 |
| Darmstadt | Stadtverordnetenversammlung | 71 |
| Kassel | Stadtverordnetenversammlung | 71 |
| Offenbach | Stadtverordnetenversammlung | 71 |
| Gießen | Stadtverordnetenversammlung | 59 |
| Hanau | Stadtverordnetenversammlung | 59 |
| Marburg | Stadtverordnetenversammlung | 59 |
| Fulda | Stadtverordnetenversammlung | 59 |
| Rüsselsheim | Stadtverordnetenversammlung | 45 |

## Features

### Voting
- **Individual voting (Kumulieren)** — Assign 1-3 Stimmen to specific candidates across any party
- **List voting (Kopfleiste)** — Check a party's list header to automatically distribute votes top-to-bottom
- **Striking candidates (Streichen)** — Exclude individual candidates from the list vote distribution
- **Split voting (Panaschieren)** — Combine votes across multiple parties
- Real-time vote counter with validity checking (green = complete, red = over-limit)

### Navigation
- Interactive Germany map drill-down: state -> city -> election
- Party bookmark tabs for quick jumping between parties
- Keyboard navigation (arrow keys, tab, escape)
- Fully responsive from mobile to desktop

### Languages
Deutsch, English, Turkce, Arabic (RTL), Ukrainian, Russian

### Education
- 10-step interactive guided tour with spotlight overlay
- Walkthrough sidebar explaining each voting concept
- Practical info panel: election date, voter eligibility, postal voting, official links

### Sharing & Printing
- Shareable links with compact binary-encoded vote state
- QR code generation colored by party vote distribution
- Image export of ballot snapshot
- Printable "Spickzettel" (cheat sheet) optimized for taking into the voting booth

## Tech Stack

- React + TypeScript + Vite
- Tailwind CSS v4
- i18next (6 languages)
- Deployed to GitHub Pages

## Development

```bash
npm install
npm run dev
```

## Data Pipeline

Candidate data is parsed from official Amtsblatt PDFs and city Probestimmzettel using scripts in `scripts/`. Output JSON files live in `public/data/`.

## Disclaimer

This is a private informational project and is not affiliated with any city government or election authority. All data is provided without guarantee. Consult your city's official election page for authoritative information.
