import { scrapeGenericBook } from './genericTextScraper.js';
import { scrapeAutoBook } from './autoNavigator.js';

export const bookDefs = {
  draftkings: { id: 'draftkings', name: 'DraftKings' },
  fanatics: { id: 'fanatics', name: 'Fanatics' },
  fanduel: { id: 'fanduel', name: 'FanDuel' },
  betmgm: { id: 'betmgm', name: 'BetMGM' },
  caesars: { id: 'caesars', name: 'Caesars' },
  espnbet: { id: 'espnbet', name: 'ESPN BET' }
};

export async function scrapeBook({ browser, bookId, urls, debug, autoNavigate, maxEventsPerBook, proxy }) {
  const def = bookDefs[bookId];
  if (!def) throw new Error(`Unknown book: ${bookId}`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 1200 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36',
    proxy,
    locale: 'en-US',
    timezoneId: process.env.TIMEZONE_ID || 'America/Chicago'
  });

  const page = await context.newPage();
  try {
    if (urls?.length) {
      return await scrapeGenericBook({ page, bookId: def.id, bookName: def.name, urls, debug });
    }
    if (autoNavigate) {
      return await scrapeAutoBook({ page, bookId: def.id, bookName: def.name, debug, maxEventsPerBook });
    }
    console.log(`${def.name}: no URLs configured and AUTO_NAVIGATE=false, skipping`);
    return [];
  } finally {
    await context.close().catch(() => {});
  }
}
