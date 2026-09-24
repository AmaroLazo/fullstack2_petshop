/* =========================================================
   DETALLE DE PRODUCTO - muestra el producto según el id de la URL
   Ejemplo: producto.html?id=7
   Necesita cargar antes js/productos.js (ahí están los datos).
   producto.html los carga así:
       <script src="js/productos.js"></script>
       <script src="js/producto.js"></script>
   ========================================================= */

const formatoPrecio = n => '$' + n.toLocaleString('es-CL');

/* ---------- Conectar aquí tu carrito cuando lo tengas ---------- */
function agregarAlCarrito(producto, cantidad) {

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];

    const productoExistente = carrito.find(item => item.id === producto.id);

    if (productoExistente) {

        productoExistente.cantidad += cantidad;

    } else {

        carrito.push({
            id: producto.id,
            nombre: producto.nombre,
            precio: producto.precio,
            imagen: producto.imagen,
            cantidad: cantidad
        });

    }

    localStorage.setItem("carrito", JSON.stringify(carrito));

    alert("¡Producto agregado al carrito correctamente!");

}
/* ---------- Dibujar el detalle ---------- */
const id = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
const producto = PRODUCTOS.find(p => p.id === id);
const contenedor = document.getElementById('detalle');

if (!producto) {
    document.title = 'Producto no encontrado | Huellitas Club';
    contenedor.innerHTML = `
        <div class="detalle-card text-center">
            <i class="bi bi-emoji-frown fs-1"></i>
            <h1 class="detalle-nombre mt-2">Producto no encontrado</h1>
            <p>El producto que buscas no existe o ya no está disponible.</p>
            <a href="catalogo.html" class="btn">Volver al catálogo</a>
        </div>`;
} else {
    document.title = producto.nombre + ' | Huellitas Club';
    document.getElementById('migaNombre').textContent = producto.nombre;

    const etiquetas = [...producto.animal.map(a => NOMBRE_ANIMAL[a]), NOMBRE_CATEGORIA[producto.categoria]]
        .map(t => `<span class="detalle-etiqueta">${t}</span>`).join('');

    contenedor.innerHTML = `
        <div class="detalle-card">
            <div class="row g-4">

                <div class="col-12 col-md-6">
                    <div class="detalle-imagen">
                        <img src="${producto.imagen}" alt="${producto.nombre}">
                    </div>
                </div>

                <div class="col-12 col-md-6">
                    <h1 class="detalle-nombre">${producto.nombre}</h1>
                    <div class="mb-2">${etiquetas}</div>
                    <p class="detalle-precio">${formatoPrecio(producto.precio)}</p>
                    <p>${producto.descripcion}</p>

                    <ul class="detalle-lista">
                        <li><span>Código</span><strong>HC-${String(producto.id).padStart(3, '0')}</strong></li>
                        <li><span>Categoría</span><strong>${NOMBRE_CATEGORIA[producto.categoria]}</strong></li>
                        <li><span>Ideal para</span><strong>${producto.animal.map(a => NOMBRE_ANIMAL[a]).join(', ')}</strong></li>
                    </ul>

                    <div class="detalle-acciones">
                        <div class="input-group detalle-cantidad">
                            <button class="btn" type="button" id="menos" aria-label="Disminuir cantidad">−</button>
                            <input type="number" class="form-control text-center" id="cantidad" value="1" min="1" max="10">
                            <button class="btn" type="button" id="mas" aria-label="Aumentar cantidad">+</button>
                        </div>
                        <button class="btn" type="button" id="btnAgregar">
                            <i class="bi bi-cart-plus"></i> Agregar al carrito
                        </button>
                    </div>

                    <a href="catalogo.html" class="detalle-volver"><i class="bi bi-arrow-left"></i> Volver al catálogo</a>
                </div>

            </div>
        </div>`;

    /* Cantidad */
    const inputCantidad = document.getElementById('cantidad');
    const limitar = () => {
        let v = parseInt(inputCantidad.value, 10);
        if (isNaN(v) || v < 1) v = 1;
        if (v > 10) v = 10;
        inputCantidad.value = v;
    };
    document.getElementById('menos').addEventListener('click', () => { inputCantidad.value = parseInt(inputCantidad.value, 10) - 1; limitar(); });
    document.getElementById('mas').addEventListener('click', () => { inputCantidad.value = parseInt(inputCantidad.value, 10) + 1; limitar(); });
    inputCantidad.addEventListener('change', limitar);

    document.getElementById('btnAgregar').addEventListener('click', () => {
        limitar();
        agregarAlCarrito(producto, parseInt(inputCantidad.value, 10));
    });

}
    
