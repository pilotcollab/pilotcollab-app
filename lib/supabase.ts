import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = "https://hhsygxmegicboexwdhju.supabase.co"
const supabaseAnonKey = "sb_publishable_TADOgWLEdwSIJEdh9tiR-A_GQ6SDDTp"

console.log('AsyncStorage no supabase.ts:', !!AsyncStorage)

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})