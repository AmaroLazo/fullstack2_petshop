/* ---------- Seguridad: solo administrador ---------- */
if (localStorage.getItem("sesionActiva") !== "true" || localStorage.getItem("rol") !== "administrador") {
    window.location.href = "login.html";
}
function cerrarSesion() {
    ["sesionActiva", "rol", "nombreUsuario", "correoUsuario"].forEach(k => localStorage.removeItem(k));
    window.location.href = "login.html";
}

/* ---------- Utilidades ---------- */
const $ = id => document.getElementById(id);
const clp = n => "$" + Math.round(n).toLocaleString("es-CL");
const fFecha = iso => new Date(iso).toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" });
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const chip = e => `<span class="estado estado-${e}">${ESTADOS_PEDIDO[e]}</span>`;
const COLORES = ["#6C2A8A", "#B45FD6", "#E8C9F5", "#38203F", "#F2A65A", "#4FA3A5", "#9AA0B4"];
const graficos = {};
function grafico(id, cfg) {
    if (graficos[id]) graficos[id].destroy();
    cfg.options = Object.assign({ responsive: true, maintainAspectRatio: false }, cfg.options || {});
    graficos[id] = new Chart($(id), cfg);
}
function tabla(cols, filas, vacio) {
    if (!filas.length) return `<p class="text-muted mb-0">${vacio || "Sin resultados."}</p>`;
    return `<table class="table table-hover align-middle"><thead><tr>${cols.map(c => `<th>${c}</th>`).join("")}</tr></thead><tbody>${filas.join("")}</tbody></table>`;
}

/* ---------- Estado ---------- */
let pedidos = obtenerPedidos();
let productos = cargarProductos();
let seccion = "resumen";
let filtros = {};

function cargarProductos() {
    try {
        const g = JSON.parse(localStorage.getItem("productosAdmin"));
        if (Array.isArray(g) && g.length) return g;
    } catch (e) {}
    const base = PRODUCTOS.map(p => Object.assign({}, p, { stock: (p.id * 7) % 31 }));
    localStorage.setItem("productosAdmin", JSON.stringify(base));
    return base;
}
const guardarProductos = () => localStorage.setItem("productosAdmin", JSON.stringify(productos));
const umbral = () => parseInt(localStorage.getItem("umbralStock")) || 5;

/* ---------- Filtros ---------- */
function iniciarFiltros() {
    const hoy = new Date(), ini = new Date(Date.now() - 90 * 86400000);
    $("fechaHasta").value = hoy.toISOString().slice(0, 10);
    $("fechaDesde").value = ini.toISOString().slice(0, 10);
    $("fAnimal").innerHTML = `<option value="">Todos</option>` + Object.entries(NOMBRE_ANIMAL).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
    $("fCategoria").innerHTML = `<option value="">Todas</option>` + Object.entries(NOMBRE_CATEGORIA).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
    $("pEstado").innerHTML = `<option value="">Todos los estados</option>` + Object.entries(ESTADOS_PEDIDO).map(([k, v]) => `<option value="${k}">${v}</option>`).join("");
    $("cfgUmbral").value = umbral();
}
function leerFiltros() {
    filtros = { desde: $("fechaDesde").value, hasta: $("fechaHasta").value, animal: $("fAnimal").value, categoria: $("fCategoria").value };
}
function aplicarFiltros() { leerFiltros(); render(); }
function limpiarFiltros() { iniciarFiltros(); aplicarFiltros(); }
function actualizarDashboard() { pedidos = obtenerPedidos(); productos = cargarProductos(); aplicarFiltros(); }

/* Devuelve pedidos dentro de filtros; cada uno con "lineas" (items que cumplen animal/categoría) */
function pedidosFiltrados(soloValidos) {
    const d = filtros.desde ? new Date(filtros.desde + "T00:00:00") : null;
    const h = filtros.hasta ? new Date(filtros.hasta + "T23:59:59") : null;
    const out = [];
    pedidos.forEach(p => {
        const f = new Date(p.fecha);
        if ((d && f < d) || (h && f > h)) return;
        if (soloValidos && p.estado === "cancelado") return;
        const lineas = p.items.filter(it => (!filtros.animal || it.animal.includes(filtros.animal)) && (!filtros.categoria || it.categoria === filtros.categoria));
        if (!lineas.length) return;
        out.push(Object.assign({}, p, { lineas, subtotal: lineas.reduce((s, it) => s + it.precio * it.cantidad, 0) }));
    });
    return out;
}

