// js/public.js
async function initPublic() {
    await waitForSupabase();
    await cargarProductos();
}

function waitForSupabase() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(checkInterval);
                console.log('✅ Supabase listo en public.js');
                resolve();
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Timeout esperando supabase');
            resolve();
        }, 5000);
    });
}

async function cargarProductos() {
    try {
        const { data: productos, error } = await window.supabaseClient
            .from('productos')
            .select('*')
            .eq('activo', true)
            .gt('stock', 0);
        
        if (error) throw error;
        
        // ... resto del código igual
    } catch (error) {
        console.error('Error:', error);
    }
}

// Iniciar
document.addEventListener('DOMContentLoaded', initPublic);