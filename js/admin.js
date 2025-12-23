const supabaseUrl = 'TU_URL_SUPABASE';
const supabaseKey = 'TU_KEY_ADMIN'; // Key con permisos

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Verificar sesión al cargar
async function verificarSesion() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('admin-panel').style.display = 'block';
        cargarProductosAdmin();
    }
}

async function login() {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
    });
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        verificarSesion();
    }
}

async function agregarProducto() {
    const producto = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        precio: parseFloat(document.getElementById('precio').value),
        stock: parseInt(document.getElementById('stock').value),
        imagen_url: document.getElementById('imagen').value
    };
    
    const { error } = await supabase
        .from('productos')
        .insert([producto]);
    
    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert('Producto agregado!');
        cargarProductosAdmin();
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
        <div class="producto-admin">
            <h4>${p.nombre} - Stock: ${p.stock}</h4>
            <button onclick="actualizarStock('${p.id}', 10)">+10</button>
            <button onclick="actualizarStock('${p.id}', -10)">-10</button>
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
        cargarProductosAdmin();
    }
}

// Al cargar la página
document.addEventListener('DOMContentLoaded', verificarSesion);