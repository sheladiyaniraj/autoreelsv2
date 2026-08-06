const ZEPTOMAIL_API_URL = "https://api.zeptomail.in/v1.1/email";

// Fire-and-forget welcome email via ZeptoMail. Silently no-ops if
// ZEPTOMAIL_TOKEN / ZEPTOMAIL_FROM_ADDRESS aren't configured, and never
// throws — an email-provider outage must never break the signup/auth flow
// this is called from.
export async function sendWelcomeEmail({
  email,
  name,
}: {
  email: string;
  name?: string | null;
}): Promise<void> {
  const token = process.env.ZEPTOMAIL_TOKEN;
  const fromAddress = process.env.ZEPTOMAIL_FROM_ADDRESS;
  if (!token || !fromAddress) return;

  const payload = {
    from: { address: fromAddress, name: "AutoReels" },
    to: [{ email_address: { address: email, name: name ?? email } }],
    subject: "Welcome to AutoReels",
    htmlbody: `<div><p>Hey${name ? ` ${name}` : ""},</p><p>Welcome to AutoReels — glad to have you on board. Jump into your dashboard to create your first faceless video.</p></div>`,
  };

  try {
    const res = await fetch(ZEPTOMAIL_API_URL, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: token,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error("[email] welcome email failed:", res.status, await res.text());
    }
  } catch (err) {
    console.error("[email] welcome email failed:", err);
  }
}
