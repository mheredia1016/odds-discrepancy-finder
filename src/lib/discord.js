export async function postDiscord(webhookUrl, alert) {
  if (!webhookUrl) {
    console.log('DISCORD_WEBHOOK_URL missing. Alert:', alert.title);
    return;
  }

  const body = {
    embeds: [
      {
        title: alert.title,
        description: alert.description,
        fields: alert.fields,
        timestamp: new Date().toISOString()
      }
    ]
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Discord webhook failed ${res.status}: ${text}`);
  }
}
