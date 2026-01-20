// js/config.js - CONFIGURACIÓN COMPLETA
(function() {
    const SUPABASE_URL = 'https://xkzxforgasbdamgtarcz.supabase.co';
    const SUPABASE_KEY = 'sb_publishable_CJ5yPSBEGz7wgeSmChIWoA_aEMdNOlg';
    
    if (typeof window.supabase === 'undefined') {
        console.error('Supabase no está cargado');
        return;
    }
    
    try {
        window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
                detectSessionInUrl: true
            }
        });
        
        console.log('✅ Cliente Supabase configurado');
        
    } catch (error) {
        console.error('Error creando cliente Supabase:', error);
    }
    
    // ==================== STORAGE CONFIGURATION ====================
    window.imageStorage = {
        bucketName: 'product-images',
        
        // Subir múltiples imágenes
        uploadMultipleImages: async function(files, productoId) {
            const uploadedImages = [];
            
            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
                const filePath = `${productoId}/${fileName}`;
                
                try {
                    console.log(`📤 Subiendo imagen ${i + 1}/${files.length}: ${file.name}`);
                    
                    const { data, error } = await window.supabaseClient.storage
                        .from(this.bucketName)
                        .upload(filePath, file);
                    
                    if (error) throw error;
                    
                    // Obtener URL pública
                    const { data: urlData } = window.supabaseClient.storage
                        .from(this.bucketName)
                        .getPublicUrl(data.path);
                    
                    uploadedImages.push({
                        path: data.path,
                        url: urlData.publicUrl,
                        fileName: file.name
                    });
                    
                    console.log(`✅ Imagen ${i + 1} subida: ${urlData.publicUrl}`);
                    
                } catch (error) {
                    console.error(`❌ Error subiendo imagen ${i + 1}:`, error);
                    throw new Error(`Error subiendo imagen ${file.name}: ${error.message}`);
                }
            }
            
            console.log(`✅ ${uploadedImages.length} imágenes subidas exitosamente`);
            return uploadedImages;
        },
        
        // Eliminar múltiples imágenes
        deleteMultipleImages: async function(paths) {
            try {
                if (!paths || paths.length === 0) {
                    console.log('⚠️ No hay imágenes para eliminar');
                    return true;
                }
                
                console.log(`🗑️ Eliminando ${paths.length} imágenes del storage...`);
                
                const { error } = await window.supabaseClient.storage
                    .from(this.bucketName)
                    .remove(paths);
                
                if (error) throw error;
                
                console.log(`✅ ${paths.length} imágenes eliminadas del storage`);
                return true;
                
            } catch (error) {
                console.error('❌ Error eliminando imágenes:', error);
                throw error;
            }
        }
    };
    
    // ==================== FUNCIONES AUXILIARES ====================
    
    // Función para mostrar alertas
    window.mostrarAlerta = function(mensaje, tipo = 'info') {
        // Eliminar alertas anteriores
        const alertasAnteriores = document.querySelectorAll('.alert-flotante');
        alertasAnteriores.forEach(alerta => alerta.remove());
        
        const alerta = document.createElement('div');
        alerta.className = `alert-flotante alert-${tipo}`;
        alerta.innerHTML = `
            <div class="alert-content">
                <span class="alert-message">${mensaje}</span>
                <button class="alert-close" onclick="this.parentElement.parentElement.remove()">&times;</button>
            </div>
        `;
        
        document.body.appendChild(alerta);
        
        // Auto-eliminar después de 5 segundos
        setTimeout(() => {
            if (alerta.parentNode) {
                alerta.remove();
            }
        }, 5000);
    };
    
    // Verificar sesión
    window.verificarSesion = async function() {
        try {
            console.log('🔐 Verificando sesión...');
            
            const { data: { session }, error } = await window.supabaseClient.auth.getSession();
            
            if (error) {
                console.error('❌ Error verificando sesión:', error);
                return false;
            }
            
            if (session) {
                console.log('✅ Usuario autenticado:', session.user.email);
                
                // Ocultar login y mostrar panel
                const loginForm = document.getElementById('login-form');
                const adminPanel = document.getElementById('admin-panel');
                
                if (loginForm) loginForm.style.display = 'none';
                if (adminPanel) adminPanel.style.display = 'block';
                
                // Cargar datos iniciales
                await cargarProductosAdmin();
                await cargarCategorias();
                
                return true;
            } else {
                console.log('🔓 Usuario no autenticado');
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error en verificarSesion:', error);
            return false;
        }
    };
    
    // Cargar categorías
    window.cargarCategorias = async function() {
        try {
            console.log('📁 Cargando categorías...');
            
            const { data: categorias, error } = await window.supabaseClient
                .from('categorias')
                .select('*')
                .order('nombre');
            
            if (error) {
                console.error('❌ Error cargando categorías:', error);
                mostrarAlerta('Error cargando categorías: ' + error.message, 'error');
                return [];
            }
            
            console.log(`✅ ${categorias.length} categorías cargadas`);
            
            // Actualizar select de categorías en agregar producto
            const selectCategoria = document.getElementById('categoria');
            const selectEditCategoria = document.getElementById('edit-categoria');
            
            if (selectCategoria) {
                selectCategoria.innerHTML = '<option value="">Selecciona una categoría</option>' +
                    categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
            }
            
            if (selectEditCategoria) {
                selectEditCategoria.innerHTML = '<option value="">Sin categoría</option>' +
                    categorias.map(cat => `<option value="${cat.id}">${cat.nombre}</option>`).join('');
            }
            
            // También actualizar lista de categorías en la pestaña
            const listaCategorias = document.getElementById('lista-categorias');
            if (listaCategorias) {
                if (categorias.length === 0) {
                    listaCategorias.innerHTML = '<p class="text-muted">No hay categorías registradas</p>';
                } else {
                    listaCategorias.innerHTML = categorias.map(cat => `
                        <div class="categoria-item">
                            <div class="categoria-header">
                                <h4>${cat.nombre}</h4>
                                <button class="btn btn-sm btn-danger" onclick="eliminarCategoria('${cat.id}', '${cat.nombre}')">
                                    <i class="bi bi-trash"></i>
                                </button>
                            </div>
                            ${cat.descripcion ? `<p class="categoria-descripcion">${cat.descripcion}</p>` : ''}
                            <small class="text-muted">ID: ${cat.id}</small>
                        </div>
                    `).join('');
                }
            }
            
            return categorias;
            
        } catch (error) {
            console.error('❌ Error cargando categorías:', error);
            mostrarAlerta('Error cargando categorías: ' + error.message, 'error');
            return [];
        }
    };
    
    // Agregar categoría
    window.agregarCategoria = async function() {
        const nombreInput = document.getElementById('categoria-nombre');
        const descripcionInput = document.getElementById('categoria-descripcion');
        
        const nombre = nombreInput ? nombreInput.value.trim() : '';
        const descripcion = descripcionInput ? descripcionInput.value.trim() : '';
        
        if (!nombre) {
            mostrarAlerta('El nombre de la categoría es obligatorio', 'warning');
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
                    descripcion: descripcion || null
                }])
                .select()
                .single();
            
            if (error) throw error;
            
            mostrarAlerta('✅ Categoría agregada exitosamente', 'success');
            
            // Limpiar formulario
            if (nombreInput) nombreInput.value = '';
            if (descripcionInput) descripcionInput.value = '';
            
            // Recargar categorías
            await cargarCategorias();
            
        } catch (error) {
            console.error('❌ Error agregando categoría:', error);
            mostrarAlerta('Error agregando categoría: ' + error.message, 'error');
            
        } finally {
            if (btn) {
                btn.textContent = originalText;
                btn.disabled = false;
            }
        }
    };
    
    // Eliminar categoría
    window.eliminarCategoria = async function(categoriaId, categoriaNombre) {
        if (!confirm(`¿Estás seguro de eliminar la categoría "${categoriaNombre}"?\n\nEsta acción no se puede deshacer.`)) {
            return;
        }
        
        try {
            const { error } = await window.supabaseClient
                .from('categorias')
                .delete()
                .eq('id', categoriaId);
            
            if (error) throw error;
            
            mostrarAlerta(`✅ Categoría "${categoriaNombre}" eliminada`, 'success');
            await cargarCategorias();
            
        } catch (error) {
            console.error('❌ Error eliminando categoría:', error);
            mostrarAlerta(`Error eliminando categoría: ${error.message}`, 'error');
        }
    };
    
    // ==================== FUNCIONES DE EDICIÓN ====================
    
    // Llenar formulario de edición
    window.llenarFormularioEdicion = function(producto) {
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
    };
    
    // Inicializar eventos de edición
    window.inicializarEventosEdicion = function() {
        const inputNuevas = document.getElementById('edit-imagenes-nuevas');
        if (inputNuevas) {
            inputNuevas.addEventListener('change', function() {
                if (this.files.length > 0) {
                    previewImagenesEdicion(this);
                }
            });
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
    
    // ==================== TEST DE CONEXIÓN ====================
    async function testConexion() {
        try {
            console.log('🔍 Probando conexión a Supabase...');
            
            // Probar autenticación
            const { data: { session } } = await window.supabaseClient.auth.getSession();
            console.log('✅ Sesión:', session ? 'Activa' : 'Inactiva');
            
            // Probar storage
            try {
                const { data: buckets } = await window.supabaseClient.storage.listBuckets();
                console.log('✅ Storage disponible. Buckets:', buckets?.length || 0);
                
                // Verificar que el bucket de imágenes exista
                const bucketImagenes = buckets?.find(b => b.name === 'product-images');
                if (bucketImagenes) {
                    console.log('✅ Bucket "product-images" encontrado');
                } else {
                    console.warn('⚠️ Bucket "product-images" no encontrado');
                }
                
            } catch (storageError) {
                console.warn('⚠️ Storage no disponible o sin permisos:', storageError.message);
            }
            
        } catch (error) {
            console.error('❌ Error en test de conexión:', error);
        }
    }
    
    // Ejecutar test cuando esté listo
    setTimeout(testConexion, 1500);
    
    // Asegurar que las variables globales estén disponibles
    window.imagenesTemporales = [];
    window.inputImagenes = null;
    window.productoEnEdicion = null;
    window.editarImagenesTemp = [];
    window.editarImagenesAEliminar = [];
    window.editarImagenesPathsAEliminar = [];
    
})();