/* ---------- Navegación ---------- */
const TITULOS = { resumen: "Resumen", ventas: "Ventas", pedidos: "Pedidos", productos: "Productos", clientes: "Clientes", alertas: "Alertas", reportes: "Reportes", configuracion: "Configuración" };
function mostrarSeccion(s) {
    seccion = s;
    document.querySelectorAll(".seccion").forEach(e => e.classList.toggle("visible", e.id === "sec-" + s));
    document.querySelectorAll(".sidebar button").forEach(b => b.classList.toggle("active", b.dataset.sec === s));
    $("tituloSeccion").textContent = TITULOS[s];
    $("filtros").style.display = ["configuracion", "productos", "alertas"].includes(s) ? "none" : "block";
    render();
}
function render() {
    ({ resumen: renderResumen, ventas: renderVentas, pedidos: renderPedidos, productos: renderProductos,
       clientes: renderClientes, alertas: renderAlertas, reportes() {}, configuracion() {} })[seccion]();
    badgeAlertas();
}

/* ---------- Agregaciones ---------- */
function agrupar(lista, fnClave, fnValor) {
    const m = {};
    lista.forEach(x => { const k = fnClave(x); m[k] = (m[k] || 0) + fnValor(x); });
    return m;
}
function ventasPorProducto(validos) {
    const m = {};
    validos.forEach(p => p.lineas.forEach(it => {
        m[it.id] = m[it.id] || { nombre: it.nombre, unidades: 0, ingresos: 0 };
        m[it.id].unidades += it.cantidad; m[it.id].ingresos += it.precio * it.cantidad;
    }));
    return Object.values(m).sort((a, b) => b.ingresos - a.ingresos);
}
function serieTiempo(validos) {
    const dias = (new Date(filtros.hasta || Date.now()) - new Date(filtros.desde || validos.length && validos[validos.length - 1].fecha)) / 86400000;
    const semanal = dias > 45;
    const clave = p => {
        const f = new Date(p.fecha);
        if (semanal) f.setDate(f.getDate() - ((f.getDay() + 6) % 7));
        return f.toISOString().slice(0, 10);
    };
    const m = agrupar(validos, clave, p => p.subtotal);
    const keys = Object.keys(m).sort();
    return { labels: keys.map(k => fFecha(k + "T12:00:00") .slice(0, 5) + (semanal ? " (sem.)" : "")), data: keys.map(k => m[k]) };
}

/* ---------- Resumen ---------- */
function renderResumen() {
    const todos = pedidosFiltrados(false), validos = todos.filter(p => p.estado !== "cancelado");
    const ventas = validos.reduce((s, p) => s + p.subtotal, 0);
    const clientes = new Set(validos.map(p => p.cliente.correo)).size;
    const kpi = (ic, t, n) => `<div class="col-xl-3 col-md-6"><div class="stat-card"><i class="bi ${ic} stat-icon"></i><div class="stat-title">${t}</div><div class="stat-number">${n}</div></div></div>`;
    $("kpis").innerHTML = kpi("bi-cash-coin", "Ventas", clp(ventas)) + kpi("bi-box-seam", "Pedidos", todos.length)
        + kpi("bi-receipt", "Ticket promedio", clp(validos.length ? ventas / validos.length : 0)) + kpi("bi-people", "Clientes activos", clientes);

    const s = serieTiempo(validos);
    grafico("ventasChart", { type: "bar", data: { labels: s.labels, datasets: [{ label: "Ventas", data: s.data, backgroundColor: "#6C2A8A" }] }, options: { plugins: { legend: { display: false } } } });
    const est = agrupar(todos, p => p.estado, () => 1);
    grafico("pedidosChart", { type: "doughnut", data: { labels: Object.keys(est).map(k => ESTADOS_PEDIDO[k]), datasets: [{ data: Object.values(est), backgroundColor: COLORES }] } });

    const top = ventasPorProducto(validos).slice(0, 5);
    $("topProductos").innerHTML = top.length ? top.map((p, i) => `<div class="alert-item alert-success-custom"><span>${i + 1}. ${esc(p.nombre)}</span><strong>${p.unidades} u.</strong></div>`).join("") : `<p class="text-muted">Sin ventas en el período.</p>`;
    $("ultimosPedidos").innerHTML = tabla(["N°", "Fecha", "Cliente", "Total", "Estado"], todos.slice(0, 6).map(p =>
        `<tr style="cursor:pointer" onclick="verPedido(${p.id})"><td>#${p.id}</td><td>${fFecha(p.fecha)}</td><td>${esc(p.cliente.nombre)}</td><td>${clp(p.subtotal)}</td><td>${chip(p.estado)}</td></tr>`));
}

