// js/admin.js - VERSIÓN CON MÚLTIPLES IMÁGENES

// ====================
// CONFIGURACIÓN CLOUDINARY
// ====================
const CLOUDINARY_CLOUD_NAME = 'dqmlubvqo';
const CLOUDINARY_UPLOAD_PRESET = 'ciela_products';

// Variables globales para imágenes
let imagenesSeleccionadas = [];
let nuevasImagenesParaSubir = [];

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
// GESTIÓN DE MÚLTIPLES IMÁGENES
// ====================

// Función para mostrar vista previa de imágenes
window.mostrarPreviewsImagenes = function() {
    const input = document.getElementById('imagenes');
    const previewContainer = document.getElementById('preview-imagenes');
    
    if (!input || !previewContainer) return;
    
    previewContainer.innerHTML = '';
    imagenesSeleccionadas = [];
    
    if (input.files.length === 0) {
        previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">🖼️</div>
                <p>Arrastra o selecciona múltiples imágenes</p>
                <small>Primera imagen será la principal</small>
            </div>
        `;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    Array.from(input.files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert(`La imagen "${file.name}" es demasiado grande (máximo 5MB)`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'imagen-preview-item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <div class="imagen-info">
                    <span>${file.name.length > 15 ? file.name.substring(0, 12) + '...' : file.name}</span>
                    <div class="orden-control">
                        <label>Orden:</label>
                        <input type="number" class="orden-input" value="${index + 1}" min="1" 
                               data-index="${index}" onchange="actualizarOrdenImagen(${index}, this.value)">
                    </div>
                    <button type="button" class="btn-remove-imagen" onclick="removerImagen(${index})">
                        ✕
                    </button>
                </div>
            `;
            fragment.appendChild(div);
        };
        
        reader.readAsDataURL(file);
        imagenesSeleccionadas.push({
            file: file,
            orden: index + 1
        });
    });
    
    previewContainer.appendChild(fragment);
};

// Función para actualizar orden de imagen
window.actualizarOrdenImagen = function(index, nuevoOrden) {
    if (imagenesSeleccionadas[index]) {
        imagenesSeleccionadas[index].orden = parseInt(nuevoOrden) || 1;
    }
};

// Función para remover imagen
window.removerImagen = function(index) {
    imagenesSeleccionadas.splice(index, 1);
    
    // Actualizar inputs y recrear previews
    const input = document.getElementById('imagenes');
    const dt = new DataTransfer();
    
    imagenesSeleccionadas.forEach(img => {
        dt.items.add(img.file);
    });
    
    input.files = dt.files;
    mostrarPreviewsOrdenadas();
};

// Función para mostrar previews ordenadas
function mostrarPreviewsOrdenadas() {
    const previewContainer = document.getElementById('preview-imagenes');
    if (!previewContainer) return;
    
    previewContainer.innerHTML = '';
    
    if (imagenesSeleccionadas.length === 0) {
        previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">🖼️</div>
                <p>Arrastra o selecciona múltiples imágenes</p>
                <small>Primera imagen será la principal</small>
            </div>
        `;
        return;
    }
    
    const fragment = document.createDocumentFragment();
    
    imagenesSeleccionadas.forEach((img, index) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'imagen-preview-item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Preview ${index + 1}">
                <div class="imagen-info">
                    <span>${img.file.name.length > 15 ? img.file.name.substring(0, 12) + '...' : img.file.name}</span>
                    <div class="orden-control">
                        <label>Orden:</label>
                        <input type="number" class="orden-input" value="${img.orden}" min="1" 
                               data-index="${index}" onchange="actualizarOrdenImagen(${index}, this.value)">
                    </div>
                    <button type="button" class="btn-remove-imagen" onclick="removerImagen(${index})">
                        ✕
                    </button>
                </div>
            `;
            fragment.appendChild(div);
        };
        reader.readAsDataURL(img.file);
    });
    
    previewContainer.appendChild(fragment);
}

// ====================
// AGREGAR PRODUCTO CON MÚLTIPLES IMÁGENES
// ====================

