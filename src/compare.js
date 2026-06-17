import { oddsDifference, propKey } from './lib/odds.js';

export function findAlerts(props, minDiff) {
  const groups = new Map();
  for (const prop of props) {
    const key = propKey(prop);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(prop);
  }

  const alerts = [];
  for (const [key, rows] of groups.entries()) {
    const uniqueBooks = new Map();
    for (const row of rows) {
      const current = uniqueBooks.get(row.bookId);
      if (!current || row.odds > current.odds) uniqueBooks.set(row.bookId, row);
    }
    const books = [...uniqueBooks.values()];
    if (books.length < 2) continue;

    const sorted = books.sort((a, b) => a.odds - b.odds);
    const worst = sorted[0];
    const best = sorted[sorted.length - 1];
    const diff = oddsDifference(best, worst);
    if (diff >= minDiff) {
      alerts.push({ key, best, worst, diff, books: sorted });
    }
  }

  return alerts.sort((a, b) => b.diff - a.diff);
}

export function formatAlert(alert) {
  const { best, worst, diff, books } = alert;
  const title = `🚨 Soccer prop odds gap: +${diff}`;
  const description = `**${best.player}**\n${best.market}${best.line ? ` — ${best.line}` : ''}`;
  const oddsList = books
    .sort((a, b) => b.odds - a.odds)
    .map(b => `**${b.bookName}:** ${b.odds > 0 ? '+' : ''}${b.odds}`)
    .join('\n');

  return {
    title,
    description,
    fields: [
      { name: 'Best', value: `${best.bookName} ${best.odds > 0 ? '+' : ''}${best.odds}`, inline: true },
      { name: 'Lowest', value: `${worst.bookName} ${worst.odds > 0 ? '+' : ''}${worst.odds}`, inline: true },
      { name: 'All Books', value: oddsList || 'N/A', inline: false },
      { name: 'Source', value: best.url || 'N/A', inline: false }
    ]
  };
}
