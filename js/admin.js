// js/admin.js - VERSIÓN COMPLETA CON ELIMINACIÓN EN CLOUDINARY

// ====================
// CONFIGURACIÓN
// ====================
const CLOUDINARY_CLOUD_NAME = 'dqmlubvqo';
const CLOUDINARY_UPLOAD_PRESET = 'ciela_products';

// ====================
// VARIABLES GLOBALES
// ====================
let imagenesTemporales = [];
let inputImagenes = null;
let productoEnEdicion = null;
let editarImagenesTemp = [];
let editarImagenesAEliminar = [];
let imagenesParaEliminarDeCloudinary = []; // Para trackear qué eliminar

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
// GESTIÓN DE IMÁGENES
// ====================
function inicializarInputImagenes() {
    inputImagenes = document.getElementById('imagenes');
    
    if (inputImagenes) {
        inputImagenes.addEventListener('change', function() {
            if (this.files.length > 0) {
                previewImagenesMultiples(this);
            }
        });
    }
}

window.previewImagenesMultiples = function(input) {
    const previewContainer = document.getElementById('preview-imagenes');
    
    if (!input.files || input.files.length === 0) return;
    
    // Eliminar placeholder si existe
    const placeholder = previewContainer.querySelector('.preview-placeholder');
    if (placeholder) placeholder.remove();
    
    Array.from(input.files).forEach((file) => {
        // Verificar si ya existe
        const existe = imagenesTemporales.find(img => 
            img.file.name === file.name && img.file.size === file.size
        );
        
        if (existe) {
            alert(`La imagen "${file.name}" ya fue agregada`);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const nuevaImagen = {
                file: file,
                previewUrl: e.target.result,
                orden: imagenesTemporales.length + 1,
                id: Date.now() + Math.random()
            };
            
            imagenesTemporales.push(nuevaImagen);
            crearElementoPrevisualizacion(nuevaImagen, previewContainer);
            actualizarOrdenImagenes();
            actualizarInputFiles();
        };
        
        reader.readAsDataURL(file);
    });
};

function crearElementoPrevisualizacion(imagen, container) {
    const previewItem = document.createElement('div');
    previewItem.className = 'imagen-preview-item';
    previewItem.id = `imagen-preview-${imagen.id}`;
    previewItem.innerHTML = `
        <img src="${imagen.previewUrl}" alt="Previsualización">
        <div class="imagen-info">
            <div class="nombre-imagen" title="${imagen.file.name}">
                ${imagen.file.name.length > 15 ? imagen.file.name.substring(0, 15) + '...' : imagen.file.name}
            </div>
            <div class="orden-control">
                <span>Orden:</span>
                <input type="number" class="orden-input" 
                       value="${imagen.orden}" 
                       min="1" max="${imagenesTemporales.length}"
                       onchange="actualizarOrdenImagen(${imagen.id}, this.value)">
            </div>
            <button type="button" class="btn btn-red-pastel" 
                    onclick="eliminarImagenTemporal(${imagen.id})">
                Eliminar
            </button>
        </div>
    `;
    
    container.appendChild(previewItem);
}

window.actualizarOrdenImagen = function(imagenId, nuevoOrden) {
    const imagenIndex = imagenesTemporales.findIndex(img => img.id === imagenId);
    if (imagenIndex === -1) return;
    
    nuevoOrden = Math.max(1, Math.min(parseInt(nuevoOrden), imagenesTemporales.length));
    imagenesTemporales[imagenIndex].orden = nuevoOrden;
    actualizarOrdenImagenes();
    actualizarInputFiles();
};

function actualizarOrdenImagenes() {
    // Ordenar imágenes por orden
    imagenesTemporales.sort((a, b) => a.orden - b.orden);
    
    // Reasignar órdenes consecutivos
    imagenesTemporales.forEach((imagen, index) => {
        imagen.orden = index + 1;
    });
    
    // Actualizar inputs
    document.querySelectorAll('.orden-input').forEach((input, index) => {
        input.value = index + 1;
        input.max = imagenesTemporales.length;
    });
};