/* ---------- Ventas ---------- */
function renderVentas() {
    const validos = pedidosFiltrados(true);
    const s = serieTiempo(validos);
    grafico("ingresosChart", { type: "line", data: { labels: s.labels, datasets: [{ label: "Ingresos", data: s.data, borderColor: "#6C2A8A", backgroundColor: "rgba(108,42,138,.15)", fill: true, tension: .3 }] } });
    const linea = fn => agrupar(validos.flatMap(p => p.lineas), fn, it => it.precio * it.cantidad);
    const cat = linea(it => NOMBRE_CATEGORIA[it.categoria]);
    grafico("categoriasChart", { type: "doughnut", data: { labels: Object.keys(cat), datasets: [{ data: Object.values(cat), backgroundColor: COLORES }] } });
    const ani = {};
    validos.flatMap(p => p.lineas).forEach(it => it.animal.forEach(a => ani[NOMBRE_ANIMAL[a]] = (ani[NOMBRE_ANIMAL[a]] || 0) + it.precio * it.cantidad / it.animal.length));
    grafico("animalesChart", { type: "bar", data: { labels: Object.keys(ani), datasets: [{ label: "Ventas", data: Object.values(ani), backgroundColor: "#B45FD6" }] }, options: { plugins: { legend: { display: false } } } });
    $("tablaVentas").innerHTML = tabla(["Producto", "Unidades", "Ingresos"], ventasPorProducto(validos).map(p => `<tr><td>${esc(p.nombre)}</td><td>${p.unidades}</td><td>${clp(p.ingresos)}</td></tr>`));
}

/* ---------- Pedidos ---------- */
function listaPedidos() {
    const q = $("pBuscar").value.trim().toLowerCase(), e = $("pEstado").value;
    return pedidosFiltrados(false).filter(p => (!e || p.estado === e) &&
        (!q || String(p.id).includes(q) || p.cliente.nombre.toLowerCase().includes(q) || p.cliente.correo.toLowerCase().includes(q)));
}
function renderPedidos() {
    const l = listaPedidos();
    $("pContador").textContent = l.length + " pedido(s)";
    $("tablaPedidos").innerHTML = tabla(["N°", "Fecha", "Cliente", "Productos", "Total", "Estado", ""], l.map(p =>
        `<tr><td>#${p.id}</td><td>${fFecha(p.fecha)}</td><td>${esc(p.cliente.nombre)}</td><td>${p.lineas.reduce((s, i) => s + i.cantidad, 0)}</td><td>${clp(p.subtotal)}</td><td>${chip(p.estado)}</td>
         <td><button class="btn btn-sm btn-outline-secondary" onclick="verPedido(${p.id})"><i class="bi bi-eye"></i> Ver</button></td></tr>`));
}
function verPedido(id) {
    const p = pedidos.find(x => x.id === id);
    $("modalTitulo").textContent = "Pedido #" + p.id;
    $("modalCuerpo").innerHTML = `
      <p class="mb-1"><b>Cliente:</b> ${esc(p.cliente.nombre)} · ${esc(p.cliente.correo)}</p>
      <p class="mb-1"><b>Teléfono:</b> ${esc(p.cliente.telefono || "-")}</p>
      <p class="mb-1"><b>Dirección:</b> ${esc(p.cliente.direccion || "-")}</p>
      <p><b>Fecha:</b> ${fFecha(p.fecha)} · <b>Pago:</b> ${esc(p.pago)}</p>
      ${tabla(["Producto", "Precio", "Cant.", "Subtotal"], p.items.map(i => `<tr><td>${esc(i.nombre)}</td><td>${clp(i.precio)}</td><td>${i.cantidad}</td><td>${clp(i.precio * i.cantidad)}</td></tr>`))}
      ${p.iva ? `<p class="text-end mb-0">IVA (19%): ${clp(p.iva)}</p>` : ""}
      <p class="text-end fs-5"><b>Total: ${clp(p.total)}</b></p>
      <label class="fw-bold" for="nuevoEstado">Estado del pedido</label>
      <select id="nuevoEstado" class="form-select mb-3">${Object.entries(ESTADOS_PEDIDO).map(([k, v]) => `<option value="${k}" ${k === p.estado ? "selected" : ""}>${v}</option>`).join("")}</select>
      <div class="text-end"><button class="btn btn-outline-secondary" onclick="cerrarModal()">Cerrar</button>
      <button class="btn btn-huellitas" onclick="cambiarEstado(${p.id})">Guardar estado</button></div>`;
    $("modal").classList.add("abierto");
}
function cambiarEstado(id) {
    pedidos = actualizarEstadoPedido(id, $("nuevoEstado").value);
    cerrarModal(); render();
}
function cerrarModal() { $("modal").classList.remove("abierto"); }
document.addEventListener("keydown", e => { if (e.key === "Escape") cerrarModal(); });

