// js/config.js - VERSIÓN MEJORADA
(function() {
    // DATOS DE SUPABASE - REEMPLAZA CON LOS TUYOS
    const SUPABASE_URL = 'https://xkzxforgasbdamgtarcz.supabase.co';  // <-- REEMPLAZA
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrenhmb3JnYXNiZGFtZ3RhcmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MjI1NjAsImV4cCI6MjA4MjA5ODU2MH0.CVR0bD02Vc80cRIMnfplDrO8S3txxgw5Tba4Oe9Ua8Q';  // <-- REEMPLAZA
    
    // Verificar que supabase.js está cargado
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase SDK no cargado');
        return;
    }
    
    // Crear cliente global
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('✅ Supabase configurado:', SUPABASE_URL);
})();