# SportsGameOdds Discrepancy Finder

Scans SportsGameOdds league-by-league, compares the same play across selected sportsbooks, and posts discrepancies to separate Discord channels for pregame and live.

## Required Railway Variables

```env
SPORTSGAMEODDS_API_KEY=your_sgo_key
PREGAME_WEBHOOK_URL=https://discord.com/api/webhooks/...
LIVE_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

## Recommended Variables

```env
LEAGUE_IDS=MLB,NBA,NFL,NHL,WNBA,UFC,EPL,MLS,INTERNATIONAL_SOCCER
BOOKMAKER_IDS=fanduel,draftkings,hardrockbet,thescorebet,fanatics,betmgm

MIN_ODDS_DIFF=500
LIVE_MIN_ODDS_DIFF=750
MAX_ODDS=10000
LIVE_MAX_ODDS=5000
MIN_BOOK_COUNT=2
LIVE_MIN_BOOK_COUNT=3

SCAN_INTERVAL_MINUTES=5
INCLUDE_LIVE=true
INCLUDE_ALT_LINES=true
INCLUDE_DEEPLINKS=true
TOP_PREGAME_ALERTS_PER_SCAN=20
TOP_LIVE_ALERTS_PER_SCAN=10
```

## How It Works

- Pregame alerts go to `PREGAME_WEBHOOK_URL`.
- Live alerts go to `LIVE_WEBHOOK_URL`.
- No role pings are included.
- Best sportsbook deeplink is included when SportsGameOdds returns one.
- Rookie plan is supported by scanning one `leagueID` at a time.

## Deploy

1. Upload/push this folder to GitHub.
2. Connect the repo to Railway.
3. Add the variables above.
4. Deploy.

## Notes

SportsGameOdds response shapes can vary by market. This bot uses flexible parsing for common `byBookmaker`, `odds`, and `markets` structures. If logs show events but `Total odds rows loaded: 0`, paste one full event object so the extractor can be adjusted to your plan's exact response shape.
