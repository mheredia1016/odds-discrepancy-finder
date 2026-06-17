import { scrapeGenericBook } from './genericTextScraper.js';

export const startUrls = {
  draftkings: 'https://sportsbook.draftkings.com/leagues/soccer',
  fanatics: 'https://sportsbook.fanatics.com/sports/soccer',
  fanduel: 'https://sportsbook.fanduel.com/navigation/soccer',
  betmgm: 'https://sports.betmgm.com/en/sports/soccer',
  caesars: 'https://www.caesars.com/sportsbook-and-casino/sport/soccer',
  espnbet: 'https://espnbet.com/sport/soccer'
};

const EVENT_WORDS = [
  'world cup', 'international', 'club world cup', 'epl', 'premier league',
  'champions league', 'mls', 'soccer'
];

const PROP_WORDS = [
  'player props', 'player', 'shots', 'shots on target', 'offsides',
  'assists', 'passes', 'tackles'
];

async function clickIfVisible(page, texts, timeout = 1500) {
  for (const text of texts) {
    const loc = page.getByText(new RegExp(text, 'i')).first();
    try {
      if (await loc.isVisible({ timeout })) {
        await loc.click({ timeout: 3000 });
        await page.waitForTimeout(2000);
        return true;
      }
    } catch {}
  }
  return false;
}

async function acceptPopups(page) {
  await clickIfVisible(page, [
    'accept all', 'accept', 'agree', 'got it', 'continue', 'ok', 'i agree',
    'confirm', 'yes', 'close', 'not now'
  ], 700);
}

async function collectEventLinks(page, bookId, maxEvents) {
  const links = await page.locator('a[href]').evaluateAll((els, words) => {
    return els
      .map(a => ({ href: a.href, text: (a.innerText || a.textContent || '').replace(/\s+/g, ' ').trim() }))
      .filter(x => x.href && x.text && words.some(w => x.text.toLowerCase().includes(w)))
      .filter(x => /\b(v|vs|@)\b/i.test(x.text) || x.href.toLowerCase().includes('event') || x.href.toLowerCase().includes('game'));
  }, EVENT_WORDS).catch(() => []);

  const uniq = [];
  const seen = new Set();
  for (const l of links) {
    const key = l.href.split('?')[0];
    if (seen.has(key)) continue;
    seen.add(key);
    uniq.push(l.href);
    if (uniq.length >= maxEvents) break;
  }

  // DraftKings/FanDuel often expose event URLs without useful anchor text.
  if (!uniq.length) {
    const all = await page.locator('a[href]').evaluateAll((els) =>
      els.map(a => a.href).filter(Boolean)
    ).catch(() => []);
    for (const href of all) {
      const low = href.toLowerCase();
      const looksEvent = low.includes('/event/') || low.includes('/game/') || low.includes('/events/') || low.includes('/fixture/');
      const looksSoccer = low.includes('soccer') || low.includes('football');
      if (!looksEvent || !looksSoccer) continue;
      const key = href.split('?')[0];
      if (seen.has(key)) continue;
      seen.add(key);
      uniq.push(href);
      if (uniq.length >= maxEvents) break;
    }
  }

  return uniq;
}

async function openPlayerProps(page) {
  for (let i = 0; i < 4; i++) {
    await clickIfVisible(page, PROP_WORDS, 1000);
    await page.waitForTimeout(1200);
  }

  // Scroll through the event page. Some books lazy-load prop groups as they enter view.
  for (let i = 0; i < 10; i++) {
    await page.mouse.wheel(0, 900);
    await page.waitForTimeout(350);
  }
}

export async function scrapeAutoBook({ page, bookId, bookName, debug = false, maxEventsPerBook = 8 }) {
  const start = startUrls[bookId];
  if (!start) return [];

  console.log(`${bookName}: auto opening ${start}`);
  await page.goto(start, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(6000);
  await acceptPopups(page);

  // Try to land on soccer/event listings.
  await clickIfVisible(page, ['soccer', 'football'], 1200);
  await page.waitForTimeout(3000);

  const eventLinks = await collectEventLinks(page, bookId, maxEventsPerBook);
  if (debug) console.log(`${bookName}: event links`, eventLinks);

  const urlsToScrape = eventLinks.length ? eventLinks : [page.url()];
  const all = [];

  for (const url of urlsToScrape) {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 }).catch(() => null);
    await page.waitForTimeout(5000);
    await acceptPopups(page);
    await openPlayerProps(page);
    const props = await scrapeGenericBook({ page, bookId, bookName, urls: [page.url()], debug, alreadyOpen: true });
    all.push(...props);
  }

  return all;
}
