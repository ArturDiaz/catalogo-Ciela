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
        'hide': 'display'

    },
    
    // CONFIGURACIÓN DE VALORES ESPECIALES
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
        'hide': 'none'
    },
    
    // Conversión de valores a CSS - REESTRUCTURADA
    valorToCSS: (claseNum, tipo = '', claseCompleta = '') => {
        // Para clases especiales (flexbox)
        if (CONFIG.valoresEspeciales[claseCompleta]) {
            return CONFIG.valoresEspeciales[claseCompleta];
        }
        
        if (claseNum === '0') return '0';
        const num = parseFloat(claseNum);
        
        // Si es una clase de columnas (cl-3, cl-4, etc.)
        if (tipo === 'cl') {
            return `repeat(${num}, minmax(0, 1fr))`;
        }
        
        // Si es una clase de span (span-2, span-3, etc.)
        if (tipo === 'span') {
            return `span ${num} / span ${num}`;
        }
        if (tipo === 'gap'){
            return (num * 0.25) + 'em !important';
        }
        
        // Para spacing (padding, margin, gap)
        return (num * 0.25) + 'em';
    }
};

// CACHÉ SIMPLIFICADO - SOLO LO ESENCIAL
const CACHE = {
    // Cache de CSS ya generado (evita regenerar lo mismo)
    cssGenerado: new Map(),
    
    // Cache de parsing de nombres de clase
    parsedClases: new Map(),
    
    // Limpiar caché (útil para debugging)
    limpiar: function() {
        this.cssGenerado.clear();
        this.parsedClases.clear();
    }
};

// FUNCIÓN PARA PARSEAR CLASES CON CACHÉ
function parsearClase(claseCompleta) {
    // Verificar caché primero
    if (CACHE.parsedClases.has(claseCompleta)) {
        return CACHE.parsedClases.get(claseCompleta);
    }
    
    let tipo = null;
    let valor = '';
    let esResponsive = false;
    let breakpointPrefijo = '';
    
    // Verificar si es clase responsive
    if (claseCompleta.includes(':')) {
        esResponsive = true;
        const partes = claseCompleta.split(':');
        breakpointPrefijo = partes[0];
        claseCompleta = partes[1];
    }
    
    // Primero verificar si es una clase sin guión
    if (CONFIG.clasesMap[claseCompleta]) {
        tipo = claseCompleta;
        valor = '';
    } 
    // Si tiene guión
    else if (claseCompleta.includes('-')) {
        const partes = claseCompleta.split('-');
        
        // Probar combinaciones desde la más larga a la más corta
        for (let i = partes.length; i > 0; i--) {
            const posibleTipo = partes.slice(0, i).join('-');
            if (CONFIG.clasesMap[posibleTipo]) {
                tipo = posibleTipo;
                valor = partes.slice(i).join('-');
                break;
            }
        }
    }
    
    const resultado = tipo && CONFIG.clasesMap[tipo] ? {
        tipo,
        valor,
        esResponsive,
        breakpointPrefijo,
        claseOriginal: claseCompleta,
        esValida: true
    } : {
        tipo: null,
        valor: '',
        esResponsive,
        breakpointPrefijo,
        claseOriginal: claseCompleta,
        esValida: false
    };
    
    // Guardar en caché
    CACHE.parsedClases.set(claseCompleta, resultado);
    return resultado;
}

// FUNCIÓN OPTIMIZADA PARA GENERAR CSS CON CACHÉ
function generarCSSParaClase(claseCompleta) {
    const cacheKey = claseCompleta;
    
    // Verificar si ya generamos este CSS
    if (CACHE.cssGenerado.has(cacheKey)) {
        return CACHE.cssGenerado.get(cacheKey);
    }
    
    let tipo, valor, breakpointPrefijo;
    let claseSinBreakpoint = claseCompleta;
    let esResponsive = false;
    
    // Verificar si es clase responsive
    if (claseCompleta.includes(':')) {
        esResponsive = true;
        const partes = claseCompleta.split(':');
        breakpointPrefijo = partes[0];
        claseSinBreakpoint = partes[1];
    }
    
    // Parsear la clase (usando caché)
    const parsed = parsearClase(claseCompleta);
    if (!parsed.esValida) {
        return null;
    }
    
    tipo = parsed.tipo;
    valor = parsed.valor;
    
    // Obtener propiedades y valores
    const propiedad = CONFIG.clasesMap[tipo];
    const valorCSS = CONFIG.valorToCSS(valor, tipo, claseSinBreakpoint);
    
    // Crear selector
    let selector;
    if (esResponsive) {
        selector = `.${breakpointPrefijo}\\:${claseSinBreakpoint.replace('.', '\\.').replace(':', '\\:')}`;
    } else {
        selector = `.${claseCompleta.replace('.', '\\.')}`;
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

// FUNCIÓN PRINCIPAL OPTIMIZADA CON CACHÉ
function generarClasesUsadas() {
    // 1. Buscar TODAS las clases usadas en el DOM
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
    
    // 3. Separar clases base de clases responsive
    const clasesBase = [];
    const clasesResponsive = [];
    
    clasesUnicas.forEach(claseCompleta => {
        if (claseCompleta.includes(':')) {
            clasesResponsive.push(claseCompleta);
        } else {
            const esClaseUtilidad = Object.keys(CONFIG.clasesMap).some(prefijo => 
                claseCompleta === prefijo || claseCompleta.startsWith(prefijo + '-')
            );
            if (esClaseUtilidad) {
                clasesBase.push(claseCompleta);
            }
        }
    });
    
    // 4. Generar CSS para clases BASE con caché
    let cssBase = '';
    const clasesBaseProcesadas = new Set();
    
    clasesBase.forEach(claseBase => {
        const css = generarCSSParaClase(claseBase);
        if (css && !clasesBaseProcesadas.has(claseBase)) {
            cssBase += `${css}\n`;
            clasesBaseProcesadas.add(claseBase);
        }
    });
    
    // 5. Generar CSS para clases RESPONSIVE con caché
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
    
    // Construir media queries
    Object.entries(reglasPorBreakpoint).forEach(([query, reglas]) => {
        cssResponsive += `@media (${query}) {\n`;
        reglas.forEach(regla => {
            cssResponsive += `  ${regla}\n`;
        });
        cssResponsive += `}\n`;
    });
    
    // 6. Combinar todo el CSS
    const cssFinal = cssBase + (cssResponsive ? '\n' + cssResponsive : '');
    
    // 7. Inyectar al DOM (solo si cambió)
    const estiloId = 'clases-generadas';
    let estilo = document.getElementById(estiloId);
    
    if (!estilo) {
        estilo = document.createElement('style');
        estilo.id = estiloId;
        document.head.appendChild(estilo);
    }
    
    // Solo actualizar si hay cambios
    if (estilo.textContent !== cssFinal) {
        estilo.textContent = cssFinal;
    }
    
    return cssFinal;
}

// OBSERVADOR CON DEBOUNCE (optimización adicional)
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
    
    // API simple para debugging
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
        }
    };
});