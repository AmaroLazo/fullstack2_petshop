document.addEventListener("DOMContentLoaded", mostrarCarrito);


function mostrarCarrito() {

    const carritoContainer = document.getElementById("carrito-container");
    const carritoResumen = document.getElementById("carrito-resumen");

    let carrito = JSON.parse(localStorage.getItem("carrito")) || [];


    // Si el carrito está vacío
    if (carrito.length === 0) {

        carritoContainer.innerHTML = `
            <div class="text-center py-5">

                <i class="bi bi-cart-x"
                   style="font-size: 70px;">
                </i>

                <h3 class="mt-3">
                    Tu carrito está vacío
                </h3>

                <p>
                    Agrega productos para comenzar tu compra.
                </p>

                <a href="catalogo.html" class="btn">
                    Ver productos
                </a>

            </div>
        `;

        carritoResumen.innerHTML = "";

        return;
    }


    // Limpiar contenido
    carritoContainer.innerHTML = "";


    let total = 0;


    // Mostrar productos
    carrito.forEach((producto, indice) => {

        const subtotal = producto.precio * producto.cantidad;

        total += subtotal;


        const productoHTML = document.createElement("div");

        productoHTML.classList.add(
            "card",
            "mb-3",
            "p-3"
        );


        productoHTML.innerHTML = `

            <div class="row align-items-center">


                <!-- Imagen -->
                <div class="col-12 col-md-2 text-center">

                    <img src="${producto.imagen}"
                         alt="${producto.nombre}"
                         class="img-fluid"
                         style="
                            max-height: 120px;
                            object-fit: contain;
                         ">

                </div>


                <!-- Nombre y precio -->
                <div class="col-12 col-md-4 text-center text-md-start">

                    <h4>
                        ${producto.nombre}
                    </h4>

                    <p class="mb-1">
                        Precio:
                        $${producto.precio.toLocaleString("es-CL")}
                    </p>

                    <strong>
                        Subtotal:
                        $${subtotal.toLocaleString("es-CL")}
                    </strong>

                </div>


                <!-- Cantidad -->
                <div class="col-8 col-md-3 mt-3 mt-md-0">

                    <label class="form-label">
                        Cantidad
                    </label>

                    <input
                        type="number"
                        min="1"
                        value="${producto.cantidad}"
                        class="form-control text-center"
                        onchange="cambiarCantidad(${indice}, this.value)"
                    >

                </div>


                <!-- Basurero -->
                <div class="col-4 col-md-3 text-center mt-3 mt-md-0">

                    <button
                        class="btn btn-danger"
                        onclick="eliminarProducto(${indice})"
                        title="Eliminar producto">

                        <i class="bi bi-trash"></i>

                    </button>

                </div>

            </div>

        `;


        carritoContainer.appendChild(productoHTML);

    });


    // Cálculo de IVA (19%) - CLP no usa decimales
    const iva = Math.round(total * 0.19);
    const totalConIva = total + iva;


    // Mostrar resumen
    carritoResumen.innerHTML = `

        <div class="card p-4 mt-4">

            <div class="d-flex justify-content-between mb-2">

                <span>
                    Producto
                </span>

                <span>
                    $${total.toLocaleString("es-CL")}
                </span>

            </div>


            <div class="d-flex justify-content-between mb-2">

                <span>
                    IVA (19%)
                </span>

                <span>
                    $${iva.toLocaleString("es-CL")}
                </span>

            </div>


            <hr>


            <div class="d-flex justify-content-between align-items-center">

                <h4 class="mb-0">
                    Total
                </h4>

                <h4 class="mb-0">
                    $${totalConIva.toLocaleString("es-CL")}
                </h4>

            </div>


            <div class="text-end mt-4">

                <button
                    class="btn"
                    onclick="continuarCompra()">

                    Continuar

                </button>

            </div>

        </div>

    `;

}



/* =========================================
   CAMBIAR CANTIDAD
========================================= */

function cambiarCantidad(indice, cantidad) {

    let carrito =
        JSON.parse(localStorage.getItem("carrito")) || [];


    cantidad = parseInt(cantidad);


    if (isNaN(cantidad) || cantidad < 1) {

        cantidad = 1;

    }


    carrito[indice].cantidad = cantidad;


    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );


    mostrarCarrito();

}



/* =========================================
   ELIMINAR PRODUCTO
========================================= */

function eliminarProducto(indice) {

    let carrito =
        JSON.parse(localStorage.getItem("carrito")) || [];


    carrito.splice(indice, 1);


    localStorage.setItem(
        "carrito",
        JSON.stringify(carrito)
    );


    mostrarCarrito();

}



/* =========================================
   CONTINUAR
========================================= */

function continuarCompra() {

    window.location.href = "envio.html";

}