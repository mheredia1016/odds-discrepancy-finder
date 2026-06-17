import { config } from './config.js';

const BASE = 'https://api.the-odds-api.com/v4';

async function getJson(url) {
  const res = await fetch(url);
  const text = await res.text();
  let json;
  try { json = text ? JSON.parse(text) : null; } catch { json = text; }

  const used = res.headers.get('x-requests-used');
  const remaining = res.headers.get('x-requests-remaining');
  if (used || remaining) console.log(`Odds API credits used=${used ?? '?'} remaining=${remaining ?? '?'}`);

  if (!res.ok) {
    const msg = typeof json === 'string' ? json : JSON.stringify(json);
    throw new Error(`The Odds API ${res.status}: ${msg}`);
  }
  return json;
}

export async function fetchEvents(sportKey) {
  const url = new URL(`${BASE}/sports/${sportKey}/events`);
  url.searchParams.set('apiKey', config.oddsApiKey);
  const events = await getJson(url);
  return Array.isArray(events) ? events.slice(0, config.maxEventsPerSport) : [];
}

export async function fetchEventOdds(sportKey, eventId, markets) {
  const url = new URL(`${BASE}/sports/${sportKey}/events/${eventId}/odds`);
  url.searchParams.set('apiKey', config.oddsApiKey);
  url.searchParams.set('regions', config.regions);
  url.searchParams.set('markets', markets.join(','));
  url.searchParams.set('oddsFormat', config.oddsFormat);
  if (config.bookmakers) url.searchParams.set('bookmakers', config.bookmakers);
  return getJson(url);
}
