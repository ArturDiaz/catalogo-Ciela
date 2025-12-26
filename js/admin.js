// js/admin.js - VERSIÓN CON CLOUDINARY INTEGRADO

// ====================
// CONFIGURACIÓN CLOUDINARY
// ====================
const CLOUDINARY_CLOUD_NAME = 'dqddikvnz'; // Cambia esto por tu Cloud Name
const CLOUDINARY_UPLOAD_PRESET = 'ciela_products'; // Cambia esto por tu Upload Preset

// ====================
// INICIALIZACIÓN
// ====================

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
// AUTENTICACIÓN
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

window.logout = async function() {
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    window.location.reload();
};

// ====================
// FUNCIÓN PARA SUBIR A CLOUDINARY
// ====================

async function subirImagenACloudinary(file) {
    console.log('📤 Subiendo a Cloudinary...', file.name);
    
    // Validaciones
    if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten imágenes');
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10MB máximo
        throw new Error('Máximo 10MB por imagen');
    }
    
    // Mostrar loading
    const loading = document.getElementById('loading-imagen');
    if (loading) {
        loading.style.display = 'block';
        loading.innerHTML = '<div>📤 Subiendo imagen...</div>';
    }
    
    try {
        // Crear FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        formData.append('folder', 'ciela/productos'); // Organiza en carpetas
        
        // Subir a Cloudinary
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
            {
                method: 'POST',
                body: formData
            }
        );
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Error subiendo imagen');
        }
        
        const data = await response.json();
        
        console.log('✅ Imagen subida:', data.secure_url);
        
        return {
            url: data.secure_url,
            publicId: data.public_id
        };
        
    } catch (error) {
        console.error('❌ Error Cloudinary:', error);
        throw new Error(`Cloudinary: ${error.message}`);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// ====================
// GESTIÓN DE PRODUCTOS
// ====================

window.agregarProducto = async function() {
    const producto = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        precio: parseFloat(document.getElementById('precio').value) || 0,
        stock: parseInt(document.getElementById('stock').value) || 0,
        activo: true
    };
    
    // Validaciones
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    if (!producto.precio || producto.precio <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
    }
    
    const imagenInput = document.getElementById('imagen');
    
    if (imagenInput.files && imagenInput.files[0]) {
        try {
            // Subir a Cloudinary
            const imagenData = await subirImagenACloudinary(imagenInput.files[0]);
            producto.imagen_url = imagenData.url;
            
            console.log('✅ Imagen en Cloudinary:', producto.imagen_url);
            
        } catch (error) {
            alert('Error subiendo imagen: ' + error.message);
            // Imagen por defecto de Cloudinary
            producto.imagen_url = 'https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg';
        }
    } else {
        // Imagen por defecto de Cloudinary
        producto.imagen_url = 'https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg';
    }
    
    // Deshabilitar botón durante proceso
    const btn = document.querySelector('#admin-panel .btn-primary');
    const originalText = btn.textContent;
    btn.textContent = 'Agregando...';
    btn.disabled = true;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('productos')
            .insert([producto])
            .select();
        
        if (error) throw error;
        
        alert('✅ Producto agregado exitosamente!\nLa imagen ya está en la nube.');
        await cargarProductosAdmin();
        limpiarFormulario();
        
    } catch (error) {
        console.error('Error agregando producto:', error);
        alert('Error: ' + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

window.actualizarStock = async function(productoId, cambio) {
    try {
        // Obtener producto actual
        const { data: producto, error: fetchError } = await window.supabaseClient
            .from('productos')
            .select('stock')
            .eq('id', productoId)
            .single();
        
        if (fetchError) throw fetchError;
        
        const nuevoStock = Math.max(0, (producto.stock || 0) + cambio);
        
        const { error } = await window.supabaseClient
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', productoId);
        
        if (error) throw error;
        
        await cargarProductosAdmin();
        
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
        
        if (error) throw error;
        
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// ====================
// FUNCIONES AUXILIARES
// ====================

function limpiarFormulario() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '0';
    document.getElementById('imagen').value = '';
    document.getElementById('preview-imagen').innerHTML = `
        <div class="preview-placeholder">
            <div class="placeholder-icon">🖼️</div>
            <p>Vista previa aparecerá aquí</p>
        </div>
    `;
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
                        `<img src="${p.imagen_url}" alt="${p.nombre}" class="producto-img" 
                             onerror="this.src='https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'">` 
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
// EDICIÓN DE PRODUCTOS
// ====================

window.editarProducto = async function(productoId) {
    const producto = window.productosAdmin?.find(p => p.id === productoId);
    if (!producto) return;
    
    // Mostrar modal de edición
    mostrarModalEdicion(producto);
};

function mostrarModalEdicion(producto) {
    const modalHTML = `
        <div class="modal-overlay" id="modal-edicion">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>✏️ Editar Producto</h2>
                    <button class="modal-close" onclick="cerrarModal()">×</button>
                </div>
                
                <div class="modal-body">
                    <input type="text" id="edit-nombre" value="${producto.nombre}" placeholder="Nombre *" required>
                    <textarea id="edit-descripcion" placeholder="Descripción">${producto.descripcion || ''}</textarea>
                    <input type="number" id="edit-precio" value="${producto.precio}" step="0.01" placeholder="Precio *" required>
                    <input type="number" id="edit-stock" value="${producto.stock}" placeholder="Stock">
                    
                    <div class="imagen-upload">
                        <label>Imagen actual:</label>
                        ${producto.imagen_url ? 
                            `<img src="${producto.imagen_url}" class="imagen-preview" 
                                 style="max-width: 200px; margin: 10px 0;" 
                                 onerror="this.src='https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'">` 
                            : '<p>Sin imagen</p>'
                        }
                        <label for="edit-imagen" style="display: block; margin-top: 10px;">
                            <strong>Cambiar imagen:</strong>
                        </label>
                        <input type="file" id="edit-imagen" accept="image/*" style="margin-top: 5px;">
                        <small>La nueva imagen se subirá automáticamente a Cloudinary</small>
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
        nombre: document.getElementById('edit-nombre').value.trim(),
        descripcion: document.getElementById('edit-descripcion').value.trim(),
        precio: parseFloat(document.getElementById('edit-precio').value) || 0,
        stock: parseInt(document.getElementById('edit-stock').value) || 0
    };
    
    const imagenInput = document.getElementById('edit-imagen');
    const productoOriginal = window.productosAdmin?.find(p => p.id === productoId);
    
    // Validaciones
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    if (!producto.precio || producto.precio <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
    }
    
    // Si hay nueva imagen seleccionada
    if (imagenInput.files && imagenInput.files[0]) {
        try {
            // Subir nueva imagen a Cloudinary
            const imagenData = await subirImagenACloudinary(imagenInput.files[0]);
            producto.imagen_url = imagenData.url;
            
        } catch (error) {
            alert('Error subiendo nueva imagen: ' + error.message);
            producto.imagen_url = productoOriginal?.imagen_url;
        }
    } else {
        // Mantener la imagen actual
        producto.imagen_url = productoOriginal?.imagen_url;
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
// VERIFICACIÓN DE SESIÓN
// ====================

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
// INICIALIZACIÓN
// ====================

async function initAdmin() {
    await waitForSupabase();
    await verificarSesion();
}

// Iniciar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', initAdmin);

// Estilos adicionales para la carga
const style = document.createElement('style');
style.textContent = `
    #loading-imagen {
        text-align: center;
        padding: 10px;
        background: #f0f9ff;
        border-radius: 5px;
        margin: 10px 0;
    }
    
    #loading-imagen div {
        animation: pulse 1.5s infinite;
    }
    
    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }
`;
document.head.appendChild(style);