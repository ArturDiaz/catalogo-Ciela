// js/admin.js - VERSIÓN COMPLETA ACTUALIZADA
// ==================== VARIABLES GLOBALES ====================
let imagenesTemporales = [];
let inputImagenes = null;
let productoEnEdicion = null;
let editarImagenesTemp = [];
let editarImagenesAEliminar = [];
let editarImagenesPathsAEliminar = [];

// ==================== INICIALIZACIÓN ====================
async function initAdmin() {
    console.log('🚀 Inicializando panel admin...');
    
    try {
        // Esperar a que Supabase esté listo
        let attempts = 0;
        const maxAttempts = 50;
        
        const waitForSupabase = () => {
            return new Promise((resolve) => {
                const check = () => {
                    attempts++;
                    if (window.supabaseClient && window.imageStorage) {
                        console.log('✅ Supabase y Storage listos');
                        resolve();
                        return;
                    }
                    
                    if (attempts >= maxAttempts) {
                        console.warn('⚠️ Timeout esperando Supabase');
                        resolve();
                        return;
                    }
                    
                    setTimeout(check, 100);
                };
                
                check();
            });
        };
        
        await waitForSupabase();
        
        // Verificar sesión automáticamente
        const sesionActiva = await window.verificarSesion();
        
        if (sesionActiva) {
            // Inicializar componentes
            inicializarInputImagenes();
            inicializarModalEdicion();
            console.log('✅ Panel admin inicializado correctamente');
        } else {
            console.log('🔐 Mostrando formulario de login');
        }
        
    } catch (error) {
        console.error('❌ Error inicializando admin:', error);
        window.mostrarAlerta('Error inicializando el sistema: ' + error.message, 'error');
    }
}

// Inicializar eventos del modal
function inicializarModalEdicion() {
    const modal = document.getElementById('modalEditarProducto');
    if (modal) {
        modal.addEventListener('hidden.bs.modal', function() {
            // Resetear variables al cerrar modal
            window.productoEnEdicion = null;
            window.editarImagenesTemp = [];
            window.editarImagenesAEliminar = [];
            window.editarImagenesPathsAEliminar = [];
        });
    }
    
    // Inicializar input de nuevas imágenes
    const inputNuevas = document.getElementById('edit-imagenes-nuevas');
    if (inputNuevas) {
        inputNuevas.addEventListener('change', function() {
            if (this.files.length > 0) {
                previewImagenesEdicion(this);
            }
        });
    }
}

// ==================== GESTIÓN DE IMÁGENES TEMPORALES ====================
function inicializarInputImagenes() {
    inputImagenes = document.getElementById('imagenes');
    
    if (inputImagenes) {
        inputImagenes.addEventListener('change', function() {
            if (this.files.length > 0) {
                previewImagenesMultiples(this);
            }
        });
        
        // Configurar arrastrar y soltar
        const uploadArea = document.querySelector('.image-upload');
        if (uploadArea) {
            uploadArea.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadArea.classList.add('dragover');
            });
            
            uploadArea.addEventListener('dragleave', () => {
                uploadArea.classList.remove('dragover');
            });
            
            uploadArea.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadArea.classList.remove('dragover');
                
                if (e.dataTransfer.files.length > 0) {
                    inputImagenes.files = e.dataTransfer.files;
                    previewImagenesMultiples(inputImagenes);
                }
            });
        }
    }
}

window.previewImagenesMultiples = function(input) {
    const previewContainer = document.getElementById('preview-imagenes');
    
    if (!input.files || input.files.length === 0) return;
    
    // Mostrar loading
    const loading = document.getElementById('loading-imagen');
    if (loading) {
        loading.style.display = 'block';
        loading.innerHTML = '<div class="spinner-border text-primary"></div><p>Procesando imágenes...</p>';
    }
    
    // Eliminar placeholder si existe
    const placeholder = previewContainer.querySelector('.preview-placeholder');
    if (placeholder) placeholder.remove();
    
    // Limpiar imágenes temporales anteriores
    imagenesTemporales = [];
    
    Array.from(input.files).forEach((file, index) => {
        // Verificar si ya existe
        const existe = imagenesTemporales.find(img => 
            img.file.name === file.name && img.file.size === file.size
        );
        
        if (existe) {
            console.log(`Imagen "${file.name}" ya agregada`);
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
            
            // Ocultar loading cuando todas las imágenes estén procesadas
            if (index === input.files.length - 1 && loading) {
                setTimeout(() => {
                    loading.style.display = 'none';
                }, 500);
            }
        };
        
        reader.readAsDataURL(file);
    });
};

