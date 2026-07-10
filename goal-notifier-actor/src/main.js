import { Actor, log } from 'apify';

// --- API-Football (via RapidAPI) constants ------------------------------------
const RAPIDAPI_HOST = 'api-football-v1.p.rapidapi.com';
const API_BASE = `https://${RAPIDAPI_HOST}/v3`;

// Fixture status short-codes, grouped by what they mean for the watcher.
// See https://www.api-football.com/documentation-v3#tag/Fixtures
const LIVE_STATUSES = new Set(['1H', '2H', 'HT', 'ET', 'BT', 'P', 'LIVE', 'INT']);
const FINISHED_STATUSES = new Set(['FT', 'AET', 'PEN']);
const ABANDONED_STATUSES = new Set(['PST', 'CANC', 'ABD', 'SUSP', 'AWD', 'WO']);

// KV-store key used to survive a migration/restart without re-sending emails.
const STATE_KEY = 'WATCHER_STATE';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const {
    rapidApiKey,
    notificationEmail,
    homeTeam = 'Belgium',
    awayTeam = 'Spain',
    matchDate,
    fixtureId: inputFixtureId,
    pollIntervalSecs = 30,
    notifyOnKickoffAndFullTime = true,
    maxRuntimeSecs = 18000,
} = input;

if (!rapidApiKey) throw new Error('Missing "rapidApiKey" input. Provide your API-Football RapidAPI key.');
if (!notificationEmail) throw new Error('Missing "notificationEmail" input.');

/** Small typed wrapper around the API-Football REST endpoint. */
async function apiFootball(path, searchParams = {}) {
    const url = new URL(`${API_BASE}${path}`);
    for (const [key, value] of Object.entries(searchParams)) {
        if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, value);
    }
    const res = await fetch(url, {
        headers: {
            'x-rapidapi-key': rapidApiKey,
            'x-rapidapi-host': RAPIDAPI_HOST,
        },
    });
    if (!res.ok) {
        const body = await res.text().catch(() => '');
        throw new Error(`API-Football request failed: ${res.status} ${res.statusText} for ${path} — ${body.slice(0, 300)}`);
    }
    const json = await res.json();
    // API-Football reports auth/quota problems in a non-empty `errors` object with HTTP 200.
    if (json.errors && (Array.isArray(json.errors) ? json.errors.length : Object.keys(json.errors).length)) {
        throw new Error(`API-Football returned errors: ${JSON.stringify(json.errors)}`);
    }
    return json.response ?? [];
}

/** Resolve the fixture to watch, either from an explicit id or by matching team names on a date. */
async function resolveFixture() {
    if (inputFixtureId) {
        const [fixture] = await apiFootball('/fixtures', { id: inputFixtureId });
        if (!fixture) throw new Error(`No fixture found for id ${inputFixtureId}.`);
        return fixture;
    }

    const date = matchDate || new Date().toISOString().slice(0, 10);
    log.info(`No fixtureId given — searching fixtures on ${date} for "${homeTeam}" vs "${awayTeam}".`);
    const fixtures = await apiFootball('/fixtures', { date, timezone: 'UTC' });

    const home = homeTeam.toLowerCase();
    const away = awayTeam.toLowerCase();
    const match = fixtures.find((f) => {
        const names = [f.teams?.home?.name ?? '', f.teams?.away?.name ?? ''].map((n) => n.toLowerCase());
        const hasHome = names.some((n) => n.includes(home));
        const hasAway = names.some((n) => n.includes(away));
        return hasHome && hasAway;
    });

    if (!match) {
        throw new Error(
            `Could not find a "${homeTeam}" vs "${awayTeam}" fixture on ${date}. ` +
            `Set "matchDate" correctly or pass an explicit "fixtureId".`,
        );
    }
    return match;
}

/** Stable identity for a goal event so we never notify twice for the same one. */
function goalKey(ev) {
    return [ev.time?.elapsed, ev.time?.extra ?? 0, ev.team?.name, ev.player?.name, ev.detail].join('|');
}

/** True for events that represent an actual goal being scored (not a missed penalty). */
function isGoal(ev) {
    return ev.type === 'Goal' && ev.detail !== 'Missed Penalty';
}

