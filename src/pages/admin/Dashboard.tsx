import { Link } from 'react-router'
import { Users, ShoppingBag, Package, DollarSign, AlertTriangle, RefreshCw, ArrowUpRight, Tags } from 'lucide-react'
import { useDashboardAdmin } from '../../hooks/useDashboardAdmin'

const moneda = (n: number) => n.toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const meses = ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D']
const fecha = (s: string) => new Date(s).toLocaleDateString('es-CL')

export const Dashboard = () => {
  const { datos, cargando, recargar } = useDashboardAdmin()
  const { pagos, pedidos, productos, usuarios, categorias, errores } = datos
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = hoy.getMonth()
  const porMes = Array.from({ length: 12 }, () => 0)

  for (const pago of pagos ?? []) {
    if (!pago.transactionDate) continue
    const fechaPago = new Date(pago.transactionDate)
    if (Number.isNaN(fechaPago.getTime()) || fechaPago.getFullYear() !== anio) continue
    const importe = Number(pago.amount)
    if (Number.isFinite(importe)) porMes[fechaPago.getMonth()] += importe
  }

  const totalAnual = porMes.reduce((suma, valor) => suma + valor, 0)
  const totalMensual = porMes[mes]
  const escala = Math.max(...porMes, 1)
  const activos = productos?.filter(p => p.active !== false).length
  const clientes = usuarios?.filter(u => u.active && u.role === 'CUSTOMER').length
  const recientes = [...(pedidos ?? [])].sort((a, b) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6)
  const stockBajo = (productos ?? []).filter(p => p.active !== false &&
    Number(p.stockQuantity ?? 0) <= Number(p.minStock ?? 0)).slice(0, 3)
  const pendientes = (pedidos ?? []).filter(p => p.status === 'PENDIENTE').length

  const indicadores = [
    { titulo: 'Ventas del mes', valor: pagos ? moneda(totalMensual) : 'Sin datos', detalle: 'Pagos exitosos del mes', Icono: DollarSign, tono: 'violet' },
    { titulo: 'Pedidos registrados', valor: pedidos ? String(pedidos.length) : 'Sin datos', detalle: 'Microservicio de pedidos', Icono: ShoppingBag, tono: 'orange' },
    { titulo: 'Productos activos', valor: productos ? String(activos) : 'Sin datos', detalle: 'Microservicio de catálogo', Icono: Package, tono: 'blue' },
    { titulo: 'Clientes activos', valor: usuarios ? String(clientes) : 'Sin datos', detalle: 'Microservicio de usuarios', Icono: Users, tono: 'green' },
    { titulo: 'Categorías', valor: categorias ? String(categorias.length) : 'Sin datos', detalle: 'Microservicio de catálogo', Icono: Tags, tono: 'violet' }
  ]

  return (
    <div className="hc-dashboard">
      <div className="hc-dashboard-heading">
        <div><span className="hc-section-kicker">HUELLITAS CLUB / ADMINISTRACIÓN</span><h1>Resumen general</h1>
          <p>Información obtenida de los microservicios de la tienda.</p></div>
        <button type="button" className="hc-admin-btn secondary" onClick={recargar} disabled={cargando}>
          <RefreshCw size={16} /> {cargando ? 'Actualizando...' : 'Actualizar datos'}
        </button>
      </div>
      {errores.length > 0 && <div className="hc-admin-error" role="alert">{errores.join(' ')} Los indicadores sin datos no representan cero.</div>}
      {cargando && <p role="status" className="hc-admin-muted">Consultando catálogo, pedidos, pagos y usuarios...</p>}

      <section className="hc-stat-grid" aria-label="Indicadores generales">
        {indicadores.map(({ titulo, valor, detalle, Icono, tono }) => (
          <article className="hc-stat-card" key={titulo}>
            <div className={`hc-stat-icon ${tono}`}><Icono size={22} /></div>
            <div className="hc-stat-title">{titulo}</div>
            <strong className="hc-stat-value">{cargando ? '...' : valor}</strong>
            <span className="hc-admin-muted">{detalle}</span>
          </article>
        ))}
      </section>

      <section className="hc-dashboard-grid">
        <article className="hc-dashboard-card hc-sales-card">
          <div className="hc-card-heading"><div><h2>Ventas del año</h2><p>Importes de pagos exitosos por mes</p></div>
            <span className="hc-card-period">{anio}</span></div>
          <div className="hc-chart-total"><strong>{pagos ? moneda(totalAnual) : 'Sin datos'}</strong></div>
          <div className="hc-bars" role="img" aria-label={`Ventas mensuales de ${anio} en pesos chilenos`}>
            {porMes.map((valor, index) => (
              <div className="hc-bar-column" key={index} title={`${meses[index]}: ${moneda(valor)}`}>
                <div className="hc-bar-track"><span style={{ height: `${valor === 0 ? 0 : Math.max(3, valor / escala * 100)}%` }} /></div>
                <small>{meses[index]}</small>
              </div>
            ))}
          </div>
          <p className="hc-chart-footnote">Solo pagos SUCCESS fechados en {anio}. Los reembolsos no se descuentan automáticamente.</p>
        </article>
        <article className="hc-dashboard-card hc-alert-card">
          <div className="hc-card-heading"><div><h2>Alertas reales</h2><p>Stock y pedidos pendientes</p></div><AlertTriangle size={20} /></div>
          {productos && stockBajo.map(p => (
            <div key={p.id} className="hc-alert-item danger"><span className="hc-alert-icon"><AlertTriangle size={17}/></span>
              <div><strong>Stock bajo: {p.name}</strong><p>{p.stockQuantity ?? 0} unidades disponibles</p></div></div>
          ))}
          {pedidos && pendientes > 0 && <div className="hc-alert-item warning"><span className="hc-alert-icon"><ShoppingBag size={17}/></span>
            <div><strong>Pedidos pendientes</strong><p>{pendientes} pedido(s) por revisar</p></div></div>}
          {productos && pedidos && stockBajo.length === 0 && pendientes === 0 &&
            <p className="hc-admin-muted">Sin alertas de stock ni pedidos pendientes.</p>}
          {(!productos || !pedidos) && <p className="hc-admin-muted">Algunas alertas no están disponibles.</p>}
          <Link className="hc-alert-link" to="/admin/productos">Administrar productos <ArrowUpRight size={15}/></Link>
        </article>
      </section>
      <section className="hc-dashboard-card hc-recent-orders">
        <div className="hc-card-heading"><div><h2>Pedidos recientes</h2><p>Datos del microservicio de pedidos</p></div>
          <Link to="/admin/pedidos" className="hc-table-link">Ver sección <ArrowUpRight size={15}/></Link></div>
        <div className="hc-table-wrap"><table className="hc-orders-table"><thead><tr>
          <th>Pedido</th><th>Usuario</th><th>Fecha</th><th>Total</th><th>Estado</th>
        </tr></thead><tbody>
          {recientes.map(p => <tr key={p.orderId}><td><strong>#{p.orderId}</strong></td>
            <td>{usuarios?.find(u => u.userId === p.userId)?.name ?? `Usuario #${p.userId}`}</td><td>{fecha(p.createdAt)}</td><td>{moneda(Number(p.total))}</td>
            <td><span className="hc-order-status pending">{p.status.replaceAll('_', ' ')}</span></td></tr>)}
          {pedidos && recientes.length === 0 && <tr><td colSpan={5}>No hay pedidos registrados.</td></tr>}
          {!pedidos && <tr><td colSpan={5}>No se pudo consultar el listado de pedidos.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="hc-dashboard-card hc-recent-orders">
        <div className="hc-card-heading"><div><h2>Usuarios registrados</h2><p>Datos del microservicio de usuarios</p></div>
          <Link to="/admin/usuarios" className="hc-table-link">Ver todos <ArrowUpRight size={15}/></Link></div>
        <div className="hc-table-wrap"><table className="hc-orders-table"><thead><tr><th>ID</th><th>Nombre completo</th><th>Correo</th><th>Rol</th><th>Estado</th></tr></thead><tbody>
          {(usuarios ?? []).slice(0, 8).map(u => <tr key={u.userId}><td>#{u.userId}</td><td><strong>{u.name}</strong></td><td>{u.email}</td><td>{u.role}</td><td>{u.active ? 'Activo' : 'Inactivo'}</td></tr>)}
          {usuarios?.length === 0 && <tr><td colSpan={5}>No hay usuarios registrados.</td></tr>}
          {usuarios === null && <tr><td colSpan={5}>No se pudo consultar el listado de usuarios.</td></tr>}
        </tbody></table></div>
      </section>
      <section className="hc-dashboard-card hc-recent-orders">
        <div className="hc-card-heading"><div><h2>Categorías registradas</h2><p>Datos del microservicio de catálogo</p></div>
          <Link to="/admin/categorias" className="hc-table-link">Ver todas <ArrowUpRight size={15}/></Link></div>
        <div className="hc-table-wrap"><table className="hc-orders-table"><thead><tr><th>ID</th><th>Categoría</th><th>Estado</th></tr></thead><tbody>
          {(categorias ?? []).map(c => <tr key={c.id}><td>#{c.id}</td><td><strong>{c.name}</strong></td><td>{c.active === false ? 'Inactiva' : 'Activa'}</td></tr>)}
          {categorias?.length === 0 && <tr><td colSpan={3}>No hay categorías registradas.</td></tr>}
          {categorias === null && <tr><td colSpan={3}>No se pudieron consultar categorías.</td></tr>}
        </tbody></table></div>
      </section>
    </div>
  )
}
