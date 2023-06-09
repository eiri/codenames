import Ably from 'ably'

export default {
    install(app) {
        const ablyAPIKey = import.meta.env.VITE_ABLY_API_KEY
        const ably = new Ably.Realtime(ablyAPIKey)

        // app.config.globalProperties.broker = ably
        app.provide('broker', ably)
    }
}
