export async function getStatus(serviceName, provider) {
    try {
        if (!serviceName || !provider) return null;

        const res = await fetch("https://docs.x.com/status.md");
        if (!res.ok) return null;

        const text = await res.text();

        const regex = /<Card title="([^"]+)"[^>]*>[\s\S]*?<Tooltip tip="([^"]+)">/gi;

        let match;
        const components = [];

        while ((match = regex.exec(text)) !== null) {
            components.push({
                name: match[1],
                status: match[2]
            });
        }

        const comp = components.find(c =>
            c.name.toLowerCase().includes(serviceName.toLowerCase())
        );

        if (!comp) return null;

        let normalizedStatus = "unknown";
        switch (comp.status.toLowerCase()) {
            case "operational":
            case "normal":
                normalizedStatus = "operational";
                break;
            case "degraded":
            case "partial outage":
            case "degraded performance":
                normalizedStatus = "degraded";
                break;
            case "major outage":
            case "down":
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
