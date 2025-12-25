import fs from "fs";
import path from "path";

import { sendDiscord } from "./sendto/discord.js";
import { sendSlack } from "./sendto/slack.js";
import { sendNormal } from "./sendto/nomal.js";

const RESULT_DIR = path.resolve(process.cwd(), "result");

export function sendWebhook() {
    const [prev, curr] = loadLatestResults();
    if (!prev || !curr) return;

    const events = extractEvents(prev, curr);

    if(events.length == 0) return;

    console.log(events);
    const discordWebhook = process.env.DISCORD_WEBHOOK_URL;
    if (discordWebhook) {
        sendDiscord(events, discordWebhook);
    }
    const slackWebhook = process.env.SLACK_WEBHOOK_URL;
    if (slackWebhook) {
        sendSlack(events, slackWebhook);
    }
    const nomalWebhooks = process.env.NOMAL_WEBHOOK_URL;
    if (nomalWebhooks) {
        nomalWebhooks.split(",").forEach(url => {
            sendNormal(events, url.trim());
        });
    }


    console.log("Webhook events extracted:", events.length);
}

/**
 * 最新と一個前の result を読む
 */
function loadLatestResults() {
    const files = fs.readdirSync(RESULT_DIR)
        .filter(f => f.endsWith(".json"))
        .sort(); // ISO8601なので文字列ソートでOK

    if (files.length < 2) return [];

    const prevFile = files[files.length - 2];
    const currFile = files[files.length - 1];

    const prev = JSON.parse(
        fs.readFileSync(path.join(RESULT_DIR, prevFile), "utf-8")
    );
    const curr = JSON.parse(
        fs.readFileSync(path.join(RESULT_DIR, currFile), "utf-8")
    );

    return [prev, curr];
}

/**
 * 状態変化を抽出
 */
function extractEvents(prev, curr) {
    const events = [];

    for (const currItem of curr.results) {
        const prevItem = prev.results.find(
        p => p.label === currItem.label
        );

        const prevStatus = normalizeStatus(prevItem);
        const currStatus = normalizeStatus(currItem);

        if (prevStatus !== currStatus) {
        events.push({
            type: currStatus === "down" ? "service_down" : "service_up",
            label: currItem.label,
            category: currItem.category,
            prevStatus,
            currentStatus: currStatus,
            detectedAt: curr.generatedAt
        });
        }
    }

    return events;
}

/**
 * status を up / down に正規化
 */
function normalizeStatus(item) {
    if (!item) return "unknown";

    // provider 系
    if (item.results?.status?.normalizedStatus) {
        // ok が true かつ normalizedStatus が "operational" の場合のみ "up"
        return (item.results.ok && item.results.status.normalizedStatus === "operational")
            ? "up"
            : "down";
    }

    // self / http 系
    const r = item.results;
    if (!r) return "down";

    if (r.http && r.http !== 200) return "down";
    if (r.head && r.head.ok === false) return "down";
    if (r.restime && r.restime.ok === false) return "down";
    if (r.dns && r.dns.ok === false) return "down";

    return "up";
}
