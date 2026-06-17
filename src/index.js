import { chromium } from 'playwright';
import { config } from './config.js';
import { scrapeBook } from './books/index.js';
import { findAlerts, formatAlert } from './compare.js';
import { postDiscord } from './lib/discord.js';
import { loadSeen, saveSeen } from './lib/seen.js';

const once = process.argv.includes('--once');
const seen = loadSeen();

async function scan() {
  console.log(`Scanning books: ${config.books.join(', ')}`);
  const browser = await chromium.launch({
    headless: config.headless,
    args: ['--no-sandbox', '--disable-dev-shm-usage']
  });

  const allProps = [];
  try {
    for (const bookId of config.books) {
      try {
        const props = await scrapeBook({
          browser,
          bookId,
          urls: config.urls[bookId] || [],
          debug: config.debug,
          autoNavigate: config.autoNavigate,
          maxEventsPerBook: config.maxEventsPerBook,
          proxy: config.proxies.length ? config.proxies[config.books.indexOf(bookId) % config.proxies.length] : undefined
        });
        console.log(`${bookId}: parsed ${props.length} props`);
        allProps.push(...props);
      } catch (err) {
        console.error(`${bookId}: failed`, err.message);
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }

  console.log(`Total props loaded: ${allProps.length}`);
  const alerts = findAlerts(allProps, config.minOddsDiff);
  console.log(`Alerts found: ${alerts.length}`);

  let posted = 0;
  for (const alert of alerts.slice(0, 20)) {
    const alertId = `${alert.key}|${alert.best.bookId}|${alert.best.odds}|${alert.worst.bookId}|${alert.worst.odds}`;
    if (seen.has(alertId)) continue;
    await postDiscord(config.discordWebhookUrl, formatAlert(alert));
    seen.add(alertId);
    posted++;
  }
  saveSeen(seen);
  console.log(`New alerts posted: ${posted}`);
}

async function main() {
  await scan();
  if (once) return;
  const ms = config.scanIntervalMinutes * 60 * 1000;
  console.log(`Running every ${config.scanIntervalMinutes} minutes`);
  setInterval(() => scan().catch(err => console.error('Scan failed:', err)), ms);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
