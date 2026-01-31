// CONFIGURACIÓN
const CONFIG = {
    breakpoints: [
        { prefijo: 'xs', query: 'max-width: 550px' },
        { prefijo: 'sm', query: 'max-width: 767px' },
        { prefijo: 'md', query: 'min-width: 768px' },
        { prefijo: 'lg', query: 'min-width: 1024px' },
        { prefijo: 'xl', query: 'min-width: 1400px' }
    ],
    
    // Mapeo de prefijos a propiedades CSS
    clasesMap: {
        // Padding
        'p': 'padding',
        'px': ['padding-left', 'padding-right'],
        'py': ['padding-top', 'padding-bottom'],
        'pt': 'padding-top',
        'pr': 'padding-right',
        'pb': 'padding-bottom',
        'pl': 'padding-left',
        // Margin
        'm': 'margin',
        'mx': ['margin-left', 'margin-right'],
        'my': ['margin-top', 'margin-bottom'],
        'mt': 'margin-top',
        'mr': 'margin-right',
        'mb': 'margin-bottom',
        'ml': 'margin-left',
        
        // Gap
        'gap': 'gap',
        'gap-x': 'column-gap',
        'gap-y': 'row-gap',
        
        // Grid 
        'grid': 'display',

        // Grid Columns
        'cl': 'grid-template-columns',
        
        // Grid Span
        'span': 'grid-column',
        
        // Flexbox 
        'flex': 'display',
        'flex-r': ['display', 'flex-direction'],
        'flex-c': ['display', 'flex-direction'],
        'wrap': 'flex-wrap',
        'nowrap': 'flex-wrap',
        
        // Justify Content
        'jc-c': 'justify-content',
        'jc-b': 'justify-content',
        'jc-a': 'justify-content',
        'jc-e': 'justify-content',
        'jc-l': 'justify-content',
        'jc-r': 'justify-content',

        // Align Items
        'ai-c': 'align-items',
        'ai-l': 'align-items',
        'ai-r': 'align-items',
        'ai-s': 'align-items',

        // Align Self
        'as-c': 'align-self',
        'as-l': 'align-self',
        'as-r': 'align-self',
        'as-s': 'align-self',

        // Position
        'absolute': 'position',
        'relative': 'position',
        'fixed': 'position',
        'static': 'position',
        'sticky': 'position',

        // ubicacion
        'top': 'top',
        'left': 'left',
        'right': 'right',
        'bottom': 'bottom',

        // Hide
        'hide': 'display',

        // Width
        'w': 'width',
        'min-w': 'min-width',
        'max-w': 'max-width',
        'w-responsive': 'width',
        
        // Height (alto)
        'h': 'height',
        'min-h': 'min-height',
        'max-h': 'max-height',
        
        // Size (cuadrado)
        'size': ['width', 'height'],
        
        // Text Size
        'text': 'font-size',
        
        // Font Weight
        'font': 'font-weight',
        
        // Border
        'border': 'border-width',
        'rounded': 'border-radius',
        
        // Opacity
        'opacity': 'opacity',
        
        // Z-Index
        'z': 'z-index',
        
        // Display
        'block': 'display',
        'inline': 'display',
        'inline-block': 'display',
        'hidden': 'display',
        
        // Overflow
        'overflow': 'overflow',
        'overflow-x': 'overflow-x',
        'overflow-y': 'overflow-y',
        
        // Cursor
        'cursor': 'cursor'

    },
    
    // VALORES ESPECIALES
    valoresEspeciales: {
        'grid': 'grid',
        'flex': 'flex',
        'flex-r': ['flex', 'row'],
        'flex-c': ['flex', 'column'],
        'wrap': 'wrap',
        'nowrap': 'nowrap',
        'jc-c': 'center',
        'jc-b': 'space-between',
        'jc-a': 'space-around',
        'jc-e': 'space-evenly',
        'jc-l': 'flex-start',
        'jc-r': 'flex-end',
        'ai-c': 'center',
        'ai-l': 'flex-start',
        'ai-r': 'flex-end',
        'ai-s': 'stretch',
        'as-c': 'center',
        'as-l': 'flex-start',
        'as-r': 'flex-end',
        'as-s': 'stretch',
        'absolute': 'absolute',
        'relative': 'relative',
        'fixed': 'fixed',
        'static': 'static',
        'sticky': 'sticky',
        'hide': 'none',

        // Width values
        'w-auto': 'auto',
        'w-full': '100%',
        'w-screen': '100vw',
        'w-min': 'min-content',
        'w-max': 'max-content',
        'w-fit': 'fit-content',
        
        // Height values
        'h-auto': 'auto',
        'h-full': '100%',
        'h-screen': '100vh',
        'h-min': 'min-content',
        'h-max': 'max-content',
        'h-fit': 'fit-content',
        
        // Size values
        'size-full': '100%',
        
        // Display values
        'block': 'block',
        'inline': 'inline',
        'inline-block': 'inline-block',
        'hidden': 'none',
        
        // Overflow values
        'overflow-auto': 'auto',
        'overflow-hidden': 'hidden',
        'overflow-visible': 'visible',
        'overflow-scroll': 'scroll',
        
        // Cursor values
        'cursor-pointer': 'pointer',
        'cursor-default': 'default',
        'cursor-text': 'text',
        'cursor-move': 'move',
        'cursor-not-allowed': 'not-allowed',
        
        // Font weight values
        'font-thin': '100',
        'font-light': '300',
        'font-normal': '400',
        'font-medium': '500',
        'font-semibold': '600',
        'font-bold': '700',
        'font-extrabold': '800',
        'font-black': '900',
        
        // Opacity values (0-100)
        'opacity-0': '0',
        'opacity-25': '0.25',
        'opacity-50': '0.5',
        'opacity-75': '0.75',
        'opacity-100': '1'
    },

    // CLASES COMPLEJAS
    clasesComplejas: {
        'w-responsive': `
            width: 100%;
            max-width: 100%;
            padding: 0 20px; 
            margin: auto;
        }
        @media (min-width: 640px) {
            .w-responsive {
                max-width: 640px;
                padding: 0 10px; 
            }
        }
        @media (min-width: 768px) {
            .w-responsive {
                max-width: 768px;
                padding: 0px; 
            }
        }
        @media (min-width: 1024px) {
            .w-responsive {
                max-width: 1024px;
            }
        }
        @media (min-width: 1280px) {
            .w-responsive {
                max-width: 1280px;
            }
        }`
    },
    
    // Conversión de valores a CSS - REESTRUCTURADA
    valorToCSS: (claseNum, tipo = '', claseCompleta = '') => {
        // 1. Primero verificar valores especiales
        if (CONFIG.valoresEspeciales[claseCompleta]) {
            return CONFIG.valoresEspeciales[claseCompleta];
        }
        
        // 2. Si es clase compleja, devolver null
        if (CONFIG.clasesComplejas && CONFIG.clasesComplejas[tipo]) {
            return null;
        }
        
        // 3. Validar que el valor sea aceptable
        if (!esValorValidoParaTipo(claseNum, tipo)) {
            console.warn(`⚠️ Valor inválido para ${tipo}: ${claseNum}`);
            return null;
        }
        
        // 4. Casos especiales por tipo
        switch(tipo) {
            // Z-INDEX: NO tiene unidades, solo el número
            case 'z':
                return claseNum; // Solo el número, sin unidades
                
            // GRID COLUMNS
            case 'cl':
                return `repeat(${parseInt(claseNum)}, minmax(0, 1fr))`;
                
            // GRID SPAN
            case 'span':
                return `span ${claseNum} / span ${claseNum}`;
                
            // GAP (con !important)
            case 'gap':
            case 'gap-x':
            case 'gap-y':
                return (parseFloat(claseNum) * 0.25) + 'em !important';
                
            // BORDER WIDTH (px)
            case 'border':
                return claseNum + 'px';
                
            // BORDER RADIUS
            case 'rounded':
                if (claseNum === 'full') return '9999px';
                return (parseFloat(claseNum) * 0.25) + 'rem';
                
            // FONT SIZE (rem)
            case 'text':
                return (parseFloat(claseNum) * 0.25) + 'rem';
                
            // WIDTH/HEIGHT/SIZE - usar función especial
            case 'w':
            case 'min-w':
            case 'max-w':
            case 'h':
            case 'min-h':
            case 'max-h':
            case 'size':
                return convertirValorDimension(claseNum, tipo);
                
            // PADDING/MARGIN (em)
            case 'p':
            case 'px':
            case 'py':
            case 'pt':
            case 'pr':
            case 'pb':
            case 'pl':
            case 'm':
            case 'mx':
            case 'my':
            case 'mt':
            case 'mr':
            case 'mb':
            case 'ml':
                if (claseNum === '0') return '0';
                return (parseFloat(claseNum) * 0.25) + 'em';
                
            // FONT WEIGHT (sin unidades)
            case 'font':
                // Si ya es un número, devolverlo tal cual
                if (/^\d+$/.test(claseNum)) {
                    return claseNum;
                }
                // Si es un nombre, convertirlo
                const pesos = {
                    'thin': '100',
                    'light': '300',
                    'normal': '400',
                    'medium': '500',
                    'semibold': '600',
                    'bold': '700',
                    'extrabold': '800',
                    'black': '900'
                };
                return pesos[claseNum] || '400';
                
            // OPACITY (0-1)
            case 'opacity':
                const opacidades = {
                    '0': '0',
                    '25': '0.25',
                    '50': '0.5',
                    '75': '0.75',
                    '100': '1'
                };
                return opacidades[claseNum] || claseNum;
                
            // OVERFLOW y CURSOR (valores directos)
            case 'overflow':
            case 'overflow-x':
            case 'overflow-y':
            case 'cursor':
                return claseNum;
                
            default:
                // Por defecto, intentar como número
                if (claseNum === '0') return '0';
                const num = parseFloat(claseNum);
                if (!isNaN(num)) {
                    return (num * 0.25) + 'em';
                }
                return claseNum;
        }
    }
};