function crearElementoPrevisualizacion(imagen, container) {
    const previewItem = document.createElement('div');
    previewItem.className = 'imagen-preview-item';
    previewItem.id = `imagen-preview-${imagen.id}`;
    previewItem.innerHTML = `
        <div class="imagen-preview-container">
            <img src="${imagen.previewUrl}" alt="Previsualización" loading="lazy">
            <div class="imagen-info">
                <div class="nombre-imagen" title="${imagen.file.name}">
                    ${imagen.file.name.length > 15 ? 
                        imagen.file.name.substring(0, 15) + '...' : 
                        imagen.file.name}
                </div>
                <div class="imagen-metadata">
                    <small>${(imagen.file.size / 1024).toFixed(0)} KB</small>
                    <small>${imagen.file.type.split('/')[1].toUpperCase()}</small>
                </div>
                <div class="orden-control">
                    <span>Orden:</span>
                    <input type="number" class="orden-input" 
                           value="${imagen.orden}" 
                           min="1" max="${imagenesTemporales.length}"
                           onchange="actualizarOrdenImagen(${imagen.id}, this.value)">
                </div>
                <button type="button" class="btn btn-red-pastel btn-sm" 
                        onclick="eliminarImagenTemporal(${imagen.id})">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </div>
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
};

function actualizarOrdenImagenes() {
    // Ordenar imágenes por orden
    imagenesTemporales.sort((a, b) => a.orden - b.orden);
    
    // Reasignar órdenes consecutivos
    imagenesTemporales.forEach((imagen, index) => {
        imagen.orden = index + 1;
    });
    
    // Actualizar inputs en la UI
    document.querySelectorAll('.orden-input').forEach((input, index) => {
        input.value = index + 1;
        input.max = imagenesTemporales.length;
    });
}

window.eliminarImagenTemporal = function(imagenId) {
    const imagenIndex = imagenesTemporales.findIndex(img => img.id === imagenId);
    if (imagenIndex === -1) return;
    
    imagenesTemporales.splice(imagenIndex, 1);
    
    const elemento = document.getElementById(`imagen-preview-${imagenId}`);
    if (elemento) elemento.remove();
    
    actualizarOrdenImagenes();
    
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

// ==================== AUTENTICACIÓN ====================
window.login = async function() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        window.mostrarAlerta('Por favor ingresa email y contraseña', 'warning');
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
        
        // Cargar datos iniciales
        await cargarProductosAdmin();
        await window.cargarCategorias();
        
        window.mostrarAlerta('✅ Sesión iniciada correctamente', 'success');
        
    } catch (error) {
        window.mostrarAlerta('Error de autenticación: ' + error.message, 'error');
    }
};

// ==================== GESTIÓN DE PRODUCTOS ====================
window.agregarProducto = async function() {
    // Validar datos básicos
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
        window.mostrarAlerta('El nombre es obligatorio', 'warning');
        return;
    }
    
    if (!producto.precio || producto.precio <= 0) {
        window.mostrarAlerta('El precio debe ser mayor a 0', 'warning');
        return;
    }
    
    const btn = document.querySelector('.add-product .btn-primary');
    const originalText = btn ? btn.textContent : 'Agregar Producto';
    
    if (btn) {
        btn.textContent = 'Procesando...';
        btn.disabled = true;
    }
    
    try {
        // 1. Insertar el producto en la base de datos
        const { data: productoInsertado, error: productoError } = await window.supabaseClient
            .from('productos')
            .insert([producto])
            .select()
            .single();
        
        if (productoError) throw productoError;
        
        console.log('✅ Producto insertado:', productoInsertado.id);
        
        // 2. Subir imágenes a Supabase Storage si existen
        if (imagenesTemporales.length > 0) {
            try {
                await subirImagenesProductoStorage(productoInsertado.id);
            } catch (uploadError) {
                console.error('Error subiendo imágenes:', uploadError);
                // Si falla la subida de imágenes, eliminar el producto
                await window.supabaseClient
                    .from('productos')
                    .delete()
                    .eq('id', productoInsertado.id);
                throw new Error('Error subiendo imágenes: ' + uploadError.message);
            }
        } else {
            // Asignar imagen por defecto
            const imagenPorDefecto = 'https://placehold.co/600x600/e2e8f0/475569?text=Producto+Sin+Imagen';
            await window.supabaseClient
                .from('productos')
                .update({ imagen_url: imagenPorDefecto })
                .eq('id', productoInsertado.id);
        }
        
        window.mostrarAlerta('✅ Producto agregado exitosamente', 'success');
        await cargarProductosAdmin();
        limpiarFormularioProducto();
        
    } catch (error) {
        window.mostrarAlerta('Error: ' + error.message, 'error');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

async function subirImagenesProductoStorage(productoId) {
    if (!window.imageStorage) {
        throw new Error('Storage no disponible');
    }
    
    console.log(`📤 Subiendo ${imagenesTemporales.length} imágenes para producto ${productoId}`);
    
    const files = imagenesTemporales.map(img => img.file);
    
    // Subir imágenes a Supabase Storage
    const uploadedImages = await window.imageStorage.uploadMultipleImages(files, productoId);
    
    // Guardar referencias en la tabla producto_imagenes
    const imagenesPromises = uploadedImages.map((uploadedImage, index) => {
        const orden = imagenesTemporales[index]?.orden || index + 1;
        
        return window.supabaseClient
            .from('producto_imagenes')
            .insert({
                producto_id: productoId,
                imagen_url: uploadedImage.url,
                storage_path: uploadedImage.path,
                orden: orden
            });
    });
    
    await Promise.all(imagenesPromises);
    
    // Actualizar imagen principal del producto
    if (uploadedImages.length > 0) {
        await window.supabaseClient
            .from('productos')
            .update({ imagen_url: uploadedImages[0].url })
            .eq('id', productoId);
    }
    
    console.log(`✅ ${uploadedImages.length} imágenes guardadas en BD`);
}

// ==================== CARGA DE PRODUCTOS ====================
async function cargarProductosAdmin() {
    try {
        const { data: productos, error } = await window.supabaseClient
            .from('productos')
            .select(`
                *,
                categorias: categoria_id (id, nombre),
                producto_imagenes (id, imagen_url, orden, storage_path)
            `)
            .order('orden_visual', { ascending: false })
            .order('id', { ascending: false });
        
        if (error) throw error;
        
        const container = document.getElementById('lista-productos');
        if (!container) return;
        
        if (!productos || productos.length === 0) {
            container.innerHTML = '<p class="text-muted">No hay productos registrados</p>';
            return;
        }
        
        container.innerHTML = productos.map((producto, index) => {
            // Obtener la imagen principal (la primera en orden)
            const imagenes = producto.producto_imagenes || [];
            const imagenPrincipal = imagenes.length > 0 
                ? imagenes.find(img => img.orden === 1)?.imagen_url || imagenes[0].imagen_url
                : 'https://placehold.co/300x300/e2e8f0/475569?text=Sin+Imagen';
            
            return `
            <div class="producto-item">
                <div class="producto-header">
                    <div class="flex-r ai-c jc-sb gap-1">
                        <label class="checkbox-container">
                            <input type="checkbox" 
                                class="producto-checkbox" 
                                data-id="${producto.id}"
                                data-nombre="${producto.nombre}"
                                onchange="actualizarAccionesMasivas()">
                            <span class="checkmark"></span>
                        </label>
                        <h3 class="producto-nombre">${producto.nombre}</h3>
                    </div>
                    <div class="producto-metadata">
                        <span class="badge ${producto.activo ? 'bg-success' : 'bg-secondary'}">
                            ${producto.activo ? 'Activo' : 'Inactivo'}
                        </span>
                        <span class="badge bg-info">ID: ${producto.id.substring(0, 8)}...</span>
                        <span class="badge bg-primary">Orden: ${producto.orden_visual || 0}</span>
                        <span class="badge bg-warning">${imagenes.length} imágenes</span>
                    </div>
                </div>
                
                <div class="producto-content grid cl-3 gap-3">
                    <div class="producto-imagen">
                        <img src="${imagenPrincipal}" 
                             alt="${producto.nombre}" 
                             loading="lazy"
                             onerror="this.src='https://placehold.co/300x300/e2e8f0/475569?text=Error+Cargando'">
                        ${imagenes.length > 1 ? `
                        <div class="imagenes-extra">
                            <span class="badge bg-info">+${imagenes.length - 1} más</span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="producto-info span-2">
                        <p class="producto-descripcion sm:hide">${producto.descripcion || 'Sin descripción'}</p>
                        
                        <div class="producto-detalles">
                            <div class="detalle-item">
                                <span class="detalle-label">Precio:</span>
                                <span class="detalle-valor">S/ ${producto.precio.toFixed(2)}</span>
                            </div>
                            <div class="detalle-item">
                                <span class="detalle-label">Stock:</span>
                                <span class="detalle-valor ${producto.stock <= 0 ? 'text-danger' : ''}">
                                    ${producto.stock} unidades
                                </span>
                            </div>
                            <div class="detalle-item">
                                <span class="detalle-label">Categoría:</span>
                                <span class="detalle-valor">
                                    ${producto.categorias?.nombre || 'Sin categoría'}
                                </span>
                            </div>
                            <div class="detalle-item">
                                <span class="detalle-label">Imágenes:</span>
                                <span class="detalle-valor">
                                    ${imagenes.length} imágenes
                                    ${imagenes.some(img => img.storage_path) ? 
                                        ' (storage)' : 
                                        ' (cloudinary)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="producto-actions">
                    <button class="btn btn-warning btn-sm" 
                            onclick="cargarProductoParaEditar('${producto.id}')"
                            data-bs-toggle="modal" 
                            data-bs-target="#modalEditarProducto">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-danger btn-sm" 
                            onclick="eliminarProductoIndividual('${producto.id}', '${producto.nombre}')">
                        <i class="bi bi-trash"></i> Eliminar
                    </button>
                    <button class="btn ${producto.activo ? 'btn-secondary' : 'btn-success'} btn-sm" 
                            onclick="toggleActivoProducto('${producto.id}', ${producto.activo})">
                        <i class="bi ${producto.activo ? 'bi-eye-slash' : 'bi-eye'}"></i>
                        ${producto.activo ? 'Now' : 'Active'}
                    </button>
                </div>
            </div>
        `}).join('');
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        document.getElementById('lista-productos').innerHTML = 
            `<p class="text-danger">Error cargando productos: ${error.message}</p>`;
    }
}

