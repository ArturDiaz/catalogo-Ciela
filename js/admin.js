// js/admin.js - VERSIÓN LIMPIA Y MEJORADA
async function waitForSupabase() {
    return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 50;
        
        const check = () => {
            attempts++;
            if (window.supabaseClient) {
                console.log('✅ Supabase listo');
                resolve();
                return;
            }
            
            if (attempts >= maxAttempts) {
                console.error('❌ Timeout esperando Supabase');
                resolve();
                return;
            }
            
            setTimeout(check, 100);
        };
        
        check();
    });
}

// ====================
// FUNCIONES GLOBALES
// ====================

window.login = async function() {
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
        
        if (error) {
            alert('Error: ' + error.message);
        } else {
            document.getElementById('login-form').style.display = 'none';
            document.getElementById('admin-panel').style.display = 'block';
            await cargarProductosAdmin();
        }
        
    } catch (error) {
        alert('Error inesperado: ' + error.message);
    }
};

window.agregarProducto = async function() {
    const producto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value) || 0,
        stock: parseInt(document.getElementById('stock').value) || 0,
        activo: true
    };
    
    const imagenInput = document.getElementById('imagen');
    if (imagenInput.files && imagenInput.files[0]) {
        producto.imagen_url = await subirImagen(imagenInput.files[0]);
    }
    
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
    }
};