window.eliminarImagenTemporal = function(imagenId) {
    const imagenIndex = imagenesTemporales.findIndex(img => img.id === imagenId);
    if (imagenIndex === -1) return;
    
    imagenesTemporales.splice(imagenIndex, 1);
    
    const elemento = document.getElementById(`imagen-preview-${imagenId}`);
    if (elemento) elemento.remove();
    
    actualizarOrdenImagenes();
    actualizarInputFiles();
    
    // Mostrar placeholder si no hay imágenes
    if (imagenesTemporales.length === 0) {
        const previewContainer = document.getElementById('preview-imagenes');
        previewContainer.innerHTML = `
            <div class="preview-placeholder">
                <div class="placeholder-icon">🖼️</div>
                <p>Arrastra o selecciona múltiples imágenes</p>
                <small>Primera imagen será la principal</small>
            </div>
        `;
    }
};

function actualizarInputFiles() {
    if (!inputImagenes) return;
    
    const dt = new DataTransfer();
    imagenesTemporales.forEach(img => {
        dt.items.add(img.file);
    });
    
    inputImagenes.files = dt.files;
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
        
        if (error) throw error;
        
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        await cargarProductosAdmin();
        await cargarCategorias();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.logout = async function() {
    if (window.supabaseClient) {
        await window.supabaseClient.auth.signOut();
    }
    window.location.reload();
};

// ====================
// SUBIDA A CLOUDINARY
// ====================
async function subirImagenACloudinary(file) {
    if (!file.type.startsWith('image/')) {
        throw new Error('Solo se permiten imágenes');
    }
    
    // REDUCE de 10MB a 2MB (línea importante)
    if (file.size > 2 * 1024 * 1024) {
        throw new Error('Máximo 2MB por imagen');
    }
    
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
    formData.append('folder', 'ciela/productos');
    
    // ¡AGREGA ESTAS 2 LÍNEAS! (optimización automática)
    formData.append('transformation', 'q_auto:eco,f_auto,w_1000');
    formData.append('quality', 'auto:good');
    
    const response = await fetch(
        `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Error subiendo imagen');
    }
    
    const data = await response.json();
    return { 
        url: data.secure_url, 
        publicId: data.public_id,
        assetId: data.asset_id 
    };
}

// ====================
// ELIMINAR DE CLOUDINARY
// ====================
async function eliminarImagenDeCloudinary(publicId) {
    try {
        if (!publicId) {
            console.warn('No public_id proporcionado para eliminar');
            return false;
        }
        
        // Crear signature para autenticación (opcional pero recomendado)
        // Para simplificar, usaremos solo el upload_preset
        const formData = new FormData();
        formData.append('public_id', publicId);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);
        
        const response = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/destroy`,
            { 
                method: 'POST', 
                body: formData 
            }
        );
        
        const result = await response.json();
        
        if (response.ok && result.result === 'ok') {
            console.log(`✅ Imagen eliminada de Cloudinary: ${publicId}`);
            return true;
        } else {
            console.warn(`⚠️ No se pudo eliminar imagen ${publicId}:`, result.error?.message || 'Error desconocido');
            return false;
        }
        
    } catch (error) {
        console.error('Error en eliminarImagenDeCloudinary:', error);
        return false;
    }
}

