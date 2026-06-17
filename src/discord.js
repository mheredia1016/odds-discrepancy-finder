import { config } from './config.js';
import { formatAmerican, formatTime, marketLabel } from './normalize.js';

export async function postAlert(alert) {
  if (!config.discordWebhookUrl) {
    console.log('No DISCORD_WEBHOOK_URL set. Alert:', alertSummary(alert));
    return;
  }

  const payload = {
    embeds: [{
      title: `🚨 Soccer Odds Difference +${alert.diff}`,
      description: `**${alert.awayTeam} @ ${alert.homeTeam}**\n${formatTime(alert.commenceTime)}`,
      color: 15158332,
      fields: [
        { name: 'Player', value: alert.player || 'Unknown', inline: true },
        { name: 'Market', value: marketLabel(alert.marketKey), inline: true },
        { name: 'Line', value: alert.line || 'N/A', inline: true },
        { name: 'Best', value: `**${alert.best.bookTitle} ${formatAmerican(alert.best.price)}**`, inline: true },
        { name: 'Lowest', value: `${alert.lowest.bookTitle} ${formatAmerican(alert.lowest.price)}`, inline: true },
        { name: 'Difference', value: `+${alert.diff}`, inline: true },
        { name: 'Books', value: alert.prices.map(p => `• ${p.bookTitle}: ${formatAmerican(p.price)}`).join('\n').slice(0, 1000) }
      ],
      timestamp: new Date().toISOString()
    }]
  };

  if (config.dryRun) {
    console.log('DRY_RUN alert:', JSON.stringify(payload, null, 2));
    return;
  }

  const res = await fetch(config.discordWebhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Discord ${res.status}: ${text}`);
  }
}

export function alertSummary(alert) {
  return `${alert.awayTeam} @ ${alert.homeTeam} | ${alert.player} | ${marketLabel(alert.marketKey)} | ${alert.line} | ${alert.best.bookTitle} ${formatAmerican(alert.best.price)} vs ${alert.lowest.bookTitle} ${formatAmerican(alert.lowest.price)} (+${alert.diff})`;
}
