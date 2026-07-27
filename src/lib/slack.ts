// Fire-and-forget Slack Incoming Webhook notifications. Silently no-ops if
// SLACK_SIGNUP_WEBHOOK_URL isn't configured, and never throws — a Slack
// outage or missing webhook must never break the actual signup/auth flow
// this is called from.
export async function notifySlackSignup({
  email,
  source,
  referred,
}: {
  email: string;
  source: string;
  referred: boolean;
}): Promise<void> {
  const webhookUrl = process.env.SLACK_SIGNUP_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text:
          `🎉 New signup: *${email}*\n` +
          `Source: \`${source}\`${referred ? " · via referral 🔗" : ""}`,
      }),
    });
  } catch (err) {
    console.error("[slack] signup notification failed:", err);
  }
}
