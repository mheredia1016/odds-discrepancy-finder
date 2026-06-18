const { describePlay, isLiveEvent } = require('./normalize');

function textFor(row) {
  return [
    row.raw?.marketName,
    row.raw?.oddID,
    row.raw?.statID,
    row.raw?.statEntityID,
    row.raw?.betTypeID,
    row.raw?.sideID,
    row.raw?.periodID,
    row.raw?.label,
    row.raw?.name,
    row.raw?.playerName,
    row.raw?.participantName,
    row.raw?.teamName,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function listFromConfig(value, fallback) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    return value.split(',').map(x => x.trim()).filter(Boolean);
  }
  return fallback;
}

function hasAny(text, words) {
  return words.some(word => text.includes(String(word).toLowerCase()));
}

function hasExcludedMarket(row, config) {
  const text = textFor(row);

  const excludes = listFromConfig(config.excludeMarketKeywords, [
    'moneyline',
    'spread',
    'run line',
    'puck line',
    'game total',
    'total points',
    'total runs',
    'total goals',
    'alternate total',
    'team total',
    'yes/no',
    'any runs',
    'race to',
    'inning',
    'quarter',
    'half',
    'period',
    '1h',
    '2h',
    '1i',
    '2i',
    '3i',
    '4i',
    '5i',
    '6i',
    '7i',
    '8i',
    '9i',
  ]);

  return hasAny(text, excludes);
}

function hasPreferredMarket(row, config) {
  const text = textFor(row);

  const preferred = listFromConfig(config.preferredMarketKeywords, [
    'player',
    'batter',
    'pitcher',
    'goalie',
    'fighter',
    'home run',
    'hits',
    'total bases',
    'rbi',
    'runs scored',
    'strikeouts',
    'stolen bases',
    'points',
    'rebounds',
    'assists',
    'threes',
    '3-pointers',
    'saves',
    'shots',
    'shots on target',
    'goals',
    'goal scorer',
    'goalscorer',
    'to score',
    'tackles',
    'cards',
    'fouls',
    'method of victory',
    'round',
    'submission',
    'ko/tko',
  ]);

  return hasAny(text, preferred);
}

function impliedProbability(americanOdds) {
  const odds = Number(americanOdds);
  if (!Number.isFinite(odds)) return null;

  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

function median(values) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}

function compareRows(rows, config) {
  const groups = new Map();

  for (const row of rows) {
    if (!groups.has(row.key)) groups.set(row.key, []);
    groups.get(row.key).push(row);
  }

  const alerts = [];

  for (const [key, groupRows] of groups.entries()) {
    const isLive = isLiveEvent(groupRows[0].event);

    const minBookCount = isLive ? config.liveMinBookCount : config.minBookCount;
    const minDiff = isLive ? config.liveMinOddsDiff : config.minOddsDiff;
    const maxOdds = isLive ? config.liveMaxOdds : config.maxOdds;

    const minPositiveOdds = Number(config.minPositiveOdds ?? 100);
    const minEdgePct = Number(config.minEdgePct ?? 10);
    const maxMarketSpread = Number(config.maxMarketSpread ?? 0.30);
    const requirePreferredMarket = String(config.requirePreferredMarket ?? 'true') === 'true';
    const requireDeeplink = String(config.requireDeeplink ?? 'false') === 'true';

    if (hasExcludedMarket(groupRows[0], config)) continue;
    if (requirePreferredMarket && !hasPreferredMarket(groupRows[0], config)) continue;

    const byBook = new Map();

    for (const row of groupRows) {
      if (!Number.isFinite(row.price)) continue;
      if (row.price < minPositiveOdds) continue;
      if (Math.abs(row.price) > maxOdds) continue;

      const current = byBook.get(row.bookId);
      if (!current || row.price > current.price) {
        byBook.set(row.bookId, row);
      }
    }

    const prices = [...byBook.values()].sort((a, b) => b.price - a.price);
    if (prices.length < minBookCount) continue;

    const best = prices[0];
    if (requireDeeplink && !best.deeplink) continue;

    const lowest = [...prices].sort((a, b) => a.price - b.price)[0];
    const diff = best.price - lowest.price;
    if (diff < minDiff) continue;

    const implied = prices
      .map(p => impliedProbability(p.price))
      .filter(v => Number.isFinite(v));

    if (implied.length < minBookCount) continue;

    const bestImp = impliedProbability(best.price);
    const otherImp = prices
      .filter(p => p.bookId !== best.bookId)
      .map(p => impliedProbability(p.price))
      .filter(v => Number.isFinite(v));

    if (!Number.isFinite(bestImp) || otherImp.length < minBookCount - 1) continue;

    const consensusImp = median(otherImp);
    if (!Number.isFinite(consensusImp) || consensusImp <= 0) continue;

    const edgePct = ((consensusImp - bestImp) / consensusImp) * 100;
    if (edgePct < minEdgePct) continue;

    const marketSpread = Math.max(...implied) - Math.min(...implied);
    if (marketSpread > maxMarketSpread) continue;

    alerts.push({
      key,
      isLive,
      event: best.event,
      raw: best.raw,
      description: describePlay(best.raw),
      best,
      lowest,
      prices,
      diff,
      edgePct,
      score:
        diff +
        edgePct * 25 +
        prices.length * 75 +
        (best.deeplink ? 200 : 0) +
        (isLive ? 50 : 0),
    });
  }

  return alerts.sort((a, b) => b.score - a.score);
}

module.exports = { compareRows };
