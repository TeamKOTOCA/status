export const PROVIDERS = {
    github: async () => import("./extras/atlassian.js"),
    render: async () => import("./extras/atlassian.js"),
    cloudflare: async () => import("./extras/atlassian.js"),
    dropbox: async () => import("./extras/atlassian.js"),
    notion: async () => import("./extras/atlassian.js"),
    openai: async () => import("./extras/atlassian.js"),
    discord: async () => import("./extras/atlassian.js"),
    x: async () => import("./extras/x.js"),
};


export async function getServiceStatus({ provider, service }) {
    try {
        const loader = PROVIDERS[provider];
        if (!loader) {
            throw new Error(`Unsupported provider: ${provider}`);
        }

        const mod = await loader();

        if (typeof mod.getStatus !== "function") {
            throw new Error(`Provider ${provider} has no getStatus()`);
        }

        const raw = await mod.getStatus(service, provider);
        console.log(raw);
        if(raw == null){
            return {
                ok: false,
                provider,
                status: "unknown",
            };
        }

        return {
            ok: true,
            provider,
            status: raw,
        };

    } catch (e) {
        return {
            ok: false,
            provider,
            status: "unknown",
            error: e.message,
        };
    }
}