window.agregarProducto = async function() {
    const producto = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        precio: parseFloat(document.getElementById('precio').value) || 0,
        stock: parseInt(document.getElementById('stock').value) || 0,
        categoria_id: document.getElementById('categoria').value || null,
        activo: true,
        imagen_url: '' // Se actualizará con la primera imagen
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
    
    if (imagenesSeleccionadas.length === 0) {
        alert('Debes subir al menos una imagen');
        return;
    }
    
    const btn = document.querySelector('.add-product .btn-primary');
    const originalText = btn ? btn.textContent : 'Agregar Producto';
    
    if (btn) {
        btn.textContent = 'Subiendo...';
        btn.disabled = true;
    }
    
    try {
        // 1. Subir imágenes a Cloudinary
        const imagenesSubidas = [];
        
        for (let i = 0; i < imagenesSeleccionadas.length; i++) {
            const imagenData = await subirImagenACloudinary(imagenesSeleccionadas[i].file);
            imagenesSubidas.push({
                url: imagenData.url,
                orden: imagenesSeleccionadas[i].orden
            });
        }
        
        // 2. Insertar producto principal (con primera imagen como principal)
        producto.imagen_url = imagenesSubidas[0].url;
        
        const { data: productoInsertado, error: productoError } = await window.supabaseClient
            .from('productos')
            .insert([producto])
            .select()
            .single();
        
        if (productoError) throw productoError;
        
        // 3. Insertar todas las imágenes en la tabla producto_imagenes
        const imagenesParaInsertar = imagenesSubidas.map((img, index) => ({
            producto_id: productoInsertado.id,
            imagen_url: img.url,
            orden: img.orden || (index + 1)
        }));
        
        const { error: imagenesError } = await window.supabaseClient
            .from('producto_imagenes')
            .insert(imagenesParaInsertar);
        
        if (imagenesError) throw imagenesError;
        
        alert(`✅ Producto agregado con ${imagenesSubidas.length} imagen(es)!`);
        await cargarProductosAdmin();
        limpiarFormularioProducto();
        imagenesSeleccionadas = [];
        
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

// ====================
// CARGAR PRODUCTOS ADMIN CON MÚLTIPLES IMÁGENES
// ====================

async function cargarProductosAdmin() {
    try {
        const { data: productos, error } = await window.supabaseClient
            .from('productos')
            .select(`
                *,
                categorias: categoria_id (nombre),
                producto_imagenes (
                    id,
                    imagen_url,
                    orden
                )
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
            const totalImagenes = p.producto_imagenes?.length || 0;
            
            return `
                <div class="producto-admin" data-id="${p.id}">
                    <div class="producto-header">
                        <input type="checkbox" class="producto-checkbox" data-id="${p.id}">
                        
                        <!-- Mini carrusel de imágenes -->
                        <div class="producto-imagenes-carousel">
                            ${p.producto_imagenes && p.producto_imagenes.length > 0 ? 
                                p.producto_imagenes
                                    .sort((a, b) => a.orden - b.orden)
                                    .slice(0, 3)
                                    .map(img => `
                                        <img src="${img.imagen_url}" 
                                             alt="${p.nombre}" 
                                             class="producto-img-mini"
                                             title="Orden: ${img.orden}"
                                             onerror="this.src='https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'">
                                    `).join('')
                                : 
                                `<div class="no-image">Sin imágenes</div>`
                            }
                            ${totalImagenes > 3 ? 
                                `<div class="mas-imagenes">+${totalImagenes - 3}</div>` 
                                : ''
                            }
                        </div>
                        
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
                                <span class="imagenes-count" title="${totalImagenes} imágenes">
                                    📷 ${totalImagenes}
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
                            <button class="btn-images" onclick="gestionarImagenes('${p.id}')">
                                🖼️ Imágenes
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

// ====================
// GESTIÓN DE IMÁGENES POR PRODUCTO
// ====================

window.gestionarImagenes = async function(productoId) {
    try {
        // Cargar imágenes del producto
        const { data: imagenes, error } = await window.supabaseClient
            .from('producto_imagenes')
            .select('*')
            .eq('producto_id', productoId)
            .order('orden', { ascending: true });
        
        if (error) throw error;
        
        const producto = window.productosAdmin?.find(p => p.id === productoId);
        
        mostrarModalImagenes(producto, imagenes || []);
        
    } catch (error) {
        alert('Error cargando imágenes: ' + error.message);
    }
};

function mostrarModalImagenes(producto, imagenes) {
    const modalHTML = `
        <div class="modal-overlay" id="modal-imagenes">
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h2>🖼️ Imágenes de: ${producto.nombre}</h2>
                    <button class="modal-close" onclick="cerrarModalImagenes()">×</button>
                </div>
                
                <div class="modal-body">
                    <div class="imagenes-grid">
                        ${imagenes.length === 0 ? 
                            '<p class="no-images">No hay imágenes para este producto</p>' :
                            imagenes.map(img => `
                                <div class="imagen-item" data-id="${img.id}">
                                    <img src="${img.imagen_url}" 
                                         alt="Imagen ${img.orden}"
                                         onerror="this.src='https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'">
                                    <div class="imagen-controls">
                                        <div class="orden-control">
                                            <label>Orden:</label>
                                            <input type="number" value="${img.orden}" 
                                                   min="1" 
                                                   onchange="actualizarOrdenImagenDB('${img.id}', this.value, '${producto.id}')">
                                        </div>
                                        <button class="btn-delete-small" 
                                                onclick="eliminarImagen('${img.id}', '${producto.id}')">
                                            🗑️
                                        </button>
                                    </div>
                                </div>
                            `).join('')
                        }
                    </div>
                    
                    <div class="agregar-imagenes-section">
                        <h3>Agregar nuevas imágenes</h3>
                        <input type="file" 
                               id="nuevas-imagenes" 
                               multiple 
                               accept="image/*"
                               onchange="prepararNuevasImagenes()">
                        <div id="preview-nuevas-imagenes" class="preview-grid"></div>
                        <button class="btn-secondary" 
                                onclick="subirNuevasImagenes('${producto.id}')"
                                style="margin-top: 10px;">
                            📤 Subir nuevas imágenes
                        </button>
                    </div>
                </div>
                
                <div class="modal-footer">
                    <button class="btn-cancel" onclick="cerrarModalImagenes()">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    const modalExistente = document.getElementById('modal-imagenes');
    if (modalExistente) modalExistente.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    nuevasImagenesParaSubir = [];
}

window.cerrarModalImagenes = function() {
    const modal = document.getElementById('modal-imagenes');
    if (modal) modal.remove();
};

window.actualizarOrdenImagenDB = async function(imagenId, nuevoOrden, productoId) {
    try {
        const ordenNum = parseInt(nuevoOrden);
        if (ordenNum < 1) {
            alert('El orden debe ser al menos 1');
            return;
        }
        
        const { error } = await window.supabaseClient
            .from('producto_imagenes')
            .update({ orden: ordenNum })
            .eq('id', imagenId);
        
        if (error) throw error;
        
        // Actualizar la imagen principal si es la primera
        if (ordenNum === 1) {
            const imagenItem = document.querySelector(`.imagen-item[data-id="${imagenId}"]`);
            const imgSrc = imagenItem.querySelector('img').src;
            
            await window.supabaseClient
                .from('productos')
                .update({ imagen_url: imgSrc })
                .eq('id', productoId);
                
            await cargarProductosAdmin();
        }
        
        // Recargar el modal
        await gestionarImagenes(productoId);
        
    } catch (error) {
        alert('Error actualizando orden: ' + error.message);
    }
};

window.eliminarImagen = async function(imagenId, productoId) {
    if (!confirm('¿Eliminar esta imagen?')) return;
    
    try {
        const { error } = await window.supabaseClient
            .from('producto_imagenes')
            .delete()
            .eq('id', imagenId);
        
        if (error) throw error;
        
        // Verificar si quedan imágenes
        const { data: imagenesRestantes } = await window.supabaseClient
            .from('producto_imagenes')
            .select('imagen_url, orden')
            .eq('producto_id', productoId)
            .order('orden', { ascending: true });
        
        // Si era la imagen principal, actualizar producto
        if (imagenesRestantes && imagenesRestantes.length > 0) {
            await window.supabaseClient
                .from('productos')
                .update({ imagen_url: imagenesRestantes[0].imagen_url })
                .eq('id', productoId);
        } else {
            // Si no quedan imágenes, poner una por defecto
            await window.supabaseClient
                .from('productos')
                .update({ imagen_url: 'https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg' })
                .eq('id', productoId);
        }
        
        alert('✅ Imagen eliminada');
        await cargarProductosAdmin();
        await gestionarImagenes(productoId);
        
    } catch (error) {
        alert('Error eliminando imagen: ' + error.message);
    }
};

// Funciones para nuevas imágenes en modal
window.prepararNuevasImagenes = function() {
    const input = document.getElementById('nuevas-imagenes');
    const previewContainer = document.getElementById('preview-nuevas-imagenes');
    
    if (!input || !previewContainer) return;
    
    previewContainer.innerHTML = '';
    nuevasImagenesParaSubir = [];
    
    Array.from(input.files).forEach((file, index) => {
        if (!file.type.startsWith('image/')) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert(`La imagen "${file.name}" es demasiado grande (máximo 5MB)`);
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'imagen-preview-item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Nueva imagen ${index + 1}">
                <div class="imagen-info">
                    <span>${file.name.substring(0, 15)}...</span>
                    <div class="orden-control">
                        <label>Orden:</label>
                        <input type="number" class="orden-input" value="${index + 1}" min="1" 
                               data-index="${index}">
                    </div>
                    <button type="button" class="btn-remove-imagen" onclick="removerNuevaImagen(${index})">
                        ✕
                    </button>
                </div>
            `;
            previewContainer.appendChild(div);
        };
        
        reader.readAsDataURL(file);
        nuevasImagenesParaSubir.push({
            file: file,
            orden: index + 1
        });
    });
    
    input.value = '';
};

window.removerNuevaImagen = function(index) {
    nuevasImagenesParaSubir.splice(index, 1);
    
    // Recrear previews
    const previewContainer = document.getElementById('preview-nuevas-imagenes');
    previewContainer.innerHTML = '';
    
    nuevasImagenesParaSubir.forEach((img, i) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            const div = document.createElement('div');
            div.className = 'imagen-preview-item';
            div.innerHTML = `
                <img src="${e.target.result}" alt="Nueva imagen ${i + 1}">
                <div class="imagen-info">
                    <span>${img.file.name.substring(0, 15)}...</span>
                    <div class="orden-control">
                        <label>Orden:</label>
                        <input type="number" class="orden-input" value="${i + 1}" min="1" 
                               data-index="${i}">
                    </div>
                    <button type="button" class="btn-remove-imagen" onclick="removerNuevaImagen(${i})">
                        ✕
                    </button>
                </div>
            `;
            previewContainer.appendChild(div);
        };
        reader.readAsDataURL(img.file);
    });
};