// Función para extraer public_id de la URL de Cloudinary
function extraerPublicIdDeUrl(url) {
    try {
        if (!url || !url.includes('cloudinary.com')) {
            return null;
        }
        
        // Ejemplo de URL: https://res.cloudinary.com/dqmlubvqo/image/upload/v1234567890/ciela/productos/xyz.jpg
        const urlParts = url.split('/');
        
        // Buscar el índice de 'upload'
        const uploadIndex = urlParts.indexOf('upload');
        if (uploadIndex === -1 || uploadIndex >= urlParts.length - 1) {
            return null;
        }
        
        // La parte después de 'upload' contiene la versión y la ruta
        const pathAfterUpload = urlParts.slice(uploadIndex + 1).join('/');
        
        // Eliminar la extensión del archivo
        const withoutExtension = pathAfterUpload.replace(/\.[^/.]+$/, '');
        
        // Eliminar la versión (v1234567890/) si existe
        const withoutVersion = withoutExtension.replace(/^v\d+\//, '');
        
        return withoutVersion;
        
    } catch (error) {
        console.error('Error extrayendo public_id:', error);
        return null;
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
        
        actualizarListaCategoriasUI();
        
    } catch (error) {
        const listaCategorias = document.getElementById('lista-categorias');
        if (listaCategorias) {
            listaCategorias.innerHTML = '<p class="error">Error cargando categorías</p>';
        }
    }
}

function actualizarListaCategoriasUI() {
    const listaCategorias = document.getElementById('lista-categorias');
    if (!listaCategorias) return;
    
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
    if (!confirm('¿Estás seguro de eliminar esta categoría?\nLos productos en esta categoría quedarán sin categoría asignada.')) {
        return;
    }
    
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
// GESTIÓN DE PRODUCTOS
// ====================
window.agregarProducto = async function() {
    const producto = {
        nombre: document.getElementById('nombre').value.trim(),
        descripcion: document.getElementById('descripcion').value.trim(),
        precio: parseFloat(document.getElementById('precio').value) || 0,
        stock: parseInt(document.getElementById('stock').value) || 0,
        orden_visual: parseInt(document.getElementById('orden_visual').value) || 0,
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
        // 1. Insertar el producto
        const { data: productoInsertado, error: productoError } = await window.supabaseClient
            .from('productos')
            .insert([producto])
            .select()
            .single();
        
        if (productoError) throw productoError;
        
        // 2. Subir y asociar imágenes si existen
        if (imagenesTemporales.length > 0) {
            await subirImagenesProducto(productoInsertado.id);
        } else {
            // Imagen por defecto
            await window.supabaseClient
                .from('productos')
                .update({ 
                    imagen_url: 'https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'
                })
                .eq('id', productoInsertado.id);
        }
        
        alert('✅ Producto agregado exitosamente!');
        await cargarProductosAdmin();
        limpiarFormularioProducto();
        
    } catch (error) {
        alert('Error: ' + error.message);
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

async function subirImagenesProducto(productoId) {
    const imagenesPromises = imagenesTemporales.map(async (imagenTemp, index) => {
        try {
            const imagenData = await subirImagenACloudinary(imagenTemp.file);
            
            await window.supabaseClient
                .from('producto_imagenes')
                .insert({
                    producto_id: productoId,
                    imagen_url: imagenData.url,
                    public_id: imagenData.publicId,
                    orden: imagenTemp.orden
                });
            
        } catch (error) {
            alert(`Error subiendo imagen ${imagenTemp.file.name}: ${error.message}`);
        }
    });
    
    await Promise.all(imagenesPromises);
}

function limpiarFormularioProducto() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '0';
    document.getElementById('categoria').value = '';
    
    if (inputImagenes) inputImagenes.value = '';
    
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
                imagenes:producto_imagenes (id, imagen_url, public_id, orden)
            `)
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        window.productosAdmin = productos;
        actualizarListaProductosUI(productos);
        
    } catch (error) {
        const lista = document.getElementById('lista-productos');
        if (lista) lista.innerHTML = '<p class="error">Error cargando productos</p>';
    }
}

// ====================
// GESTIÓN DE ORDEN VISUAL
// ====================

// Función actualizada para incluir el orden visual
function actualizarListaProductosUI(productos) {
    const lista = document.getElementById('lista-productos');
    if (!lista) return;
    
    if (productos.length === 0) {
        lista.innerHTML = '<p class="no-products">No hay productos registrados</p>';
        return;
    }
    
    // Ordenar productos por orden_visual descendente (los más altos primero)
    productos.sort((a, b) => b.orden_visual - a.orden_visual);
    
    lista.innerHTML = productos.map(p => {
        const imagenes = p.imagenes || [];
        const categorias = p.categorias?.nombre || 'Sin categoría';
        
        return `
            <div class="producto-admin" data-id="${p.id}">
                <div class="producto-header flex-c__grid cl-auto-3 gap-10">
                    <input type="checkbox" class="producto-checkbox" data-id="${p.id}">
                    ${generarHTMLImagenesProducto(imagenes)}
                    <div class="producto-info span-2">
                        <div class="flex-r jc-b ai-c mb-2">
                            <h3>${p.nombre}</h3>
                            <div class="flex-r ai-c gap-2">
                                <span class="badge btn-scale-30">Orden: ${p.orden_visual || 0}</span>
                                <!--<button class="btn btn-sm btn-outline-primary" 
                                        onclick="cambiarOrdenVisual('${p.id}', 'up')">
                                    <i class="bi bi-arrow-up"></i>
                                </button>
                                <button class="btn btn-sm btn-outline-primary" 
                                        onclick="cambiarOrdenVisual('${p.id}', 'down')">
                                    <i class="bi bi-arrow-down"></i>
                                </button>-->
                            </div>
                        </div>
                        <p class="producto-desc">${p.descripcion || 'Sin descripción'}</p>
                        <div class="producto-meta">
                            <span class="price">S/ ${p.precio?.toFixed(2) || '0.00'}</span>
                            <span class="stock ${p.stock < 5 ? 'low' : ''}">Stock: ${p.stock}</span>
                            <span class="categoria-badge">${categorias}</span>
                            <span class="status ${p.activo ? 'active' : 'inactive'}">
                                ${p.activo ? 'Activo' : 'Inactivo'}
                            </span>
                        </div>

                        <div class="producto-actions">
                            <div class="stock-control">
                                <button class="btn-minus btn btn-scale-20" onclick="actualizarStock('${p.id}', -1)">-1</button>
                                <button class="btn-minus btn btn-scale-20" onclick="actualizarStock('${p.id}', -5)">-5</button>
                                <button class="btn-plus btn btn-scale-30" onclick="actualizarStock('${p.id}', 1)">+1</button>
                                <button class="btn-plus btn btn-scale-30" onclick="actualizarStock('${p.id}', 5)">+5</button>
                            </div>
                            
                            <div class="action-buttons">
                                <button class="btn-edit btn btn-green-pastel" 
                                        data-bs-toggle="modal" 
                                        data-bs-target="#modalEditarProducto"
                                        onclick="cargarProductoParaEditar('${p.id}')">
                                    Editar
                                </button>
                                <button class="btn-toggle btn btn-scale-20" onclick="toggleActivo('${p.id}', ${!p.activo})">
                                    ${p.activo ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Función para cambiar el orden visual
window.cambiarOrdenVisual = async function(productoId, direccion) {
    try {
        const { data: producto } = await window.supabaseClient
            .from('productos')
            .select('orden_visual')
            .eq('id', productoId)
            .single();
        
        let nuevoOrden = producto.orden_visual || 0;
        
        if (direccion === 'up') {
            nuevoOrden += 1;
        } else if (direccion === 'down') {
            nuevoOrden = Math.max(0, nuevoOrden - 1);
        }
        
        await window.supabaseClient
            .from('productos')
            .update({ orden_visual: nuevoOrden })
            .eq('id', productoId);
        
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// Función para establecer orden específico
window.establecerOrdenEspecifico = async function(productoId) {
    const nuevoOrden = prompt('Ingresa el número de orden (0-999):', '0');
    
    if (nuevoOrden === null) return;
    
    const ordenNum = parseInt(nuevoOrden);
    if (isNaN(ordenNum) || ordenNum < 0 || ordenNum > 999) {
        alert('Por favor ingresa un número entre 0 y 999');
        return;
    }
    
    try {
        await window.supabaseClient
            .from('productos')
            .update({ orden_visual: ordenNum })
            .eq('id', productoId);
        
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

function generarHTMLImagenesProducto(imagenes) {
    if (imagenes.length === 0) return '';
    
    const mostrarPrimeras = Math.min(imagenes.length, 3);
    
    return `
        <div class="content-img flex-c-r gap-10">
            <div class="producto-imagenes-carousel">
                ${imagenes.slice(0, mostrarPrimeras).map(img => 
                    `<img src="${img.imagen_url}" 
                        class="producto-img-mini" 
                        alt="Imagen"
                        onerror="this.src='https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'">`
                ).join('')}
                ${imagenes.length > 3 ? `<div class="mas-imagenes">+${imagenes.length - 3}</div>` : ''}
            </div>
            <div class="imagenes-count">${imagenes.length} imagen(es)</div>
        </div>
    `;
}

window.actualizarStock = async function(productoId, cambio) {
    try {
        const { data: producto } = await window.supabaseClient
            .from('productos')
            .select('stock')
            .eq('id', productoId)
            .single();
        
        const nuevoStock = Math.max(0, (producto.stock || 0) + cambio);
        
        await window.supabaseClient
            .from('productos')
            .update({ stock: nuevoStock })
            .eq('id', productoId);
        
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

window.toggleActivo = async function(productoId, nuevoEstado) {
    try {
        await window.supabaseClient
            .from('productos')
            .update({ activo: nuevoEstado })
            .eq('id', productoId);
        
        await cargarProductosAdmin();
        
    } catch (error) {
        alert('Error: ' + error.message);
    }
};

// ====================
// EDICIÓN USANDO MODAL DE BOOTSTRAP
// ====================
window.cargarProductoParaEditar = async function(productoId) {
    try {
        const { data: producto, error } = await window.supabaseClient
            .from('productos')
            .select(`
                *,
                categorias: categoria_id (id, nombre),
                imagenes:producto_imagenes (id, imagen_url, public_id, orden)
            `)
            .eq('id', productoId)
            .single();
        
        if (error) throw error;
        
        productoEnEdicion = producto;
        editarImagenesTemp = [];
        editarImagenesAEliminar = [];
        
        llenarFormularioEdicion(producto);
        cargarImagenesExistentes(producto.imagenes || []);
        inicializarEventosEdicion();
        
    } catch (error) {
        alert('Error al cargar el producto para editar: ' + error.message);
    }
};

function llenarFormularioEdicion(producto) {
    document.getElementById('edit-producto-id').value = producto.id;
    document.getElementById('edit-nombre').value = producto.nombre;
    document.getElementById('edit-descripcion').value = producto.descripcion || '';
    document.getElementById('edit-precio').value = producto.precio;
    document.getElementById('edit-stock').value = producto.stock;
    document.getElementById('edit-activo').checked = producto.activo;
    document.getElementById('edit-orden_visual').value = producto.orden_visual || 0;

    // Llenar categorías
    const selectCategoria = document.getElementById('edit-categoria');
    if (selectCategoria && window.categorias) {
        selectCategoria.innerHTML = `
            <option value="">Sin categoría</option>
            ${window.categorias.map(cat => 
                `<option value="${cat.id}" ${producto.categoria_id === cat.id ? 'selected' : ''}>
                    ${cat.nombre}
                </option>`
            ).join('')}
        `;
    }
}

function cargarImagenesExistentes(imagenes) {
    const contenedor = document.getElementById('edit-imagenes-existente');
    if (!contenedor) return;
    
    if (imagenes.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No hay imágenes cargadas</p>';
        return;
    }
    
    // Ordenar por orden
    imagenes.sort((a, b) => a.orden - b.orden);
    
    contenedor.innerHTML = `
        <div class="imagenes-existente-grid">
            ${imagenes.map((img, index) => `
                <div class="imagen-existente-item" data-imagen-id="${img.id}">
                    <div class="imagen-existente-header">
                        <span class="imagen-orden">#${index + 1}</span>
                        <button type="button" class="btn btn-sm btn-danger btn-eliminar-imagen" 
                                onclick="marcarImagenParaEliminar('${img.id}', '${img.public_id || extraerPublicIdDeUrl(img.imagen_url) || ''}')">
                            <i class="bi bi-trash"></i>
                        </button>
                    </div>
                    <img src="${img.imagen_url}" 
                         alt="Imagen ${index + 1}" 
                         class="imagen-existente-img img-thumbnail"
                         onerror="this.src='https://res.cloudinary.com/demo/image/upload/v1581330420/sample.jpg'">
                    <div class="imagen-existente-info mt-2">
                        <small class="text-muted">Orden: ${img.orden}</small>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

function inicializarEventosEdicion() {
    // Configurar input para nuevas imágenes
    const inputNuevas = document.getElementById('edit-imagenes-nuevas');
    if (inputNuevas) {
        inputNuevas.onchange = function(e) {
            if (this.files && this.files.length > 0) {
                procesarNuevasImagenes(this.files);
            }
        };
    }
}

window.marcarImagenParaEliminar = async function(imagenId, publicId) {
    if (!confirm('¿Estás seguro de eliminar esta imagen?\nSe borrará también de Cloudinary.')) return;
    
    try {
        // Si no tenemos public_id, intentar extraerlo de la URL
        if (!publicId) {
            // Obtener la imagen para conseguir el public_id
            const { data: imagen } = await window.supabaseClient
                .from('producto_imagenes')
                .select('imagen_url, public_id')
                .eq('id', imagenId)
                .single();
            
            if (imagen) {
                publicId = imagen.public_id || extraerPublicIdDeUrl(imagen.imagen_url);
            }
        }
        
        // Guardar para eliminar de Cloudinary después
        if (publicId) {
            imagenesParaEliminarDeCloudinary.push({
                imagenId,
                publicId
            });
        }
        
        // Marcar para eliminar de la base de datos
        if (!editarImagenesAEliminar.includes(imagenId)) {
            editarImagenesAEliminar.push(imagenId);
        }
        
        // Marcar visualmente
        const elemento = document.querySelector(`[data-imagen-id="${imagenId}"]`);
        if (elemento) {
            elemento.style.opacity = '0.5';
            elemento.style.border = '2px solid red';
            elemento.querySelector('.btn-eliminar-imagen').disabled = true;
            elemento.querySelector('.btn-eliminar-imagen').innerHTML = '<i class="bi bi-check-circle"></i>';
        }
        
    } catch (error) {
        alert('Error al preparar eliminación: ' + error.message);
    }
};

function procesarNuevasImagenes(files) {
    const previewContainer = document.getElementById('edit-preview-nuevas');
    if (!previewContainer) return;
    
    // Eliminar placeholder si existe
    const placeholder = previewContainer.querySelector('.preview-placeholder-edit');
    if (placeholder) placeholder.remove();
    
    Array.from(files).forEach((file) => {
        // Verificar si ya existe
        const existe = editarImagenesTemp.find(img => 
            img.file.name === file.name && img.file.size === file.size
        );
        
        if (existe) {
            alert(`La imagen "${file.name}" ya fue agregada`);
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const nuevaImagen = {
                file: file,
                previewUrl: e.target.result,
                id: Date.now() + Math.random()
            };
            
            editarImagenesTemp.push(nuevaImagen);
            
            const previewItem = document.createElement('div');
            previewItem.className = 'nueva-imagen-preview mb-2';
            previewItem.innerHTML = `
                <div class="card">
                    <div class="card-body p-2">
                        <div class="d-flex align-items-center">
                            <img src="${e.target.result}" alt="Nueva imagen" class="img-thumbnail me-2" style="width: 60px; height: 60px;">
                            <div class="flex-grow-1">
                                <small class="d-block">${file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name}</small>
                                <small class="text-muted">${(file.size / 1024).toFixed(0)} KB</small>
                            </div>
                            <button type="button" class="btn btn-sm btn-outline-danger" 
                                    onclick="eliminarNuevaImagenTemporal('${nuevaImagen.id}')">
                                <i class="bi bi-x"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            previewContainer.appendChild(previewItem);
        };
        
        reader.readAsDataURL(file);
    });
}

window.eliminarNuevaImagenTemporal = function(imagenId) {
    const index = editarImagenesTemp.findIndex(img => img.id === imagenId);
    if (index !== -1) {
        editarImagenesTemp.splice(index, 1);
        
        // Remover del DOM
        const elementos = document.querySelectorAll('.nueva-imagen-preview');
        elementos.forEach(el => {
            if (el.innerHTML.includes(imagenId)) {
                el.remove();
            }
        });
        
        // Mostrar placeholder si no hay imágenes
        const previewContainer = document.getElementById('edit-preview-nuevas');
        if (editarImagenesTemp.length === 0 && previewContainer.children.length === 0) {
            previewContainer.innerHTML = `
                <div class="preview-placeholder-edit">
                    <div class="placeholder-icon-edit">➕</div>
                    <p>Arrastra o selecciona nuevas imágenes</p>
                </div>
            `;
        }
    }
};

// Función auxiliar para ajustar orden
window.ajustarOrdenEdit = function(cambio) {
    const input = document.getElementById('edit-orden_visual');
    if (!input) return;
    
    let valor = parseInt(input.value) || 0;
    valor += cambio;
    if (valor < 0) valor = 0;
    if (valor > 999) valor = 999;
    input.value = valor;
};

// Función auxiliar para ajustar stock en modal de edición
window.ajustarStockEdit = function(cambio) {
    const input = document.getElementById('edit-stock');
    if (!input) return;
    
    let valor = parseInt(input.value) || 0;
    valor += cambio;
    if (valor < 0) valor = 0;
    input.value = valor;
};

window.guardarEdicionCompleta = async function() {
    const productoId = document.getElementById('edit-producto-id').value;
    
    if (!productoId) {
        alert('Error: ID de producto no encontrado');
        return;
    }
    
    const producto = {
        nombre: document.getElementById('edit-nombre').value.trim(),
        descripcion: document.getElementById('edit-descripcion').value.trim(),
        precio: parseFloat(document.getElementById('edit-precio').value) || 0,
        stock: parseInt(document.getElementById('edit-stock').value) || 0,
        orden_visual: parseInt(document.getElementById('edit-orden_visual').value) || 0,
        categoria_id: document.getElementById('edit-categoria').value || null,
        activo: document.getElementById('edit-activo').checked
    };
    
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    if (!producto.precio || producto.precio <= 0) {
        alert('El precio debe ser mayor a 0');
        return;
    }
    
    const btn = document.querySelector('#modalEditarProducto .btn-primary');
    const originalText = btn ? btn.textContent : 'Guardar Cambios';
    
    if (btn) {
        btn.textContent = 'Guardando...';
        btn.disabled = true;
    }
    
    try {
        // 1. Actualizar datos básicos del producto
        await window.supabaseClient
            .from('productos')
            .update(producto)
            .eq('id', productoId);
        
        // 2. Eliminar imágenes marcadas para eliminar (primero de la BD)
        for (const imagenId of editarImagenesAEliminar) {
            await window.supabaseClient
                .from('producto_imagenes')
                .delete()
                .eq('id', imagenId);
        }
        
        // 3. Eliminar imágenes de Cloudinary (después de borrar de la BD)
        for (const imgInfo of imagenesParaEliminarDeCloudinary) {
            await eliminarImagenDeCloudinary(imgInfo.publicId);
        }
        
        // 4. Subir nuevas imágenes si las hay
        if (editarImagenesTemp.length > 0) {
            // Obtener el orden más alto actual
            const { data: imagenesActuales } = await window.supabaseClient
                .from('producto_imagenes')
                .select('orden')
                .eq('producto_id', productoId)
                .order('orden', { ascending: false })
                .limit(1);
            
            let ordenInicio = 1;
            if (imagenesActuales && imagenesActuales.length > 0) {
                ordenInicio = imagenesActuales[0].orden + 1;
            }
            
            // Subir cada nueva imagen
            for (let i = 0; i < editarImagenesTemp.length; i++) {
                try {
                    const imagenData = await subirImagenACloudinary(editarImagenesTemp[i].file);
                    
                    await window.supabaseClient
                        .from('producto_imagenes')
                        .insert({
                            producto_id: productoId,
                            imagen_url: imagenData.url,
                            public_id: imagenData.publicId,
                            orden: ordenInicio + i
                        });
                    
                } catch (error) {
                    console.error(`Error subiendo nueva imagen:`, error);
                }
            }
        }
        
        alert('✅ Producto actualizado exitosamente');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto'));
        if (modal) modal.hide();
        
        // Limpiar variables
        editarImagenesTemp = [];
        editarImagenesAEliminar = [];
        imagenesParaEliminarDeCloudinary = [];
        
        await cargarProductosAdmin();
        
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
// ELIMINACIÓN MASIVA CON CLOUDINARY
// ====================
window.eliminarSeleccionados = async function() {
    const checkboxes = document.querySelectorAll('.producto-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Selecciona al menos un producto');
        return;
    }
    
    if (!confirm(`¿Eliminar ${checkboxes.length} producto(s)?\nSe borrarán también TODAS las imágenes asociadas de Cloudinary.\nEsta acción NO se puede deshacer.`)) {
        return;
    }
    
    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    
    const btn = document.querySelector('#btn-eliminar-seleccionados');
    const originalText = btn ? btn.textContent : 'Eliminar Seleccionados';
    
    if (btn) {
        btn.textContent = 'Eliminando...';
        btn.disabled = true;
    }
    
    try {
        // 1. Primero obtener todas las imágenes de los productos a eliminar
        const { data: imagenes, error: imagenesError } = await window.supabaseClient
            .from('producto_imagenes')
            .select('id, imagen_url, public_id')
            .in('producto_id', ids);
        
        if (imagenesError) throw imagenesError;
        
        // 2. Eliminar imágenes de Cloudinary
        if (imagenes && imagenes.length > 0) {
            let eliminadosExitosos = 0;
            let fallidos = 0;
            
            for (const imagen of imagenes) {
                try {
                    let publicId = imagen.public_id;
                    
                    // Si no hay public_id en la BD, intentar extraerlo de la URL
                    if (!publicId && imagen.imagen_url) {
                        publicId = extraerPublicIdDeUrl(imagen.imagen_url);
                    }
                    
                    if (publicId) {
                        const eliminado = await eliminarImagenDeCloudinary(publicId);
                        if (eliminado) {
                            eliminadosExitosos++;
                        } else {
                            fallidos++;
                        }
                    } else {
                        fallidos++;
                        console.warn('No se pudo obtener public_id para:', imagen.imagen_url);
                    }
                } catch (error) {
                    fallidos++;
                    console.error('Error eliminando imagen:', error);
                }
            }
            
            console.log(`Resultado eliminación Cloudinary: ${eliminadosExitosos} exitosos, ${fallidos} fallidos`);
        }
        
        // 3. Eliminar productos de la base de datos
        await window.supabaseClient
            .from('productos')
            .delete()
            .in('id', ids);
        
        alert(`✅ ${ids.length} producto(s) eliminados\nImágenes eliminadas de Cloudinary: ${imagenes?.length || 0}`);
        await cargarProductosAdmin();
        
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
// LIMPIEZA DE IMÁGENES HUÉRFANAS
// ====================
window.limpiarImagenesHuerfanas = async function() {
    if (!confirm('¿Buscar y mostrar imágenes huérfanas en Cloudinary?\nEsto solo mostrará información, no eliminará nada.')) {
        return;
    }
    
    try {
        // 1. Obtener todas las imágenes en uso de nuestra BD
        const { data: imagenesEnUso, error } = await window.supabaseClient
            .from('producto_imagenes')
            .select('public_id, imagen_url, producto_id');
        
        if (error) throw error;
        
        const publicIdsEnUso = imagenesEnUso
            .filter(img => img.public_id)
            .map(img => ({
                publicId: img.public_id,
                productoId: img.producto_id,
                url: img.imagen_url
            }));
        
        // 2. Mostrar estadísticas
        const mensaje = `
📊 ESTADO DE IMÁGENES:

✅ En uso en base de datos: ${publicIdsEnUso.length} imágenes

💡 Para limpiar imágenes no usadas:
1. Ve a https://cloudinary.com/console
2. Ve a "Media Library"
3. Usa el filtro "View unused assets"
4. Selecciona y elimina las imágenes no usadas

⚠️ Nota: Esta limpieza debe hacerse manualmente en el panel de Cloudinary
por seguridad y para evitar eliminar imágenes por error.
        `;
        
        alert(mensaje);
        
        // 3. Opcional: Mostrar lista detallada en consola
        console.group('📋 Imágenes en uso:');
        publicIdsEnUso.forEach((img, index) => {
            console.log(`${index + 1}. ${img.publicId} (Producto: ${img.productoId})`);
        });
        console.groupEnd();
        
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

window.desactivarSeleccionados = async function() {
    const checkboxes = document.querySelectorAll('.producto-checkbox:checked');
    
    if (checkboxes.length === 0) {
        alert('Selecciona al menos un producto');
        return;
    }
    
    const ids = Array.from(checkboxes).map(cb => cb.dataset.id);
    
    try {
        await window.supabaseClient
            .from('productos')
            .update({ activo: false })
            .in('id', ids);
        
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
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        
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
    inicializarInputImagenes();
    
    // Agregar botón de limpieza si no existe
    setTimeout(() => {
        const accionesMasivas = document.querySelector('.acciones-masivas');
        if (accionesMasivas && !document.getElementById('btn-limpiar-huerfanas')) {
            const btnLimpiar = document.createElement('button');
            btnLimpiar.id = 'btn-limpiar-huerfanas';
            btnLimpiar.className = 'btn btn-warning';
            btnLimpiar.innerHTML = '<i class="bi bi-trash"></i> Limpiar Imágenes Huérfanas';
            btnLimpiar.onclick = () => window.limpiarImagenesHuerfanas();
            accionesMasivas.appendChild(btnLimpiar);
        }
    }, 1000);
}

document.addEventListener('DOMContentLoaded', initAdmin);