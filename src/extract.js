const { americanOdds, buildPlayKey } = require('./normalize');

function looksLikeBookId(id, allowed) {
  return allowed.includes(String(id || '').toLowerCase());
}

function pickDeeplink(node) {
  return node?.deeplink || node?.deepLink || node?.link || node?.url || node?.betLink || node?.sportsbookUrl || null;
}

function pickOdds(node) {
  return americanOdds(node?.odds ?? node?.price ?? node?.americanOdds ?? node?.american ?? node?.value);
}

function entityNameFromEvent(event, statEntityID) {
  if (!statEntityID) return '';
  const id = String(statEntityID);
  if (id === 'home') return event.teams?.home?.names?.long || event.teams?.home?.names?.medium || 'Home';
  if (id === 'away') return event.teams?.away?.names?.long || event.teams?.away?.names?.medium || 'Away';
  if (id === 'all') return 'All';

  const players = event.players;
  if (!players) return '';
  const player = Array.isArray(players)
    ? players.find(p => String(p.playerID || p.id || p.statEntityID) === id)
    : players[id];
  if (!player) return '';
  return player.names?.long || player.names?.medium || player.name || player.fullName || player.displayName || '';
}

function sideLabel(odd) {
  if (odd.sideID === 'over') return 'Over';
  if (odd.sideID === 'under') return 'Under';
  if (odd.sideID === 'home') return 'Home';
  if (odd.sideID === 'away') return 'Away';
  if (odd.sideID === 'draw') return 'Draw';
  if (odd.sideID === 'not_draw') return 'Not Draw';
  return odd.sideID || odd.side || odd.selection || odd.outcomeName || odd.outcome || odd.betName || odd.label || '';
}

function lineFromOdd(odd) {
  return odd.line ?? odd.points ?? odd.handicap ?? odd.spread ?? odd.total ?? odd.value ?? odd.statValue ?? '';
}

function baseRaw(event, odd, oddID) {
  const statEntityID = odd.statEntityID || odd.entityID || odd.participantID || '';
  return {
    oddID: odd.oddID || oddID,
    marketID: odd.marketName || odd.marketID || odd.marketId || odd.market || odd.statID || odd.statId || oddID,
    marketName: odd.marketName || odd.marketID || odd.market || odd.statID || oddID,
    statID: odd.statID,
    statEntityID,
    playerName: odd.playerName || odd.player || odd.participantName || odd.participant || odd.entityName || entityNameFromEvent(event, statEntityID),
    side: sideLabel(odd),
    line: lineFromOdd(odd),
    periodID: odd.periodID || odd.period,
    betTypeID: odd.betTypeID,
    raw: odd,
  };
}

function extractFromSgoOddsObject(event, allowedBookmakers) {
  const rows = [];
  if (!event.odds || typeof event.odds !== 'object' || Array.isArray(event.odds)) return rows;

  for (const [oddID, odd] of Object.entries(event.odds)) {
    if (!odd || typeof odd !== 'object') continue;
    const byBookmaker = odd.byBookmaker;
    if (!byBookmaker || typeof byBookmaker !== 'object') continue;

    const raw = baseRaw(event, odd, oddID);

    for (const [bookIdRaw, bookNode] of Object.entries(byBookmaker)) {
      const bookId = String(bookIdRaw).toLowerCase();
      if (!looksLikeBookId(bookId, allowedBookmakers)) continue;
      if (!bookNode || bookNode.available === false) continue;
      const price = pickOdds(bookNode);
      if (price == null) continue;

      rows.push({
        key: buildPlayKey(raw),
        event,
        raw,
        bookId,
        price,
        deeplink: pickDeeplink(bookNode) || pickDeeplink(odd),
      });
    }
  }

  return rows;
}

function extractOddsRows(event, allowedBookmakers) {
  const allowed = allowedBookmakers.map(x => String(x).toLowerCase());
  const rows = extractFromSgoOddsObject(event, allowed);

  const seen = new Set();
  return rows.filter(row => {
    const id = `${row.key}|${row.bookId}|${row.price}`;
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

module.exports = { extractOddsRows };