window.subirNuevasImagenes = async function(productoId) {
    if (nuevasImagenesParaSubir.length === 0) {
        alert('No hay imágenes para subir');
        return;
    }
    
    const producto = window.productosAdmin?.find(p => p.id === productoId);
    
    try {
        // Obtener el máximo orden actual
        const { data: imagenesExistentes } = await window.supabaseClient
            .from('producto_imagenes')
            .select('orden')
            .eq('producto_id', productoId)
            .order('orden', { ascending: false })
            .limit(1);
        
        let siguienteOrden = 1;
        if (imagenesExistentes && imagenesExistentes.length > 0) {
            siguienteOrden = imagenesExistentes[0].orden + 1;
        }
        
        // Subir nuevas imágenes
        for (let i = 0; i < nuevasImagenesParaSubir.length; i++) {
            const img = nuevasImagenesParaSubir[i];
            const imagenData = await subirImagenACloudinary(img.file);
            
            await window.supabaseClient
                .from('producto_imagenes')
                .insert([{
                    producto_id: productoId,
                    imagen_url: imagenData.url,
                    orden: siguienteOrden + i
                }]);
        }
        
        alert(`✅ ${nuevasImagenesParaSubir.length} imagen(es) agregadas`);
        nuevasImagenesParaSubir = [];
        document.getElementById('preview-nuevas-imagenes').innerHTML = '';
        document.getElementById('nuevas-imagenes').value = '';
        
        // Recargar imágenes
        await gestionarImagenes(productoId);
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error subiendo imágenes: ' + error.message);
    }
};

