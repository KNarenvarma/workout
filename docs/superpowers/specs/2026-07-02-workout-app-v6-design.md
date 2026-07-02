# Workout App v6 — Design Spec

**Date:** 2026-07-02
**File:** `index.html` (single-file app, GitHub Pages hosted, mobile-first)
**Owner:** Naren

## 1. Problem

The current app (v5) has a hard-wired weekday schedule, a binary "skip day" flag, no
concept of missed/pushed workouts, no gym awareness (PRs compare across differently
calibrated machines), a diet tab the user doesn't use, and data locked inside one
browser's localStorage with no export. The user wants real-life-proof tracking, an
Excel file he can keep in OneDrive, and an AI-trainer prompt generated from his data.

## 2. Decisions (user-confirmed)

| Decision | Choice |
|---|---|
| Scheduling | **Weekdays + push**: keep Mon UB1 / Tue LB1 / Thu UB2 / Fri LB2; missed workouts get Push→next day / Do today / Mark missed / Mark skipped actions |
| Storage | **Local-first** (localStorage `train_v6`, migrated from v5/v4) + one-tap multi-sheet **.xlsx export** the user overwrites in his OneDrive folder (share link then always serves current data) + **JSON backup/restore** for device moves |
| Live OneDrive sync | **Out of scope.** Writing to an Excel workbook from a static page requires Microsoft Graph OAuth (Azure app registration by the user). Documented as a future upgrade path; not built now |
| Diet | **Removed entirely** (Fuel tab, meals, breakfast variants, macro targets). Old meal data left untouched under the old storage key |
| Gyms | **Gym profiles**: named gyms, current-gym picker, every set tagged with gym; last-weights and PRs are per-gym with cross-gym reference shown secondary |
| AI trainer | **Prompt generator**: builds a markdown progress report (program, adherence, per-exercise progression, PRs, bodyweight trend, notes) — copy to clipboard / share / download .md |
| UI | Full overhaul, keep dark aesthetic + Inter, mobile-first; 4 tabs: **Today / Train / Progress / More** |
| Approval | User chose "build it all now" — no further check-ins required before implementation |

## 3. Data model (localStorage key `train_v6`)

```js
{
  version: 6,
  gyms: [{ id: "g1", name: "Home Gym" }],       // user-editable
  currentGym: "g1",
  days: {
    "2026-07-02": {
      due: "lower1",            // workout key resolved for that day (after pushes)
      status: "done" | "partial" | "skipped" | "missed" | "rest" | "pushed",
      gym: "g1",                // gym used that day (set on first logged set)
      sets: { [workoutKey]: { [exIdx]: { [setIdx]: { w, r, done, pr, ts } } } },
      note: ""
    }
  },
  overrides: { "2026-07-03": "lower1" },        // date → workout assigned by a push
  weights: [{ date: "2026-07-02", kg: 80.4 }],
  exNotes: { "Flat Dumbbell Press": "seat pin 4" },
  photos: [ ...metadata... ]                    // blobs stay in IndexedDB (unchanged)
}
```

- **Due resolution:** `due(date) = overrides[date] ?? SCHED[weekday(date)]`.
- **Status resolution for past days** (computed, not stored, unless user set one):
  sets fully logged → `done`; some sets → `partial`; none and it was a training
  day → `missed`; scheduled rest → `rest`. User can reclassify any past day from
  History (missed ↔ skipped ↔ rest).
- **Push:** on any day with an unresolved due workout, "Push → tomorrow" sets
  `overrides[tomorrow] = thatWorkout` and marks the source day `pushed`. If
  tomorrow already has a due workout, both show; each is independently pushable.
  Chains are allowed; no automatic cascading beyond what the user taps.
- **Migration:** on first load, if `train_v6` absent, read `train_v5`/`grind_v4`:
  `log[date][wk]` → `days[date].sets[wk]` with status inferred, `skipped[date]` →
  status `skipped`, `weights`/`photos`/`notes` carried over. Old keys are **not
  deleted** (rollback safety). Meals/breakfast data is not migrated.

## 4. Features

### 4.1 Today tab
- Header: date, gym picker pill, bodyweight quick-log.
- Card for each due workout today (normally one; two if a push landed on a
  scheduled day): big **Start / Continue** button, progress ring, set count.
- Overdue banner for yesterday-and-earlier unresolved workouts with the four
  actions: **Do today · Push → tomorrow · Missed · Skipped**.
- Week strip (Mon–Sun) with per-day status dots (done/partial/missed/skipped/rest/future).
- Rest-day card on Wed/Sat/Sun when nothing is due.

