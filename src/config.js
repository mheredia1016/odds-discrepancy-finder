export const config = {
  oddsApiKey: process.env.ODDS_API_KEY,
  discordWebhookUrl: process.env.DISCORD_WEBHOOK_URL,
  sportKeys: split(process.env.SPORT_KEYS || 'soccer_fifa_world_cup'),
  markets: split(process.env.MARKETS || 'player_shots,player_shots_on_target,player_goal_scorer_anytime,player_goals_alternate,player_assists,player_tackles_alternate,player_fouls,player_to_receive_card'),
  regions: process.env.REGIONS || 'us',
  bookmakers: process.env.BOOKMAKERS || '',
  oddsFormat: process.env.ODDS_FORMAT || 'american',
  minOddsDiff: Number(process.env.MIN_ODDS_DIFF || 300),
  maxOdds: Number(process.env.MAX_ODDS || 25000),
  minBookCount: Number(process.env.MIN_BOOK_COUNT || 2),
  scanIntervalMinutes: Number(process.env.SCAN_INTERVAL_MINUTES || 5),
  eventMarketChunkSize: Math.max(1, Number(process.env.EVENT_MARKET_CHUNK_SIZE || 1)),
  maxEventsPerSport: Number(process.env.MAX_EVENTS_PER_SPORT || 50),
  dryRun: String(process.env.DRY_RUN || '').toLowerCase() === 'true'
};

function split(value) {
  return String(value || '')
    .split(',')
    .map(v => v.trim())
    .filter(Boolean);
}
