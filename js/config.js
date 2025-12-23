// config.js - DEBE TENER esto:
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';  // REEMPLAZA
const SUPABASE_KEY = 'eyJhbGci...';  // REEMPLAZA TU KEY

// Solo crear si no existe
if (!window.supabase) {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase configurado');
}