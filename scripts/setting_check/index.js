import fs from 'fs/promises';
import path from 'path';

const SETTING_PATH = path.resolve('./setting.json');

function assert(cond, msg) {
    if (!cond) throw new Error(msg);
}

function isString(v) {
    return typeof v === 'string' && v.length > 0;
}

function isBoolean(v) {
    return typeof v === 'boolean';
}

function isURL(v) {
    return typeof v === 'string' && /^https?:\/\//.test(v);
}

function warn(msg) {
    console.warn('[WARN]', msg);
}

async function validateSetting() {
    const raw = await fs.readFile(SETTING_PATH, 'utf-8');
    const json = JSON.parse(raw);

    /* ===== root ===== */
    assert(json.meta, 'meta が存在しません');
    assert(Array.isArray(json.categories), 'categories は配列である必要があります');
    assert(Array.isArray(json.targets), 'targets は配列である必要があります');

    /* ===== meta ===== */
    const meta = json.meta;
    assert(isString(meta.title), 'meta.title は string 必須');
    assert(isURL(meta.logo), 'meta.logo は URL 必須');
    assert(isURL(meta.favicon), 'meta.favicon は URL 必須');
    assert(['dark', 'light'].includes(meta.theme), 'meta.theme は dark | light');

    if (meta.footer_links) {
        assert(Array.isArray(meta.footer_links), 'footer_links は配列');
        meta.footer_links.forEach((l, i) => {
            assert(isString(l.label), `footer_links[${i}].label 不正`);
            assert(isString(l.url), `footer_links[${i}].url 不正`);
        });
    }

    /* ===== categories ===== */
    const categoryIds = new Set();
    json.categories.forEach((c, i) => {
        assert(isString(c.id), `categories[${i}].id 不正`);
        assert(isString(c.label), `categories[${i}].label 不正`);
        assert(!categoryIds.has(c.id), `category id 重複: ${c.id}`);
        categoryIds.add(c.id);
    });

    /* ===== targets ===== */
    const labelPerCategory = new Map();

    json.targets.forEach((t, i) => {
        assert(isString(t.label), `targets[${i}].label 不正`);
        assert(isString(t.category), `targets[${i}].category 不正`);
        assert(categoryIds.has(t.category), `targets[${i}] category 未定義: ${t.category}`);
        assert(['self', 'provider'].includes(t.type), `targets[${i}].type 不正`);
        assert(t.meta && typeof t.meta === 'object', `targets[${i}].meta 不正`);

        /* label 重複（警告） */
        const key = t.category;
        if (!labelPerCategory.has(key)) labelPerCategory.set(key, new Set());
        const set = labelPerCategory.get(key);
        if (set.has(t.label)) {
            warn(`category "${key}" 内で label 重複: ${t.label}`);
        }
        set.add(t.label);

        /* ===== type別 meta ===== */
        if (t.type === 'self') {
            const m = t.meta;

            assert(isURL(m.url), `targets[${i}].meta.url 不正`);
            assert(isString(m.host), `targets[${i}].meta.host 不正`);

            ['http', 'head', 'restime', 'dns', 'ping'].forEach(k => {
                if (k in m) assert(isBoolean(m[k]), `targets[${i}].meta.${k} は boolean`);
            });

            if (m.tcp) {
                assert(
                    Number.isInteger(m.tcp.port) &&
                    m.tcp.port >= 1 &&
                    m.tcp.port <= 65535,
                    `targets[${i}].meta.tcp.port 範囲外`
                );
            }

        } else if (t.type === 'provider') {
            const m = t.meta;
            assert(isString(m.provider), `targets[${i}].meta.provider 不正`);
            assert(isString(m.service), `targets[${i}].meta.service 不正`);

            const extraKeys = Object.keys(m).filter(k => !['provider', 'service'].includes(k));
            if (extraKeys.length > 0) {
                warn(`provider meta に不要キー: ${extraKeys.join(', ')}`);
            }
        }
    });

    console.log('✔ setting.json validation passed');
}

validateSetting().catch(err => {
    console.error('✖ setting.json validation failed');
    console.error(err.message);
    process.exit(1);
});
