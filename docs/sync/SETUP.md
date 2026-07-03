# Google Sheets live sync — one-time setup (~5 minutes)

After this, the app pushes every change to your Google Sheet automatically, and
any device can pull the latest state. The sheet itself stays human-readable
(Sessions / Sets / BodyWeight / PRs / Program tabs) — share its link with anyone,
including an AI.

## Steps

1. Go to [sheets.new](https://sheets.new) → name the sheet (e.g. **Train Log**).
2. Menu: **Extensions → Apps Script**. Delete the placeholder code.
3. Paste the entire contents of [`google-sheet-sync.gs`](google-sheet-sync.gs). Save (Ctrl+S).
4. Click **Deploy → New deployment** → gear icon → **Web app**.
   - Description: `train sync`
   - Execute as: **Me**
   - Who has access: **Anyone**  ← required; the URL itself is your secret
5. Click **Deploy**, authorize with your Google account (it warns because the
   script is yours, not verified — Advanced → Go to project → Allow).
6. Copy the **Web app URL** (ends in `/exec`).
7. In the app: **More → Live sync → Connect** → paste the URL.

## How it behaves

- Every change (set logged, day pushed, weight, gym…) syncs ~4 seconds later.
  Offline? No problem — it retries on the next change; your data is always safe
  locally first.
- New device / phone died: open the app → More → Live sync → Connect (same URL)
  → **Pull from Sheet**. Photos are the only thing that stays per-device.
- Last write wins. Log on one device at a time and you'll never notice.

## Privacy

The Web app URL is an unguessable token — anyone who has it can read/write your
workout log (only your workout log). Don't post it publicly. To revoke: Apps
Script → Deploy → Manage deployments → Archive.
