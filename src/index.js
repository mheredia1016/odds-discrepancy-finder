const config = require('./config');
const { fetchLeagueEvents } = require('./sgo');
const { extractOddsRows } = require('./extract');
const { compareRows } = require('./compare');
const { postDiscord } = require('./discord');
const { loadPosted, savePosted, alertId } = require('./state');

if (!config.apiKey) {
  console.error('Missing SPORTSGAMEODDS_API_KEY');
  process.exit(1);
}
if (!config.pregameWebhookUrl) {
  console.warn('Missing PREGAME_WEBHOOK_URL. Pregame alerts will not post.');
}
if (!config.liveWebhookUrl) {
  console.warn('Missing LIVE_WEBHOOK_URL. Live alerts will not post.');
}

const posted = loadPosted();

async function scan() {
  console.log(`Scanning leagues: ${config.leagueIds.join(', ')}`);
  console.log(`Books: ${config.bookmakerIds.join(', ')}`);
  console.log(`Pregame diff +${config.minOddsDiff}; live diff +${config.liveMinOddsDiff}`);

  const allRows = [];

  for (const leagueID of config.leagueIds) {
    try {
      const data = await fetchLeagueEvents(leagueID, config);
      const events = Array.isArray(data) ? data : (data.events || data.data || []);
      console.log(`${leagueId}: events ${events.data.length}`);

console.log('=== FIRST EVENT ===');
console.log(JSON.stringify(events.data?.[0], null, 2));
process.exit(0);
      for (const event of events) {
        const rows = extractOddsRows(event, config.bookmakerIds);
        allRows.push(...rows);
      }
    } catch (err) {
      console.error(`${leagueID}: fetch failed - ${err.message}`);
    }
  }

  console.log(`Total odds rows loaded: ${allRows.length}`);

  const alerts = compareRows(allRows, config);
  const pregame = alerts.filter(a => !a.isLive).slice(0, config.topPregameAlertsPerScan);
  const live = alerts.filter(a => a.isLive).slice(0, config.topLiveAlertsPerScan);

  console.log(`Alerts found: pregame ${pregame.length}, live ${live.length}`);

  let postedCount = 0;
  for (const alert of [...live, ...pregame]) {
    const id = alertId(alert);
    if (posted.has(id)) continue;
    const webhook = alert.isLive ? config.liveWebhookUrl : config.pregameWebhookUrl;
    if (!webhook) continue;
    try {
      await postDiscord(webhook, alert);
      posted.add(id);
      postedCount++;
      await new Promise(r => setTimeout(r, 1200));
    } catch (err) {
      console.error(`Discord post failed: ${err.message}`);
    }
  }

  savePosted(posted);
  console.log(`New alerts posted: ${postedCount}`);
}

async function main() {
  await scan();
  const ms = config.scanIntervalMinutes * 60 * 1000;
  console.log(`Running every ${config.scanIntervalMinutes} minutes`);
  setInterval(scan, ms);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
