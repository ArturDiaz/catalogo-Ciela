// js/admin.js - VERSIÓN MEJORADA CON DIAGNÓSTICO
async function initAdmin() {
    console.log('🔧 Iniciando admin.js...');
    
    // 1. Verificar si config.js se cargó
    console.log('📦 Verificando config.js...');
    console.log('supabaseClient existe?', typeof window.supabaseClient !== 'undefined');
    console.log('supabase existe?', typeof window.supabase !== 'undefined');
    
    // 2. Esperar a Supabase
    await waitForSupabase();
    
    // 3. Verificar sesión
    await verificarSesion();
}

function waitForSupabase() {
    return new Promise((resolve) => {
        console.log('⏳ Esperando supabaseClient...');
        
        const checkInterval = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(checkInterval);
                console.log('✅ supabaseClient encontrado!', window.supabaseClient);
                resolve();
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Timeout: supabaseClient NO encontrado');
            console.log('Estado actual de window:', {
                supabase: typeof window.supabase,
                supabaseClient: typeof window.supabaseClient,
                configScript: document.querySelector('script[src*="config.js"]')
            });
            alert('Error: No se pudo conectar con la base de datos. Verifica que config.js se cargó.');
            resolve();
        }, 5000);
    });
}