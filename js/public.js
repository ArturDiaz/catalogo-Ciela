// js/public.js
async function initPublic() {
    await testConexionSupabase();
    await cargarProductos();
}

async function testConexionSupabase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 30;
        
        const check = setInterval(() => {
            attempts++;
            
            if (window.supabaseClient) {
                clearInterval(check);
                resolve();
            }
            
            if (attempts >= maxAttempts) {
                clearInterval(check);
                alert('Error: No se puede conectar con la base de datos');
                resolve();
            }
        }, 100);
    });
}