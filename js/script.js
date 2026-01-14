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
        'as-s': 'align-self'

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
        'as-s': 'stretch'
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

// FUNCIÓN PRINCIPAL - GENERA CLASES BASE Y RESPONSIVE
function generarClasesUsadas() {
    // 1. Buscar TODAS las clases usadas en el DOM
    const todasClases = [];
    document.querySelectorAll('*').forEach(elemento => {
        // Usar getAttribute que funciona para HTML y SVG
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
            // Verificar si es una clase de utilidad
            const esClaseUtilidad = Object.keys(CONFIG.clasesMap).some(prefijo => 
                claseCompleta === prefijo || claseCompleta.startsWith(prefijo + '-')
            );
            if (esClaseUtilidad) {
                clasesBase.push(claseCompleta);
            }
        }
    });
    
    // 4. Generar CSS para clases BASE (sin media queries)
    let cssBase = '';
    const clasesBaseGeneradas = new Set();
    
    clasesBase.forEach(claseBase => {
        // CORRECCIÓN: Buscar primero si la clase completa existe en el mapa
        let tipo, valor;
        
        // Primero verificar si es una clase sin guión (como "flex", "wrap")
        if (CONFIG.clasesMap[claseBase]) {
            tipo = claseBase;
            valor = '';
        } 
        // Si tiene guión, verificar diferentes posibilidades
        else if (claseBase.includes('-')) {
            // Intentar encontrar la clase completa primero (ej: "flex-c")
            const partes = claseBase.split('-');
            
            // Probar combinaciones: "flex-c", luego "flex", etc.
            for (let i = partes.length; i > 0; i--) {
                const posibleTipo = partes.slice(0, i).join('-');
                if (CONFIG.clasesMap[posibleTipo]) {
                    tipo = posibleTipo;
                    valor = partes.slice(i).join('-');
                    break;
                }
            }
            
            // Si no se encontró tipo válido, salir
            if (!tipo || !CONFIG.clasesMap[tipo]) {
                return;
            }
        } else {
            // Clase sin guión que no existe en el mapa
            return;
        }
        
        // Obtener propiedades y valores
        const propiedad = CONFIG.clasesMap[tipo];
        let valorCSS = CONFIG.valorToCSS(valor, tipo, claseBase);
        
        // Crear selector (escapar punto si existe)
        const selector = `.${claseBase.replace('.', '\\.')}`;
        
        let reglaCSS = '';
        
        if (Array.isArray(propiedad)) {
            // Propiedades múltiples
            if (Array.isArray(valorCSS)) {
                // Valores múltiples específicos (flex-r, flex-c)
                const reglas = propiedad.map((p, index) => {
                    return `${p}: ${valorCSS[index]}`;
                });
                reglaCSS = `${selector} { ${reglas.join('; ')} }`;
            } else {
                // Mismo valor para todas las propiedades (jc-c, ai-c, etc.)
                const reglas = propiedad.map(p => `${p}: ${valorCSS}`);
                reglaCSS = `${selector} { ${reglas.join('; ')} }`;
            }
        } else {
            // Propiedad única
            reglaCSS = `${selector} { ${propiedad}: ${valorCSS}; }`;
        }
        
        if (!clasesBaseGeneradas.has(reglaCSS)) {
            cssBase += `${reglaCSS}\n`;
            clasesBaseGeneradas.add(reglaCSS);
        }
    });
    
    // 5. Generar CSS para clases RESPONSIVE (con media queries) - CORREGIDO
    let cssResponsive = '';
    const cssPorBreakpoint = {};
    
    clasesResponsive.forEach(claseCompleta => {
        // Ejemplo: "lg:gap-8" → breakpoint="lg", resto="gap-8"
        const [breakpointPrefijo, clase] = claseCompleta.split(':');
        
        // Encontrar el breakpoint configurado
        const breakpoint = CONFIG.breakpoints.find(bp => bp.prefijo === breakpointPrefijo);
        if (!breakpoint) return;
        
        // CORRECCIÓN: Buscar el tipo de clase correctamente
        let tipo, valor;
        
        // Primero verificar si es una clase sin guión (ej: "lg:flex")
        if (CONFIG.clasesMap[clase]) {
            tipo = clase;
            valor = '';
        } 
        // Si tiene guión (ej: "lg:gap-8")
        else if (clase.includes('-')) {
            const partes = clase.split('-');
            
            // Probar combinaciones: "gap-8", luego "gap", etc.
            for (let i = partes.length; i > 0; i--) {
                const posibleTipo = partes.slice(0, i).join('-');
                if (CONFIG.clasesMap[posibleTipo]) {
                    tipo = posibleTipo;
                    valor = partes.slice(i).join('-');
                    break;
                }
            }
            
            if (!tipo || !CONFIG.clasesMap[tipo]) {
                return;
            }
        } else {
            return;
        }
        
        // Obtener propiedades y valores
        const propiedad = CONFIG.clasesMap[tipo];
        let valorCSS = CONFIG.valorToCSS(valor, tipo, clase);
        
        // Crear selector - CORREGIDO para clases responsive
        // Para "lg:gap-8" → ".lg\:gap-8"
        const selector = `.${breakpointPrefijo}\\:${clase.replace('.', '\\.').replace(':', '\\:')}`;
        
        let reglaCSS = '';
        
        if (Array.isArray(propiedad)) {
            // Propiedades múltiples
            if (Array.isArray(valorCSS)) {
                // Valores múltiples específicos (flex-r, flex-c)
                const reglas = propiedad.map((p, index) => {
                    return `${p}: ${valorCSS[index]}`;
                });
                reglaCSS = `${selector} { ${reglas.join('; ')} }`;
            } else {
                // Mismo valor para todas las propiedades (jc-c, ai-c, etc.)
                const reglas = propiedad.map(p => `${p}: ${valorCSS}`);
                reglaCSS = `${selector} { ${reglas.join('; ')} }`;
            }
        } else {
            // Propiedad única
            reglaCSS = `${selector} { ${propiedad}: ${valorCSS}; }`;
        }
        
        // Agrupar por breakpoint
        if (!cssPorBreakpoint[breakpoint.query]) {
            cssPorBreakpoint[breakpoint.query] = [];
        }
        
        // Evitar duplicados
        if (!cssPorBreakpoint[breakpoint.query].includes(reglaCSS)) {
            cssPorBreakpoint[breakpoint.query].push(reglaCSS);
        }
    });
    
    // Construir CSS responsive con media queries
    Object.entries(cssPorBreakpoint).forEach(([query, reglas]) => {
        cssResponsive += `@media (${query}) {\n`;
        reglas.forEach(regla => {
            cssResponsive += `  ${regla}\n`;
        });
        cssResponsive += `}\n`;
    });
    
    // 6. Combinar todo el CSS
    const cssFinal = cssBase + (cssResponsive ? '\n' + cssResponsive : '');
    
    // 7. Inyectar al DOM
    const estiloId = 'clases-generadas';
    let estilo = document.getElementById(estiloId);
    
    if (!estilo) {
        estilo = document.createElement('style');
        estilo.id = estiloId;
        document.head.appendChild(estilo);
    }
    
    estilo.textContent = cssFinal;
    return cssFinal;
}

// EJECUTAR después de que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(generarClasesUsadas, 100);
    
    // También regenerar si hay cambios dinámicos
    const observer = new MutationObserver(generarClasesUsadas);
    observer.observe(document.body, { 
        attributes: true, 
        attributeFilter: ['class'],
        childList: true, 
        subtree: true 
    });
});