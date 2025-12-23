// js/public.js
// CATÁLOGO PÚBLICO - NO declara supabase, usa el global

document.addEventListener('DOMContentLoaded', function() {
    console.log('🛍️ Iniciando catálogo público...');
    cargarProductos();
});

async function cargarProductos() {
    try {
        const { data: productos, error } = await window.supabase
            .from('productos')
            .select('*')
            .eq('activo', true)
            .gt('stock', 0);
        
        if (error) throw error;
        
        const catalogo = document.getElementById('catalogo');
        if (!catalogo) return;
        
        if (!productos || productos.length === 0) {
            catalogo.innerHTML = '<p>No hay productos disponibles</p>';
            return;
        }
        
        catalogo.innerHTML = productos.map(producto => `
            <div class="product-card">
                <img src="${producto.imagen_url || 'img/default.jpg'}" 
                     alt="${producto.nombre}"
                     onerror="this.src='img/default.jpg'">
                <h3>${producto.nombre}</h3>
                <p>${producto.descripcion || ''}</p>
                <div class="product-info">
                    <span class="price">$${producto.precio?.toFixed(2) || '0.00'}</span>
                    <span class="stock">Stock: ${producto.stock}</span>
                </div>
                <button onclick="comprarProducto('${producto.id}')" 
                        ${producto.stock === 0 ? 'disabled' : ''}>
                    ${producto.stock === 0 ? 'Sin Stock' : 'Comprar'}
                </button>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando productos:', error);
        const catalogo = document.getElementById('catalogo');
        if (catalogo) {
            catalogo.innerHTML = '<p>Error cargando productos. Intenta más tarde.</p>';
        }
    }
}

// Hacer función global para los botones
window.comprarProducto = async function(productoId) {
    try {
        const { data, error } = await window.supabase.rpc('decrementar_stock', {
            producto_id: productoId,
            cantidad: 1
        });
        
        if (error) {
            alert('Error en la compra: ' + error.message);
        } else if (data === false) {
            alert('No hay suficiente stock');
        } else {
            alert('¡Compra exitosa!');
            cargarProductos(); // Recargar
        }
    } catch (error) {
        console.error('Error en compra:', error);
        alert('Error inesperado');
    }
};

// Exportar para uso global
window.cargarProductos = cargarProductos;