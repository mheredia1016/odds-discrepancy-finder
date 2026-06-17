export function marketLabel(key) {
  const labels = {
    player_shots: 'Shots',
    player_shots_alternate: 'Shots',
    player_shots_on_target: 'Shots on Target',
    player_shots_on_target_alternate: 'Shots on Target',
    player_goal_scorer_anytime: 'Anytime Goal Scorer',
    player_goals: 'Goals',
    player_goals_alternate: 'Goals',
    player_assists: 'Assists',
    player_assists_alternate: 'Assists',
    player_tackles_alternate: 'Tackles',
    player_fouls: 'Fouls',
    player_to_receive_card: 'To Receive Card',
    player_to_receive_red_card: 'To Receive Red Card',
    h2h: 'Moneyline',
    h2h_3_way: '3-Way Moneyline',
    spreads: 'Spread',
    totals: 'Total',
    btts: 'Both Teams To Score',
    draw_no_bet: 'Draw No Bet'
  };
  return labels[key] || key.replaceAll('_', ' ');
}

export function outcomeName(outcome) {
  return outcome?.description || outcome?.name || 'Unknown';
}

export function outcomeLine(outcome) {
  const side = outcome?.name || '';
  const point = outcome?.point;
  if (point === undefined || point === null || point === '') return side;
  return `${side} ${point}`.trim();
}

export function formatAmerican(price) {
  const n = Number(price);
  if (!Number.isFinite(n)) return String(price);
  return n > 0 ? `+${n}` : `${n}`;
}

export function formatTime(iso) {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago',
      month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short'
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
