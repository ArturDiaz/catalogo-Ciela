// js/admin.js
// PANEL ADMIN - NO declara supabase, usa el global

// Funciones globales para los botones HTML
window.login = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Por favor ingresa email y contraseña');
        return;
    }
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
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
        const { error } = await window.supabase
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

window.actualizarStock = async function(productoId, cambio) {
    try {
        const { error } = await window.supabase.rpc('actualizar_stock', {
            producto_id: productoId,
            cantidad_cambio: cambio
        });
        
        if (error) throw error;
        
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.toggleActivo = async function(productoId, nuevoEstado) {
    try {
        const { error } = await window.supabase
            .from('productos')
            .update({ activo: nuevoEstado })
            .eq('id', productoId);
        
        if (error) throw error;
        
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.logout = async function() {
    await window.supabase.auth.signOut();
    window.location.reload();
};

// Funciones internas (no globales)
function limpiarFormulario() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('imagen').value = '';
}

async function cargarProductosAdmin() {
    try {
        const { data: productos, error } = await window.supabase
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const lista = document.getElementById('lista-productos');
        if (!lista) return;
        
        lista.innerHTML = productos.map(p => `
            <div class="producto-admin" style="border:1px solid #ddd; padding:15px; margin:10px 0; border-radius:5px;">
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

// Verificar sesión al cargar
async function verificarSesion() {
    try {
        const { data: { session } } = await window.supabase.auth.getSession();
        
        if (session) {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            await cargarProductosAdmin();
        }
    } catch (error) {
        console.error('Error verificando sesión:', error);
    }
}

// Iniciar cuando cargue la página
document.addEventListener('DOMContentLoaded', verificarSesion);