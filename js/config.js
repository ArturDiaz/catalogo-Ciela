// js/config.js - VERSIÓN CORREGIDA
(function() {
    // ✅ USAR ESTA URL (DE TU IMAGEN DE CONFIGURACIÓN)
    const SUPABASE_URL = 'https://xkzxforgasbdamgtarcz.supabase.co';
    
    // ✅ CLAVE PÚBLICA COMPLETA (no truncada)
    const SUPABASE_KEY = 'sb_publishable_CJ5yPSBEGz7wgeSmChIWoA_aEMdNOlg'; // Reemplaza con la COMPLETA
    
    if (typeof window.supabase === 'undefined') {
        console.error('❌ Supabase SDK no cargado');
        return;
    }
    
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        
        console.log('✅ Cliente Supabase creado exitosamente');
        
        // Test de conexión
        testConexion();
        
    } catch (error) {
        console.error('❌ Error creando cliente:', error);
    }
    
    async function testConexion() {
        try {
            // Test más simple y seguro
            const { error } = await window.supabaseClient
                .from('productos')
                .select('id')
                .limit(1);
            
            if (error) {
                console.error('❌ Error de conexión:', error.message);
                console.error('Código:', error.code);
                
                // Error común: tabla no existe
                if (error.code === '42P01') {
                    console.error('💡 La tabla "productos" no existe. Créala en Supabase.');
                }
            } else {
                console.log('✅ ¡Conexión exitosa! La API responde correctamente.');
            }
        } catch (testError) {
            console.error('❌ Error en test de conexión:', testError);
        }
    }
})();