const BASE_URL = 'https://api.sportsgameodds.com/v2';

async function sgoGet(path, params, apiKey) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params || {})) {
    if (Array.isArray(value)) {
      if (value.length) url.searchParams.set(key, value.join(','));
    } else if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  const res = await fetch(url, {
    headers: {
      'X-Api-Key': apiKey,
      'Accept': 'application/json',
    },
  });

  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }

  if (!res.ok || json.success === false) {
    throw new Error(`SportsGameOdds ${res.status}: ${JSON.stringify(json).slice(0, 800)}`);
  }

  return json.data || json;
}

async function fetchLeagueEvents(leagueID, config) {
  const params = {
    leagueID,
    oddsAvailable: true,
    limit: config.eventLimit || 10,
    includeAltLines: config.includeAltLines,
    includeLive: config.includeLive,
    includeOdds: true,
    includeDeeplinks: config.includeDeeplinks,
    bookmakerID: config.bookmakerIds,
  };

  return sgoGet('/events', params, config.apiKey);
}

module.exports = { fetchLeagueEvents };
