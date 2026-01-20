// js/storage.js
// ==================== MIGRACIÓN A SUPABASE STORAGE ====================

class ImageStorageManager {
    constructor() {
        this.bucketName = 'product-images';
        this.maxFileSize = 2 * 1024 * 1024; // 2MB
        this.allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    }

    // ==================== VALIDACIÓN ====================
    validateImageFile(file) {
        const errors = [];

        if (!this.allowedTypes.includes(file.type)) {
            errors.push(`Tipo de archivo no permitido: ${file.type}. Usa JPG, PNG, WebP o GIF.`);
        }

        if (file.size > this.maxFileSize) {
            errors.push(`Archivo muy grande: ${(file.size / 1024 / 1024).toFixed(2)}MB. Máximo: 2MB.`);
        }

        return errors;
    }

    // ==================== SUBIR IMAGEN ====================
    async uploadImage(file, productId = null) {
        try {
            // Validar archivo
            const errors = this.validateImageFile(file);
            if (errors.length > 0) {
                throw new Error(errors.join(' '));
            }

            // Generar nombre único
            const timestamp = Date.now();
            const randomString = Math.random().toString(36).substring(2, 10);
            const fileExtension = file.name.split('.').pop().toLowerCase();
            const fileName = `${timestamp}_${randomString}.${fileExtension}`;
            
            // Crear path único
            const filePath = productId 
                ? `${productId}/${fileName}`
                : `temp/${fileName}`;

            console.log(`📤 Subiendo imagen: ${filePath}`);

            // Subir a Supabase Storage
            const { data, error } = await window.supabaseClient.storage
                .from(this.bucketName)
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) throw error;

            console.log('✅ Imagen subida:', data.path);

            // Obtener URL pública
            const { data: { publicUrl } } = window.supabaseClient.storage
                .from(this.bucketName)
                .getPublicUrl(filePath);

            return {
                url: publicUrl,
                path: data.path,
                fileName: fileName,
                originalName: file.name
            };

        } catch (error) {
            console.error('❌ Error subiendo imagen:', error);
            throw new Error(`Error al subir imagen: ${error.message}`);
        }
    }

    // ==================== SUBIR MÚLTIPLES IMÁGENES ====================
    async uploadMultipleImages(files, productId = null) {
        const uploadPromises = Array.from(files).map(file => 
            this.uploadImage(file, productId)
        );

        try {
            const results = await Promise.all(uploadPromises);
            console.log(`✅ ${results.length} imágenes subidas exitosamente`);
            return results;
        } catch (error) {
            console.error('❌ Error subiendo múltiples imágenes:', error);
            throw error;
        }
    }

    // ==================== ELIMINAR IMAGEN ====================
    async deleteImage(filePath) {
        try {
            if (!filePath) {
                console.warn('⚠️ No se proporcionó path para eliminar');
                return;
            }

            console.log(`🗑️ Eliminando imagen: ${filePath}`);

            const { error } = await window.supabaseClient.storage
                .from(this.bucketName)
                .remove([filePath]);

            if (error) {
                // Si el archivo no existe, no es un error crítico
                if (error.message.includes('not found')) {
                    console.warn(`⚠️ La imagen ${filePath} no existe en storage`);
                    return;
                }
                throw error;
            }

            console.log('✅ Imagen eliminada de storage');
            return true;

        } catch (error) {
            console.error('❌ Error eliminando imagen:', error);
            throw new Error(`No se pudo eliminar la imagen: ${error.message}`);
        }
    }

    // ==================== ELIMINAR MÚLTIPLES IMÁGENES ====================
    async deleteMultipleImages(filePaths) {
        if (!filePaths || filePaths.length === 0) return;

        try {
            console.log(`🗑️ Eliminando ${filePaths.length} imágenes...`);

            const { error } = await window.supabaseClient.storage
                .from(this.bucketName)
                .remove(filePaths);

            if (error) throw error;

            console.log(`✅ ${filePaths.length} imágenes eliminadas`);
            return true;

        } catch (error) {
            console.error('❌ Error eliminando múltiples imágenes:', error);
            throw error;
        }
    }

    // ==================== OBTENER IMÁGENES DE PRODUCTO ====================
    async getProductImages(productId) {
        try {
            console.log(`🔍 Buscando imágenes para producto: ${productId}`);

            const { data: files, error } = await window.supabaseClient.storage
                .from(this.bucketName)
                .list(productId, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' }
                });

            if (error) throw error;

            // Construir URLs públicas
            const images = files.map(file => {
                const publicUrl = window.supabaseClient.storage
                    .from(this.bucketName)
                    .getPublicUrl(`${productId}/${file.name}`).data.publicUrl;

                return {
                    name: file.name,
                    url: publicUrl,
                    path: `${productId}/${file.name}`,
                    size: file.metadata?.size,
                    createdAt: file.created_at
                };
            });

            console.log(`✅ Encontradas ${images.length} imágenes`);
            return images;

        } catch (error) {
            console.error('❌ Error obteniendo imágenes:', error);
            return [];
        }
    }

    // ==================== LIMPIAR IMÁGENES TEMPORALES ====================
    async cleanTempImages() {
        try {
            console.log('🧹 Limpiando imágenes temporales...');

            const { data: files, error } = await window.supabaseClient.storage
                .from(this.bucketName)
                .list('temp', {
                    limit: 100
                });

            if (error) throw error;

            // Eliminar archivos más viejos de 24 horas
            const twentyFourHoursAgo = new Date();
            twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

            const filesToDelete = files.filter(file => {
                const fileDate = new Date(file.created_at);
                return fileDate < twentyFourHoursAgo;
            }).map(file => `temp/${file.name}`);

            if (filesToDelete.length > 0) {
                await this.deleteMultipleImages(filesToDelete);
                console.log(`✅ ${filesToDelete.length} imágenes temporales eliminadas`);
            }

        } catch (error) {
            console.error('❌ Error limpiando imágenes temporales:', error);
        }
    }

    // ==================== COMPRESIÓN CLIENTE (OPCIONAL) ====================
    async compressImage(file, quality = 0.7) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calcular nuevo tamaño manteniendo proporción
                    let width = img.width;
                    let height = img.height;
                    const maxWidth = 1200;
                    const maxHeight = 1200;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height *= maxWidth / width;
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width *= maxHeight / height;
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // Dibujar imagen redimensionada
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    // Convertir a Blob
                    canvas.toBlob(
                        (blob) => {
                            if (!blob) {
                                reject(new Error('Error al comprimir imagen'));
                                return;
                            }
                            
                            // Crear nuevo File con el blob comprimido
                            const compressedFile = new File(
                                [blob],
                                file.name,
                                { type: 'image/jpeg' }
                            );
                            
                            resolve(compressedFile);
                        },
                        'image/jpeg',
                        quality
                    );
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
}

// Crear instancia global
window.imageStorage = new ImageStorageManager();

// Ejecutar limpieza de temporales al cargar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.imageStorage.cleanTempImages().catch(console.error);
    }, 5000);
});