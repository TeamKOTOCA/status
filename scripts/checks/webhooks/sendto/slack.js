import fetch from "node-fetch";

export async function sendSlack(events, webhookUrl) {
    if (!events.length || !webhookUrl) return;

    const blocks = [
        {
        type: "section",
        text: {
            type: "mrkdwn",
            text: "*GITUptimeHub Service Status*"
        }
        },
        { type: "divider" }
    ];

    events.forEach(ev => {
        blocks.push({
        type: "section",
        fields: [
            {
            type: "mrkdwn",
            text: `${ev.currentStatus === "up" ? "🟢" : "🔴"} *${ev.label}*\nStatus: ${ev.currentStatus}\nPrev: ${ev.prevStatus}`
            },
            {
            type: "mrkdwn",
            text: `Detected at: ${ev.detectedAt}`
            }
        ]
        });
        blocks.push({ type: "divider" });
    });

    const payload = { blocks };

    try {
        const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
        });

        if (!res.ok) {
        const text = await res.text();
        console.error(`Failed to send Slack webhook: ${res.status} ${res.statusText}`, text);
        } else {
        console.log(`Slack webhook sent. ${events.length} event(s).`);
        }
    } catch (e) {
        console.error("Error sending Slack webhook:", e);
    }
}
