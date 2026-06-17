export function parseAmericanOdds(value) {
  if (value === null || value === undefined) return null;
  const text = String(value).replace(/−/g, '-').trim();
  const m = text.match(/([+-]\d{2,5})/);
  if (!m) return null;
  return Number(m[1]);
}

export function normalizeName(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9.+ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function propKey(prop) {
  return [
    normalizeName(prop.event),
    normalizeName(prop.player),
    normalizeName(prop.market),
    normalizeName(prop.line)
  ].join('|');
}

export function oddsDifference(best, worst) {
  return Number(best.odds) - Number(worst.odds);
}
