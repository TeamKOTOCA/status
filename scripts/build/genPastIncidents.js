import fs from 'fs/promises';
import path from 'path';

const INCIDENTS_DIR = path.resolve('./incidents');

function parseFrontMatter(md) {
    const match = md.match(/^---\s*([\s\S]*?)---/);
    if (!match) return {};
    const yaml = match[1];
    const obj = {};
    yaml.split(/\r?\n/).forEach(line => {
        const [key, ...rest] = line.split(':');
        if (!key) return;
        obj[key.trim()] = rest.join(':').trim().replace(/^"|"$/g, '');
    });
    return obj;
}

function getClassFromTag(tag) {
    switch(tag) {
        case 'error': return 'past_incident_error';
        case 'warn': return 'past_incident_warn';
        case 'info': return 'past_incident_info';
        default: return 'past_incident_info';
    }
}

export async function generatePastIncidentsHTML() {
    const files = await fs.readdir(INCIDENTS_DIR);
    const incidents = [];

    for (const file of files) {
        if (!file.endsWith('.md')) continue;
        const content = await fs.readFile(path.join(INCIDENTS_DIR, file), 'utf-8');
        const fm = parseFrontMatter(content);

        if (!fm.start_date) continue;

        const date = new Date(fm.start_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}`;
        
        const now = new Date();
        if (fm.start_date && fm.end_date && new Date(fm.end_date) < now) {
            incidents.push({
                monthKey,
                timestamp: file.replace('.md',''),
                title: fm.title || '無題',
                description: fm.description || '',
                tag: fm.tags || 'info'
            });
        }
    }

    // 月ごとにまとめる
    const grouped = incidents.reduce((acc, inc) => {
        if (!acc[inc.monthKey]) acc[inc.monthKey] = [];
        acc[inc.monthKey].push(inc);
        return acc;
    }, {});

    // HTML 作成
    let html = '';
    const months = Object.keys(grouped).sort((a,b)=>a.localeCompare(b));

    for (const month of months) {
        html += `<div>\n<h2>${month.replace(/-/,'年')}月</h2>\n`;
        grouped[month].sort((a,b)=>a.timestamp.localeCompare(b.timestamp));
        for (const inc of grouped[month]) {
            const cls = getClassFromTag(inc.tag);
            html += `<a href="./incidents/${inc.timestamp}.html" class="${cls}">\n`;
            html += `  <h3>${inc.title}</h3>\n`;
            html += `  <p>${inc.description}</p>\n`;
            html += `</a>\n`;
        }
        html += `</div>\n`;
    }

    return html || `<p>過去に障害がありません</p>`;
}
