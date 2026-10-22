import { createClient } from "@supabase/supabase-js"

// A chave anon é pública por design; as políticas RLS protegem os dados.
const SUPABASE_URL = "https://yivwcjxxgygodxbmknqk.supabase.co"
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlpdndjanh4Z3lnb2R4Ym1rbnFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2Mzk4MjgsImV4cCI6MjEwODIxNTgyOH0.XkXVpmTvmCls5Ni0bhk4wQJpSTT5JP0TNlqJ64e3oWc"

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Linha unica que guarda todo o estado do app como JSON
export const APP_STATE_ID = "main"
export const APP_STATE_TABLE = "app_state"
