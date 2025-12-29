// js/admin.js - VERSIÓN FINAL CON MÚLTIPLES IMÁGENES

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
// MANEJO DE MÚLTIPLES IMÁGENES
// ====================
let imagenesTemporales = [];

window.previewImagenesMultiples = function(input) {
    const previewContainer = document.getElementById('preview-imagenes');
    
    if (!input.files || input.files.length === 0) {
        return;
    }
    
    previewContainer.innerHTML = '';
    imagenesTemporales = [];
    
    Array.from(input.files).forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            imagenesTemporales.push({
                file: file,
                previewUrl: e.target.result,
                orden: index + 1
            });
            
            const previewItem = document.createElement('div');
            previewItem.className = 'imagen-preview-item';
            previewItem.innerHTML = `
                <img src="${e.target.result}" alt="Previsualización ${index + 1}">
                <div class="imagen-info">
                    <div style="font-size: 11px; margin-bottom: 2px;">${file.name}</div>
                    <div class="orden-control">
                        <span>Orden:</span>
                        <input type="number" class="orden-input" 
                               data-index="${index}" 
                               value="${index + 1}" 
                               min="1" max="${input.files.length}"
                               onchange="actualizarOrdenImagen(${index}, this.value)">
                    </div>
                    <button type="button" class="btn-remove-imagen" 
                            onclick="eliminarImagenTemporal(${index})">
                        ✕ Eliminar
                    </button>
                </div>
            `;
            
            previewContainer.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    });
};

window.actualizarOrdenImagen = function(index, nuevoOrden) {
    const imagen = imagenesTemporales[index];
    if (imagen) {
        imagen.orden = parseInt(nuevoOrden);
        reordenarVistaPrevia();
    }
};

function reordenarVistaPrevia() {
    const previewContainer = document.getElementById('preview-imagenes');
    if (!previewContainer) return;
    
    imagenesTemporales.sort((a, b) => a.orden - b.orden);
    
    previewContainer.innerHTML = '';
    imagenesTemporales.forEach((imagen, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'imagen-preview-item';
        previewItem.innerHTML = `
            <img src="${imagen.previewUrl}" alt="Previsualización ${imagen.orden}">
            <div class="imagen-info">
                <div style="font-size: 11px; margin-bottom: 2px;">${imagen.file.name}</div>
                <div class="orden-control">
                    <span>Orden:</span>
                    <input type="number" class="orden-input" 
                           data-index="${index}" 
                           value="${imagen.orden}" 
                           min="1" max="${imagenesTemporales.length}"
                           onchange="actualizarOrdenImagen(${index}, this.value)">
                </div>
                <button type="button" class="btn-remove-imagen" 
                        onclick="eliminarImagenTemporal(${index})">
                    ✕ Eliminar
                </button>
            </div>
        `;
        previewContainer.appendChild(previewItem);
    });
};

window.eliminarImagenTemporal = function(index) {
    imagenesTemporales.splice(index, 1);
    
    imagenesTemporales.forEach((img, i) => {
        img.orden = i + 1;
    });
    
    const input = document.getElementById('imagenes');
    if (input) {
        const dt = new DataTransfer();
        imagenesTemporales.forEach(img => {
            dt.items.add(img.file);
        });
        input.files = dt.files;
    }
    
    reordenarVistaPrevia();
};

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
        
        const selectCategoria = document.getElementById('categoria');
        if (selectCategoria) {
            selectCategoria.innerHTML = `
                <option value="">Selecciona una categoría</option>
                ${window.categorias.map(cat => 
                    `<option value="${cat.id}">${cat.nombre}</option>`
                ).join('')}
            `;
        }
        
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
    
    const btn = document.querySelector('[onclick="agregarCategoria()"]');
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
// GESTIÓN DE PRODUCTOS CON MÚLTIPLES IMÁGENES
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
    
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    if (!producto.precio || producto.precio <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
    }
    
    const btn = document.querySelector('.add-product .btn-primary');
    const originalText = btn ? btn.textContent : 'Agregar Producto';
    
    if (btn) {
        btn.textContent = 'Procesando...';
        btn.disabled = true;
    }
    
    try {
        const { data: productoInsertado, error: productoError } = await window.supabaseClient
            .from('productos')
            .insert([producto])
            .select()
            .single();
        
        if (productoError) throw productoError;
        
        if (imagenesTemporales.length > 0) {
            const imagenesPromises = imagenesTemporales.map(async (imagenTemp, index) => {
                try {
                    const imagenData = await subirImagenACloudinary(imagenTemp.file);
                    
                    const { error: imagenError } = await window.supabaseClient
                        .from('producto_imagenes')
                        .insert({
                            producto_id: productoInsertado.id,
                            imagen_url: imagenData.url,
                            orden: imagenTemp.orden
                        });
                    
                    if (imagenError) {
                        return null;
                    }
                    
                    return { url: imagenData.url, orden: imagenTemp.orden };
                    
                } catch (error) {
                    return null;
                }
            });
            
            await Promise.all(imagenesPromises);
        } else {
            await window.supabaseClient
                .from('productos')
                .update({ 
                    imagen_url: 'https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'
                })
                .eq('id', productoInsertado.id);
        }
        
        alert('✅ Producto agregado exitosamente!');
        await cargarProductosAdmin();
        limpiarFormularioProductoCompleto();
        
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

function limpiarFormularioProductoCompleto() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '0';
    document.getElementById('categoria').value = '';
    document.getElementById('imagenes').value = '';
    
    const previewContainer = document.getElementById('preview-imagenes');
    if (previewContainer) {
        previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">🖼️</div>
                <p>Arrastra o selecciona múltiples imágenes</p>
                <small>Primera imagen será la principal</small>
            </div>
        `;
    }
    
    imagenesTemporales = [];
}

async function cargarProductosAdmin() {
    try {
        const { data: productos, error } = await window.supabaseClient
            .from('productos')
            .select(`
                *,
                categorias: categoria_id (nombre),
                imagenes:producto_imagenes (imagen_url, orden)
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
        
        lista.innerHTML = productos.map(p => {
            const imagenes = p.imagenes || [];
            const imagenPrincipal = imagenes.length > 0 ? 
                imagenes.find(img => img.orden === 1)?.imagen_url || imagenes[0].imagen_url : 
                p.imagen_url;
            
            let imagenesHTML = '';
            if (imagenes.length > 0) {
                const mostrarPrimeras = Math.min(imagenes.length, 3);
                imagenesHTML = `
                    <div class="producto-imagenes-carousel">
                        ${imagenes.slice(0, mostrarPrimeras).map(img => 
                            `<img src="${img.imagen_url}" 
                                  class="producto-img-mini" 
                                  alt="Imagen ${img.orden}"
                                  onerror="this.src='https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'">`
                        ).join('')}
                        ${imagenes.length > 3 ? 
                            `<div class="mas-imagenes">+${imagenes.length - 3}</div>` : ''}
                    </div>
                    <div class="imagenes-count">${imagenes.length} imagen(es)</div>
                `;
            }
            
            return `
                <div class="producto-admin" data-id="${p.id}">
                    <div class="producto-header">
                        <input type="checkbox" class="producto-checkbox" data-id="${p.id}">
                        ${imagenesHTML}
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
            `;
        }).join('');
        
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
// EDICIÓN DE PRODUCTOS
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

window.cerrarModal = function() {
    const modal = document.getElementById('modal-edicion');
    if (modal) modal.remove();
};

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