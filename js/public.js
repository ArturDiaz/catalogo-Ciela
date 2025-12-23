// public.js - CATÁLOGO PÚBLICO
const supabase = window.supabaseClient;

async function cargarProductos() {
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .gt('stock', 0);
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    const catalogo = document.getElementById('catalogo');
    if (!catalogo) return;
    
    catalogo.innerHTML = productos.map(producto => `
        <div class="product-card">
            <img src="${producto.imagen_url || 'img/default.jpg'}" 
                 alt="${producto.nombre}"
                 onerror="this.src='img/default.jpg'">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <div class="product-info">
                <span class="price">$${producto.precio?.toFixed(2) || '0.00'}</span>
                <span class="stock">Stock: ${producto.stock}</span>
            </div>
            <button onclick="comprarProducto('${producto.id}', '${producto.nombre.replace(/'/g, "\\'")}')" 
                    ${producto.stock === 0 ? 'disabled' : ''}>
                ${producto.stock === 0 ? 'Sin Stock' : 'Comprar'}
            </button>
        </div>
    `).join('');
}

async function comprarProducto(productoId, productoNombre) {
    const { data, error } = await supabase.rpc('decrementar_stock', {
        producto_id: productoId,
        cantidad: 1
    });
    
    if (error) {
        alert('Error en la compra: ' + error.message);
    } else if (data === false) {
        alert('No hay suficiente stock');
    } else {
        alert('¡Compra exitosa de ' + productoNombre + '!');
        cargarProductos();
    }
}

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', cargarProductos);