// ==================== ELIMINACIÓN MASIVA ====================
window.eliminarSeleccionados = async function() {
    const checkboxes = document.querySelectorAll('.producto-checkbox:checked');
    
    if (checkboxes.length === 0) {
        window.mostrarAlerta('Selecciona al menos un producto', 'warning');
        return;
    }
    
    const productosAEliminar = Array.from(checkboxes).map(cb => ({
        id: cb.dataset.id,
        nombre: cb.dataset.nombre || `Producto ${cb.dataset.id}`
    }));
    
    const confirmacion = confirm(
        `¿Eliminar ${productosAEliminar.length} producto(s) permanentemente?\n\n` +
        `📋 Productos seleccionados:\n${productosAEliminar.map(p => `• ${p.nombre}`).join('\n')}\n\n` +
        `⚠️ Esta acción eliminará:\n` +
        `✅ Productos de la base de datos\n` +
        `✅ Todas las imágenes del almacenamiento\n` +
        `✅ Información relacionada\n\n` +
        `❌ NO se puede deshacer`
    );
    
    if (!confirmacion) return;
    
    const btn = document.querySelector('[onclick="eliminarSeleccionados()"]');
    const originalText = btn ? btn.textContent : 'Eliminar Seleccionados';
    const btnIcon = btn ? btn.querySelector('i') : null;
    
    if (btn) {
        btn.textContent = 'Eliminando...';
        btn.disabled = true;
        if (btnIcon) btnIcon.className = 'bi bi-hourglass-split';
    }
    
    try {
        let resultados = {
            exitosos: 0,
            fallidos: 0,
            imagenesEliminadas: 0,
            errores: []
        };
        
        // Procesar cada producto en paralelo para mayor velocidad
        const procesos = productosAEliminar.map(async (producto) => {
            try {
                console.log(`🔄 Procesando eliminación del producto ${producto.id}...`);
                
                // 1. Obtener todas las imágenes del producto
                const { data: imagenes, error: imagenesError } = await window.supabaseClient
                    .from('producto_imagenes')
                    .select('storage_path')
                    .eq('producto_id', producto.id);
                
                if (imagenesError) {
                    throw new Error(`Error obteniendo imágenes: ${imagenesError.message}`);
                }
                
                // 2. Eliminar imágenes del storage si existen
                let imagenesStorageEliminadas = 0;
                if (imagenes && imagenes.length > 0) {
                    const storagePaths = imagenes
                        .map(img => img.storage_path)
                        .filter(path => path && path.trim() !== '');
                    
                    if (storagePaths.length > 0) {
                        try {
                            const { error: storageError } = await window.supabaseClient
                                .storage
                                .from('product-images')
                                .remove(storagePaths);
                            
                            if (!storageError) {
                                imagenesStorageEliminadas = storagePaths.length;
                                resultados.imagenesEliminadas += storagePaths.length;
                                console.log(`✅ ${storagePaths.length} imágenes eliminadas del storage`);
                            } else {
                                console.warn(`⚠️ No se pudieron eliminar algunas imágenes de storage: ${storageError.message}`);
                                // Continuamos aunque falle la eliminación del storage
                            }
                        } catch (storageError) {
                            console.warn(`⚠️ Error eliminando imágenes del storage: ${storageError.message}`);
                            // No detenemos el proceso por errores del storage
                        }
                    }
                }
                
                // 3. Eliminar el producto de la base de datos (CASCADE eliminará las imágenes de la tabla producto_imagenes)
                const { error: deleteError } = await window.supabaseClient
                    .from('productos')
                    .delete()
                    .eq('id', producto.id);
                
                if (deleteError) {
                    throw new Error(`Error eliminando de BD: ${deleteError.message}`);
                }
                
                resultados.exitosos++;
                console.log(`✅ Producto "${producto.nombre}" (${producto.id}) eliminado correctamente`);
                
                return {
                    success: true,
                    productoId: producto.id,
                    productoNombre: producto.nombre,
                    imagenesEliminadas: imagenesStorageEliminadas
                };
                
            } catch (error) {
                resultados.fallidos++;
                resultados.errores.push({
                    productoId: producto.id,
                    productoNombre: producto.nombre,
                    mensaje: error.message
                });
                
                console.error(`❌ Error eliminando producto ${producto.id}:`, error);
                
                return {
                    success: false,
                    productoId: producto.id,
                    error: error.message
                };
            }
        });
        
        // Esperar a que todos los procesos terminen
        const resultadosProcesos = await Promise.allSettled(procesos);
        
        // Mostrar resumen detallado
        let mensajeResumen = `📊 **Resumen de eliminación:**\n\n`;
        mensajeResumen += `✅ **${resultados.exitosos} producto(s) eliminados exitosamente**\n`;
        
        if (resultados.imagenesEliminadas > 0) {
            mensajeResumen += `🗑️ **${resultados.imagenesEliminadas} imagen(es) eliminadas del storage**\n`;
        }
        
        if (resultados.fallidos > 0) {
            mensajeResumen += `\n❌ **${resultados.fallidos} producto(s) con errores:**\n`;
            resultados.errores.forEach((error, index) => {
                mensajeResumen += `${index + 1}. ${error.productoNombre}: ${error.mensaje}\n`;
            });
        }
        
        // Mostrar alerta según resultado
        if (resultados.exitosos > 0 && resultados.fallidos === 0) {
            window.mostrarAlerta(mensajeResumen, 'success');
        } else if (resultados.exitosos > 0 && resultados.fallidos > 0) {
            window.mostrarAlerta(mensajeResumen, 'warning');
        } else {
            window.mostrarAlerta(mensajeResumen, 'error');
        }
        
        // Recargar lista de productos
        await cargarProductosAdmin();
        
        // Desmarcar todos los checkboxes
        document.getElementById('select-all').checked = false;
        
    } catch (error) {
        console.error('❌ Error inesperado:', error);
        window.mostrarAlerta(`Error inesperado: ${error.message}`, 'error');
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
            if (btnIcon) btnIcon.className = 'bi bi-trash-fill';
        }
    }
};

