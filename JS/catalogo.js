/* =========================================================
   CATÁLOGO - dibuja los productos y maneja filtros, búsqueda y orden
   Necesita cargar antes js/productos.js (ahí están los datos).
   catalogo.html los carga así:
       <script src="js/productos.js"></script>
       <script src="js/catalogo.js"></script>
   ========================================================= */

const params = new URLSearchParams(window.location.search);

const grid = document.getElementById('productosGrid');
const inputTexto = document.getElementById('filtroTexto');
const selAnimal = document.getElementById('filtroAnimal');
const selCategoria = document.getElementById('filtroCategoria');
const selOrden = document.getElementById('ordenar');
const contador = document.getElementById('contador');
const sinResultados = document.getElementById('sinResultados');
const titulo = document.getElementById('tituloCatalogo');


/* ---------------------------------------------------------
   1. DIBUJAR LAS TARJETAS DESDE PRODUCTOS (js/productos.js)
   --------------------------------------------------------- */

function formatoPrecio(n) {
    return '$' + n.toLocaleString('es-CL');
}

// Texto corto para la tarjeta: usa "resumen" si el producto lo tiene;
// si no, toma la descripción hasta la primera coma o punto y,
// si aun así es muy larga, la corta en una palabra y agrega "…".
const LARGO_MAX_TARJETA = 60;

function textoCorto(p) {
    if (p.resumen) return p.resumen;
    const texto = p.descripcion.split(/[,.]/)[0].trim();
    if (texto.length <= LARGO_MAX_TARJETA) return texto + '.';
    return texto.slice(0, LARGO_MAX_TARJETA).replace(/\s+\S*$/, '') + '…';
}

function crearTarjeta(p) {
    return `
        <div class="producto" style="position: relative;"
             data-animal="${p.animal.join(' ')}"
             data-categoria="${p.categoria}"
             data-precio="${p.precio}">
            <img src="${p.imagen}" alt="${p.nombre}">
            <h3><a href="producto.html?id=${p.id}" class="stretched-link text-reset text-decoration-none">${p.nombre}</a></h3>
            <p>${textoCorto(p)}</p>
            <span>${formatoPrecio(p.precio)}</span>
        </div>`;
}

grid.innerHTML = PRODUCTOS.map(crearTarjeta).join('');

const productos = Array.from(grid.querySelectorAll('.producto'));

// Guardamos el orden original para poder volver a "Recomendados"
productos.forEach((p, i) => p.dataset.orden = i);


/* ---------------------------------------------------------
   2. FILTROS, BÚSQUEDA Y ORDEN
   --------------------------------------------------------- */

// Quita tildes y pasa a minúsculas para buscar sin problemas
function normalizar(texto) {
    return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function nombreLegible(select) {
    return select.value ? select.options[select.selectedIndex].text : '';
}

function aplicarFiltros() {
    const texto = normalizar(inputTexto.value.trim());
    const animal = selAnimal.value;
    const categoria = selCategoria.value;

    let visibles = productos.filter(p => {
        const coincideTexto = !texto || normalizar(
            p.querySelector('h3').textContent + ' ' + p.querySelector('p').textContent
        ).includes(texto);
        const coincideAnimal = !animal || p.dataset.animal.split(' ').includes(animal);
        const coincideCategoria = !categoria || p.dataset.categoria === categoria;
        return coincideTexto && coincideAnimal && coincideCategoria;
    });

    // Ordenar
    const orden = selOrden.value;
    visibles.sort((a, b) => {
        if (orden === 'precio-asc') return a.dataset.precio - b.dataset.precio;
        if (orden === 'precio-desc') return b.dataset.precio - a.dataset.precio;
        if (orden === 'nombre') {
            return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent, 'es');
        }
        return a.dataset.orden - b.dataset.orden;
    });

    // Mostrar / ocultar y reordenar en el DOM
    productos.forEach(p => p.hidden = !visibles.includes(p));
    visibles.forEach(p => grid.appendChild(p));

    // Textos informativos
    contador.textContent = visibles.length === 1
        ? '1 producto encontrado'
        : visibles.length + ' productos encontrados';
    sinResultados.hidden = visibles.length > 0;

    const partes = [nombreLegible(selAnimal), nombreLegible(selCategoria)].filter(Boolean);
    titulo.textContent = partes.length ? partes.join(' · ') : 'Todos los productos';
}

function limpiarFiltros() {
    inputTexto.value = '';
    selAnimal.value = '';
    selCategoria.value = '';
    selOrden.value = 'original';
    aplicarFiltros();
}


/* ---------------------------------------------------------
   3. EVENTOS Y FILTROS QUE VIENEN EN LA URL
   --------------------------------------------------------- */

[inputTexto, selAnimal, selCategoria, selOrden].forEach(el => {
    el.addEventListener('input', aplicarFiltros);
});
document.getElementById('limpiarFiltros').addEventListener('click', limpiarFiltros);
document.getElementById('limpiarFiltros2').addEventListener('click', limpiarFiltros);

// Leer filtros que vienen en la URL (desde el navbar o el buscador)
inputTexto.value = params.get('q') || '';
document.getElementById('busquedaNavbar').value = params.get('q') || '';
selAnimal.value = params.get('animal') || '';
selCategoria.value = params.get('categoria') || '';

aplicarFiltros();
