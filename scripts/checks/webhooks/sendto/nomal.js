export async function sendNormal(events, webhookUrl) {
    if (!events.length) return;
    if (!webhookUrl) {
        console.warn("Webhook URL not set. Skipping send.");
        return;
    }

    const payload = {
        source: "GITUptimeHub",
        generatedAt: new Date().toISOString(),
        events
    };

    console.log("Prepared generic webhook payload:", JSON.stringify(payload, null, 2));

    try {
        const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
        });

        if (!res.ok) {
        const text = await res.text();
        console.error(`Failed to send generic webhook: ${res.status} ${res.statusText}`, text);
        } else {
        console.log(`Generic webhook sent. ${events.length} event(s).`);
        }
    } catch (e) {
        console.error("Error sending generic webhook:", e);
  }
}
