# Train — personal workout tracker (v6)

Single-file workout tracker (`index.html`) for a 4-day Upper/Lower split. No backend, no build step — open it in any browser or host it on GitHub Pages. All data stays on your device.

## The program

| Day | Session |
|-----|---------|
| Mon | Upper Body 1 |
| Tue | Lower Body 1 (heavy standing calf raises) |
| Wed | Rest |
| Thu | Upper Body 2 (+ calf raise finisher) |
| Fri | Lower Body 2 (seated calf raises) |
| Sat / Sun | Rest |

Calves are trained 3×/week (standing heavy, seated high-rep, short finisher) — weak-point priority.

## Real-life tracking

- Missed a workout? The next day offers: **Do it today · Push to tomorrow · I chose to skip · Just missed it**. Pushed workouts land on the next free day.
- Every day gets an honest status: done / partial / missed / skipped / pushed / rest — shown on the week strip and the 8-week grid in Progress.
- **Gyms:** add each gym you train at. Set history and PRs are kept separate per gym, because the same machine loads differently in different places. The set sheet shows "last time here" first and other-gym numbers as reference.
- **Logging:** tap a set → scroll the weight/reps wheels → Log set. "Same as last time" logs all remaining sets of an exercise in one tap.

## Excel + OneDrive

**More → Excel export** downloads `naren-workout.xlsx` with five sheets: Sessions, Sets, BodyWeight, PRs, Program.

Save it **over the same file** in your OneDrive folder each time — your existing share link then always serves the latest data. (A browser page cannot write directly into OneDrive without a Microsoft sign-in + Azure app registration; overwrite-the-same-file gives you the same result with one tap + one save.)

## AI coach

**More → Generate coach report** builds a complete progress prompt — adherence, per-exercise progression with plateau flags, PRs per gym, bodyweight trend, your notes — ready to paste into ChatGPT / Claude / Gemini, which then acts as your trainer.

## Backup / moving devices

Data lives in the browser's localStorage (plus photos in IndexedDB). **More → Export backup** produces a JSON file; **Import backup** restores it on a new device. v5 data is migrated automatically on first load and the old copy is left untouched.
