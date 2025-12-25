/**
 * Discord にイベントを送信する（Embeds版）
 * @param {Array} events - webhook で送信するイベント配列
 * @param {string} webhookUrl - Discord の Webhook URL
 */
export async function sendDiscord(events, webhookUrl) {
    if (!events.length) return;
    if (!webhookUrl) {
        console.warn("Discord webhook URL not set.");
        return;
    }

    // イベント配列を Embed オブジェクトの配列に変換
    const embeds = events.map(ev => formatEventToEmbed(ev));

    const payload = {
        username: "GITUptimeHub",
        embeds: embeds
    };

    try {
        const res = await fetch(webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const text = await res.text();
            console.error(`Failed to send Discord: ${res.status}`, text);
        }
    } catch (e) {
        console.error("Error sending Discord webhook:", e);
    }
}

/**
 * イベントを Discord Embed 形式に整形
 * @param {Object} ev
 */
function formatEventToEmbed(ev) {
    const isUp = ev.currentStatus === "up";
    
    return {
        title: `${isUp ? "🟢" : "🔴"} Status Changed: ${ev.label}`,
        color: isUp ? 0x2ECC71 : 0xE74C3C, // Upなら緑、Downなら赤
        fields: [
            {
                name: "Category",
                value: ev.category,
                inline: true
            },
            {
                name: "Transition",
                value: `\`${ev.prevStatus}\` → \`${ev.currentStatus}\``,
                inline: true
            },
            {
                name: "Detected At",
                value: ev.detectedAt,
                inline: false
            }
        ],
        footer: {
            text: "GITUptimeHub Monitoring"
        },
        timestamp: new Date().toISOString()
    };
}