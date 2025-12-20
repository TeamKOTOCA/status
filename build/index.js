import fs from 'fs/promises';
import path from 'path';

// パス設定
const SRC_DIR = path.resolve('./src');
const DEST_DIR = path.resolve('./final_html');
const SETTING_PATH = path.resolve('./setting.json');
const RESULT_DIR = path.resolve('./result');

// /result から最新タイムスタンプを取得
async function getLastTime() {
    try {
        const files = await fs.readdir(RESULT_DIR);
        const jsonFiles = files.filter(f => f.endsWith('.json'));
        if (jsonFiles.length === 0) return '';

        const latestFile = jsonFiles
            .map(f => ({ file: f, time: new Date(f.replace('.json','')) }))
            .sort((a,b) => b.time - a.time)[0];

        return latestFile.time.toISOString();
    } catch (err) {
        console.error('Failed to get last time:', err);
        return '';
    }
}

async function copyAndReplace() {
    // 1. setting.json をロード
    const setting = JSON.parse(await fs.readFile(SETTING_PATH, 'utf-8'));
    const meta = setting.meta || {};

    // 2. 最新時間を追加
    meta.lasttime = await getLastTime();

    // 3. DEST_DIR を作成
    await fs.mkdir(DEST_DIR, { recursive: true });

    // 4. src のファイル一覧を取得
    const files = await fs.readdir(SRC_DIR);

    for (const file of files) {
        const srcPath = path.join(SRC_DIR, file);
        const destPath = path.join(DEST_DIR, file);

        const stat = await fs.stat(srcPath);
        if (stat.isFile() && file.endsWith('.html')) {
            // HTML ファイルの場合は置換しながらコピー
            let content = await fs.readFile(srcPath, 'utf-8');

            // {{xxx}} を meta.xxx に置換
            content = content.replaceAll(/\{\{(\w+)\}\}/g, (match, key) => {
                return meta[key] ?? match;
            });

            await fs.writeFile(destPath, content, 'utf-8');
            console.log(`Processed ${file}`);
        } else if (stat.isFile()) {
            // HTML 以外はそのままコピー
            await fs.copyFile(srcPath, destPath);
        }
        // ディレクトリは今は無視（必要なら再帰処理追加可能）
    }

    console.log('All files processed!');
}

copyAndReplace().catch(err => {
    console.error(err);
    process.exit(1);
});
