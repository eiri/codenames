import { createClient } from '@supabase/supabase-js'

export default {
    install(app) {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
        const supabase = createClient(supabaseUrl, supabaseAnonKey)

        // app.config.globalProperties.supabase = supabase
        app.provide('supabase', supabase)
    }
}
