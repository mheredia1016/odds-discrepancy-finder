import { config } from './config.js';
import { fetchEvents, fetchEventOdds } from './oddsApi.js';
import { compareEvent } from './compare.js';
import { postAlert, alertSummary } from './discord.js';

const seen = new Set();

function chunks(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function alertKey(alert) {
  return [alert.eventId, alert.marketKey, alert.player, alert.line, alert.best.bookKey, alert.best.price, alert.lowest.bookKey, alert.lowest.price].join('|');
}

async function scan() {
  if (!config.oddsApiKey) throw new Error('Missing ODDS_API_KEY');

  console.log(`Scanning sports: ${config.sportKeys.join(', ')}`);
  console.log(`Markets: ${config.markets.join(', ')}`);
  console.log(`Min diff: ${config.minOddsDiff}, Max odds: ${config.maxOdds}, Min books: ${config.minBookCount}`);

  let totalEvents = 0;
  let totalAlerts = 0;
  let posted = 0;

  for (const sportKey of config.sportKeys) {
    try {
      const events = await fetchEvents(sportKey);
      totalEvents += events.length;
      console.log(`${sportKey}: ${events.length} events found`);

      for (const event of events) {
        for (const marketChunk of chunks(config.markets, config.eventMarketChunkSize)) {
          try {
            const odds = await fetchEventOdds(sportKey, event.id, marketChunk);
            const alerts = compareEvent(odds);
            if (alerts.length) console.log(`${event.away_team} @ ${event.home_team}: ${alerts.length} alerts from ${marketChunk.join(',')}`);
            totalAlerts += alerts.length;

            for (const alert of alerts) {
              const key = alertKey(alert);
              if (seen.has(key)) continue;
              seen.add(key);
              console.log(alertSummary(alert));
              await postAlert(alert);
              posted++;
              await new Promise(r => setTimeout(r, 500));
            }
          } catch (err) {
            console.log(`${sportKey} ${event.id} markets ${marketChunk.join(',')}: failed - ${err.message}`);
          }
        }
      }
    } catch (err) {
      console.log(`${sportKey}: failed - ${err.message}`);
    }
  }

  console.log(`Total events loaded: ${totalEvents}`);
  console.log(`Alerts found: ${totalAlerts}`);
  console.log(`New alerts posted: ${posted}`);
}

async function main() {
  await scan();
  const ms = config.scanIntervalMinutes * 60 * 1000;
  console.log(`Running every ${config.scanIntervalMinutes} minutes`);
  setInterval(() => scan().catch(err => console.error(err)), ms);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