/* ---------- Productos (CRUD) ---------- */
function renderProductos() {
    const q = $("prBuscar").value.trim().toLowerCase(), u = umbral();
    const l = productos.filter(p => !q || p.nombre.toLowerCase().includes(q));
    $("tablaProductos").innerHTML = tabla(["ID", "Producto", "Animal", "Categoría", "Precio", "Stock", ""], l.map(p =>
        `<tr><td>${p.id}</td><td>${esc(p.nombre)}</td><td>${p.animal.map(a => NOMBRE_ANIMAL[a]).join(", ")}</td><td>${NOMBRE_CATEGORIA[p.categoria]}</td><td>${clp(p.precio)}</td>
         <td class="${p.stock === 0 ? "stock-cero" : p.stock <= u ? "stock-bajo" : ""}">${p.stock}</td>
         <td class="text-nowrap"><button class="btn btn-sm btn-outline-secondary" onclick="abrirProducto(${p.id})" aria-label="Editar"><i class="bi bi-pencil"></i></button>
         <button class="btn btn-sm btn-outline-danger" onclick="eliminarProducto(${p.id})" aria-label="Eliminar"><i class="bi bi-trash"></i></button></td></tr>`));
}
function abrirProducto(id) {
    const p = productos.find(x => x.id === id) || { nombre: "", precio: "", stock: 0, animal: [], categoria: "alimentos", descripcion: "" };
    $("modalTitulo").textContent = id ? "Editar producto" : "Nuevo producto";
    $("modalCuerpo").innerHTML = `
      <div class="row g-3">
        <div class="col-12"><label class="fw-bold" for="fNombre">Nombre</label><input id="fNombre" class="form-control" value="${esc(p.nombre)}"></div>
        <div class="col-6"><label class="fw-bold" for="fPrecio">Precio (CLP)</label><input id="fPrecio" type="number" min="0" class="form-control" value="${p.precio}"></div>
        <div class="col-6"><label class="fw-bold" for="fStock">Stock</label><input id="fStock" type="number" min="0" class="form-control" value="${p.stock}"></div>
        <div class="col-12"><label class="fw-bold">Animales</label><div>${Object.entries(NOMBRE_ANIMAL).map(([k, v]) =>
            `<label class="me-3"><input type="checkbox" class="chkAnimal" value="${k}" ${p.animal.includes(k) ? "checked" : ""}> ${v}</label>`).join("")}</div></div>
        <div class="col-12"><label class="fw-bold" for="fCat">Categoría</label><select id="fCat" class="form-select">${Object.entries(NOMBRE_CATEGORIA).map(([k, v]) =>
            `<option value="${k}" ${k === p.categoria ? "selected" : ""}>${v}</option>`).join("")}</select></div>
        <div class="col-12"><label class="fw-bold" for="fDesc">Descripción</label><textarea id="fDesc" rows="3" class="form-control">${esc(p.descripcion)}</textarea></div>
        <div class="col-12 text-danger" id="prError"></div>
      </div>
      <div class="text-end mt-3"><button class="btn btn-outline-secondary" onclick="cerrarModal()">Cancelar</button>
      <button class="btn btn-huellitas" onclick="guardarProducto(${id || 0})">Guardar</button></div>`;
    $("modal").classList.add("abierto");
}
function guardarProducto(id) {
    const animal = [...document.querySelectorAll(".chkAnimal:checked")].map(c => c.value);
    const nombre = $("fNombre").value.trim(), precio = parseInt($("fPrecio").value), stock = parseInt($("fStock").value);
    if (!nombre || isNaN(precio) || precio < 0 || isNaN(stock) || stock < 0 || !animal.length) {
        $("prError").textContent = "Completa nombre, precio, stock y al menos un animal."; return;
    }
    const datos = { nombre, precio, stock, animal, categoria: $("fCat").value, descripcion: $("fDesc").value.trim() };
    if (id) Object.assign(productos.find(p => p.id === id), datos);
    else productos.push(Object.assign({ id: Math.max(0, ...productos.map(p => p.id)) + 1, imagen: "img/prueba1.png" }, datos));
    guardarProductos(); cerrarModal(); render();
}
function eliminarProducto(id) {
    const p = productos.find(x => x.id === id);
    if (!confirm(`¿Eliminar "${p.nombre}"?`)) return;
    productos = productos.filter(x => x.id !== id); guardarProductos(); render();
}