async function sendEmail(subject, html) {
    log.info(`Sending email to ${notificationEmail}: ${subject}`);
    await Actor.call('apify/send-mail', {
        to: notificationEmail,
        subject,
        html,
    });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// --- Watcher ------------------------------------------------------------------
const fixture = await resolveFixture();
const fixtureId = fixture.fixture.id;
const homeName = fixture.teams.home.name;
const awayName = fixture.teams.away.name;
log.info(`Watching fixture ${fixtureId}: ${homeName} vs ${awayName} (${fixture.league?.name ?? 'unknown league'}).`);

// Restore state across migrations so restarts don't re-send goals we already emailed.
const state = (await Actor.getValue(STATE_KEY)) ?? { seenGoals: [], kickoffNotified: false };
const seenGoals = new Set(state.seenGoals);
let kickoffNotified = state.kickoffNotified;

const persistState = async () => {
    await Actor.setValue(STATE_KEY, { seenGoals: [...seenGoals], kickoffNotified });
};
Actor.on('migrating', persistState);

const deadline = Date.now() + maxRuntimeSecs * 1000;
let finished = false;

while (!finished && Date.now() < deadline) {
    let statusShort = 'NS';
    try {
        const [current] = await apiFootball('/fixtures', { id: fixtureId });
        statusShort = current?.fixture?.status?.short ?? statusShort;
        const goalsHome = current?.goals?.home ?? 0;
        const goalsAway = current?.goals?.away ?? 0;
        const scoreLine = `${homeName} ${goalsHome} - ${goalsAway} ${awayName}`;
        await Actor.setStatusMessage(`[${statusShort}] ${scoreLine}`);

        // Kickoff email (once), when the match transitions into a live state.
        if (notifyOnKickoffAndFullTime && !kickoffNotified && LIVE_STATUSES.has(statusShort)) {
            kickoffNotified = true;
            await sendEmail(
                `⚽ Kickoff: ${homeName} vs ${awayName}`,
                `<p>The match <b>${homeName} vs ${awayName}</b> has kicked off. You'll get an email for every goal.</p>`,
            );
            await persistState();
        }

        // Fetch and diff goal events.
        const events = await apiFootball('/fixtures/events', { fixture: fixtureId });
        for (const ev of events.filter(isGoal)) {
            const key = goalKey(ev);
            if (seenGoals.has(key)) continue;
            seenGoals.add(key);

            const minute = `${ev.time.elapsed}${ev.time.extra ? `+${ev.time.extra}` : ''}'`;
            const scorer = ev.player?.name ?? 'Unknown';
            const assist = ev.assist?.name ?? null;
            const detail = ev.detail ?? 'Goal';
            const team = ev.team?.name ?? '';

            await Actor.pushData({
                fixtureId,
                minute,
                team,
                scorer,
                assist,
                detail,
                score: scoreLine,
                notifiedAt: new Date().toISOString(),
            });

            const detailSuffix = detail && detail !== 'Normal Goal' ? ` (${detail})` : '';
            const assistLine = assist ? `<p>Assist: ${assist}</p>` : '';
            await sendEmail(
                `⚽ GOAL! ${scorer} (${team}) — ${minute}`,
                `<h2>${team} score!</h2>` +
                    `<p><b>${scorer}</b> ${minute}${detailSuffix}</p>` +
                    assistLine +
                    `<p>Current score: <b>${scoreLine}</b></p>`,
            );
            await persistState();
        }

        if (FINISHED_STATUSES.has(statusShort)) {
            finished = true;
            if (notifyOnKickoffAndFullTime) {
                await sendEmail(
                    `🏁 Full time: ${scoreLine}`,
                    `<p>The match has finished.</p><p>Final score: <b>${scoreLine}</b></p>`,
                );
            }
            log.info(`Match finished (${statusShort}). Final score: ${scoreLine}.`);
        } else if (ABANDONED_STATUSES.has(statusShort)) {
            finished = true;
            log.warning(`Match will not continue (status ${statusShort}). Stopping watcher.`);
            await Actor.setStatusMessage(`Match not played to completion (${statusShort}).`);
        }
    } catch (err) {
        // Transient API/network hiccups shouldn't kill a multi-hour watch — log and retry next tick.
        log.warning(`Poll failed, will retry: ${err.message}`);
    }

    if (!finished) await sleep(pollIntervalSecs * 1000);
}

await persistState();
if (!finished) log.warning(`Reached maxRuntimeSecs (${maxRuntimeSecs}s) before the match finished — stopping.`);

await Actor.exit();