// CACHÉ SIMPLIFICADO
const CACHE = {
    cssGenerado: new Map(),
    parsedClases: new Map(),
    limpiar: function() {
        this.cssGenerado.clear();
        this.parsedClases.clear();
    }
};

// FUNCIÓN AUXILIAR PARA CONVERTIR VALORES DE DIMENSIÓN
function convertirValorDimension(claseNum, tipo) {
    // Casos especiales primero
    const valoresEspeciales = {
        'auto': 'auto',
        'full': '100%',
        'screen': '100vw',
        'min': 'min-content',
        'max': 'max-content',
        'fit': 'fit-content'
    };
    
    if (valoresEspeciales[claseNum]) {
        return valoresEspeciales[claseNum];
    }
    
    // VERIFICAR FRACCIONES (1/2, 2/3, etc.) - CORRECCIÓN IMPORTANTE
    if (claseNum.includes('/')) {
        const partes = claseNum.split('/');
        if (partes.length === 2) {
            const numerador = parseFloat(partes[0]);
            const denominador = parseFloat(partes[1]);
            if (!isNaN(numerador) && !isNaN(denominador) && denominador !== 0) {
                return `${(numerador / denominador) * 100}%`;
            }
        }
        return null; // Fracción inválida
    }
    
    // Verificar si tiene unidad
    const regexUnidad = /^(\d+(\.\d+)?)(px|rem|em|%|vw|vh)$/;
    if (regexUnidad.test(claseNum)) {
        return claseNum; // Devolver con unidad tal cual
    }
    
    // Si es solo número, convertir a rem
    const num = parseFloat(claseNum);
    if (!isNaN(num)) {
        // LIMITAR: máximo 3 dígitos para valores sin unidad
        if (claseNum.length > 3) {
            console.warn(`⚠️ ${tipo}-${claseNum}: Valor muy grande sin unidad`);
            return null;
        }
        
        // LIMITAR: máximo valor razonable
        if (num > 96) {
            console.warn(`⚠️ ${tipo}-${claseNum}: Valor numérico muy grande`);
            return (96 * 0.25) + 'rem'; // Limitar a 24rem
        }
        
        return (num * 0.25) + 'rem';
    }
    
    return null;
}


