const supabaseUrl = 'TU_URL_SUPABASE';
const supabaseKey = 'TU_KEY_PUBLICA'; // Usa clave anónima, no la secreta

const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

async function cargarProductos() {
    const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .eq('activo', true)
        .gt('stock', 0); // Solo mostrar con stock
    
    if (error) {
        console.error('Error:', error);
        return;
    }
    
    const catalogo = document.getElementById('catalogo');
    catalogo.innerHTML = productos.map(producto => `
        <div class="product-card">
            <img src="${producto.imagen_url || 'default.jpg'}" 
                 alt="${producto.nombre}">
            <h3>${producto.nombre}</h3>
            <p>${producto.descripcion}</p>
            <div class="product-info">
                <span class="price">$${producto.precio}</span>
                <span class="stock">Stock: ${producto.stock}</span>
            </div>
            <button onclick="comprarProducto('${producto.id}')" 
                    ${producto.stock === 0 ? 'disabled' : ''}>
                ${producto.stock === 0 ? 'Sin Stock' : 'Comprar'}
            </button>
        </div>
    `).join('');
}

async function comprarProducto(productoId) {
    // RESTAR STOCK DE FORMA SEGURA
    const { data, error } = await supabase.rpc('decrementar_stock', {
        producto_id: productoId,
        cantidad: 1
    });
    
    if (error) {
        alert('Error en la compra: ' + error.message);
    } else {
        alert('Compra exitosa!');
        cargarProductos(); // Refrescar
    }
}

// Función en Supabase (crear en SQL Editor):
/*
CREATE OR REPLACE FUNCTION decrementar_stock(
    producto_id UUID, 
    cantidad INTEGER
) RETURNS VOID AS $$
BEGIN
    UPDATE productos 
    SET stock = stock - cantidad 
    WHERE id = producto_id 
    AND stock >= cantidad;
END;
$$ LANGUAGE plpgsql;
*/