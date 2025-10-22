import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tmgdwunvclnzytnqeolh.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface WaitlistEntry {
  id?: string
  name: string
  email: string
  type: 'waitlist' | 'download'
  created_at?: string
  updated_at?: string
}