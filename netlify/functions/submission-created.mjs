// Runs automatically on every verified Netlify form submission.
// Posts quiz results to Slack via the incoming webhook stored in the
// SLACK_WEBHOOK_URL environment variable (Netlify → Environment variables).
export const handler = async (event) => {
  const { payload } = JSON.parse(event.body || '{}');
  if (!payload || payload.form_name !== 'quiz-results') return { statusCode: 200 };

  const webhook = process.env.SLACK_WEBHOOK_URL;
  if (!webhook) {
    console.log('SLACK_WEBHOOK_URL is not set — skipping Slack notification');
    return { statusCode: 200 };
  }

  const d = payload.data || {};
  const passed = d.result === 'Passed';
  const lines = [
    `${passed ? '✅' : '🔁'} *${d.name || 'Someone'}* ${passed ? 'passed' : 'didn’t pass'} *${d.quiz || 'a quiz'}* — ${d.score || '?'} (${d.percent || '?'})`
  ];
  if (!passed && d.missed && d.missed !== 'None') {
    const missed = d.missed.split(' | ');
    lines.push(`Missed: ${missed.slice(0, 3).map(q => `“${q}”`).join(', ')}${missed.length > 3 ? ` +${missed.length - 3} more` : ''}`);
  }

  const res = await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: lines.join('\n') })
  });
  if (!res.ok) console.log('Slack webhook failed:', res.status, await res.text());
  return { statusCode: 200 };
};
