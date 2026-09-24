/* =========================================================
   HISTORIAL DE COMPRAS
   ---------------------------------------------------------
   Lee la lista de pedidos que pagos.js va guardando en
   localStorage bajo la llave "historialCompras" cada vez que
   una compra se completa. Formato de cada pedido:
       { numero, fecha, items: [{nombre, cantidad, precio}], total }
   ========================================================= */

function formatoPrecio(n) {
    return '$' + n.toLocaleString('es-CL');
}

document.addEventListener('DOMContentLoaded', () => {

    const lista = document.getElementById('historialLista');
    let pedidos = [];

    try {
        pedidos = JSON.parse(localStorage.getItem('historialCompras')) || [];
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
            <div class="historial-pedido-total">
                <span>Total</span>
                <strong>${formatoPrecio(pedido.total)}</strong>
            </div>
        </div>`).join('');
});