// ==================== FUNCIONES DE EDICIÓN ====================

// Cargar producto para editar
window.cargarProductoParaEditar = async function(productoId) {
    try {
        const { data: producto, error } = await window.supabaseClient
            .from('productos')
            .select(`
                *,
                categorias: categoria_id (id, nombre),
                producto_imagenes (id, imagen_url, orden, storage_path)
            `)
            .eq('id', productoId)
            .single();
        
        if (error) throw error;
        
        window.productoEnEdicion = producto;
        
        // Llenar formulario básico
        document.getElementById('edit-producto-id').value = producto.id;
        document.getElementById('edit-nombre').value = producto.nombre || '';
        document.getElementById('edit-descripcion').value = producto.descripcion || '';
        document.getElementById('edit-precio').value = producto.precio || 0;
        document.getElementById('edit-stock').value = producto.stock || 0;
        document.getElementById('edit-orden_visual').value = producto.orden_visual || 0;
        document.getElementById('edit-activo').checked = producto.activo !== false;
        
        // Seleccionar categoría
        const selectCategoria = document.getElementById('edit-categoria');
        if (selectCategoria && producto.categoria_id) {
            setTimeout(() => {
                selectCategoria.value = producto.categoria_id;
            }, 100);
        }
        
        // Cargar imágenes existentes
        const imagenesContainer = document.getElementById('edit-imagenes-existente');
        if (imagenesContainer) {
            const imagenes = producto.producto_imagenes || [];
            
            if (imagenes.length === 0) {
                imagenesContainer.innerHTML = '<p class="text-muted">No hay imágenes</p>';
            } else {
                imagenesContainer.innerHTML = imagenes.map((img, index) => `
                    <div class="imagen-existente-item" data-id="${img.id}">
                        <div class="imagen-existente-preview">
                            <img src="${img.imagen_url}" 
                                 alt="Imagen ${index + 1}" 
                                 loading="lazy"
                                 onerror="this.src='https://placehold.co/150x150/e2e8f0/475569?text=Error'">
                            <div class="imagen-existente-info">
                                <span class="badge ${img.storage_path ? 'bg-success' : 'bg-warning'}">
                                    ${img.storage_path ? 'Storage' : 'Cloudinary'}
                                </span>
                                <span class="orden-label">Orden: ${img.orden || (index + 1)}</span>
                            </div>
                        </div>
                        <div class="imagen-existente-actions">
                            <button type="button" 
                                    class="btn btn-sm btn-danger"
                                    onclick="eliminarImagenExistente('${img.id}', '${img.storage_path || ''}')">
                                <i class="bi bi-trash"></i> Eliminar
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
        // Resetear imágenes temporales
        window.editarImagenesTemp = [];
        window.editarImagenesAEliminar = [];
        window.editarImagenesPathsAEliminar = [];
        
        const previewContainer = document.getElementById('edit-preview-nuevas');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="preview-placeholder-edit">
                    <div class="placeholder-icon-edit">➕</div>
                    <p>Arrastra o selecciona nuevas imágenes</p>
                </div>
            `;
        }
        
        console.log('✅ Producto cargado para edición:', producto.id);
        
    } catch (error) {
        console.error('❌ Error cargando producto para edición:', error);
        window.mostrarAlerta(`Error cargando producto: ${error.message}`, 'error');
    }
};

// Eliminar imagen existente
window.eliminarImagenExistente = function(imagenId, storagePath) {
    if (!confirm('¿Eliminar esta imagen?\nSe eliminará del producto pero se mantendrá en storage.')) {
        return;
    }
    
    // Marcar para eliminación posterior
    window.editarImagenesAEliminar.push(imagenId);
    if (storagePath) {
        window.editarImagenesPathsAEliminar.push(storagePath);
    }
    
    // Ocultar en la UI
    const imagenElement = document.querySelector(`.imagen-existente-item[data-id="${imagenId}"]`);
    if (imagenElement) {
        imagenElement.style.opacity = '0.3';
        imagenElement.querySelector('.imagen-existente-actions').innerHTML = `
            <span class="text-danger">
                <i class="bi bi-exclamation-triangle"></i> Marcada para eliminar
            </span>
        `;
    }
};

// Guardar edición completa
window.guardarEdicionCompleta = async function() {
    const productoId = document.getElementById('edit-producto-id').value;
    
    if (!productoId) {
        window.mostrarAlerta('No hay producto seleccionado para editar', 'warning');
        return;
    }
    
    const productoData = {
        nombre: document.getElementById('edit-nombre').value.trim(),
        descripcion: document.getElementById('edit-descripcion').value.trim(),
        precio: parseFloat(document.getElementById('edit-precio').value) || 0,
        stock: parseInt(document.getElementById('edit-stock').value) || 0,
        orden_visual: parseInt(document.getElementById('edit-orden_visual').value) || 0,
        categoria_id: document.getElementById('edit-categoria').value || null,
        activo: document.getElementById('edit-activo').checked
    };
    
    if (!productoData.nombre) {
        window.mostrarAlerta('El nombre es obligatorio', 'warning');
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
        const { error: updateError } = await window.supabaseClient
            .from('productos')
            .update(productoData)
            .eq('id', productoId);
        
        if (updateError) throw updateError;
        
        // 2. Eliminar imágenes marcadas para eliminación
        if (window.editarImagenesAEliminar.length > 0) {
            console.log(`🗑️ Eliminando ${window.editarImagenesAEliminar.length} imágenes de la BD`);
            
            // Eliminar de la BD
            const { error: deleteError } = await window.supabaseClient
                .from('producto_imagenes')
                .delete()
                .in('id', window.editarImagenesAEliminar);
            
            if (deleteError) {
                console.warn('⚠️ Error eliminando imágenes de BD:', deleteError);
            }
            
            // Opcional: Eliminar del storage si se desea
            if (window.editarImagenesPathsAEliminar.length > 0) {
                try {
                    await window.supabaseClient.storage
                        .from('product-images')
                        .remove(window.editarImagenesPathsAEliminar);
                    console.log(`✅ ${window.editarImagenesPathsAEliminar.length} imágenes eliminadas del storage`);
                } catch (storageError) {
                    console.warn('⚠️ Error eliminando del storage:', storageError);
                }
            }
        }
        
        // 3. Subir nuevas imágenes si existen
        if (window.editarImagenesTemp.length > 0) {
            console.log(`📤 Subiendo ${window.editarImagenesTemp.length} nuevas imágenes`);
            
            const files = window.editarImagenesTemp.map(img => img.file);
            
            try {
                const uploadedImages = await window.imageStorage.uploadMultipleImages(files, productoId);
                
                // Guardar en la tabla producto_imagenes
                const imagenesPromises = uploadedImages.map((uploadedImage, index) => {
                    const orden = window.editarImagenesTemp[index]?.orden || 
                                 (window.productoEnEdicion?.producto_imagenes?.length || 0) + index + 1;
                    
                    return window.supabaseClient
                        .from('producto_imagenes')
                        .insert({
                            producto_id: productoId,
                            imagen_url: uploadedImage.url,
                            storage_path: uploadedImage.path,
                            orden: orden
                        });
                });
                
                await Promise.all(imagenesPromises);
                
                console.log(`✅ ${uploadedImages.length} nuevas imágenes guardadas`);
                
            } catch (uploadError) {
                console.error('❌ Error subiendo nuevas imágenes:', uploadError);
                throw new Error(`Error subiendo nuevas imágenes: ${uploadError.message}`);
            }
        }
        
        // 4. Cerrar modal y recargar
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarProducto'));
        if (modal) modal.hide();
        
        window.mostrarAlerta('✅ Producto actualizado exitosamente', 'success');
        await cargarProductosAdmin();
        
        // 5. Resetear variables temporales
        window.productoEnEdicion = null;
        window.editarImagenesTemp = [];
        window.editarImagenesAEliminar = [];
        window.editarImagenesPathsAEliminar = [];
        
    } catch (error) {
        console.error('❌ Error guardando cambios:', error);
        window.mostrarAlerta(`Error guardando cambios: ${error.message}`, 'error');
        
    } finally {
        if (btn) {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    }
};

// Preview imágenes en edición
window.previewImagenesEdicion = function(input) {
    const previewContainer = document.getElementById('edit-preview-nuevas');
    if (!previewContainer) return;
    
    // Limpiar placeholder si existe
    const placeholder = previewContainer.querySelector('.preview-placeholder-edit');
    if (placeholder) placeholder.remove();
    
    // Limpiar imágenes temporales anteriores
    editarImagenesTemp = [];
    
    Array.from(input.files).forEach((file, index) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const nuevaImagen = {
                file: file,
                previewUrl: e.target.result,
                id: Date.now() + Math.random()
            };
            
            editarImagenesTemp.push(nuevaImagen);
            crearElementoPrevisualizacionEdicion(nuevaImagen, previewContainer);
        };
        
        reader.readAsDataURL(file);
    });
};

function crearElementoPrevisualizacionEdicion(imagen, container) {
    const previewItem = document.createElement('div');
    previewItem.className = 'imagen-preview-item-edit';
    previewItem.id = `edit-preview-${imagen.id}`;
    previewItem.innerHTML = `
        <div class="imagen-preview-container-edit">
            <img src="${imagen.previewUrl}" alt="Previsualización" loading="lazy">
            <div class="imagen-info-edit">
                <div class="nombre-imagen-edit" title="${imagen.file.name}">
                    ${imagen.file.name.length > 15 ? 
                        imagen.file.name.substring(0, 15) + '...' : 
                        imagen.file.name}
                </div>
                <div class="imagen-metadata-edit">
                    <small>${(imagen.file.size / 1024).toFixed(0)} KB</small>
                    <small>${imagen.file.type.split('/')[1].toUpperCase()}</small>
                </div>
                <button type="button" class="btn btn-red-pastel btn-sm" 
                        onclick="eliminarImagenEdicionTemp(${imagen.id})">
                    <i class="bi bi-trash"></i> Eliminar
                </button>
            </div>
        </div>
    `;
    
    container.appendChild(previewItem);
};

// Eliminar imagen temporal en edición
window.eliminarImagenEdicionTemp = function(imagenId) {
    const imagenIndex = editarImagenesTemp.findIndex(img => img.id === imagenId);
    if (imagenIndex === -1) return;
    
    editarImagenesTemp.splice(imagenIndex, 1);
    
    const elemento = document.getElementById(`edit-preview-${imagenId}`);
    if (elemento) elemento.remove();
    
    // Mostrar placeholder si no hay imágenes
    if (editarImagenesTemp.length === 0) {
        const previewContainer = document.getElementById('edit-preview-nuevas');
        if (previewContainer) {
            previewContainer.innerHTML = `
                <div class="preview-placeholder-edit">
                    <div class="placeholder-icon-edit">➕</div>
                    <p>Arrastra o selecciona nuevas imágenes</p>
                </div>
            `;
        }
    }
};

// ==================== FUNCIONES AUXILIARES ====================
function limpiarFormularioProducto() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '0';
    document.getElementById('orden_visual').value = '0';
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

// ==================== CSS ADICIONAL ====================
document.addEventListener('DOMContentLoaded', function() {
    // Agregar estilos para las imágenes
    const style = document.createElement('style');
    style.textContent = `
        .producto-imagen {
            position: relative;
        }
        
        .imagenes-extra {
            position: absolute;
            bottom: 10px;
            right: 10px;
        }
        
        .imagen-existente-item {
            border: 1px solid #dee2e6;
            border-radius: 4px;
            padding: 10px;
            margin-bottom: 10px;
            transition: opacity 0.3s;
        }
        
        .imagen-existente-preview {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        .imagen-existente-preview img {
            width: 80px;
            height: 80px;
            object-fit: cover;
            border-radius: 4px;
        }
        
        .imagen-existente-info {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        
        .imagen-existente-actions {
            margin-top: 10px;
            text-align: right;
        }
        
        .producto-detalles {
            margin-top: 10px;
        }
        
        .detalle-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            padding-bottom: 5px;
            border-bottom: 1px solid #f0f0f0;
        }
        
        .detalle-label {
            font-weight: bold;
            color: #666;
        }
        
        .detalle-valor {
            color: #333;
        }
        
        .producto-item {
            border: 1px solid #dee2e6;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 20px;
            background: white;
        }
        
        .producto-header {
            border-bottom: 1px solid #eee;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        
        
        .producto-imagen {
            flex: 0 0 200px;
        }
        
        .producto-imagen img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            border-radius: 6px;
        }
        
        .producto-info {
            flex: 1;
        }
        
        
        .producto-metadata {
            display: flex;
            gap: 5px;
            flex-wrap: wrap;
            margin-top: 8px;
        }
    `;
    document.head.appendChild(style);
});

// ==================== INICIALIZAR ====================
document.addEventListener('DOMContentLoaded', initAdmin);