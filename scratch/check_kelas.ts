
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

async function checkKelas() {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Missing Supabase env vars')
    return
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey)
  const { data, error } = await supabase.from('kelas').select('*').limit(1)
  console.log('Kelas table check:', { data, error })
}

checkKelas()
