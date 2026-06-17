# Soccer Props Odds Difference Bot

Playwright scanner for soccer player props. It compares configured sportsbooks and posts to Discord when the best American odds are at least `MIN_ODDS_DIFF` higher than the lowest book.

Example: Fanatics +135 vs DraftKings +1600 = +1465 alert.

## Important

This does **not** bypass sportsbook login, geolocation, bot protection, or terms. It only reads pages that your browser/server can load. If a book blocks Railway, use residential proxies or run it on a machine that can access the pages normally.

## What Changed

This version no longer requires direct event URLs. With `AUTO_NAVIGATE=true`, it starts from each book's soccer page, tries to open soccer events/player props, scrolls the prop markets, parses visible text, then compares books.

Start books recommended:

```env
BOOKS=draftkings,fanatics,fanduel
```

Add BetMGM/Caesars/ESPN BET later once the first three parse props.

## Railway Variables

```env
DISCORD_WEBHOOK_URL=your_new_webhook
MIN_ODDS_DIFF=300
SCAN_INTERVAL_MINUTES=5
HEADLESS=true
DEBUG_SCRAPE=false
AUTO_NAVIGATE=true
MAX_EVENTS_PER_BOOK=8
BOOKS=draftkings,fanatics,fanduel
TIMEZONE_ID=America/Chicago
```

## Proxy Variables

One proxy:

```env
PROXY_SERVER=http://user:pass@host:port
```

Multiple proxies, rotated by book:

```env
PROXY_SERVERS=http://user:pass@host1:port,http://user:pass@host2:port,http://user:pass@host3:port
```

If your proxy provider uses separate auth fields:

```env
PROXY_SERVER=http://host:port
PROXY_USERNAME=username
PROXY_PASSWORD=password
```

## Optional Direct URL Overrides

If auto navigation fails for a book, paste direct soccer/event/player-prop URLs here. If a URL variable is set, the bot uses those URLs instead of auto navigation for that book.

```env
DRAFTKINGS_URLS=https://...
FANATICS_URLS=https://...
FANDUEL_URLS=https://...
BETMGM_URLS=https://...
CAESARS_URLS=https://...
ESPNBET_URLS=https://...
```

Multiple URLs can be comma-separated.

## Local Test

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run scan
```

Debug extraction:

```bash
DEBUG_SCRAPE=true npm run scan
```

Look for:

```txt
book: event links [...]
book: parsed X props
```

If a book parses `0 props`, the site either blocked the browser, did not expose text in the DOM, or the page layout needs a book-specific parser.

## Deploy on GitHub + Railway

1. Upload this folder to a new GitHub repo.
2. Create a Railway project from that repo.
3. Add the Railway variables above.
4. Add your Discord webhook in Railway only.
5. Deploy.
6. Watch logs for parsed props.