/* ---------- Clientes ---------- */
function listaClientes() {
    const m = {};
    pedidosFiltrados(false).forEach(p => {
        const c = m[p.cliente.correo] = m[p.cliente.correo] || { nombre: p.cliente.nombre, correo: p.cliente.correo, telefono: p.cliente.telefono, pedidos: 0, gasto: 0, ultima: p.fecha };
        c.pedidos++; if (p.estado !== "cancelado") c.gasto += p.subtotal;
        if (p.fecha > c.ultima) c.ultima = p.fecha;
    });
    // Usuarios registrados aunque todavía no hayan comprado
    usuariosRegistrados().forEach(u => {
        const c = m[u.correo] = m[u.correo] || { nombre: u.nombre, correo: u.correo, telefono: u.telefono, pedidos: 0, gasto: 0, ultima: null };
        c.registro = u.fechaRegistro || null;
    });
    return Object.values(m).sort((a, b) => b.gasto - a.gasto || a.nombre.localeCompare(b.nombre));
}
function usuariosRegistrados() {
    let lista = [];
    try { lista = JSON.parse(localStorage.getItem("usuarios")) || []; } catch (e) {}
    try {
        const antiguo = JSON.parse(localStorage.getItem("usuario"));
        if (antiguo && antiguo.correo && !lista.some(u => u.correo === antiguo.correo)) lista.push(antiguo);
    } catch (e) {}
    return lista;
}
function renderClientes() {
    const q = $("cBuscar").value.trim().toLowerCase();
    const l = listaClientes().filter(c => !q || c.nombre.toLowerCase().includes(q) || c.correo.toLowerCase().includes(q));
    $("tablaClientes").innerHTML = tabla(["Cliente", "Correo", "Teléfono", "Registro", "Pedidos", "Gasto total", "Última compra"], l.map(c =>
        `<tr><td>${esc(c.nombre)}</td><td>${esc(c.correo)}</td><td>${esc(c.telefono || "-")}</td><td>${c.registro ? fFecha(c.registro) : "-"}</td><td>${c.pedidos}</td><td>${clp(c.gasto)}</td><td>${c.ultima ? fFecha(c.ultima) : "Sin compras"}</td></tr>`));
}

/* ---------- Alertas ---------- */
function calcularAlertas() {
    const u = umbral(), a = [];
    productos.filter(p => p.stock === 0).forEach(p => a.push({ t: "danger", txt: `Sin stock: ${p.nombre}`, ir: "productos" }));
    productos.filter(p => p.stock > 0 && p.stock <= u).forEach(p => a.push({ t: "warning", txt: `Stock bajo: ${p.nombre} (${p.stock} u.)`, ir: "productos" }));
    pedidos.filter(p => p.estado === "pendiente" && Date.now() - new Date(p.fecha) > 2 * 86400000)
        .forEach(p => a.push({ t: "warning", txt: `Pedido #${p.id} pendiente hace más de 2 días (${esc(p.cliente.nombre)})`, ir: "pedidos" }));
    return a;
}
function renderAlertas() {
    const a = calcularAlertas();
    $("listaAlertas").innerHTML = a.length ? a.map(x => `<div class="alert-item alert-${x.t}-custom"><span>${x.txt}</span>
        <button class="btn btn-sm btn-outline-secondary" onclick="mostrarSeccion('${x.ir}')">Ver</button></div>`).join("")
        : `<div class="alert-item alert-success-custom">Todo en orden, no hay alertas.</div>`;
}
function badgeAlertas() {
    const n = calcularAlertas().length;
    $("badgeAlertas").hidden = !n; $("badgeAlertas").textContent = n;
}

