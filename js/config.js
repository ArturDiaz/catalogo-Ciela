// js/config.js
(function() {
    const SUPABASE_URL = 'https://xkzxforgasbdamgtarcz.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_CJ5yPSBEGz7wgeSmChIWoA_aEMdNOlg';
    
    if (typeof window.supabase === 'undefined') {
        return;
    }
    
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true
            }
        });
        
    } catch (error) {
        console.error('Error creando cliente:', error);
    }
    
    async function testConexion() {
        try {
            const { error } = await window.supabaseClient
                .from('productos')
                .select('id')
                .limit(1);
            
            if (error) {
                if (error.code === '42P01') {
                    console.error('💡 La tabla "productos" no existe. Créala en Supabase.');
                }
            }
        } catch (testError) {
            console.error('Error en test de conexión:', testError);
        }
    }
})();