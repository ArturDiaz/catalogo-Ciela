// js/admin.js - VERSIÓN LIMPIA Y OPTIMIZADA

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
    
    // Obtener nombre de la imagen
    const imagenInput = document.getElementById('imagen');
    
    if (imagenInput.files && imagenInput.files[0]) {
        const archivo = imagenInput.files[0];
        const rutaFinal = await generarNombreImagen(archivo.name);
        producto.imagen_url = `img/productos/${rutaFinal}`;
        
        // Mostrar instrucciones para la imagen
        mostrarInstruccionesImagen(producto.imagen_url, archivo);
    } else {
        producto.imagen_url = 'img/default.jpg';
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
        
        alert('✅ Producto agregado exitosamente!\n\nRevisa las instrucciones para la imagen.');
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
    document.getElementById('preview-imagen').innerHTML = '';
}

async function generarNombreImagen(nombreOriginal) {
    try {
        // Consultar productos existentes para obtener el próximo número
        const { data: productos, error } = await window.supabaseClient
            .from('productos')
            .select('imagen_url')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        // Buscar el número más alto usado
        let maxNum = 0;
        productos.forEach(p => {
            if (p.imagen_url && p.imagen_url.includes('producto_')) {
                const match = p.imagen_url.match(/producto_(\d+)\./);
                if (match) {
                    const num = parseInt(match[1]);
                    if (num > maxNum) maxNum = num;
                }
            }
        });
        
        const siguienteNumero = maxNum + 1;
        const numeroFormateado = siguienteNumero.toString().padStart(3, '0');
        
        // Obtener extensión del archivo original
        const extension = nombreOriginal.split('.').pop().toLowerCase();
        
        return `producto_${numeroFormateado}.${extension}`;
        
    } catch (error) {
        console.error('Error generando nombre:', error);
        // Fallback: usar timestamp
        const extension = nombreOriginal.split('.').pop().toLowerCase();
        return `producto_${Date.now()}.${extension}`;
    }
}

function mostrarInstruccionesImagen(rutaImagen, archivo) {
    const nombreArchivo = rutaImagen.split('/').pop();
    
    // Crear modal de instrucciones
    const modalHTML = `
        <div class="modal-overlay" id="instrucciones-modal">
            <div class="modal-content">
                <div class="modal-header">
                    <h2>📋 Instrucciones para la Imagen</h2>
                    <button class="modal-close" onclick="cerrarInstrucciones()">×</button>
                </div>
                <div class="modal-body">
                    <p><strong>Producto guardado en la base de datos ✅</strong></p>
                    <p>Ahora necesitas manejar la imagen manualmente:</p>
                    
                    <div class="instruccion-paso">
                        <strong>1. Nombre del archivo:</strong>
                        <code>${nombreArchivo}</code>
                    </div>
                    
                    <div class="instruccion-paso">
                        <strong>2. Descargar imagen:</strong>
                        <p>Haz clic derecho sobre la imagen → "Guardar imagen como..."</p>
                        <div id="imagen-descarga" style="text-align: center; margin: 15px 0;"></div>
                    </div>
                    
                    <div class="instruccion-paso">
                        <strong>3. Subir a GitHub:</strong>
                        <p>Sube el archivo <code>${nombreArchivo}</code> a la carpeta <code>/img/productos/</code> de tu proyecto</p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="cerrarInstrucciones()">Entendido</button>
                </div>
            </div>
        </div>
    `;
    
    // Remover modal existente si hay
    const modalExistente = document.getElementById('instrucciones-modal');
    if (modalExistente) modalExistente.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // Mostrar la imagen seleccionada para descarga
    if (archivo) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const contenedor = document.getElementById('imagen-descarga');
            if (contenedor) {
                contenedor.innerHTML = `
                    <img src="${e.target.result}" 
                         style="max-width: 250px; max-height: 200px; border: 2px solid #ddd; border-radius: 5px; padding: 5px;">
                    <p><small>Haz clic derecho sobre la imagen para guardarla</small></p>
                `;
            }
        };
        reader.readAsDataURL(archivo);
    }
}

window.cerrarInstrucciones = function() {
    const modal = document.getElementById('instrucciones-modal');
    if (modal) modal.remove();
};

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
                        `<img src="${p.imagen_url}" alt="${p.nombre}" class="producto-img" onerror="this.src='img/default.jpg'">` 
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
                            `<img src="${producto.imagen_url}" class="imagen-preview" style="max-width: 200px; margin: 10px 0;" onerror="this.src='img/default.jpg'">` 
                            : '<p>Sin imagen</p>'
                        }
                        <label for="edit-imagen" style="display: block; margin-top: 10px;">
                            <strong>Cambiar imagen:</strong>
                        </label>
                        <input type="file" id="edit-imagen" accept="image/*" style="margin-top: 5px;">
                        <small>Si seleccionas una nueva imagen, deberás subirla manualmente a GitHub</small>
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
        const archivo = imagenInput.files[0];
        const nuevoNombre = await generarNombreImagen(archivo.name);
        producto.imagen_url = `img/productos/${nuevoNombre}`;
        
        // Mostrar instrucciones para la nueva imagen
        mostrarInstruccionesImagen(producto.imagen_url, archivo);
    } else {
        // Mantener la imagen actual
        producto.imagen_url = productoOriginal?.imagen_url || 'img/default.jpg';
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