// ====================
// FUNCIONES DE PRODUCTOS
// ====================

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
// EDICIÓN DE PRODUCTOS (SIMPLIFICADA)
// ====================

window.editarProducto = async function(productoId) {
    const producto = window.productosAdmin?.find(p => p.id === productoId);
    if (!producto) return;
    
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
                    
                    <p><strong>Nota:</strong> Para gestionar imágenes, usa el botón 🖼️ en la lista de productos</p>
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
};

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
// LIMPIAR FORMULARIO
// ====================

function limpiarFormularioProducto() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '0';
    document.getElementById('categoria').value = '';
    document.getElementById('imagenes').value = '';
    document.getElementById('preview-imagenes').innerHTML = `
        <div class="preview-placeholder">
            <div class="placeholder-icon">🖼️</div>
            <p>Arrastra o selecciona múltiples imágenes</p>
            <small>Primera imagen será la principal</small>
        </div>
    `;
    imagenesSeleccionadas = [];
}

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

// Estilos adicionales para múltiples imágenes
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
    
    /* Estilos para múltiples imágenes */
    .preview-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin-top: 10px;
        min-height: 150px;
    }
    
    .imagen-preview-item {
        width: 120px;
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        background: white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .imagen-preview-item img {
        width: 100%;
        height: 80px;
        object-fit: cover;
        display: block;
    }
    
    .imagen-info {
        padding: 8px;
        background: #f8f9fa;
        border-top: 1px solid #ddd;
        font-size: 12px;
    }
    
    .orden-control {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 4px 0;
        font-size: 11px;
    }
    
    .orden-control input {
        width: 40px;
        padding: 2px 4px;
        border: 1px solid #ccc;
        border-radius: 3px;
        font-size: 11px;
    }
    
    .btn-remove-imagen {
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 3px;
        padding: 2px 6px;
        cursor: pointer;
        font-size: 10px;
        width: 100%;
        margin-top: 4px;
    }
    
    .preview-placeholder {
        text-align: center;
        padding: 20px;
        color: #666;
        width: 100%;
        border: 2px dashed #ddd;
        border-radius: 8px;
    }
    
    .placeholder-icon {
        font-size: 2rem;
        margin-bottom: 10px;
    }
    
    /* Producto admin con mini imágenes */
    .producto-imagenes-carousel {
        display: flex;
        gap: 5px;
        margin-right: 15px;
    }
    
    .producto-img-mini {
        width: 50px;
        height: 50px;
        object-fit: cover;
        border-radius: 4px;
        border: 2px solid #ddd;
    }
    
    .mas-imagenes {
        width: 50px;
        height: 50px;
        background: #6c757d;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 4px;
        font-size: 11px;
    }
    
    .imagenes-count {
        background: #e3f2fd;
        color: #1976d2;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
    }
    
    .btn-images {
        background: #e3f2fd;
        color: #1976d2;
        border: 1px solid #bbdefb;
        padding: 6px 12px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
    }
    
    /* Modal de imágenes */
    .imagenes-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
        gap: 15px;
        margin-bottom: 20px;
        max-height: 400px;
        overflow-y: auto;
        padding: 10px;
    }
    
    .imagen-item {
        border: 1px solid #ddd;
        border-radius: 8px;
        overflow: hidden;
        background: white;
    }
    
    .imagen-item img {
        width: 100%;
        height: 100px;
        object-fit: cover;
    }
    
    .imagen-controls {
        padding: 8px;
        background: #f8f9fa;
        border-top: 1px solid #ddd;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .agregar-imagenes-section {
        margin-top: 20px;
        padding: 15px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px dashed #ccc;
    }
    
    .preview-grid {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 10px 0;
        max-height: 200px;
        overflow-y: auto;
    }
    
    @keyframes pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
    }
`;
document.head.appendChild(style);