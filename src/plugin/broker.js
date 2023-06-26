import Ably from 'ably'

export default {
  install(app) {
    const ablyAPIKey = import.meta.env.VITE_ABLY_API_KEY

    const newBroker = (username) => {
      const ably = new Ably.Realtime({
        key: ablyAPIKey,
        clientId: username,
        autoConnect: false,
        transportParams: { heartbeatInterval: 300000 },
      })

      return ably
    }

    // app.config.globalProperties.broker = ably
    app.provide('broker', newBroker)
  }
}