function generarCSSParaClaseCompleja(claseCompleta, tipo) {
    const cacheKey = `compleja_${claseCompleta}`;
    
    if (CACHE.cssGenerado.has(cacheKey)) {
        return CACHE.cssGenerado.get(cacheKey);
    }
    
    const cssComplejo = CONFIG.clasesComplejas[tipo];
    if (!cssComplejo) {
        return null;
    }
    
    let css = cssComplejo;
    
    // Si no empieza con el selector, agregarlo
    if (!css.trim().startsWith('.')) {
        const selector = `.${claseCompleta.replace(/\./g, '\\.')}`;
        css = `${selector} { ${css}`;
    }
    
    CACHE.cssGenerado.set(cacheKey, css);
    return css;
}

// FUNCIÓN PARA VALIDAR VALORES
function esValorValidoParaTipo(valor, tipo) {
    if (valor === '') {
        const clasesSinValor = ['flex', 'grid', 'wrap', 'nowrap', 'block', 'inline', 
                               'inline-block', 'hidden', 'w-responsive'];
        return clasesSinValor.includes(tipo);
    }
    
    // Para w-responsive no debe tener valor
    if (tipo === 'w-responsive') {
        return false;
    }
    
    // Z-INDEX: permite cualquier número entero
    if (tipo === 'z') {
        return /^-?\d+$/.test(valor);
    }
    
    // FRACCIONES: para width/height/size
    if (['w', 'min-w', 'max-w', 'h', 'min-h', 'max-h', 'size'].includes(tipo)) {
        // Valores especiales
        const valoresEspeciales = ['auto', 'full', 'screen', 'min', 'max', 'fit'];
        if (valoresEspeciales.includes(valor)) return true;
        
        // Fracciones (1/2, 2/3, etc.)
        if (valor.includes('/')) {
            const partes = valor.split('/');
            if (partes.length !== 2) return false;
            
            const num = parseFloat(partes[0]);
            const den = parseFloat(partes[1]);
            return !isNaN(num) && !isNaN(den) && den !== 0;
        }
        
        // Valores con unidades o números simples
        return esValorConUnidadValido(valor, tipo);
    }
    
    // CLASES NUMÉRICAS BÁSICAS
    const clasesNumericas = ['p', 'px', 'py', 'pt', 'pr', 'pb', 'pl',
                            'm', 'mx', 'my', 'mt', 'mr', 'mb', 'ml',
                            'gap', 'gap-x', 'gap-y', 'text', 'border',
                            'rounded', 'cl', 'span'];
    
    if (clasesNumericas.includes(tipo)) {
        // Para border-radius "full"
        if (tipo === 'rounded' && valor === 'full') return true;
        
        // Para el resto, debe ser número
        return /^\d+(\.\d+)?$/.test(valor);
    }
    
    // FONT WEIGHT
    if (tipo === 'font') {
        const pesos = ['thin', 'light', 'normal', 'medium', 'semibold', 'bold', 'extrabold', 'black'];
        if (pesos.includes(valor)) return true;
        if (/^\d+$/.test(valor)) {
            const num = parseInt(valor);
            return num >= 100 && num <= 900 && num % 100 === 0;
        }
        return false;
    }
    
    // OPACITY
    if (tipo === 'opacity') {
        return ['0', '25', '50', '75', '100'].includes(valor);
    }
    
    // OVERFLOW
    if (['overflow', 'overflow-x', 'overflow-y'].includes(tipo)) {
        return ['auto', 'hidden', 'visible', 'scroll'].includes(valor);
    }
    
    // CURSOR
    if (tipo === 'cursor') {
        return ['pointer', 'default', 'text', 'move', 'not-allowed'].includes(valor);
    }
    
    return true;
}

