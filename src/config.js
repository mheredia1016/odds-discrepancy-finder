import 'dotenv/config';

function bool(v, fallback = false) {
  if (v === undefined || v === '') return fallback;
  return String(v).toLowerCase() === 'true';
}

function num(v, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function list(v) {
  return String(v || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function proxyList() {
  const servers = list(process.env.PROXY_SERVERS || process.env.PROXY_SERVER);
  return servers.map(server => ({
    server,
    username: process.env.PROXY_USERNAME || undefined,
    password: process.env.PROXY_PASSWORD || undefined
  }));
}

export const config = {
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL || '',
  minOddsDiff: num(process.env.MIN_ODDS_DIFF, 300),
  scanIntervalMinutes: num(process.env.SCAN_INTERVAL_MINUTES, 5),
  headless: bool(process.env.HEADLESS, true),
  debug: bool(process.env.DEBUG_SCRAPE, false),
  autoNavigate: bool(process.env.AUTO_NAVIGATE, true),
  maxEventsPerBook: num(process.env.MAX_EVENTS_PER_BOOK, 8),
  books: list(process.env.BOOKS || 'draftkings,fanatics,fanduel'),
  urls: {
    draftkings: list(process.env.DRAFTKINGS_URLS),
    fanatics: list(process.env.FANATICS_URLS),
    fanduel: list(process.env.FANDUEL_URLS),
    betmgm: list(process.env.BETMGM_URLS),
    caesars: list(process.env.CAESARS_URLS),
    espnbet: list(process.env.ESPNBET_URLS)
  },
  proxies: proxyList()
};
