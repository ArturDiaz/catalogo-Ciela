// js/admin.js - VERSIÓN COMPLETA
console.log('👑 Admin.js iniciando...');

// ====================
// ESPERAR A SUPABASE
// ====================

async function waitForSupabase() {
    return new Promise((resolve) => {
        console.log('⏳ Esperando supabaseClient...');
        
        const checkInterval = setInterval(() => {
            if (window.supabaseClient) {
                clearInterval(checkInterval);
                console.log('✅ supabaseClient encontrado!');
                resolve();
            }
        }, 100);
        
        setTimeout(() => {
            clearInterval(checkInterval);
            console.error('❌ Timeout: supabaseClient NO encontrado');
            resolve();
        }, 5000);
    });
}

// ====================
// FUNCIONES GLOBALES
// ====================

window.login = async function() {
    console.log('🔑 Ejecutando login()...');
    
    if (!window.supabaseClient) {
        alert('Error: Sistema no inicializado. Recarga la página.');
        return;
    }
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Por favor ingresa email y contraseña');
        return;
    }
    
    console.log('📧 Login con email:', email);
    
    try {
        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) {
            console.error('❌ Error login:', error);
            alert('Error: ' + error.message);
        } else {
            console.log('✅ Login exitoso:', data.user.email);
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            await cargarProductosAdmin();
        }
        
    } catch (error) {
        console.error('❌ Excepción en login:', error);
        alert('Error inesperado: ' + error.message);
    }
};

window.agregarProducto = async function() {
    console.log('➕ Ejecutando agregarProducto()...');
    
    if (!window.supabaseClient) {
        alert('Error: Sistema no inicializado');
        return;
    }
    
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
        
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('✅ Producto agregado!');
            await cargarProductosAdmin();
            limpiarFormulario();
        }
        
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Error agregando producto:', error);
    }
};

window.logout = async function() {
    console.log('🚪 Ejecutando logout()...');
    
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    window.location.reload();
};

window.actualizarStock = async function(productoId, cambio) {
    console.log('📊 Actualizando stock:', productoId, cambio);
    
    try {
        const { error } = await window.supabaseClient.rpc('actualizar_stock', {
            producto_id: productoId,
            cantidad_cambio: cambio
        });
        
        if (error) {
            alert('Error: ' + error.message);
        } else {
            await cargarProductosAdmin();
        }
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.toggleActivo = async function(productoId, nuevoEstado) {
    console.log('🔄 Cambiando estado:', productoId, nuevoEstado);
    
    try {
        const { error } = await window.supabaseClient
            .from('productos')
            .update({ activo: nuevoEstado })
            .eq('id', productoId);
        
        if (error) {
            alert('Error: ' + error.message);
        } else {
            await cargarProductosAdmin();
        }
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// ====================
// FUNCIONES INTERNAS
// ====================

function limpiarFormulario() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('imagen').value = '';
}

async function cargarProductosAdmin() {
    console.log('📦 Cargando productos para admin...');
    
    try {
        const { data: productos, error } = await window.supabaseClient
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) {
            console.error('Error:', error);
            return;
        }
        
        const lista = document.getElementById('lista-productos');
        if (!lista) return;
        
        lista.innerHTML = productos.map(p => `
            <div class="producto-admin">
                <h4>${p.nombre}</h4>
                <p>${p.descripcion || 'Sin descripción'}</p>
                <p><strong>Precio:</strong> $${p.precio?.toFixed(2) || '0.00'}</p>
                <p><strong>Stock:</strong> ${p.stock} | <strong>Estado:</strong> ${p.activo ? '✅ Activo' : '❌ Inactivo'}</p>
                <div style="margin-top:10px;">
                    <button onclick="actualizarStock('${p.id}', 10)" style="background:#2ecc71; color:white; border:none; padding:5px 10px; margin-right:5px; border-radius:3px;">
                        +10 Stock
                    </button>
                    <button onclick="actualizarStock('${p.id}', -10)" style="background:#e67e22; color:white; border:none; padding:5px 10px; margin-right:5px; border-radius:3px;">
                        -10 Stock
                    </button>
                    <button onclick="toggleActivo('${p.id}', ${!p.activo})" style="background:${p.activo ? '#e74c3c' : '#3498db'}; color:white; border:none; padding:5px 10px; border-radius:3px;">
                        ${p.activo ? 'Desactivar' : 'Activar'}
                    </button>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando productos admin:', error);
        const lista = document.getElementById('lista-productos');
        if (lista) {
            lista.innerHTML = '<p>Error cargando productos</p>';
        }
    }
}

async function verificarSesion() {
    console.log('🔐 Verificando sesión...');
    
    if (!window.supabaseClient) {
        console.error('supabaseClient no disponible');
        return;
    }
    
    try {
        const { data: { session }, error } = await window.supabaseClient.auth.getSession();
        
        if (error) {
            console.error('Error en getSession:', error);
            return;
        }
        
        console.log('👤 Sesión:', session ? '✅ Activa' : '❌ Inactiva');
        
        if (session) {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            await cargarProductosAdmin();
        }
        
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }
}

// ====================
// INICIAR
// ====================

async function initAdmin() {
    console.log('🔧 Iniciando sistema admin...');
    await waitForSupabase();
    await verificarSesion();
}

// Iniciar cuando cargue la página
document.addEventListener('DOMContentLoaded', initAdmin);

console.log('✅ Admin.js completamente cargado y listo');