// NUEVA FUNCIÓN PARA VALIDAR VALORES CON UNIDADES
function esValorConUnidadValido(valor, tipo) {
    // Patrón: número opcionalmente con decimales + unidad opcional
    const regex = /^(\d+(\.\d+)?)(px|rem|em|%|vw|vh)?$/;
    
    if (!regex.test(valor)) {
        return false;
    }
    
    // Si no tiene unidad, limitar a 3 dígitos
    if (!valor.match(/[a-z%]/i)) {
        return valor.length <= 3;
    }
    
    return true;
}

// FUNCIÓN PARA MANEJAR VALORES ESPECIALES EN VALORTOCSS
function obtenerValorCSS(tipo, valor, claseCompleta) {
    // Primero verificar valores especiales completos
    if (CONFIG.valoresEspeciales[claseCompleta]) {
        return CONFIG.valoresEspeciales[claseCompleta];
    }
    
    // Llamar a la función principal de conversión
    return CONFIG.valorToCSS(valor, tipo, claseCompleta);
}

// FUNCIÓN MEJORADA PARA PARSEAR CLASES
function parsearClase(claseCompleta) {
    if (CACHE.parsedClases.has(claseCompleta)) {
        return CACHE.parsedClases.get(claseCompleta);
    }
    
    let tipo = null;
    let valor = '';
    let esResponsive = false;
    let breakpointPrefijo = '';
    let claseParaParsear = claseCompleta;
    let advertencia = '';
    
    // Manejar responsive
    if (claseCompleta.includes(':')) {
        esResponsive = true;
        const partes = claseCompleta.split(':');
        breakpointPrefijo = partes[0];
        claseParaParsear = partes[1];
    }
    
    // ESTRATEGIA DE MATCHING
    if (CONFIG.clasesMap[claseParaParsear]) {
        tipo = claseParaParsear;
        valor = '';
    } else {
        const prefijos = Object.keys(CONFIG.clasesMap);
        prefijos.sort((a, b) => b.length - a.length);
        
        for (const prefijo of prefijos) {
            if (claseParaParsear.startsWith(prefijo + '-')) {
                tipo = prefijo;
                valor = claseParaParsear.substring(prefijo.length + 1);
                
                // Validación con mensajes de error
                if (!esValorValidoParaTipo(valor, tipo)) {
                    advertencia = `Valor "${valor}" no válido para ${tipo}`;
                    
                    // Para width/height con valores grandes sin unidad, sugerir unidad
                    if (['w', 'h', 'min-w', 'max-w', 'min-h', 'max-h'].includes(tipo) && 
                        /^\d{4,}$/.test(valor)) {
                        advertencia += `. Usa ${tipo}-${valor}px o ${tipo}-${valor/16}rem`;
                    }
                    
                    tipo = null;
                    valor = '';
                    continue;
                }
                
                break;
            }
        }
    }
    
    const esValida = tipo !== null && CONFIG.clasesMap[tipo];
    const resultado = {
        tipo,
        valor,
        esResponsive,
        breakpointPrefijo,
        claseOriginal: claseParaParsear,
        esValida,
        advertencia
    };
    
    CACHE.parsedClases.set(claseCompleta, resultado);
    return resultado;
}

