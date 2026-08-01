// Converts an ISO 3166-1 alpha-2 country code (e.g. the x-vercel-ip-country
// header) to its flag emoji via regional indicator symbols — no lookup
// table needed, every letter A-Z has a direct Unicode offset.
function countryFlagEmoji(countryCode: string): string {
  if (!/^[A-Za-z]{2}$/.test(countryCode)) return "🌍";
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

// Fire-and-forget Slack Incoming Webhook notifications. Silently no-ops if
// SLACK_SIGNUP_WEBHOOK_URL isn't configured, and never throws — a Slack
// outage or missing webhook must never break the actual signup/auth flow
// this is called from.
export async function notifySignup({
  email,
  method,
  country,
  source,
  totalUsers,
}: {
  email: string;
  method: string;
  country: string | null;
  source: string;
  totalUsers: number | null;
}): Promise<void> {
  const webhookUrl = process.env.SLACK_SIGNUP_WEBHOOK_URL;
  if (!webhookUrl) return;

  const time = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" });

  const payload = {
    text: `🎉 New AutoReels Signup: ${email}`, // push notification fallback
    blocks: [
      {
        type: "section",
        text: { type: "mrkdwn", text: "🎉 *New AutoReels Signup*" },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Email:*\n${email}` },
          {
            type: "mrkdwn",
            text: `*Country:*\n${country ? `${countryFlagEmoji(country)} ${country}` : "🌍 Unknown"}`,
          },
          { type: "mrkdwn", text: `*Method:*\n${method || "unknown"}` },
          { type: "mrkdwn", text: `*Time:*\n${time} IST` },
          { type: "mrkdwn", text: `*Source:*\n\`${source || "direct"}\`` },
          { type: "mrkdwn", text: `*Total users:*\n${totalUsers ?? "—"}` },
        ],
      },
    ],
  };

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error("[slack] signup notification failed:", err);
  }
}
