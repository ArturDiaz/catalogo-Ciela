// js/admin.js - VERSIÓN CORREGIDA

// Función principal que espera a que todo esté listo
async function initAdmin() {
    // Esperar a que supabase esté disponible
    await waitForSupabase();
    
    // Ahora podemos verificar la sesión
    await verificarSesion();
}

// Esperar a que supabaseClient esté disponible
function waitForSupabase() {
    return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(checkInterval);
                console.log('✅ Supabase listo en admin.js');
                resolve();
            }
        }, 100);
        
        // Timeout después de 5 segundos
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Timeout esperando supabase');
            alert('Error: No se pudo conectar con la base de datos');
            resolve();
        }, 5000);
    });
}

// Funciones principales
async function verificarSesion() {
    try {
        // AHORA supabaseClient debería existir
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) throw error;
        
        if (session) {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            await cargarProductosAdmin();
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }
}

// FUNCIONES GLOBALES PARA LOS BOTONES
window.login = async function() {
    await waitForSupabase(); // Asegurar que supabase está listo
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Por favor ingresa email y contraseña');
        return;
    }
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // Login exitoso
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        
        // Cargar datos
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error de login: ' + error.message);
        console.error('Login error:', error);
    }
};

window.agregarProducto = async function() {
    await waitForSupabase(); // Asegurar que supabase está listo
    
    const producto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value) || 0,
        stock: parseInt(document.getElementById('stock').value) || 0,
        imagen_url: document.getElementById('imagen').value || null,
        activo: true
    };
    
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('productos')
            .insert([producto]);
        
        if (error) throw error;
        
        alert('✅ Producto agregado!');
        await cargarProductosAdmin();
        limpiarFormulario();
        
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Error agregando producto:', error);
    }
};

// ... (el resto de las funciones igual, pero usando window.supabaseClient)

// Iniciar cuando la página esté lista
document.addEventListener('DOMContentLoaded', initAdmin);