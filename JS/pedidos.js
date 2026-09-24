/* =========================================================
   PEDIDOS FICTICIOS - Huellitas Club
   ---------------------------------------------------------
   Requiere cargar productos.js ANTES de este archivo.
   Los pedidos se generan una sola vez y quedan guardados en
   localStorage ("pedidos"), así los cambios de estado que
   haga el administrador se conservan.
   ========================================================= */

const ESTADOS_PEDIDO = {
    pendiente:   "Pendiente",
    preparacion: "En preparación",
    enviado:     "Enviado",
    entregado:   "Entregado",
    cancelado:   "Cancelado"
};

const CLIENTES_FICTICIOS = [
    { nombre: "Camila Rojas",      correo: "camila.rojas@gmail.com",    telefono: "+56 9 5123 4401", calle: "Barros Arana 1240, Concepción" },
    { nombre: "Matías Fuentes",    correo: "matias.fuentes@gmail.com",  telefono: "+56 9 6234 5512", calle: "Los Carrera 455, Chiguayante" },
    { nombre: "Valentina Soto",    correo: "vale.soto@hotmail.com",     telefono: "+56 9 7345 6623", calle: "Pedro de Valdivia 88, Concepción" },
    { nombre: "Sebastián Muñoz",   correo: "sebamunoz@gmail.com",       telefono: "+56 9 8456 7734", calle: "O'Higgins 902, Talcahuano" },
    { nombre: "Francisca Vega",    correo: "fran.vega@outlook.com",     telefono: "+56 9 9567 8845", calle: "Av. Collao 1550, Concepción" },
    { nombre: "Diego Contreras",   correo: "diego.contreras@gmail.com", telefono: "+56 9 4678 9956", calle: "Los Aromos 321, Hualpén" },
    { nombre: "Javiera Pizarro",   correo: "javiera.pizarro@gmail.com", telefono: "+56 9 5789 1067", calle: "Freire 780, Concepción" },
    { nombre: "Nicolás Araya",     correo: "nico.araya@gmail.com",      telefono: "+56 9 6891 2178", calle: "Manuel Rodríguez 66, San Pedro de la Paz" },
    { nombre: "Constanza Bravo",   correo: "cony.bravo@gmail.com",      telefono: "+56 9 7912 3289", calle: "Colo Colo 1015, Concepción" },
    { nombre: "Felipe Herrera",    correo: "felipe.herrera@yahoo.cl",   telefono: "+56 9 8123 4390", calle: "Av. Pedro Aguirre Cerda 210, Chiguayante" },
    { nombre: "Antonia Sepúlveda", correo: "antonia.sepulveda@gmail.com", telefono: "+56 9 9234 5401", calle: "Serrano 543, Concepción" },
    { nombre: "Tomás Villalobos",  correo: "tomas.villalobos@gmail.com", telefono: "+56 9 4345 6512", calle: "Lientur 120, Coronel" }
];

const METODOS_PAGO = ["Tarjeta de crédito", "Tarjeta de débito", "Transferencia", "Webpay"];

/* Generador pseudoaleatorio con semilla (mismos datos en cada equipo) */
function _rng(semilla) {
    return function () {
        semilla |= 0; semilla = semilla + 0x6D2B79F5 | 0;
        let t = Math.imul(semilla ^ semilla >>> 15, 1 | semilla);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

function generarPedidosFicticios(cantidad) {
    cantidad = cantidad || 80;
    const azar = _rng(2026);
    const elegir = arr => arr[Math.floor(azar() * arr.length)];
    const clientes = CLIENTES_FICTICIOS.slice();

    const ahora = Date.now();
    const pedidos = [];

    for (let i = 0; i < cantidad; i++) {
        const diasAtras = Math.floor(Math.pow(azar(), 1.3) * 90);   // más pedidos recientes
        const fecha = new Date(ahora - diasAtras * 86400000 - Math.floor(azar() * 43200000));

        const items = [];
        const usados = new Set();
        const nItems = 1 + Math.floor(azar() * 4);
        for (let k = 0; k < nItems; k++) {
            const p = elegir(PRODUCTOS);
            if (usados.has(p.id)) continue;
            usados.add(p.id);
            items.push({
                id: p.id, nombre: p.nombre, precio: p.precio,
                cantidad: 1 + Math.floor(azar() * 3),
                animal: p.animal, categoria: p.categoria
            });
        }

        // El estado depende de la antigüedad del pedido
        let estado;
        const r = azar();
        if (diasAtras > 7)      estado = r < 0.9 ? "entregado" : "cancelado";
        else if (diasAtras > 3) estado = r < 0.55 ? "entregado" : r < 0.9 ? "enviado" : "cancelado";
        else if (diasAtras > 1) estado = r < 0.4 ? "enviado" : r < 0.8 ? "preparacion" : "pendiente";
        else                    estado = r < 0.6 ? "pendiente" : "preparacion";

        const c = elegir(clientes);
        pedidos.push({
            id: 1001 + i,
            fecha: fecha.toISOString(),
            cliente: { nombre: c.nombre, correo: c.correo, telefono: c.telefono, direccion: c.calle },
            items: items,
            total: items.reduce((s, it) => s + it.precio * it.cantidad, 0),
            estado: estado,
            pago: elegir(METODOS_PAGO)
        });
    }

    pedidos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    return pedidos;
}

function _leer(llave) {
    try {
        const l = JSON.parse(localStorage.getItem(llave));
        return Array.isArray(l) ? l : [];
    } catch (e) { return []; }
}

/* Los pedidos reales (pagos.js) no traen animal/categoría: se buscan en el catálogo */
function _normalizar(p) {
    p.items.forEach(it => {
        if (!it.animal || !it.categoria) {
            const base = PRODUCTOS.find(x => x.id === it.id) || PRODUCTOS.find(x => x.nombre === it.nombre);
            it.animal = base ? base.animal : [];
            it.categoria = base ? base.categoria : "accesorios";
        }
    });
    return p;
}

/* Devuelve pedidos ficticios ("pedidos") + pedidos reales de pagos.js ("pedidosReales") */
function obtenerPedidos() {
    let ficticios = _leer("pedidos");
    if (ficticios.length === 0) {
        ficticios = generarPedidosFicticios(80);
        guardarPedidos(ficticios);
    }
    return ficticios.concat(_leer("pedidosReales").map(_normalizar))
        .sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

function guardarPedidos(lista) {
    localStorage.setItem("pedidos", JSON.stringify(lista));
}

function actualizarEstadoPedido(id, estado) {
    const reales = _leer("pedidosReales");
    const real = reales.find(x => x.id === id);
    if (real) {
        real.estado = estado;
        localStorage.setItem("pedidosReales", JSON.stringify(reales));
    } else {
        const lista = _leer("pedidos");
        const p = lista.find(x => x.id === id);
        if (p) { p.estado = estado; guardarPedidos(lista); }
    }
    return obtenerPedidos();
}

/* Regenera solo los ficticios; los pedidos reales no se tocan */
function regenerarPedidos(cantidad) {
    guardarPedidos(generarPedidosFicticios(cantidad));
    return obtenerPedidos();
}
