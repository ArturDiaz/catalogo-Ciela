// js/config.js - CONFIGURACIÓN ÚNICA
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';  // REEMPLAZA CON TU URL
const SUPABASE_ANON_KEY = 'TU_ANON_PUBLIC_KEY';         // REEMPLAZA CON TU KEY

// Crear cliente Supabase GLOBAL
window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);