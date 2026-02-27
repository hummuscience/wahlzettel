# Add Election

Add a new city/election to the Wahlzettel app. Handles the full pipeline: research what data is available, download and parse candidate PDFs, generate the JSON data file, scaffold all config/i18n files, and patch the registry.

## User-invocable

Trigger: /add-election

## Instructions

The user may provide as little as a city name (e.g., "add Bad Homburg") or as much as a full spec. Work through these phases in order, skipping what's already provided.

---

### Phase 1: Research

If the user hasn't provided candidate data, research the election:

1. **Determine what's missing.** Check `src/components/ElectionPicker.tsx` to see which cities/elections already exist.

2. **Find the Amtsblatt/Bekanntmachung PDF.** Search for:
   - `"{city}" Kommunalwahl 2026 Amtsblatt Wahlvorschläge Bekanntmachung`
   - `site:{city-domain}.de wahlen Musterstimmzettel 2026 PDF`
   - Check the city's official election page for PDF links

3. **Download the PDF** to `/tmp/` using `curl -sL -o /tmp/{slug}-amtsblatt.pdf "{url}"`.

4. **Extract key facts** using pdfplumber. Run a quick Python snippet to get:
   - Number of Sitze (= totalStimmen for the STVV/Stadtrat)
   - All party list numbers, full names, short names, and candidate counts
   - Whether the same PDF contains Ortsbeirat/Ausländerbeirat sections (stop before those)

5. **Determine election parameters:**
   - **Hessen STVV**: totalStimmen = number of Sitze, maxPerCandidate = 3, date = 15. März 2026
   - **Hessen KAV**: totalStimmen = number of Sitze, maxPerCandidate = 3, date = 15. März 2026
   - **Bayern Stadtrat**: totalStimmen = number of Sitze, maxPerCandidate = 3, date = 8. März 2026
   - Stimmen = Sitze in Hessen. In Bayern, Stimmen = Sitze as well.

6. **Find the city's election info URL and hotline** from their official website.

7. **Present findings to user** before proceeding: list the parties found, candidate counts, totalStimmen, and ask for confirmation.

---

### Phase 2: Parse Candidates

Write a parsing script or inline Python to extract all candidates from the PDF into `public/data/{slug}.json`.

#### PDF format detection
Hessen Amtsblatt PDFs come in several layouts. Detect which one:

- **Single-column** (most cities): Full-page text, "Wahlvorschlag N" headers, candidates numbered `1. LastName, FirstName, Profession, geb. YEAR in PLACE`
- **Two-column** (Frankfurt): Left/right columns, "Liste N" headers. Use `page.within_bbox()` to split.
- **Table-based** (some KAV): Use `page.extract_tables()`.

#### Hessen STVV parsing pattern (single-column)
```python
import pdfplumber, re, json

pdf = pdfplumber.open(pdf_path)
full_text = '\n'.join(page.extract_text() or '' for page in pdf.pages)
pdf.close()

# Extract only STVV section (stop at Ortsbeiräte or Ausländerbeirat)
stvv_end = re.search(r'Wahlvorschläge für (?:die|den) (?:Ortsbeiräte|Ausländerbeirat)', full_text)
if stvv_end:
    full_text = full_text[:stvv_end.start()]

# Split by "Wahlvorschlag N" headers
# Parse candidates: "N. LastName, FirstName, Profession, geb. YEAR in PLACE, CITY"
```

#### Candidate ID format
- Hessen STVV: `{abbrev}-stvv-{listNumber}-{position}` (e.g., `bh-stvv-1-1`)
- Hessen KAV: `{abbrev}-kav-{listNumber}-{position}`
- Bayern Stadtrat: `{abbrev}-sr-{listNumber}-{position}`

Use 2-letter city abbreviation: Frankfurt=ff, Bad Homburg=bh, München=m, etc.

#### Output JSON format
```json
{
  "totalStimmen": 49,
  "maxPerCandidate": 3,
  "parties": [
    {
      "listNumber": 1,
      "fullName": "Christlich Demokratische Union Deutschlands",
      "shortName": "CDU",
      "candidateCount": 49,
      "candidates": [
        {
          "id": "bh-stvv-1-1",
          "position": 1,
          "lastName": "Dr. Wolf",
          "firstName": "Clemens",
          "profession": "Physiker"
        }
      ]
    }
  ]
}
```

