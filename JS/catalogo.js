/* =========================================================
   CATÁLOGO - filtros, búsqueda y orden
   Lo carga catalogo.html con <script src="js/catalogo.js">
   ========================================================= */

const params = new URLSearchParams(window.location.search);

const grid = document.getElementById('productosGrid');
const productos = Array.from(grid.querySelectorAll('.producto'));
const inputTexto = document.getElementById('filtroTexto');
const selAnimal = document.getElementById('filtroAnimal');
const selCategoria = document.getElementById('filtroCategoria');
const selOrden = document.getElementById('ordenar');
const contador = document.getElementById('contador');
const sinResultados = document.getElementById('sinResultados');
const titulo = document.getElementById('tituloCatalogo');

// Guardamos el orden original para poder volver a "Recomendados"
productos.forEach((p, i) => p.dataset.orden = i);

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

// Eventos
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
    
