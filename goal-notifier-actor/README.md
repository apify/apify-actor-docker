# ⚽ Football Goal Email Notifier

An [Apify Actor](https://docs.apify.com/actor) that watches a single live football match and
**emails you the moment anyone scores** — one email per goal, plus optional kickoff and full-time
messages. Built to answer requests like *"tell me whenever someone scores in the Belgium vs Spain
match."*

- **Data source:** [API-Football](https://www.api-football.com/) via RapidAPI (live goal events with
  scorer, minute, assist and goal type).
- **Email:** the [`apify/send-mail`](https://apify.com/apify/send-mail) Actor — no SMTP credentials
  needed, it sends through your Apify account.

## Input

| Field | Required | Default | Description |
| --- | --- | --- | --- |
| `rapidApiKey` | ✅ | – | Your RapidAPI key for `api-football-v1`. |
| `notificationEmail` | ✅ | – | Address that receives the goal emails. |
| `homeTeam` | | `Belgium` | Team name to match (substring, case-insensitive). |
| `awayTeam` | | `Spain` | The other team name. |
| `matchDate` | | today (UTC) | `YYYY-MM-DD` date used to auto-find the fixture. |
| `fixtureId` | | – | API-Football fixture ID. If set, skips team/date lookup (most reliable). |
| `pollIntervalSecs` | | `30` | How often to check for new goals. |
| `notifyOnKickoffAndFullTime` | | `true` | Also email at kickoff and full-time. |
| `maxRuntimeSecs` | | `18000` | Safety stop (5 h) if the match never reaches a finished status. |

### How the fixture is found

If you pass a `fixtureId`, that's used directly. Otherwise the Actor searches all fixtures on
`matchDate` (defaulting to today, UTC) and picks the one where the two team names both match. Because
international team names can vary ("Belgium" vs "Belgium U21"), **passing an explicit `fixtureId` is
the most reliable option** — you can find it with a quick API-Football `/fixtures` query.

## How it works

1. Resolves the fixture to watch.
2. Polls `/fixtures` (status + score) and `/fixtures/events` (goal events) every `pollIntervalSecs`.
3. Diffs the goal events against the ones it has already seen; each new goal triggers a
   `pushData` record and an email via `apify/send-mail`.
4. Stops when the match status becomes `FT`/`AET`/`PEN` (finished), is abandoned, or the runtime
   cap is hit.

State (seen goals, kickoff flag) is persisted to the default key-value store, so a platform
migration or restart won't re-send goals you were already notified about.

## Running it

On the Apify platform: set the inputs and **Start**. Kick it off shortly before the match — while
the fixture status is `NS` (not started) the Actor simply waits and polls.

Locally with the [Apify CLI](https://docs.apify.com/cli):

```bash
cd goal-notifier-actor
apify run -p
```

> Note: emails are sent through the `apify/send-mail` Actor, so email delivery requires running on
> the Apify platform (or a local run authenticated with `apify login`).

## Output

Every goal is stored as a dataset row (`minute`, `team`, `scorer`, `assist`, `detail`, `score`,
`notifiedAt`), viewable under the **Goals scored** dataset view.
