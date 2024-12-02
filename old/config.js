export const config = {
    environment: "production",
    enableDebug: false,
    defaultHost: "archipelago.gg"
}

if (import.meta.env.DEV) {
    Object.assign(config, {
        environment: "development",
        enableDebug: true,
        defaultHost: "localhost"
    })
}