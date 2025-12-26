<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración
$uploadDir = 'img/uploads/';
$productosDir = 'img/productos/';
$maxFileSize = 5 * 1024 * 1024; // 5MB
$allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

// Crear carpetas si no existen
if (!file_exists($uploadDir)) mkdir($uploadDir, 0755, true);
if (!file_exists($productosDir)) mkdir($productosDir, 0755, true);

// Función para generar nombre único
function generarNombreUnico($extension) {
    // Buscar el siguiente número disponible
    $contador = 1;
    $productosDir = 'img/productos/';
    
    // Buscar el último número usado
    $archivos = scandir($productosDir);
    $numeros = [];
    
    foreach ($archivos as $archivo) {
        if (preg_match('/^producto_(\d+)\./', $archivo, $matches)) {
            $numeros[] = (int)$matches[1];
        }
    }
    
    if (!empty($numeros)) {
        $contador = max($numeros) + 1;
    }
    
    // Formatear con 3 dígitos
    $numeroFormateado = str_pad($contador, 3, '0', STR_PAD_LEFT);
    
    return "producto_{$numeroFormateado}{$extension}";
}

// Manejar la subida
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!isset($_FILES['imagen']) || $_FILES['imagen']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode(['error' => 'No se recibió ningún archivo']);
        exit;
    }
    
    $file = $_FILES['imagen'];
    
    // Validar tipo
    if (!in_array($file['type'], $allowedTypes)) {
        echo json_encode(['error' => 'Tipo de archivo no permitido. Solo JPG, PNG, WebP o GIF']);
        exit;
    }
    
    // Validar tamaño
    if ($file['size'] > $maxFileSize) {
        echo json_encode(['error' => 'Archivo demasiado grande. Máximo 5MB']);
        exit;
    }
    
    // Obtener extensión
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if ($extension === 'jpeg') $extension = 'jpg';
    
    // Generar nombre único
    $nombreArchivo = generarNombreUnico('.' . $extension);
    $rutaTemporal = $uploadDir . basename($file['name']);
    $rutaFinal = $productosDir . $nombreArchivo;
    
    // Mover archivo temporal
    if (move_uploaded_file($file['tmp_name'], $rutaTemporal)) {
        // Optimizar imagen (opcional)
        if ($extension === 'jpg' || $extension === 'jpeg') {
            $imagen = imagecreatefromjpeg($rutaTemporal);
            imagejpeg($imagen, $rutaFinal, 85); // 85% calidad
            imagedestroy($imagen);
        } elseif ($extension === 'png') {
            $imagen = imagecreatefrompng($rutaTemporal);
            imagepng($imagen, $rutaFinal, 8); // Compresión PNG
            imagedestroy($imagen);
        } elseif ($extension === 'webp') {
            $imagen = imagecreatefromwebp($rutaTemporal);
            imagewebp($imagen, $rutaFinal, 85);
            imagedestroy($imagen);
        } else {
            // Para GIF, copiar directamente
            copy($rutaTemporal, $rutaFinal);
        }
        
        // Eliminar archivo temporal
        unlink($rutaTemporal);
        
        // URL relativa para usar en el proyecto
        $urlImagen = 'img/productos/' . $nombreArchivo;
        
        echo json_encode([
            'success' => true,
            'url' => $urlImagen,
            'nombre' => $nombreArchivo,
            'tamaño' => filesize($rutaFinal)
        ]);
        
    } else {
        echo json_encode(['error' => 'Error al guardar el archivo']);
    }
    
} else {
    echo json_encode(['error' => 'Método no permitido']);
}
?>