### 4.2 Train tab (workout execution)
- Workout switcher (UB1/LB1/UB2/LB2) as now, plus "not today's plan" hint.
- Exercise cards preserved from v5 (same `W` data: names, sets×reps, rest, muscle
  tags, YouTube links, alternatives, step-by-step cues, tips) — content is kept
  verbatim, presentation refreshed.
- **Simpler logging:**
  - Tap a set chip → bottom sheet prefilled with last entry *at the current gym*
    (secondary line shows last at other gyms); ±2.5 kg / ±1 rep steppers; Save.
  - **"Same as last time"** button per exercise: one tap logs all remaining sets
    with the previous session's weights/reps (current gym).
  - Long-press / ✓-all control to mark an exercise done quickly.
- PRs are per-gym. Rest timer unchanged. Per-exercise notes kept (e.g. "seat pin 4").
- **Finish workout** button → sets day status done/partial + optional note.

### 4.3 Progress tab (merges Body + Stats)
- Adherence: sessions/week vs target 4, current streak, 8-week calendar heat strip
  with done/missed/skipped colors.
- Strength: per-exercise progression chart (weight over time, filtered by gym,
  with all-gyms overlay), PR list per gym.
- Body: weight quick-log, trend chart (7/30/90d), progress photos + compare
  (IndexedDB storage unchanged).
- **Photo upload with date:** adding a photo opens a sheet with (a) file picker
  that accepts gallery uploads (no `capture` attribute forcing camera) and (b) a
  date field defaulting to today so old photos can be backdated; photos sort and
  compare by that chosen date.

### 4.4 More tab
- **Gyms:** add/rename/delete gyms, switch current gym.
- **Export to Excel (.xlsx):** dependency-free generator (ZIP container with
  stored/uncompressed entries + CRC32, SpreadsheetML sheets):
  - `Sessions` — date, weekday, due workout, status, gym, sets done, volume, note
  - `Sets` — date, workout, exercise, set #, weight, reps, PR flag, gym
  - `BodyWeight` — date, kg
  - `PRs` — exercise, gym, weight, reps, date
  - `Program` — the plan itself (workout, exercise, sets×reps, rest)
  - User overwrites the same file in OneDrive → his existing share link always
    serves the latest data. This is stated in the UI ("Save over the same file in
    OneDrive to keep your share link current").
- **AI Trainer prompt:** generates markdown: role preamble ("act as my strength
  coach…"), program description, last-4-weeks adherence, per-exercise first→last
  progression with plateau flags, PRs per gym, bodyweight trend, user notes, and
  explicit questions to the AI (what to adjust next week). Actions: Copy /
  Share / Download `.md`.
- **Backup:** Export JSON / Import JSON (restores full state; photo blobs excluded,
  metadata kept).
- Danger zone: reset all data (double-confirm).

### 4.5 Removed
- Fuel tab, MEALS/BREAKFAST_VARIANTS/TARGETS data, meal logging, macro rings on
  the summary. Summary ring space is reused for adherence/volume.

## 5. UI overhaul

Dark, high-contrast, Inter; mobile-first (already the audience — phone in a gym).
Refinements: 4-tab bottom bar with safe-area padding, larger touch targets (min
44px), week strip, status-colored chips (done=green, partial=amber, missed=red,
skipped=slate, rest=dim), progress rings kept, bottom sheets kept, subtle motion
(sheet slide, ring animation). No external assets beyond the existing Google Font
(cached fallback to system font offline). Single file, no build step, no CDN JS.

## 6. Error handling

- localStorage full / unavailable → toast warning, app keeps running in-memory.
- Migration wrapped in try/catch; on failure, start fresh v6 but leave old keys.
- Import JSON validates `version` and shape before overwriting; bad file → toast,
  no change.
- xlsx/clipboard/share guarded with feature checks and fallbacks (download link
  fallback for clipboard/share).

## 7. Testing

Manual, browser-based (no test infra in a single-file static page):
- Fresh-load (no data), v5-migration load (seed v5 fixture), logging flow, push
  flow across day boundaries (simulate by seeding dates), gym switch + PR
  isolation, xlsx opens in Excel, JSON round-trip, AI prompt content sanity.
- Verified via Chrome DevTools MCP against the local file before commit.

## 8. Out of scope / future

- Live Microsoft Graph / OneDrive write sync (needs user's Azure app registration;
  design leaves a clean seam: all persistence goes through `persist()` /
  `loadStore()`).
- PWA manifest/service worker; multi-file split; workout plan editor UI.
