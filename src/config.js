require('dotenv').config();

function num(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

function bool(name, fallback = false) {
  const raw = process.env[name];
  if (raw == null || raw === '') return fallback;
  return ['1', 'true', 'yes', 'y'].includes(String(raw).toLowerCase());
}

function list(name, fallback = '') {
  return String(process.env[name] || fallback)
    .split(',')
    .map(x => x.trim())
    .filter(Boolean);
}

module.exports = {
  apiKey: process.env.SPORTSGAMEODDS_API_KEY,
  pregameWebhookUrl: process.env.PREGAME_WEBHOOK_URL || process.env.DISCORD_WEBHOOK_URL,
  liveWebhookUrl: process.env.LIVE_WEBHOOK_URL,
  leagueIds: list('LEAGUE_IDS', 'MLB,NBA,NFL,NHL,WNBA,UFC,EPL,MLS,INTERNATIONAL_SOCCER'),
  bookmakerIds: list('BOOKMAKER_IDS', 'fanduel,draftkings,hardrockbet,bet365,thescorebet,fanatics,betmgm'),
  minOddsDiff: num('MIN_ODDS_DIFF', 500),
  liveMinOddsDiff: num('LIVE_MIN_ODDS_DIFF', 750),
  maxOdds: num('MAX_ODDS', 10000),
  liveMaxOdds: num('LIVE_MAX_ODDS', 5000),
  minBookCount: num('MIN_BOOK_COUNT', 2),
  liveMinBookCount: num('LIVE_MIN_BOOK_COUNT', 3),
  scanIntervalMinutes: num('SCAN_INTERVAL_MINUTES', 5),
  lookaheadHours: num('LOOKAHEAD_HOURS', 48),
  includeLive: bool('INCLUDE_LIVE', true),
  includeAltLines: bool('INCLUDE_ALT_LINES', true),
  includeDeeplinks: bool('INCLUDE_DEEPLINKS', true),
  topPregameAlertsPerScan: num('TOP_PREGAME_ALERTS_PER_SCAN', 20),
  topLiveAlertsPerScan: num('TOP_LIVE_ALERTS_PER_SCAN', 10),
  eventLimit: Number(process.env.EVENT_LIMIT || 10),
};
