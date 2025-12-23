// js/config.js
// ESTO SE EJECUTA PRIMERO - CONFIGURACIÓN GLOBAL

// OBTÉN TUS DATOS DE SUPABASE:
// 1. Ve a Supabase → Settings → API
// 2. Copia "Project URL" y "anon public"

const SUPABASE_URL = 'https://xxxxxxx.supabase.co';  // REEMPLAZA
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';  // REEMPLAZA

// Crear cliente global UNA SOLA VEZ
if (!window.supabase) {
    window.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase configurado');
}