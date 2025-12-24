// js/config.js - VERSIÓN CORREGIDA
(function() {
    console.log('🚀 config.js - Conectando a Supabase...');
    
    // ✅ USAR ESTA URL (DE TU IMAGEN DE CONFIGURACIÓN)
    const SUPABASE_URL = 'https://skrzforgasidungtsrcs.supabase.co';
    
    // ✅ CLAVE PÚBLICA COMPLETA (no truncada)
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhrenhmb3JnYXNiZGFtZ3RhcmN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY1MjI1NjAsImV4cCI6MjA4MjA5ODU2MH0.CVR0bD02Vc80cRIMnfplDrO8S3txxgw5Tba4Oe9Ua8Q'; // Reemplaza con la COMPLETA
    
    console.log('📡 URL:', SUPABASE_URL);
    console.log('🔑 Clave:', SUPABASE_KEY.substring(0, 30) + '...');
    
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
            console.log('🧪 Probando conexión a la API...');
            
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