async function subirImagen(file) {
    try {
        // 1. Convertir imagen a base64
        const base64 = await fileToBase64(file);
        
        // 2. Subir a Supabase Storage
        const fileName = `producto_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const filePath = `productos/${fileName}`;
        
        // 3. Subir archivo (necesitas configurar storage en Supabase)
        const { data, error } = await window.supabaseClient.storage
            .from('product-images') // Nombre del bucket que debes crear
            .upload(filePath, file);
        
        if (error) throw error;
        
        // 4. Obtener URL pública
        const { data: { publicUrl } } = window.supabaseClient.storage
            .from('product-images')
            .getPublicUrl(filePath);
        
        return publicUrl;
        
    } catch (error) {
        console.error('Error subiendo imagen:', error);
        alert('Error subiendo imagen. Usando placeholder.');
        return 'img/default.jpg';
    }
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

window.logout = async function() {
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    window.location.reload();
};

window.actualizarStock = async function(productoId, cambio) {
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

window.editarProducto = async function(productoId) {
    const producto = window.productosAdmin?.find(p => p.id === productoId);
    if (!producto) return;
    
    // Mostrar modal de edición
    mostrarModalEdicion(producto);
};

// ====================
// FUNCIONES INTERNAS
// ====================

function limpiarFormulario() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '0';
    document.getElementById('imagen').value = '';
    document.getElementById('preview-imagen').innerHTML = '';
}

async function cargarProductosAdmin() {
    try {
        const { data: productos, error } = await window.supabaseClient
            .from('productos')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        window.productosAdmin = productos;
        
        const lista = document.getElementById('lista-productos');
        if (!lista) return;
        
        if (productos.length === 0) {
            lista.innerHTML = '<p class="no-products">No hay productos registrados</p>';
            return;
        }
        
        lista.innerHTML = productos.map(p => `
            <div class="producto-admin" data-id="${p.id}">
                <div class="producto-header">
                    <input type="checkbox" class="producto-checkbox" data-id="${p.id}">
                    ${p.imagen_url ? 
                        `<img src="${p.imagen_url}" alt="${p.nombre}" class="producto-img">` 
                        : 
                        `<div class="no-image">Sin imagen</div>`
                    }
                    <div class="producto-info">
                        <h3>${p.nombre}</h3>
                        <p class="producto-desc">${p.descripcion || 'Sin descripción'}</p>
                        <div class="producto-meta">
                            <span class="price">$${p.precio?.toFixed(2) || '0.00'}</span>
                            <span class="stock ${p.stock < 5 ? 'low' : ''}">Stock: ${p.stock}</span>
                            <span class="status ${p.activo ? 'active' : 'inactive'}">
                                ${p.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="producto-actions">
                    <div class="stock-control">
                        <button class="btn-minus" onclick="actualizarStock('${p.id}', -1)">-1</button>
                        <button class="btn-minus" onclick="actualizarStock('${p.id}', -5)">-5</button>
                        <button class="btn-plus" onclick="actualizarStock('${p.id}', 1)">+1</button>
                        <button class="btn-plus" onclick="actualizarStock('${p.id}', 5)">+5</button>
                        <button class="btn-plus" onclick="actualizarStock('${p.id}', 10)">+10</button>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editarProducto('${p.id}')">
                            ✏️ Editar
                        </button>
                        <button class="btn-toggle" onclick="toggleActivo('${p.id}', ${!p.activo})">
                            ${p.activo ? '⏸️ Desactivar' : '▶️ Activar'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        const lista = document.getElementById('lista-productos');
        if (lista) {
            lista.innerHTML = '<p class="error">Error cargando productos</p>';
        }
    }
}

async function verificarSesion() {
    try {
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

// ====================
// ACCIONES MASIVAS
// ====================

window.seleccionarTodos = function() {
    const checkboxes = document.querySelectorAll('.producto-checkbox');
    const selectAll = document.getElementById('select-all').checked;
    
    checkboxes.forEach(cb => {
        cb.checked = selectAll;
    });
};

window.eliminarSeleccionados = async function() {
    const checkboxes = document.querySelectorAll('.producto-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Selecciona al menos un producto');
        return;
    }
    
    const confirmacion = confirm(`¿Eliminar ${checkboxes.length} producto(s)?\nEsta acción no se puede deshacer.`);
    
    if (!confirmacion) return;
    
    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    
    try {
        const { error } = await window.supabaseClient
            .from('productos')
            .delete()
            .in('id', ids);
        
        if (error) throw error;
        
        alert(`✅ ${ids.length} producto(s) eliminados`);
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.desactivarSeleccionados = async function() {
    const checkboxes = document.querySelectorAll('.producto-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Selecciona al menos un producto');
        return;
    }
    
    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    
    try {
        const { error } = await window.supabaseClient
            .from('productos')
            .update({ activo: false })
            .in('id', ids);
        
        if (error) throw error;
        
        alert(`✅ ${ids.length} producto(s) desactivados`);
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// ====================
// MODAL DE EDICIÓN
// ====================

function mostrarModalEdicion(producto) {
    const modalHTML = `
        <div class="modal-overlay" id="modal-edicion">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>✏️ Editar Producto</h2>
                    <button class="modal-close" onclick="cerrarModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <input type="text" id="edit-nombre" value="${producto.nombre}" placeholder="Nombre">
                    <textarea id="edit-descripcion" placeholder="Descripción">${producto.descripcion || ''}</textarea>
                    <input type="number" id="edit-precio" value="${producto.precio}" step="0.01" placeholder="Precio">
                    <input type="number" id="edit-stock" value="${producto.stock}" placeholder="Stock">
                    
                    <div class="imagen-upload">
                        <label>Imagen actual:</label>
                        ${producto.imagen_url ? 
                            `<img src="${producto.imagen_url}" class="imagen-preview">` 
                            : '<p>Sin imagen</p>'
                        }
                        <input type="file" id="edit-imagen" accept="image/*">
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="cerrarModal()">Cancelar</button>
                    <button class="btn-save" onclick="guardarEdicion('${producto.id}')">Guardar Cambios</button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay
    const modalExistente = document.getElementById('modal-edicion');
    if (modalExistente) modalExistente.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.cerrarModal = function() {
    const modal = document.getElementById('modal-edicion');
    if (modal) modal.remove();
};

window.guardarEdicion = async function(productoId) {
    const producto = {
        nombre: document.getElementById('edit-nombre').value,
        descripcion: document.getElementById('edit-descripcion').value,
        precio: parseFloat(document.getElementById('edit-precio').value) || 0,
        stock: parseInt(document.getElementById('edit-stock').value) || 0
    };
    
    const imagenInput = document.getElementById('edit-imagen');
    if (imagenInput.files && imagenInput.files[0]) {
        producto.imagen_url = await subirImagen(imagenInput.files[0]);
    }
    
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    try {
        const { error } = await window.supabaseClient
            .from('productos')
            .update(producto)
            .eq('id', productoId);
        
        if (error) throw error;
        
        alert('✅ Producto actualizado');
        cerrarModal();
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// ====================
// INICIAR
// ====================

async function initAdmin() {
    await waitForSupabase();
    await verificarSesion();
}

document.addEventListener('DOMContentLoaded', initAdmin);