// FUNCIÓN MEJORADA PARA DETECTAR CLASES DE UTILIDAD
function esClaseUtilidad(claseCompleta) {
    // 1. Coincidencia exacta
    if (CONFIG.clasesMap[claseCompleta]) {
        return true;
    }
    
    // 2. Coincidencia con prefijo + guión + valor válido
    const prefijos = Object.keys(CONFIG.clasesMap);
    
    for (const prefijo of prefijos) {
        if (claseCompleta.startsWith(prefijo + '-')) {
            const valor = claseCompleta.substring(prefijo.length + 1);
            
            // Verificar que el valor sea válido para este tipo
            return esValorValidoParaTipo(valor, prefijo);
        }
    }
    
    return false;
}

// FUNCIÓN PARA FILTRAR CLASES VÁLIDAS
function filtrarClasesUtiles(clasesUnicas) {
    const clasesBase = [];
    const clasesResponsive = [];
    
    clasesUnicas.forEach(claseCompleta => {
        // Verificar si es responsive
        if (claseCompleta.includes(':')) {
            // Parsear para ver si es válida
            const parsed = parsearClase(claseCompleta);
            if (parsed.esValida) {
                clasesResponsive.push(claseCompleta);
            }
        } else {
            // Para clases base, usar la función mejorada
            if (esClaseUtilidad(claseCompleta)) {
                clasesBase.push(claseCompleta);
            }
        }
    });
    
    return { clasesBase, clasesResponsive };
}

