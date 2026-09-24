/* =========================================================
   PAGO - resumen del pedido, dirección de envío, método de
   pago y simulación de cobro
   pagos.html lo carga así:
       <script src="js/pagos.js"></script>
   ---------------------------------------------------------
   El carrito se lee de localStorage con la llave "carrito",
   la misma que usan carrito.js y producto.js.
   El IVA (19%) se calcula igual que en carrito.js, para que
   el total coincida con el que se vio en el carrito.

   Sesión y datos por usuario
   ---------------------------------------------------------
   login.js guarda "correoUsuario" al iniciar sesión (admin,
   usuario de prueba o usuario registrado). Con ese correo se
   arman llaves de localStorage exclusivas para cada cuenta:
       direcciones_<correo>     -> direcciones guardadas
       historialCompras_<correo> -> pedidos de esa cuenta
   Así ningún usuario ve las direcciones ni el historial de
   otro. Si no hay sesión activa, no se puede comprar.
   ========================================================= */

const LLAVE_CARRITO = 'carrito';
const SESION_ACTIVA = localStorage.getItem('sesionActiva') === 'true';
const CORREO_USUARIO = localStorage.getItem('correoUsuario') || '';

function formatoPrecio(n) {
    return '$' + n.toLocaleString('es-CL');
}

function obtenerCarrito() {
    try {
        const datos = JSON.parse(localStorage.getItem(LLAVE_CARRITO));
        return Array.isArray(datos) ? datos : [];
    } catch {
        return [];
    }
}

// Busca al usuario logueado en la lista "usuarios" (o en el "usuario" antiguo)
function buscarUsuarioRegistrado() {
    try {
        const lista = JSON.parse(localStorage.getItem('usuarios')) || [];
        const u = lista.find(x => x.correo === CORREO_USUARIO);
        if (u) return u;
    } catch {}
    try {
        const u = JSON.parse(localStorage.getItem('usuario'));
        if (u && u.correo === CORREO_USUARIO) return u;
    } catch {}
    return null;
}

function vaciarCarrito() {
    localStorage.removeItem(LLAVE_CARRITO);
}


/* ---------------------------------------------------------
   DIRECCIONES DE ENVÍO (por usuario)
   --------------------------------------------------------- */

function llaveDirecciones() {
    return 'direcciones_' + CORREO_USUARIO;
}

function obtenerDirecciones() {
    let direcciones = [];
    try {
        direcciones = JSON.parse(localStorage.getItem(llaveDirecciones())) || [];
    } catch {
        direcciones = [];
    }

    // Si todavía no tiene direcciones guardadas, se usa como primera
    // opción la dirección que ingresó al crear su cuenta (si aplica).
    if (direcciones.length === 0) {
        try {
            const usuarioGuardado = buscarUsuarioRegistrado();
            if (usuarioGuardado && usuarioGuardado.direccion) {
                direcciones.push({
                    id: 'inicial',
                    etiqueta: 'Dirección de registro',
                    calle: usuarioGuardado.direccion.calle || '',
                    referencia: usuarioGuardado.direccion.referencia || ''
                });
                guardarDirecciones(direcciones);
            }
        } catch {
            // no hay dirección de registro disponible, se sigue sin ella
        }
    }

    return direcciones;
}

function guardarDirecciones(direcciones) {
    localStorage.setItem(llaveDirecciones(), JSON.stringify(direcciones));
}


// Guarda el pedido en el historial de compras de ESTE usuario
// (lo lee historial.js con la misma llave por correo).
function guardarEnHistorial(numeroPedido, direccion) {
    const llaveHistorial = 'historialCompras_' + CORREO_USUARIO;

    let historial = [];
    try {
        historial = JSON.parse(localStorage.getItem(llaveHistorial)) || [];
    } catch {
        historial = [];
    }

    historial.push({
        numero: numeroPedido,
        fecha: new Date().toLocaleDateString('es-CL'),
        items: carritoActual.map(p => ({ nombre: p.nombre, cantidad: p.cantidad, precio: p.precio })),
        total: totalConIvaActual,
        direccion: direccion ? { calle: direccion.calle, referencia: direccion.referencia } : null
    });

    localStorage.setItem(llaveHistorial, JSON.stringify(historial));

    // Además se envía el pedido al dashboard del administrador
    registrarPedidoAdmin(numeroPedido, direccion);
}