#### Validation
After parsing, verify:
- Every party has the expected number of candidates (max = totalStimmen, but can be less)
- No duplicate positions within a party
- No missing positions (1 through N should be contiguous)
- First and last candidate of each party look correct (print them)

If candidate counts look wrong, check for:
- Two-column layout not detected
- Party boundary issues (candidates leaking across parties)
- Multi-line candidate entries not joined
- Ortsbeirat candidates mixed in

---

### Phase 3: Scaffold Files

#### 1. Determine the slug
- Format: `{city-lowercase}-{body}` (e.g., `bad-homburg-stvv`, `bad-homburg-kav`)
- Umlauts: ä→ae, ö→oe, ü→ue, ß→ss (e.g., Würzburg → `wuerzburg`)

#### 2. Determine the next `shareTypeCode`
- Read `src/elections/registry.ts` and find the highest existing `shareTypeCode`
- Use `highest + 1`

#### 3. Create election directory: `src/elections/{slug}/`

**`config.ts`:**
```typescript
import type { ElectionConfig } from '../types';
import { PARTY_COLORS } from './parties';

const config: ElectionConfig = {
  id: '{slug}',
  slug: '{slug}',
  shareTypeCode: {next_code},

  totalStimmen: {totalStimmen},
  maxPerCandidate: 3,
  allowListVote: true,
  allowMultipleListVotes: {true for Bayern, omit for Hessen},

  themeColor: '{themeColor}',
  themeColorLight: '{derive light variant}',
  themeColorDark: '{derive dark variant}',

  dataFile: '{slug}.json',
  partyColors: PARTY_COLORS,

  infoUrl: '{infoUrl or undefined}',
};

export default config;
```

**`parties.ts`:**
Only include parties NOT already in `src/data/partyColors.ts`. Check the global file first.
```typescript
export const PARTY_COLORS: Record<string, string> = {
  // Only local parties not in the global partyColors.ts
  'BLB': '#795548',  // example: local party
};
```

**`i18n/de.json`** — fill all fields using city name and body type:
```json
{
  "title": "{CityName} Wahlguide 2026",
  "subtitle": "Übe die Kommunalwahl – interaktiv & verständlich",
  "shareCardTitle": "Mein Wahlzettel",
  "shareCardSubtitle": "Kommunalwahl {CityName} 2026",
  "shareText": "Schau dir meine Stimmverteilung an!",
  "ballotSubtitle": "der Stadt {CityName} am {date}",
  "ballotBodyName": "{bodyName}",
  "ballotBodyPreposition": "{preposition}",
  "whoCanVoteValue": "{who can vote text}",
  "hotlineValue": "{hotline or empty}",
  "moreInfoLink": "{domain}",
  "moreInfoUrl": "{url}",
  "disclaimer": "Dies ist ein privates Informationsangebot und steht in keinem Zusammenhang mit der Stadt {CityName} oder dem Wahlamt. Alle Angaben ohne Gewähr.",
  "madeWith": "Mit ♥ für {CityName}"
}
```

Body-type-specific values:
- **stvv** (Hessen): ballotBodyName="Stadtverordnetenversammlung", preposition="für die Wahl der", date="15. März 2026", whoCanVote="Deutsche und EU-Bürger/innen ab 18 Jahren mit mindestens 6 Wochen Wohnsitz in {city}."
- **kav** (Hessen): ballotBodyName="Ausländerbeirat", preposition="für die Wahl zum", date="15. März 2026", whoCanVote="Ausländische Einwohner/innen ab 18 Jahren mit mindestens 6 Wochen Wohnsitz in {city} (ohne EU-Pass)."
- **stadtrat** (Bayern): ballotBodyName="Stadtrats", preposition="für die Wahl des", date="8. März 2026", whoCanVote="Deutsche und EU-Bürger/innen ab 18 Jahren mit mindestens 2 Monaten Wohnsitz in {city}."
- **kreistag**: ballotBodyName="Kreistags", preposition="für die Wahl des", adjust date per state

**`i18n/en.json`:**
```json
{
  "title": "{CityName} Voting Guide 2026",
  "subtitle": "Practice the municipal election – interactive & easy to understand",
  "shareCardTitle": "My Ballot",
  "shareCardSubtitle": "Municipal Election {CityName} 2026",
  "shareText": "Check out my vote distribution!"
}
```

