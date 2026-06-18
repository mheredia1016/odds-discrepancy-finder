const BOOK_NAMES = {
  fanduel: 'FanDuel',
  draftkings: 'DraftKings',
  hardrockbet: 'Hard Rock',
  bet365: 'Bet365',
  thescorebet: 'theScore Bet',
  fanatics: 'Fanatics',
  betmgm: 'BetMGM',
};

function americanOdds(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const raw = String(value).replace(/[+\s]/g, '');
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

function fmtOdds(n) {
  if (n == null) return 'n/a';
  return n > 0 ? `+${n}` : String(n);
}

function titleCase(value = '') {
  return String(value)
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\bMl\b/g, 'Moneyline')
    .replace(/\bOu\b/g, 'Over/Under')
    .replace(/\bSp\b/g, 'Spread')
    .replace(/\bHr\b/g, 'HR')
    .replace(/\bH 1\b/g, '1H')
    .replace(/\bH 2\b/g, '2H');
}

function marketName(key = '') {
  return titleCase(String(key).replace(/^player_/, ''));
}

function teamName(team) {
  if (!team) return '';
  if (typeof team === 'string') return team;
  return team.names?.long || team.names?.medium || team.name || team.longName || team.shortName || '';
}

function eventName(event) {
  const home = event.homeTeamName || event.home_team || event.homeTeam || teamName(event.home) || teamName(event.teams?.home);
  const away = event.awayTeamName || event.away_team || event.awayTeam || teamName(event.away) || teamName(event.teams?.away);
  if (away && home) return `${away} @ ${home}`;
  return event.name || event.eventName || event.shortName || event.eventID || event.id || 'Event';
}

function eventStart(event) {
  const t = event.startTime || event.commence_time || event.commenceTime || event.eventTime || event.scheduledTime || event.status?.startsAt;
  if (!t) return '';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    }).format(new Date(t));
  } catch { return String(t); }
}

function isLiveEvent(event) {
  if (typeof event.status === 'object' && event.status) return Boolean(event.status.live || event.status.started && !event.status.completed && !event.status.ended);
  const status = String(event.status || event.eventStatus || event.state || '').toLowerCase();
  return Boolean(event.isLive || event.live || status.includes('live') || status.includes('in_progress') || status.includes('in-progress'));
}

function playKeyParts(raw) {
  const market = raw.marketName || raw.marketID || raw.marketId || raw.market || raw.statID || raw.statId || raw.type || 'market';
  const player = raw.playerName || raw.player || raw.participantName || raw.participant || raw.name || raw.entityName || raw.statEntityID || '';
  const side = raw.side || raw.sideID || raw.selection || raw.outcomeName || raw.outcome || raw.betName || raw.label || '';
  const line = raw.line ?? raw.points ?? raw.handicap ?? raw.spread ?? raw.total ?? raw.value ?? '';
  const period = raw.periodID || raw.period || '';
  const statEntity = raw.statEntityID || '';
  return { market, player, side, line, period, statEntity };
}

function clean(x) {
  return String(x ?? '').trim().replace(/\s+/g, ' ');
}

function buildPlayKey(raw) {
  const p = playKeyParts(raw);
  return [p.market, p.player || p.statEntity, p.side, p.line, p.period].map(clean).join('|').toLowerCase();
}

function describePlay(raw) {
  const p = playKeyParts(raw);
  const bits = [];
  if (p.player && !['home', 'away', 'all'].includes(String(p.player).toLowerCase())) bits.push(`Player: ${p.player}`);
  bits.push(`Market: ${marketName(p.market)}`);
  const lineText = [p.side, p.line].filter(x => x !== '' && x != null).join(' ');
  if (lineText) bits.push(`Line: ${lineText}`);
  if (p.period) bits.push(`Period: ${p.period}`);
  return bits.join('\n');
}

module.exports = { BOOK_NAMES, americanOdds, fmtOdds, marketName, eventName, eventStart, isLiveEvent, buildPlayKey, describePlay };