/* ---------------------------------------------------------
   PEDIDO PARA EL ADMINISTRADOR
   Guarda el pedido en "pedidosReales" (lo lee pedidos.js /
   dashboard_admin.js) y descuenta el stock del catálogo
   administrado ("productosAdmin"), si ya existe.
   --------------------------------------------------------- */
function registrarPedidoAdmin(numeroPedido, direccion) {
    let pedidos = [];
    try {
        pedidos = JSON.parse(localStorage.getItem('pedidosReales')) || [];
    } catch {
        pedidos = [];
    }

    const usuario = buscarUsuarioRegistrado();
    const subtotal = carritoActual.reduce((s, p) => s + p.precio * p.cantidad, 0);
    const metodo = document.querySelector('input[name="metodo"]:checked');
    const textoDireccion = direccion
        ? direccion.calle + (direccion.referencia ? ' (' + direccion.referencia + ')' : '')
        : '';

    pedidos.push({
        id: parseInt(numeroPedido.replace('HC-', ''), 10),
        numero: numeroPedido,
        fecha: new Date().toISOString(),
        cliente: {
            nombre: usuario ? usuario.nombre : (localStorage.getItem('nombreUsuario') || CORREO_USUARIO),
            correo: CORREO_USUARIO,
            telefono: usuario ? (usuario.telefono || '') : '',
            direccion: textoDireccion
        },
        items: carritoActual.map(p => ({ id: p.id, nombre: p.nombre, precio: p.precio, cantidad: p.cantidad })),
        iva: totalConIvaActual - subtotal,
        total: totalConIvaActual,
        estado: 'pendiente',
        pago: metodo && metodo.value === 'debito' ? 'Tarjeta de débito' : 'Tarjeta de crédito'
    });
    localStorage.setItem('pedidosReales', JSON.stringify(pedidos));

    // Descontar stock
    try {
        const catalogo = JSON.parse(localStorage.getItem('productosAdmin'));
        if (Array.isArray(catalogo)) {
            carritoActual.forEach(item => {
                const prod = catalogo.find(x => x.id === item.id) || catalogo.find(x => x.nombre === item.nombre);
                if (prod) prod.stock = Math.max(0, (prod.stock || 0) - item.cantidad);
            });
            localStorage.setItem('productosAdmin', JSON.stringify(catalogo));
        }
    } catch {
        // si el catálogo administrado no existe todavía, no pasa nada
    }
}


/* ---------------------------------------------------------
   SIN SESIÓN: no se puede comprar sin haber iniciado sesión
   --------------------------------------------------------- */

function mostrarAvisoSinSesion() {
    const aviso = document.getElementById('avisoSinSesion');
    const contenido = document.getElementById('contenidoPago');
    if (aviso) aviso.hidden = false;
    if (contenido) contenido.hidden = true;
}


/* ---------------------------------------------------------
   Variables que usan varias funciones (carrito y total del
   pedido actual, para armar el registro del historial)
   --------------------------------------------------------- */
let carritoActual = [];
let totalConIvaActual = 0;