/* ---------- Reportes CSV ---------- */
function exportar(tipo) {
    const validos = pedidosFiltrados(true);
    let filas = [], nombre = tipo;
    if (tipo === "pedidos") filas = [["N°", "Fecha", "Cliente", "Correo", "Estado", "Pago", "Total"], ...pedidosFiltrados(false).map(p => [p.id, fFecha(p.fecha), p.cliente.nombre, p.cliente.correo, ESTADOS_PEDIDO[p.estado], p.pago, p.subtotal])];
    if (tipo === "ventas") filas = [["Producto", "Unidades", "Ingresos"], ...ventasPorProducto(validos).map(p => [p.nombre, p.unidades, p.ingresos])];
    if (tipo === "clientes") filas = [["Cliente", "Correo", "Teléfono", "Pedidos", "Gasto total"], ...listaClientes().map(c => [c.nombre, c.correo, c.telefono, c.pedidos, c.gasto])];
    if (tipo === "inventario") filas = [["ID", "Producto", "Categoría", "Precio", "Stock"], ...productos.map(p => [p.id, p.nombre, NOMBRE_CATEGORIA[p.categoria], p.precio, p.stock])];
    const csv = "\uFEFF" + filas.map(f => f.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `huellitas_${nombre}.csv`; a.click(); URL.revokeObjectURL(a.href);
}

/* ---------- Configuración ---------- */
function guardarUmbral() {
    const v = parseInt($("cfgUmbral").value);
    if (v > 0) { localStorage.setItem("umbralStock", v); alert("Umbral guardado."); render(); }
}
function restaurarProductos() {
    if (!confirm("Se perderán los cambios hechos al catálogo. ¿Continuar?")) return;
    localStorage.removeItem("productosAdmin"); productos = cargarProductos(); render();
}
function regenerar() {
    const n = Math.min(500, Math.max(10, parseInt($("cfgCantidad").value) || 80));
    if (!confirm(`Se reemplazarán los pedidos actuales por ${n} nuevos. ¿Continuar?`)) return;
    pedidos = regenerarPedidos(n); render(); alert("Pedidos regenerados.");
}

/* ---------- Actualización automática ----------
   Detecta compras, usuarios nuevos y cambios de stock hechos desde
   otras pestañas (evento "storage") y, por si acaso, revisa cada 3 s. */
const LLAVES_DATOS = ["pedidos", "pedidosReales", "usuarios", "usuario", "productosAdmin"];
const firmaDatos = () => LLAVES_DATOS.map(k => localStorage.getItem(k) || "").join("|");
let firma = firmaDatos();
let toastTimer;
function toast(txt) {
    const t = $("toast");
    t.textContent = txt; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.hidden = true, 5000);
}
function refrescarAuto() {
    const nueva = firmaDatos();
    if (nueva === firma) return;
    firma = nueva;
    const antesPedidos = pedidos.length, antesUsuarios = usuariosRegistrados().length;
    pedidos = obtenerPedidos(); productos = cargarProductos();
    render();
    if (pedidos.length > antesPedidos) toast("Nuevo pedido recibido");
    else if (usuariosRegistrados().length > antesUsuarios) toast("Nuevo usuario registrado");
    nUsuarios = usuariosRegistrados().length;
}
let nUsuarios = usuariosRegistrados().length;
window.addEventListener("storage", refrescarAuto);
window.addEventListener("focus", refrescarAuto);
setInterval(refrescarAuto, 3000);

/* ---------- Inicio ---------- */
$("nombreAdmin").textContent = localStorage.getItem("nombreUsuario") || "Administrador";
iniciarFiltros(); leerFiltros(); render();
