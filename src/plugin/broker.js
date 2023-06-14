import Ably from 'ably'

export default {
  install(app) {
    const ablyAPIKey = import.meta.env.VITE_ABLY_API_KEY
    // const uid = Math.random().toString(16).slice(2)
    let uid = 'eiri'
    if (navigator.userAgent.includes("Safari")) {
      uid = 'not_eiri'
    }
    const ably = new Ably.Realtime({
      key: ablyAPIKey,
      clientId: uid,
    })

    // app.config.globalProperties.broker = ably
    app.provide('broker', ably)
  }
}