function iniciarPagina() {

    /* -----------------------------------------------------
       1. RESUMEN DEL PEDIDO
       ----------------------------------------------------- */

    const resumenLista = document.getElementById('resumenLista');
    const resumenTotal = document.getElementById('resumenTotal');
    const btnPagar = document.getElementById('btnPagar');

    const carrito = obtenerCarrito().filter(p => p && p.cantidad > 0);
    carritoActual = carrito;

    let total = 0;
    let totalConIva = 0;

    if (carrito.length === 0) {
        resumenLista.innerHTML = `
            <p class="pago-vacio">
                No tienes productos en el carrito.
                <a href="catalogo.html">Ir al catálogo</a>
            </p>`;
        btnPagar.disabled = true;
    } else {
        resumenLista.innerHTML = carrito.map(producto => {
            const subtotal = producto.precio * producto.cantidad;
            total += subtotal;
            return `
                <div class="pago-linea">
                    <span>${producto.nombre} <small>x${producto.cantidad}</small></span>
                    <span>${formatoPrecio(subtotal)}</span>
                </div>`;
        }).join('');

        const iva = Math.round(total * 0.19);
        totalConIva = total + iva;

        resumenLista.innerHTML += `
            <div class="pago-linea">
                <span>IVA (19%)</span>
                <span>${formatoPrecio(iva)}</span>
            </div>`;
    }

    totalConIvaActual = totalConIva;
    resumenTotal.textContent = formatoPrecio(totalConIva);


    /* -----------------------------------------------------
       2. DIRECCIÓN DE ENVÍO
       ----------------------------------------------------- */

    const direccionLista = document.getElementById('direccionLista');
    const btnMostrarFormDireccion = document.getElementById('btnMostrarFormDireccion');
    const formNuevaDireccion = document.getElementById('formNuevaDireccion');
    const direccionEtiqueta = document.getElementById('direccionEtiqueta');
    const direccionCalle = document.getElementById('direccionCalle');
    const direccionReferencia = document.getElementById('direccionReferencia');

    function renderDirecciones(idSeleccionado) {
        const direcciones = obtenerDirecciones();

        if (direcciones.length === 0) {
            direccionLista.innerHTML = `<p class="pago-vacio">Todavía no tienes direcciones guardadas.</p>`;
            return;
        }

        const yaExiste = direcciones.some(d => d.id === idSeleccionado);
        const seleccionado = yaExiste ? idSeleccionado : direcciones[0].id;

        direccionLista.innerHTML = direcciones.map(dir => `
            <label class="direccion-item">
                <input type="radio" name="direccion" value="${dir.id}" ${dir.id === seleccionado ? 'checked' : ''}>
                <span>
                    <strong>${dir.etiqueta || 'Dirección'}</strong>
                    ${dir.calle}${dir.referencia ? ' — ' + dir.referencia : ''}
                </span>
            </label>`).join('');
    }

    renderDirecciones();

    if (btnMostrarFormDireccion) {
        btnMostrarFormDireccion.addEventListener('click', () => {
            formNuevaDireccion.hidden = !formNuevaDireccion.hidden;
        });
    }

    if (formNuevaDireccion) {
        formNuevaDireccion.addEventListener('submit', (evento) => {
            evento.preventDefault();

            if (!direccionCalle.value.trim()) {
                return;
            }

            const direcciones = obtenerDirecciones();
            const nueva = {
                id: 'dir-' + Date.now(),
                etiqueta: direccionEtiqueta.value.trim() || 'Nueva dirección',
                calle: direccionCalle.value.trim(),
                referencia: direccionReferencia.value.trim()
            };
            direcciones.push(nueva);
            guardarDirecciones(direcciones);

            direccionEtiqueta.value = '';
            direccionCalle.value = '';
            direccionReferencia.value = '';
            formNuevaDireccion.hidden = true;

            renderDirecciones(nueva.id);
        });
    }


    /* -----------------------------------------------------
       3. MÉTODO DE PAGO Y VISTA PREVIA DE LA TARJETA
       ----------------------------------------------------- */

    const previewTipo = document.getElementById('previewTipo');
    document.querySelectorAll('input[name="metodo"]').forEach(radio => {
        radio.addEventListener('change', () => {
            previewTipo.textContent = radio.value === 'credito' ? 'Crédito' : 'Débito';
        });
    });

    const inputNombre = document.getElementById('pagoNombre');
    const inputNumero = document.getElementById('pagoNumero');
    const inputVencimiento = document.getElementById('pagoVencimiento');
    const inputCvv = document.getElementById('pagoCvv');

    const previewNombre = document.getElementById('previewNombre');
    const previewNumero = document.getElementById('previewNumero');
    const previewVencimiento = document.getElementById('previewVencimiento');

    inputNombre.addEventListener('input', () => {
        previewNombre.textContent = inputNombre.value.trim().toUpperCase() || 'NOMBRE APELLIDO';
    });

    // Número de tarjeta: solo números, agrupados de a 4
    inputNumero.addEventListener('input', () => {
        const digitos = inputNumero.value.replace(/\D/g, '').slice(0, 16);
        inputNumero.value = digitos.replace(/(.{4})/g, '$1 ').trim();
        const grupos = digitos.padEnd(16, '•').replace(/(.{4})/g, '$1 ').trim();
        previewNumero.textContent = grupos.slice(0, 19);
    });

    // Vencimiento: MM/AA automático
    inputVencimiento.addEventListener('input', () => {
        let v = inputVencimiento.value.replace(/\D/g, '').slice(0, 4);
        if (v.length >= 3) v = v.slice(0, 2) + '/' + v.slice(2);
        inputVencimiento.value = v;
        previewVencimiento.textContent = v || 'MM/AA';
    });

    // CVV: solo números
    inputCvv.addEventListener('input', () => {
        inputCvv.value = inputCvv.value.replace(/\D/g, '').slice(0, 3);
    });


    /* -----------------------------------------------------
       4. VALIDAR Y SIMULAR EL COBRO
       ----------------------------------------------------- */

    const formPago = document.getElementById('formPago');
    const pagoError = document.getElementById('pagoError');
    const pagoCard = document.getElementById('pagoCard');
    const pagoExito = document.getElementById('pagoExito');
    const exitoNumero = document.getElementById('exitoNumero');
    const btnPagarTexto = document.getElementById('btnPagarTexto');

    function validarPago() {
        const direccionSeleccionada = document.querySelector('input[name="direccion"]:checked');
        if (!direccionSeleccionada) return 'Selecciona o agrega una dirección de envío.';

        const numero = inputNumero.value.replace(/\D/g, '');
        const vencimiento = inputVencimiento.value;

        if (!inputNombre.value.trim()) return 'Ingresa el nombre que aparece en la tarjeta.';
        if (numero.length !== 16) return 'El número de tarjeta debe tener 16 dígitos.';

        const match = vencimiento.match(/^(\d{2})\/(\d{2})$/);
        if (!match) return 'Ingresa el vencimiento en formato MM/AA.';
        const mes = parseInt(match[1], 10);
        const anio = 2000 + parseInt(match[2], 10);
        if (mes < 1 || mes > 12) return 'El mes del vencimiento no es válido.';
        const hoy = new Date();
        const vencida = anio < hoy.getFullYear() || (anio === hoy.getFullYear() && mes < hoy.getMonth() + 1);
        if (vencida) return 'La tarjeta está vencida.';

        if (inputCvv.value.length !== 3) return 'El CVV debe tener 3 dígitos.';

        return '';
    }

    formPago.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const error = validarPago();
        if (error) {
            pagoError.textContent = error;
            return;
        }
        pagoError.textContent = '';

        const idDireccion = document.querySelector('input[name="direccion"]:checked').value;
        const direccionElegida = obtenerDirecciones().find(d => d.id === idDireccion);

        // Simulación de un cobro real: deja el botón cargando un momento
        btnPagar.disabled = true;
        btnPagarTexto.textContent = 'Procesando...';

        setTimeout(() => {
            const numeroPedido = 'HC-' + Math.floor(100000 + Math.random() * 900000);
            exitoNumero.textContent = numeroPedido;

            pagoCard.hidden = true;
            pagoExito.hidden = false;

            guardarEnHistorial(numeroPedido, direccionElegida);
            vaciarCarrito();
        }, 1200);
    });
}


/* ---------------------------------------------------------
   PUNTO DE ENTRADA: sin sesión activa no se arma la página
   de pago, solo se muestra el aviso para iniciar sesión.
   --------------------------------------------------------- */
if (SESION_ACTIVA) {
    iniciarPagina();
} else {
    mostrarAvisoSinSesion();
}
