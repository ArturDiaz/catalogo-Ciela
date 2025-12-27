// js/admin.js - VERSIÓN CON CLOUDINARY Y CATEGORÍAS

// ====================
// CONFIGURACIÓN CLOUDINARY
// ====================
const CLOUDINARY_CLOUD_NAME = 'dqmlubvqo';
const CLOUDINARY_UPLOAD_PRESET = 'ciela_products';

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
                resolve();
                return;
            }
            
            if (attempts >= maxAttempts) {
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
            await cargarCategorias();
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
    if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten imágenes');
    }
    
    if (file.size > 10 * 1024 * 1024) {
        throw new Error('Máximo 10MB por imagen');
    }
    
    const loading = document.getElementById('loading-imagen');
    if (loading) {
        loading.style.display = 'block';
        loading.innerHTML = '<div>📤 Subiendo imagen...</div>';
    }
    
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        formData.append('folder', 'ciela/productos');
        
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
        
        return {
            url: data.secure_url,
            publicId: data.public_id
        };
        
    } catch (error) {
        throw new Error(`Cloudinary: ${error.message}`);
    } finally {
        if (loading) loading.style.display = 'none';
    }
}

// ====================
// GESTIÓN DE CATEGORÍAS
// ====================

async function cargarCategorias() {
    try {
        const { data: categorias, error } = await window.supabaseClient
            .from('categorias')
            .select('*')
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        
        window.categorias = categorias || [];
        
        // Actualizar lista en formulario de productos
        const selectCategoria = document.getElementById('categoria');
        if (selectCategoria) {
            selectCategoria.innerHTML = `
                <option value="">Selecciona una categoría</option>
                ${window.categorias.map(cat => 
                    `<option value="${cat.id}">${cat.nombre}</option>`
                ).join('')}
            `;
        }
        
        // Actualizar lista en sección de gestión de categorías
        const listaCategorias = document.getElementById('lista-categorias');
        if (listaCategorias) {
            if (window.categorias.length === 0) {
                listaCategorias.innerHTML = '<p class="no-categories">No hay categorías registradas</p>';
            } else {
                listaCategorias.innerHTML = window.categorias.map(cat => `
                    <div class="categoria-item" data-id="${cat.id}">
                        <span class="categoria-nombre">${cat.nombre}</span>
                        <div class="categoria-actions">
                            <button class="btn-edit-small" onclick="editarCategoria('${cat.id}')">✏️</button>
                            <button class="btn-delete-small" onclick="eliminarCategoria('${cat.id}')">🗑️</button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Error cargando categorías:', error);
        const listaCategorias = document.getElementById('lista-categorias');
        if (listaCategorias) {
            listaCategorias.innerHTML = '<p class="error">Error cargando categorías</p>';
        }
    }
}

window.agregarCategoria = async function() {
    const nombre = document.getElementById('categoria-nombre').value.trim();
    const descripcion = document.getElementById('categoria-descripcion').value.trim();
    
    if (!nombre) {
        alert('El nombre de la categoría es obligatorio');
        return;
    }
    
    // CORRECCIÓN: Usar el botón correcto del formulario de categorías
    const btn = document.querySelector('.admin-section .btn-primary') || 
                 document.querySelector('[onclick="agregarCategoria()"]');
    const originalText = btn ? btn.textContent : 'Agregar Categoría';
    
    if (btn) {
        btn.textContent = 'Agregando...';
        btn.disabled = true;
    }
    
    try {
        const { data, error } = await window.supabaseClient
            .from('categorias')
            .insert([{ 
                nombre: nombre, 
                descripcion: descripcion,
                activa: true 
            }])
            .select();
        
        if (error) throw error;
        
        alert('✅ Categoría agregada exitosamente');
        document.getElementById('categoria-nombre').value = '';
        document.getElementById('categoria-descripcion').value = '';
        await cargarCategorias();
        
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

window.eliminarCategoria = async function(categoriaId) {
    const confirmacion = confirm('¿Estás seguro de eliminar esta categoría?\nLos productos en esta categoría quedarán sin categoría asignada.');
    
    if (!confirmacion) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('categorias')
            .delete()
            .eq('id', categoriaId);
        
        if (error) throw error;
        
        alert('✅ Categoría eliminada');
        await cargarCategorias();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.editarCategoria = async function(categoriaId) {
    const categoria = window.categorias?.find(c => c.id === categoriaId);
    if (!categoria) return;
    
    const nuevoNombre = prompt('Nuevo nombre de la categoría:', categoria.nombre);
    
    if (!nuevoNombre || nuevoNombre.trim() === '') return;
    
    try {
        const { error } = await window.supabaseClient
            .from('categorias')
            .update({ nombre: nuevoNombre.trim() })
            .eq('id', categoriaId);
        
        if (error) throw error;
        
        alert('✅ Categoría actualizada');
        await cargarCategorias();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// ====================
// GESTIÓN DE PRODUCTOS (ACTUALIZADA CON CATEGORÍAS)
// ====================

window.agregarProducto = async function() {
    const producto = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        precio: parseFloat(document.getElementById('precio').value) || 0,
        stock: parseInt(document.getElementById('stock').value) || 0,
        categoria_id: document.getElementById('categoria').value || null,
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
            const imagenData = await subirImagenACloudinary(imagenInput.files[0]);
            producto.imagen_url = imagenData.url;
        } catch (error) {
            alert('Error subiendo imagen: ' + error.message);
            producto.imagen_url = 'https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg';
        }
    } else {
        producto.imagen_url = 'https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg';
    }
    
    const btn = document.querySelector('#form-producto .btn-primary');
    const originalText = btn.textContent;
    btn.textContent = 'Agregando...';
    btn.disabled = true;
    
    try {
        const { data, error } = await window.supabaseClient
            .from('productos')
            .insert([producto])
            .select();
        
        if (error) throw error;
        
        alert('✅ Producto agregado exitosamente!');
        await cargarProductosAdmin();
        limpiarFormularioProducto();
        
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
};

function limpiarFormularioProducto() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '0';
    document.getElementById('categoria').value = '';
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
            .select(`
                *,
                categorias: categoria_id (nombre)
            `)
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
                            <span class="categoria-badge">${p.categorias?.nombre || 'Sin categoría'}</span>
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
        const lista = document.getElementById('lista-productos');
        if (lista) {
            lista.innerHTML = '<p class="error">Error cargando productos</p>';
        }
    }
}

window.actualizarStock = async function(productoId, cambio) {
    try {
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
// EDICIÓN DE PRODUCTOS (ACTUALIZADA CON CATEGORÍAS)
// ====================

window.editarProducto = async function(productoId) {
    const producto = window.productosAdmin?.find(p => p.id === productoId);
    if (!producto) return;
    
    mostrarModalEdicion(producto);
};

function mostrarModalEdicion(producto) {
    const categoriasOptions = window.categorias?.map(cat => 
        `<option value="${cat.id}" ${producto.categoria_id === cat.id ? 'selected' : ''}>${cat.nombre}</option>`
    ).join('') || '';
    
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
                    
                    <div class="form-group">
                        <label for="edit-categoria">Categoría:</label>
                        <select id="edit-categoria">
                            <option value="">Sin categoría</option>
                            ${categoriasOptions}
                        </select>
                    </div>
                    
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
    
    const modalExistente = document.getElementById('modal-edicion');
    if (modalExistente) modalExistente.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

window.guardarEdicion = async function(productoId) {
    const producto = {
        nombre: document.getElementById('edit-nombre').value.trim(),
        descripcion: document.getElementById('edit-descripcion').value.trim(),
        precio: parseFloat(document.getElementById('edit-precio').value) || 0,
        stock: parseInt(document.getElementById('edit-stock').value) || 0,
        categoria_id: document.getElementById('edit-categoria').value || null
    };
    
    const imagenInput = document.getElementById('edit-imagen');
    const productoOriginal = window.productosAdmin?.find(p => p.id === productoId);
    
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    if (!producto.precio || producto.precio <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
    }
    
    if (imagenInput.files && imagenInput.files[0]) {
        try {
            const imagenData = await subirImagenACloudinary(imagenInput.files[0]);
            producto.imagen_url = imagenData.url;
        } catch (error) {
            alert('Error subiendo nueva imagen: ' + error.message);
            producto.imagen_url = productoOriginal?.imagen_url;
        }
    } else {
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
            await cargarCategorias();
        }
        
    } catch (error) {
        // Sesión no válida
    }
}

// ====================
// INICIALIZACIÓN
// ====================

async function initAdmin() {
    await waitForSupabase();
    await verificarSesion();
}

document.addEventListener('DOMContentLoaded', initAdmin);

// Estilos adicionales
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
    
    .categoria-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 5px;
        margin-bottom: 8px;
    }
    
    .categoria-nombre {
        font-weight: 500;
        color: #333;
    }
    
    .categoria-actions {
        display: flex;
        gap: 5px;
    }
    
    .btn-edit-small, .btn-delete-small {
        padding: 4px 8px;
        font-size: 12px;
        border: none;
        border-radius: 3px;
        cursor: pointer;
    }
    
    .btn-edit-small {
        background: #e3f2fd;
        color: #1976d2;
    }
    
    .btn-delete-small {
        background: #ffebee;
        color: #d32f2f;
    }
    
    .categoria-badge {
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
    }
    
    .no-categories {
        text-align: center;
        color: #666;
        padding: 20px;
        background: #f9f9f9;
        border-radius: 5px;
    }
    
    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }
`;
document.head.appendChild(style);