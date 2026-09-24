/* =========================================================
   PAGO - resumen del pedido, método de pago y simulación de cobro
   pagos.html lo carga así:
       <script src="js/pagos.js"></script>
   ---------------------------------------------------------
   El carrito se lee de localStorage con la llave "carrito",
   la misma que usan carrito.js y producto.js. Cada producto
   ya trae id, nombre, precio, imagen y cantidad, así que no
   hace falta cargar productos.js en esta página.
   El IVA (19%) se calcula igual que en carrito.js, para que
   el total coincida con el que se vio en el carrito.
   ========================================================= */

const LLAVE_CARRITO = 'carrito';

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

function vaciarCarrito() {
    localStorage.removeItem(LLAVE_CARRITO);
}

// Guarda el pedido en el historial de compras (lo lee historial.js)
function guardarEnHistorial(numeroPedido) {
    let historial = [];
    try {
        historial = JSON.parse(localStorage.getItem('historialCompras')) || [];
    } catch {
        historial = [];
    }

    historial.push({
        numero: numeroPedido,
        fecha: new Date().toLocaleDateString('es-CL'),
        items: carrito.map(p => ({ nombre: p.nombre, cantidad: p.cantidad, precio: p.precio })),
        total: totalConIva
    });

    localStorage.setItem('historialCompras', JSON.stringify(historial));
}


/* ---------------------------------------------------------
   1. RESUMEN DEL PEDIDO
   --------------------------------------------------------- */

const resumenLista = document.getElementById('resumenLista');
const resumenTotal = document.getElementById('resumenTotal');
const btnPagar = document.getElementById('btnPagar');

const carrito = obtenerCarrito().filter(p => p && p.cantidad > 0);

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

resumenTotal.textContent = formatoPrecio(totalConIva);


/* ---------------------------------------------------------
   2. MÉTODO DE PAGO Y VISTA PREVIA DE LA TARJETA
   --------------------------------------------------------- */

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


/* ---------------------------------------------------------
   3. VALIDAR Y SIMULAR EL COBRO
   --------------------------------------------------------- */

const formPago = document.getElementById('formPago');
const pagoError = document.getElementById('pagoError');
const pagoCard = document.getElementById('pagoCard');
const pagoExito = document.getElementById('pagoExito');
const exitoNumero = document.getElementById('exitoNumero');
const btnPagarTexto = document.getElementById('btnPagarTexto');

function validarPago() {
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

    // Simulación de un cobro real: deja el botón cargando un momento
    btnPagar.disabled = true;
    btnPagarTexto.textContent = 'Procesando...';

    setTimeout(() => {
        const numeroPedido = 'HC-' + Math.floor(100000 + Math.random() * 900000);
        exitoNumero.textContent = numeroPedido;

        pagoCard.hidden = true;
        pagoExito.hidden = false;

        guardarEnHistorial(numeroPedido);
        vaciarCarrito();
    }, 1200);
});