**`i18n/tr.json`:**
```json
{
  "title": "{CityName} Seçim Rehberi 2026",
  "subtitle": "Belediye seçimini deneyin – interaktif ve anlaşılır",
  "shareCardTitle": "Oy Pusulam",
  "shareCardSubtitle": "Belediye Seçimi {CityName} 2026",
  "shareText": "Oy dağılımıma göz atın!"
}
```

**`i18n/ar.json`:**
```json
{
  "title": "دليل انتخابات {CityName} 2026",
  "subtitle": "تدرّب على الانتخابات البلدية – تفاعلي ومفهوم",
  "shareCardTitle": "ورقة اقتراعي",
  "shareCardSubtitle": "الانتخابات البلدية {CityName} 2026",
  "shareText": "شاهد توزيع أصواتي!"
}
```

**`i18n/uk.json`:**
```json
{
  "title": "Виборчий гід {CityName} 2026",
  "subtitle": "Потренуйтеся на муніципальних виборах – інтерактивно та зрозуміло",
  "shareCardTitle": "Мій бюлетень",
  "shareCardSubtitle": "Муніципальні вибори {CityName} 2026",
  "shareText": "Подивіться мій розподіл голосів!"
}
```

**`i18n/ru.json`:**
```json
{
  "title": "Избирательный гид {CityName} 2026",
  "subtitle": "Попрактикуйтесь на муниципальных выборах – интерактивно и понятно",
  "shareCardTitle": "Мой бюллетень",
  "shareCardSubtitle": "Муниципальные выборы {CityName} 2026",
  "shareText": "Посмотрите моё распределение голосов!"
}
```

#### 4. Patch `src/elections/registry.ts`
Add a new entry at the end of the `ELECTIONS` array (before the closing `];`):
```typescript
  {
    slug: '{slug}',
    shareTypeCode: {next_code},
    load: () => import('./{slug}/config').then(m => m.default),
  },
```

#### 5. Patch `src/i18n.ts`
Add a new entry at the end of the `I18N_IMPORTERS` object (before the closing `};`):
```typescript
  '{slug}': {
    de: () => import('./elections/{slug}/i18n/de.json'),
    en: () => import('./elections/{slug}/i18n/en.json'),
    tr: () => import('./elections/{slug}/i18n/tr.json'),
    ar: () => import('./elections/{slug}/i18n/ar.json'),
    uk: () => import('./elections/{slug}/i18n/uk.json'),
    ru: () => import('./elections/{slug}/i18n/ru.json'),
  },
```

#### 6. Patch `src/components/ElectionPicker.tsx`
- If the city already exists in `CITIES` (e.g., adding KAV to a city that has STVV), add the new election to that city's `elections` array
- If the city is new, add a new entry to `CITIES`, inserted alphabetically within its state group:
  - For **stvv**: `{ slug, label: 'Stadtverordnetenversammlung', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: {n}, themeColor }`
  - For **kav**: `{ slug, label: 'Ausländerbeirat', descriptionKey: 'kavDesc', emoji: '🌍', stimmen: {n}, themeColor }`
  - For **stadtrat**: `{ slug, label: 'Stadtrat', descriptionKey: 'stvvDesc', emoji: '🇩🇪', stimmen: {n}, themeColor }`

---

### Phase 4: Validate

1. Run `npx tsc --noEmit` — fix any type errors
2. Verify party names in JSON match party color keys (global `src/data/partyColors.ts` + local `parties.ts`)
3. Report to user: slug, shareTypeCode, party count, total candidates

---

### Important rules
- **Never reuse a `shareTypeCode`** — always increment from the highest existing one
- **Don't duplicate colors** in `parties.ts` that already exist in `src/data/partyColors.ts`
- **Skipped list numbers are OK** — e.g., Bad Homburg skips List 2 (AfD disqualified). Keep the original list numbers from the Amtsblatt.
- **Academic titles** (Dr., Prof.) go in the lastName field: `"Dr. Wolf"`
- **Handle "geb." lines** — strip birth year/place from candidate data, only keep name and profession
- For KAV elections, `maxPerCandidate` is 3 and `allowListVote` is true (same as STVV)
- Theme color light/dark variants: lighten by mixing with white for light, darken by mixing with black for dark
- If a party has a Volt coalition variant (e.g., "BLB/Volt"), use the combined short name and keep it as a local party
- Always present parsed data to the user for review before writing the final JSON
