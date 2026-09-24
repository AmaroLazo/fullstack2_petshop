/* =========================================================
   HISTORIAL DE COMPRAS
   ---------------------------------------------------------
   Lee la lista de pedidos que pagos.js va guardando en
   localStorage. Cada usuario tiene su propia llave, armada con
   su correo (guardado en "correoUsuario" al iniciar sesión), así
   que un usuario nunca ve el historial de otro.
       llave: "historialCompras_" + correoUsuario
   Formato de cada pedido:
       { numero, fecha, items: [{nombre, cantidad, precio}], total, direccion }
   ========================================================= */

function formatoPrecio(n) {
    return '$' + n.toLocaleString('es-CL');
}

function llaveHistorial() {
    const correo = localStorage.getItem('correoUsuario') || 'invitado';
    return 'historialCompras_' + correo;
}

document.addEventListener('DOMContentLoaded', () => {

    const lista = document.getElementById('historialLista');
    let pedidos = [];

    try {
        pedidos = JSON.parse(localStorage.getItem(llaveHistorial())) || [];
    } catch {
        pedidos = [];
    }

    if (pedidos.length === 0) {
        lista.innerHTML = `
            <div class="pago-vacio text-center">
                Todavía no tienes compras registradas.
                <a href="catalogo.html">Ir al catálogo</a>
            </div>`;
        return;
    }

    // Las más recientes primero
    pedidos = pedidos.slice().reverse();

    lista.innerHTML = pedidos.map(pedido => `
        <div class="historial-pedido">
            <div class="historial-pedido-cabecera">
                <strong>${pedido.numero}</strong>
                <span>${pedido.fecha}</span>
            </div>
            <div class="historial-pedido-items">
                ${pedido.items.map(item => `
                    <div class="pago-linea">
                        <span>${item.nombre} <small>x${item.cantidad}</small></span>
                        <span>${formatoPrecio(item.precio * item.cantidad)}</span>
                    </div>`).join('')}
            </div>
            ${pedido.direccion ? `
            <div class="historial-pedido-direccion ">
                <i class="bi bi-geo-alt"></i>
                Enviado a: ${pedido.direccion.calle}${pedido.direccion.referencia ? ' (' + pedido.direccion.referencia + ')' : ''}
            </div>` : ''}
            <div class="historial-pedido-total">
                <span>Total</span>
                <strong>${formatoPrecio(pedido.total)}</strong>
            </div>
        </div>`).join('');
});
