# The Odds API Soccer Difference Bot

Compares soccer odds across books using The Odds API and posts Discord alerts when one book is at least `MIN_ODDS_DIFF` better than the lowest book.

This version uses event-level odds, which is required for soccer player props.

## Railway Variables

```env
ODDS_API_KEY=your_key
DISCORD_WEBHOOK_URL=your_webhook
SPORT_KEYS=soccer_fifa_world_cup
REGIONS=us
BOOKMAKERS=draftkings,fanduel,betmgm,betrivers,fanatics
MARKETS=player_shots,player_shots_on_target,player_goal_scorer_anytime,player_goals_alternate,player_assists,player_tackles_alternate,player_fouls,player_to_receive_card
MIN_ODDS_DIFF=300
MAX_ODDS=25000
MIN_BOOK_COUNT=2
EVENT_MARKET_CHUNK_SIZE=1
SCAN_INTERVAL_MINUTES=5
```

## Notes

- Player name comes from `outcome.description` when available.
- `MAX_ODDS` prevents junk alerts like +60000.
- `MIN_BOOK_COUNT=2` requires at least two books on the exact same player/market/line.
- If a market returns INVALID_MARKET, remove it from `MARKETS` or keep `EVENT_MARKET_CHUNK_SIZE=1` so only that market fails.
