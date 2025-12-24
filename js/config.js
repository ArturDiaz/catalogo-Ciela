// js/config.js - VERSIÓN MEJORADA
(function() {
    // DATOS DE SUPABASE - REEMPLAZA CON LOS TUYOS
    const SUPABASE_URL = 'https://xkzxforgasbdamgtarcz.supabase.co';  // <-- REEMPLAZA
    const SUPABASE_KEY = 'sb_publishable_CJ5yPSBEGz7wgeSmChIWoA_aEMdNOlg';  // <-- REEMPLAZA
    
    // Verificar que supabase.js está cargado
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase SDK no cargado');
        return;
    }
    
    // Crear cliente global
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase configurado:', SUPABASE_URL);
})();