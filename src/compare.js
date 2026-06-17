import { config } from './config.js';
import { outcomeLine, outcomeName } from './normalize.js';

export function compareEvent(eventOdds) {
  const groups = new Map();

  for (const book of eventOdds.bookmakers || []) {
    for (const market of book.markets || []) {
      for (const outcome of market.outcomes || []) {
        const price = Number(outcome.price);
        if (!Number.isFinite(price)) continue;
        if (Math.abs(price) > config.maxOdds) continue;

        const player = outcomeName(outcome);
        const line = outcomeLine(outcome);
        const key = [eventOdds.id, market.key, player, line].join('|');

        if (!groups.has(key)) {
          groups.set(key, {
            eventId: eventOdds.id,
            sportKey: eventOdds.sport_key,
            sportTitle: eventOdds.sport_title,
            homeTeam: eventOdds.home_team,
            awayTeam: eventOdds.away_team,
            commenceTime: eventOdds.commence_time,
            marketKey: market.key,
            player,
            line,
            prices: []
          });
        }

        groups.get(key).prices.push({
          bookKey: book.key,
          bookTitle: book.title || book.key,
          price,
          lastUpdate: market.last_update
        });
      }
    }
  }

  const alerts = [];

  for (const group of groups.values()) {
    const uniqueBooks = new Map();
    for (const p of group.prices) {
      const existing = uniqueBooks.get(p.bookKey);
      if (!existing || p.price > existing.price) uniqueBooks.set(p.bookKey, p);
    }
    group.prices = [...uniqueBooks.values()].sort((a, b) => b.price - a.price);
    if (group.prices.length < config.minBookCount) continue;

    const best = group.prices[0];
    const lowest = group.prices[group.prices.length - 1];
    const diff = best.price - lowest.price;
    if (diff < config.minOddsDiff) continue;

    alerts.push({ ...group, best, lowest, diff });
  }

  alerts.sort((a, b) => b.diff - a.diff);
  return alerts;
}
