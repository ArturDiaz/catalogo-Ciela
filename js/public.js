// js/public.js - VERSIÓN MEJORADA
async function initPublic() {
    console.log('🚀 Iniciando catálogo...');
    
    // Intentar conexión inmediata
    await testConexionSupabase();
    await cargarProductos();
}

async function testConexionSupabase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30; // 3 segundos
        
        const check = setInterval(() => {
            attempts++;
            
            if (window.supabaseClient) {
                clearInterval(check);
                console.log('✅ Supabase listo (intento ' + attempts + ')');
                
                // Test rápido de conexión
                window.supabaseClient.from('productos').select('count', { 
                    count: 'exact', 
                    head: true 
                }).then(({ error }) => {
                    if (error) {
                        console.error('❌ Error de conexión:', error.message);
                    } else {
                        console.log('✅ Conexión exitosa con Supabase');
                    }
                });
                
                resolve();
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(check);
                console.error('❌ Timeout: SupabaseClient no disponible');
                alert('Error: No se puede conectar con la base de datos');
                resolve();
            }
        }, 100);
    });
}