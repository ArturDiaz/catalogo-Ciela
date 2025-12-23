// admin.js - PANEL ADMIN
const supabase = window.supabaseClient;

// Verificar sesión al cargar
async function verificarSesion() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        await cargarProductosAdmin();
    }
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        alert('Por favor ingresa email y contraseña');
        return;
    }
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        await verificarSesion();
    }
}

function limpiarFormulario() {
    document.getElementById('nombre').value = '';
    document.getElementById('descripcion').value = '';
    document.getElementById('precio').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('imagen').value = '';
}

async function agregarProducto() {
    const producto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value) || 0,
        stock: parseInt(document.getElementById('stock').value) || 0,
        imagen_url: document.getElementById('imagen').value || null,
        activo: true
    };
    
    if (!producto.nombre) {
        alert('El nombre es obligatorio');
        return;
    }
    
    const { error } = await supabase
        .from('productos')
        .insert([producto]);
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert('Producto agregado!');
        await cargarProductosAdmin();
        limpiarFormulario();
    }
}

async function cargarProductosAdmin() {
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .order('created_at', { ascending: false });
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    const lista = document.getElementById('lista-productos');
    lista.innerHTML = productos.map(p => `
        <div class="producto-admin" style="border:1px solid #ccc; padding:10px; margin:10px 0;">
            <h4>${p.nombre} - Stock: ${p.stock} - $${p.precio?.toFixed(2) || '0.00'}</h4>
            <p>${p.descripcion || 'Sin descripción'}</p>
            <button onclick="actualizarStock('${p.id}', 10)">+10 Stock</button>
            <button onclick="actualizarStock('${p.id}', -10)">-10 Stock</button>
            <button onclick="toggleActivo('${p.id}', ${!p.activo})">
                ${p.activo ? 'Desactivar' : 'Activar'}
            </button>
        </div>
    `).join('');
}

async function actualizarStock(productoId, cambio) {
    const { error } = await supabase.rpc('actualizar_stock', {
        producto_id: productoId,
        cantidad_cambio: cambio
    });
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        await cargarProductosAdmin();
    }
}

async function toggleActivo(productoId, nuevoEstado) {
    const { error } = await supabase
        .from('productos')
        .update({ activo: nuevoEstado })
        .eq('id', productoId);
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        await cargarProductosAdmin();
    }
}

// Al cargar la página
document.addEventListener('DOMContentLoaded', verificarSesion);

// Hacer funciones globales para los botones onclick
window.login = login;
window.agregarProducto = agregarProducto;
window.actualizarStock = actualizarStock;
window.toggleActivo = toggleActivo;