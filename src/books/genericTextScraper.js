import { parseAmericanOdds } from '../lib/odds.js';

const TARGET_MARKETS = [
  'offsides',
  'offside',
  'shots on target',
  'shots',
  'assists',
  'passes',
  'tackles'
];

function clean(s) {
  return String(s || '').replace(/\s+/g, ' ').trim();
}

function marketFromText(text) {
  const low = text.toLowerCase();
  return TARGET_MARKETS.find(m => low.includes(m)) || null;
}

function extractLine(text) {
  const plus = text.match(/(\d+(?:\.5)?\+|over\s*\d+(?:\.5)?|under\s*\d+(?:\.5)?)/i);
  if (plus) return clean(plus[1]).replace(/^over\s*/i, 'Over ').replace(/^under\s*/i, 'Under ');
  const number = text.match(/\b([0-9]+(?:\.5)?)\b/);
  return number ? number[1] : '';
}

function likelyPlayer(text) {
  const cleaned = clean(text)
    .replace(/[+-]\d{2,5}/g, '')
    .replace(/\b(over|under|yes|no|to record|player|total|match|game|shots?|on target|offsides?|assists?|passes?|tackles?)\b/gi, '')
    .replace(/\b\d+(?:\.5)?\+?\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const words = cleaned.split(' ').filter(Boolean);
  if (words.length >= 2) return words.slice(0, 4).join(' ');
  return cleaned;
}

// This intentionally avoids bypassing login/geolocation. It only reads public page text.
export async function scrapeGenericBook({ page, bookId, bookName, urls, debug = false, alreadyOpen = false }) {
  const results = [];

  for (const url of urls) {
    if (!alreadyOpen) {
      console.log(`${bookName}: opening ${url}`);
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(8000);
    }

    // Scroll a bit so lazy-loaded markets render.
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 900);
      await page.waitForTimeout(500);
    }

    const title = clean(await page.title().catch(() => ''));
    const visibleText = await page.locator('body').innerText({ timeout: 10000 }).catch(() => '');
    const lines = visibleText.split('\n').map(clean).filter(Boolean);

    if (debug) {
      console.log(`${bookName}: page title: ${title}`);
      console.log(`${bookName}: text lines: ${lines.length}`);
      console.log(lines.slice(0, 80).join('\n'));
    }

    // Look around every odds-looking token and infer nearby player/market/line.
    for (let i = 0; i < lines.length; i++) {
      const odds = parseAmericanOdds(lines[i]);
      if (odds === null) continue;

      const windowText = lines.slice(Math.max(0, i - 6), Math.min(lines.length, i + 4)).join(' | ');
      const market = marketFromText(windowText);
      if (!market) continue;

      const player = likelyPlayer(windowText);
      if (!player || player.length < 3) continue;

      results.push({
        bookId,
        bookName,
        event: title || url,
        player,
        market,
        line: extractLine(windowText),
        odds,
        url
      });
    }
  }

  // Deduplicate noisy page text.
  const seen = new Set();
  return results.filter(r => {
    const key = `${r.bookId}|${r.event}|${r.player}|${r.market}|${r.line}|${r.odds}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
