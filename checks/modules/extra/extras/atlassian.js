const MAP = {
    github: "https://www.githubstatus.com/",
    render: "https://status.render.com/",
    cloudflare: "https://www.cloudflarestatus.com/",
    dropbox: "https://status.dropbox.com/",
    notion: "https://www.notion-status.com/",
    openai: "https://status.openai.com/",
    discord: "https://discordstatus.com/"
};

export async function getStatus(serviceName, provider) {
    try {
        if (!serviceName) return null;

        if (!provider) return null;
        const status_url = MAP[provider] + "api/v2/components.json";

        const res = await fetch(status_url);
        if (!res.ok) return null;

        const data = await res.json();
        if (!data?.components) return null;

        const comp = data.components.find(c =>
            c.name.toLowerCase().includes(serviceName.toLowerCase())
        );

        if (!comp) return null;

        const rawStatus = comp.status;
        let normalizedStatus = "unknown";

        switch (rawStatus.toLowerCase()) {
            case "operational":
                normalizedStatus = "operational";
                break;
            case "degraded_performance":
            case "partial_outage":
                normalizedStatus = "degraded";
                break;
            case "major_outage":
                normalizedStatus = "down";
                break;
        }

        return {
            name: comp.name,
            normalizedStatus
        };
    } catch (err) {
        return null;
    }
}
