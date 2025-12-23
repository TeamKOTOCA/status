import fs from "fs";
import path from "path";

const RESULT_DIR = "./result";

function createHTML(result){
    if (result.length === 0) {
        console.log("最新2回のチェックに down サービスはありません");
        return "<div id='top_status' class='top_status_up'><p>全てのサービスが正常に稼働中です</p></div>";
    } else if(result.length <= 3){
        console.log("down サービスあり:");
        console.table(result);
        let html = "<div id='top_status' class='top_status_warn'><p>" + result.length + "個のサービスにエラーが発生しています</p></div>";
        return html;
    } else {
        console.log("down サービスあり:");
        console.table(result);
        let html = "<div id='top_status' class='top_status_down'><p>" + result.length + "個のサービスにエラーが発生しています</p></div>";
        return html;
    }
}

export function checkDeadServicesHTML() {
    if (!fs.existsSync(RESULT_DIR)) return [];

    const files = fs.readdirSync(RESULT_DIR)
        .filter(f => f.endsWith(".json"))
        .sort();

    if (files.length === 0) return [];

    // 最新2ファイルだけ
    const targetFiles = files.slice(-2);

    const downServices = [];

    for (const file of targetFiles) {
        const json = JSON.parse(fs.readFileSync(path.join(RESULT_DIR, file), "utf-8"));
        for (const item of json.results ?? []) {
            const label = item.label ?? "unknown";

            // normalizeStatus の簡易版
            let status = "operational";
            if (item.results?.status?.normalizedStatus) {
                status = item.results.status.normalizedStatus;
            } else if (item.results?.head?.ok === false) {
                status = "down";
            } else if (item.results?.head?.statusCode >= 500) {
                status = "degraded";
            }

            if (status === "down") {
                downServices.push({ file, label, status });
            }
        }
    }
    const html = createHTML(downServices);

    return html;
}