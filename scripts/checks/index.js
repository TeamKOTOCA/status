import fs from "fs/promises";
import path from "path";

import * as httpdChecks from "./modules/http.js";
import * as headChecks from "./modules/head.js";
import * as tcpChecks from "./modules/tcp.js";
import * as dnsChecks from "./modules/dns.js";
import * as restimeChecks from "./modules/restime.js";
import { getServiceStatus } from "./modules/extra/extra.js";

async function checkSelf(target) {
    const { meta } = target;
    const results = {};
    let failed = false;

    // HTTP(GET)
    if (meta.http && meta.url) {
        try {
        const r = await httpdChecks.check_http(meta.url);
        results.http = r;
        if (!r.ok) failed = true;
        } catch (e) {
        results.http = { ok: false, error: e.message };
        failed = true;
        }
    }

    // HEAD
    if (meta.head && meta.url) {
        try {
        const r = await headChecks.check_head(meta.url);
        results.head = r;
        if (!r.ok) failed = true;
        } catch (e) {
        results.head = { ok: false, error: e.message };
        failed = true;
        }
    }

    // Response Time
    if (meta.restime && meta.url) {
        try {
        const r = await restimeChecks.check_restime(meta.url);
        results.restime = r;
        if (!r.ok) failed = true;
        } catch (e) {
        results.restime = { ok: false, error: e.message };
        failed = true;
        }
    }

    // DNS
    if (meta.dns && meta.host) {
        try {
        const r = await dnsChecks.check_dns(meta.host);
        results.dns = r;
        if (!r.ok) failed = true;
        } catch (e) {
        results.dns = { ok: false, error: e.message };
        failed = true;
        }
    }

    // TCP
    if (meta.tcp_port && meta.host) {

        try {
        const r = await tcpChecks.check_tcp(meta.host, meta.tcp_port);
        results.tcp = r;
        if (!r.ok) failed = true;
        } catch (e) {
            results.tcp = { ok: false, error: e.message };
            failed = true;
        }
    }

    return { results, failed };
}

async function checkExtra(target) {
    const { meta } = target;
    try {
        const r = await getServiceStatus({
        provider: meta.provider,
        service: meta.service
        });
        return { results: r};
    } catch (e) {
        return { results: { ok: false, error: e.message }, failed: true };
    }
}

async function main() {
    const raw = await fs.readFile("./setting.json", "utf-8");
    const setting = JSON.parse(raw);

    let failed = false;
    const newResults = [];

    for (const target of setting.targets) {
        console.log(`\n=== ${target.label} ===`);

        let checkResult;
        if (target.type === "self") {
            checkResult = await checkSelf(target);
        } else if (target.type === "provider") {
            checkResult = await checkExtra(target);
        } else {
            console.warn("Unknown target type:", target.type);
            continue;
        }

        newResults.push({
        label: target.label,
        category: target.category,
        type: target.type,
        results: checkResult.results,
        time: new Date().toISOString()
        });

        if (checkResult.failed) failed = true;
    }

    const distDir = path.resolve("./result");
    await fs.mkdir(distDir, { recursive: true });

    const timestamp = new Date().toISOString();
    const outFile = path.join(distDir, `${timestamp}.json`);

    await fs.writeFile(
        outFile,
        JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                results: newResults,
            },
            null,
            2
        )
    );

    console.log(`Result written to ${outFile}`);

    const files = (await fs.readdir(distDir))
        .filter(f => f.endsWith(".json"))
        .sort();

    const MAX_FILES = 50;
    if (files.length > MAX_FILES) {
        const removeTargets = files.slice(0, files.length - MAX_FILES);
        for (const file of removeTargets) {
            await fs.unlink(path.join(distDir, file));
            console.log(`Removed old result: ${file}`);
        }
    }

    if (failed) {
        console.warn("Some checks failed, but JSON was still generated.");
    }

}

main().catch((err) => {
    console.error("fatal:", err);
    process.exit(1);
});
