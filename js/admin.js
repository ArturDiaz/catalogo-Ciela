// js/admin.js - VERSIÓN MEJORADA CON TODAS LAS FUNCIONALIDADES
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
    
    // Obtener URL de imagen si se subió
    const imagenUrl = await subirImagenSiExiste();
    
    const producto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value) || 0,
        stock: parseInt(document.getElementById('stock').value) || 0,
        imagen_url: imagenUrl || null,
        activo: true
    };
    
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    if (!producto.precio || producto.precio <= 0) {
        alert('El precio debe ser mayor a 0');
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

async function subirImagenSiExiste() {
    const inputImagen = document.getElementById('imagen');
    if (!inputImagen.files || inputImagen.files.length === 0) {
        return null;
    }
    
    const file = inputImagen.files[0];
    
    // Validar tipo de archivo
    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(file.type)) {
        alert('Solo se permiten imágenes (JPEG, PNG, WebP, GIF)');
        return null;
    }
    
    // Validar tamaño (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
        alert('La imagen es muy grande. Máximo 5MB.');
        return null;
    }
    
    // En un sistema real, aquí subirías a Supabase Storage o Cloudinary
    // Por ahora usaremos una solución temporal con un servicio gratuito
    
    alert('⚠️ Subida de imágenes está en desarrollo. Por ahora usa URLs de imágenes.');
    return null;
    
    /*
    // Código futuro para Supabase Storage:
    const fileName = `${Date.now()}_${file.name}`;
    const { data, error } = await supabaseClient.storage
        .from('productos')
        .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabaseClient.storage
        .from('productos')
        .getPublicUrl(fileName);
    
    return publicUrl;
    */
}

window.logout = async function() {
    console.log('🚪 Ejecutando logout()...');
    
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    window.location.reload();
};

window.actualizarStockManual = async function(productoId) {
    console.log('📊 Actualizando stock manualmente:', productoId);
    
    const inputId = `stock-input-${productoId}`;
    const input = document.getElementById(inputId);
    
    if (!input) {
        alert('Error: No se encontró el campo de stock');
        return;
    }
    
    const nuevoStock = parseInt(input.value);
    
    if (isNaN(nuevoStock) || nuevoStock < 0) {
        alert('Por favor ingresa un número válido (0 o más)');
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', productoId);
        
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('✅ Stock actualizado!');
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

window.eliminarProducto = async function(productoId, productoNombre) {
    console.log('🗑️ Solicitando eliminar producto:', productoId);
    
    const confirmacion = confirm(`¿Estás seguro que quieres eliminar el producto "${productoNombre}"?\n\nEsta acción no se puede deshacer.`);
    
    if (!confirmacion) {
        console.log('Eliminación cancelada por el usuario');
        return;
    }
    
    try {
        // Opción 1: Eliminación permanente (DELETE)
        const { error } = await window.supabaseClient
            .from('productos')
            .delete()
            .eq('id', productoId);
        
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('✅ Producto eliminado permanentemente!');
            await cargarProductosAdmin();
        }
        
        // Opción 2: Eliminación suave (recomendada - solo desactiva)
        /*
        const { error } = await window.supabaseClient
            .from('productos')
            .update({ 
                activo: false,
                eliminado: true,
                fecha_eliminacion: new Date().toISOString()
            })
            .eq('id', productoId);
        
        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('✅ Producto marcado como eliminado!');
            await cargarProductosAdmin();
        }
        */
        
    } catch (error) {
        alert('Error: ' + error.message);
        console.error('Error eliminando producto:', error);
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
        
        if (productos.length === 0) {
            lista.innerHTML = '<p style="text-align:center; color:#666; padding:20px;">No hay productos registrados</p>';
            return;
        }
        
        lista.innerHTML = productos.map(p => `
            <div class="producto-admin" style="border:1px solid #e0e0e0; padding:20px; margin:15px 0; border-radius:8px; background:white; box-shadow:0 2px 4px rgba(0,0,0,0.05);">
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:15px;">
                    ${p.imagen_url ? 
                        `<img src="${p.imagen_url}" alt="${p.nombre}" style="width:80px; height:80px; object-fit:cover; border-radius:6px;">` 
                        : 
                        `<div style="width:80px; height:80px; background:#f0f0f0; display:flex; align-items:center; justify-content:center; border-radius:6px; color:#999;">Sin imagen</div>`
                    }
                    <div style="flex:1;">
                        <h3 style="margin:0 0 5px 0; color:#333;">${p.nombre}</h3>
                        <p style="margin:0; color:#666; font-size:0.9em;">${p.descripcion || 'Sin descripción'}</p>
                        <p style="margin:5px 0; color:#2c3e50;">
                            <strong>Precio:</strong> $${p.precio?.toFixed(2) || '0.00'} | 
                            <strong>Stock:</strong> <span style="color:${p.stock < 10 ? '#e74c3c' : '#27ae60'}">${p.stock} unidades</span> | 
                            <strong>Estado:</strong> ${p.activo ? '✅ Activo' : '❌ Inactivo'}
                        </p>
                    </div>
                </div>
                
                <div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:15px; padding-top:15px; border-top:1px solid #eee;">
                    <!-- Input para actualizar stock -->
                    <div style="flex:1; min-width:200px;">
                        <div style="display:flex; gap:5px;">
                            <input type="number" 
                                   id="stock-input-${p.id}" 
                                   value="${p.stock}"
                                   min="0"
                                   style="flex:1; padding:8px; border:1px solid #ddd; border-radius:4px;"
                                   placeholder="Nuevo stock">
                            <button onclick="actualizarStockManual('${p.id}')" 
                                    style="background:#3498db; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer;">
                                Actualizar
                            </button>
                        </div>
                    </div>
                    
                    <!-- Botones de acciones -->
                    <div style="display:flex; gap:5px;">
                        <button onclick="toggleActivo('${p.id}', ${!p.activo})" 
                                style="background:${p.activo ? '#e67e22' : '#2ecc71'}; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; white-space:nowrap;">
                            ${p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        
                        <button onclick="eliminarProducto('${p.id}', '${p.nombre.replace(/'/g, "\\'")}')" 
                                style="background:#e74c3c; color:white; border:none; padding:8px 15px; border-radius:4px; cursor:pointer; white-space:nowrap;">
                            🗑️ Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando productos admin:', error);
        const lista = document.getElementById('lista-productos');
        if (lista) {
            lista.innerHTML = '<p style="color:#e74c3c; text-align:center; padding:20px;">Error cargando productos</p>';
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