// FUNCIÓN PARA GENERAR CSS PARA UNA CLASE
function generarCSSParaClase(claseCompleta) {
    const cacheKey = claseCompleta;
    
    if (CACHE.cssGenerado.has(cacheKey)) {
        return CACHE.cssGenerado.get(cacheKey);
    }
    
    const parsed = parsearClase(claseCompleta);
    if (!parsed.esValida) {
        return null;
    }
    
    const { tipo, valor, esResponsive } = parsed;
    
    // VERIFICAR SI ES UNA CLASE COMPLEJA (como w-responsive)
    if (CONFIG.clasesComplejas[tipo]) {
        return generarCSSParaClaseCompleja(claseCompleta, tipo);
    }
    
    // Obtener propiedades y valores
    const propiedad = CONFIG.clasesMap[tipo];
    const valorCSS = CONFIG.valorToCSS(valor, tipo, claseCompleta);
    
    // Si es null y es clase compleja, ya se manejó arriba
    if (valorCSS === null) {
        return null;
    }
    
    // Crear selector
    let selector;
    if (esResponsive) {
        const claseEscapada = claseCompleta.replace(/:/g, '\\:').replace(/\./g, '\\.');
        selector = `.${claseEscapada}`;
    } else {
        selector = `.${claseCompleta.replace(/\./g, '\\.')}`;
    }
    
    // Generar CSS
    let reglaCSS = '';
    
    if (Array.isArray(propiedad)) {
        if (Array.isArray(valorCSS)) {
            const reglas = propiedad.map((p, index) => `${p}: ${valorCSS[index]}`);
            reglaCSS = `${selector} { ${reglas.join('; ')} }`;
        } else {
            const reglas = propiedad.map(p => `${p}: ${valorCSS}`);
            reglaCSS = `${selector} { ${reglas.join('; ')} }`;
        }
    } else {
        reglaCSS = `${selector} { ${propiedad}: ${valorCSS}; }`;
    }
    
    // Guardar en caché
    CACHE.cssGenerado.set(cacheKey, reglaCSS);
    return reglaCSS;
}

// FUNCIÓN PRINCIPAL CORREGIDA
function generarClasesUsadas() {
    // 1. Buscar TODAS las clases
    const todasClases = [];
    document.querySelectorAll('*').forEach(elemento => {
        const claseAttr = elemento.getAttribute('class');
        if (claseAttr) {
            claseAttr.split(' ').forEach(clase => {
                if (clase.trim()) {
                    todasClases.push(clase.trim());
                }
            });
        }
    });
    
    // 2. Filtrar clases únicas
    const clasesUnicas = [...new Set(todasClases)];
    
    // 3. Filtrar SOLO clases de utilidad válidas
    const clasesBase = [];
    const clasesResponsive = [];
    
    clasesUnicas.forEach(claseCompleta => {
        if (claseCompleta.includes(':')) {
            // Para responsive, parsear para ver si es válida
            const parsed = parsearClase(claseCompleta);
            if (parsed.esValida) {
                clasesResponsive.push(claseCompleta);
            }
        } else {
            // Para clases base, verificar si es utilidad
            const parsed = parsearClase(claseCompleta);
            if (parsed.esValida) {
                clasesBase.push(claseCompleta);
            }
        }
    });
    
    // 4. Generar CSS para clases BASE
    let cssBase = '';
    const clasesBaseProcesadas = new Set();
    
    clasesBase.forEach(claseBase => {
        const css = generarCSSParaClase(claseBase);
        if (css && !clasesBaseProcesadas.has(claseBase)) {
            cssBase += `${css}\n`;
            clasesBaseProcesadas.add(claseBase);
        }
    });
    
    // 5. Generar CSS para clases RESPONSIVE
    let cssResponsive = '';
    const reglasPorBreakpoint = {};
    
    clasesResponsive.forEach(claseCompleta => {
        const css = generarCSSParaClase(claseCompleta);
        if (!css) return;
        
        const [breakpointPrefijo] = claseCompleta.split(':');
        const breakpoint = CONFIG.breakpoints.find(bp => bp.prefijo === breakpointPrefijo);
        if (!breakpoint) return;
        
        if (!reglasPorBreakpoint[breakpoint.query]) {
            reglasPorBreakpoint[breakpoint.query] = new Set();
        }
        
        reglasPorBreakpoint[breakpoint.query].add(css);
    });
    
    // 6. Construir media queries
    Object.entries(reglasPorBreakpoint).forEach(([query, reglas]) => {
        cssResponsive += `@media (${query}) {\n`;
        reglas.forEach(regla => {
            cssResponsive += `  ${regla}\n`;
        });
        cssResponsive += `}\n`;
    });
    
    // 7. Combinar CSS
    const cssFinal = cssBase + (cssResponsive ? '\n' + cssResponsive : '');
    
    // 8. Inyectar al DOM
    const estiloId = 'clases-generadas';
    let estilo = document.getElementById(estiloId);
    
    if (!estilo) {
        estilo = document.createElement('style');
        estilo.id = estiloId;
        document.head.appendChild(estilo);
    }
    
    if (estilo.textContent !== cssFinal) {
        estilo.textContent = cssFinal;
    }
    
    return cssFinal;
}

// OBSERVADOR CON DEBOUNCE
let debounceTimeout;
function ejecutarConDebounce() {
    if (debounceTimeout) clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(generarClasesUsadas, 100);
}

// EJECUTAR después de que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(generarClasesUsadas, 100);
    
    // Observer con debounce
    const observer = new MutationObserver(ejecutarConDebounce);
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'],
        childList: true, 
        subtree: true 
    });
    
    // API para debugging
    window.utilityCSS = {
        regenerar: function() {
            CACHE.limpiar();
            generarClasesUsadas();
        },
        verCache: function() {
            return {
                cssCache: CACHE.cssGenerado.size,
                parsedCache: CACHE.parsedClases.size
            };
        },
        probarClase: function(clase) {
            console.log(`\n🔍 PROBANDO CLASE: "${clase}"`);
            
            // Parsear
            const parsed = parsearClase(clase);
            console.log('📋 Parsed:', parsed);
            
            if (parsed.advertencia) {
                console.warn(`⚠️ ${parsed.advertencia}`);
            }
            
            if (!parsed.esValida) {
                console.log('❌ Clase inválida o no reconocida');
                return { valida: false, parsed };
            }
            
            // Generar CSS
            const css = generarCSSParaClase(clase);
            console.log('🎨 CSS generado:', css || 'null');
            
            // Debug específico para fracciones
            if (clase.includes('/')) {
                console.log('🔢 Fracción detectada');
                console.log('Tipo:', parsed.tipo);
                console.log('Valor:', parsed.valor);
                
                // Probar conversión directamente
                const valorConvertido = convertirValorDimension(parsed.valor, parsed.tipo);
                console.log('Valor convertido:', valorConvertido);
            }
            
            return { valida: true, parsed, css };
        },
        probarConversion: function(valor, tipo) {
            console.log(`\n🧪 Probando conversión: ${tipo}-${valor}`);
            
            // Probar función convertirValorDimension
            if (['w', 'h', 'min-w', 'max-w', 'min-h', 'max-h', 'size'].includes(tipo)) {
                const resultado = convertirValorDimension(valor, tipo);
                console.log('convertirValorDimension →', resultado);
            }
            
            // Probar función valorToCSS
            const resultado = CONFIG.valorToCSS(valor, tipo, `${tipo}-${valor}`);
            console.log('CONFIG.valorToCSS →', resultado);
            
            return resultado;
        },
        listaEjemplos: function() {
            const ejemplos = [
                { clase: 'z-999', esperado: 'z-index: 999' },
                { clase: 'z-50', esperado: 'z-index: 50' },
                { clase: 'w-1/2', esperado: 'width: 50%' },
                { clase: 'w-64', esperado: 'width: 16rem' },
                { clase: 'w-full', esperado: 'width: 100%' },
                { clase: 'w-100px', esperado: 'width: 100px' },
                { clase: 'h-1/4', esperado: 'height: 25%' },
                { clase: 'p-4', esperado: 'padding: 1em' },
                { clase: 'm-2', esperado: 'margin: 0.5em' },
                { clase: 'text-16', esperado: 'font-size: 4rem' },
                { clase: 'font-bold', esperado: 'font-weight: 700' },
                { clase: 'rounded-full', esperado: 'border-radius: 9999px' }
            ];
            
            console.log('📚 EJEMPLOS DE PRUEBA:');
            ejemplos.forEach(ej => {
                console.log(`\n${ej.clase}:`);
                this.probarClase(ej.clase);
            });
        }
    };
});