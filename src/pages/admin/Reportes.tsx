import { useMemo, useState } from 'react'
import { RefreshCw, BarChart3, ShoppingBag, Wallet, Users, Package, AlertTriangle } from 'lucide-react'
import { useDashboardAdmin } from '../../hooks/useDashboardAdmin'

const moneda = (valor: number) => valor.toLocaleString('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0
})
const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
const estados = ['PENDIENTE', 'EN_PREPARACION', 'ENVIADO', 'ENTREGADO', 'CANCELADO'] as const
const nombresEstados: Record<string, string> = {
  PENDIENTE: 'Pendientes', EN_PREPARACION: 'En preparación', ENVIADO: 'Enviados',
  ENTREGADO: 'Entregados', CANCELADO: 'Cancelados'
}

export const Reportes = () => {
  const { datos, cargando, recargar } = useDashboardAdmin()
  const { pagos, pedidos, productos, usuarios, categorias, errores } = datos
  const [anio, setAnio] = useState(new Date().getFullYear())

  const anios = useMemo(() => {
    const valores = new Set<number>([new Date().getFullYear()])
    for (const pago of pagos ?? []) {
      const fecha = new Date(pago.transactionDate ?? '')
      if (!Number.isNaN(fecha.getTime())) valores.add(fecha.getFullYear())
    }
    for (const pedido of pedidos ?? []) {
      const fecha = new Date(pedido.createdAt)
      if (!Number.isNaN(fecha.getTime())) valores.add(fecha.getFullYear())
    }
    return [...valores].sort((a, b) => b - a)
  }, [pagos, pedidos])

  const ventasPorMes = useMemo(() => {
    const valores = Array.from({ length: 12 }, () => 0)
    for (const pago of pagos ?? []) {
      const fecha = new Date(pago.transactionDate ?? '')
      const monto = Number(pago.amount)
      if (fecha.getFullYear() === anio && Number.isFinite(monto)) {
        valores[fecha.getMonth()] += monto
      }
    }
    return valores
  }, [pagos, anio])

  const pedidosAnio = useMemo(() => (pedidos ?? []).filter(p =>
    new Date(p.createdAt).getFullYear() === anio), [pedidos, anio])
  const usuariosAnio = useMemo(() => (usuarios ?? []).filter(u =>
    u.createdAt && new Date(u.createdAt).getFullYear() === anio), [usuarios, anio])
  const totalVentas = ventasPorMes.reduce((a, b) => a + b, 0)
  const pagosAnio = (pagos ?? []).filter(p => new Date(p.transactionDate ?? '').getFullYear() === anio)
  const promedioPago = pagosAnio.length ? totalVentas / pagosAnio.length : 0
  const escalaVentas = Math.max(1, ...ventasPorMes)

  const estadosPedidos = estados.map(estado => ({
    estado, label: nombresEstados[estado],
    cantidad: pedidosAnio.filter(p => p.status === estado).length
  }))

  // Ranking por unidades solicitadas; no confundir con pagos confirmados.
  const topProductos = useMemo(() => {
    const resumen = new Map<number, { id: number; nombre: string; unidades: number }>()
    for (const pedido of pedidosAnio) {
      if (pedido.status === 'CANCELADO') continue
      for (const item of pedido.items ?? []) {
        const anterior = resumen.get(item.productId)
        if (anterior) anterior.unidades += Number(item.quantity) || 0
        else resumen.set(item.productId, {
          id: item.productId, nombre: item.productName || `Producto #${item.productId}`,
          unidades: Number(item.quantity) || 0
        })
      }
    }
    return [...resumen.values()].sort((a, b) => b.unidades - a.unidades).slice(0, 7)
  }, [pedidosAnio])

  const distribucion = useMemo(() => (categorias ?? []).map(c => ({
    id: c.id, nombre: c.name,
    cantidad: (productos ?? []).filter(p => p.categoryId === c.id).length,
    stock: (productos ?? []).filter(p => p.categoryId === c.id)
      .reduce((suma, p) => suma + (Number(p.stockQuantity) || 0), 0)
  })).sort((a, b) => b.cantidad - a.cantidad), [categorias, productos])

  const maxEstados = Math.max(1, ...estadosPedidos.map(e => e.cantidad))
  const maxProductos = Math.max(1, ...topProductos.map(p => p.unidades))
  const maxCategorias = Math.max(1, ...distribucion.map(c => c.cantidad))

  return (
    <div className="hc-dashboard hc-reports">
      <div className="hc-dashboard-heading">
        <div>
          <span className="hc-section-kicker">HUELLITAS CLUB / ADMINISTRACIÓN</span>
          <h1>Reportes de la tienda</h1>
          <p>Información consultada directamente desde pagos, pedidos, usuarios y catálogo.</p>
        </div>
        <div className="hc-report-filters">
          <label htmlFor="hc-report-year">Año</label>
          <select id="hc-report-year" value={anio} onChange={e => setAnio(Number(e.target.value))}>
            {anios.map(valor => <option key={valor} value={valor}>{valor}</option>)}
          </select>
          <button className="hc-admin-btn secondary" type="button" onClick={() => void recargar()} disabled={cargando}>
            <RefreshCw size={16}/> {cargando ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>
      {cargando && <p className="hc-admin-muted" role="status">Consultando los microservicios...</p>}
      {errores.length > 0 && <div className="hc-admin-error" role="alert">
        <AlertTriangle size={16}/> {errores.join(' ')} Los apartados afectados se muestran como «Sin datos».
      </div>}
      <section className="hc-report-kpis" aria-label="Indicadores de reportes">
        <article className="hc-report-kpi"><Wallet size={23}/><span>Ventas exitosas · {anio}</span><strong>{pagos ? moneda(totalVentas) : 'Sin datos'}</strong></article>
        <article className="hc-report-kpi"><ShoppingBag size={23}/><span>Pedidos · {anio}</span><strong>{pedidos ? pedidosAnio.length : 'Sin datos'}</strong></article>
        <article className="hc-report-kpi"><BarChart3 size={23}/><span>Pago exitoso promedio</span><strong>{pagos ? moneda(promedioPago) : 'Sin datos'}</strong></article>
        <article className="hc-report-kpi"><Users size={23}/><span>Nuevas cuentas · {anio}</span><strong>{usuarios ? usuariosAnio.length : 'Sin datos'}</strong></article>
      </section>
      <div className="hc-report-grid">
        <section className="hc-dashboard-card hc-report-span">
          <div className="hc-card-heading"><div><h2>Ventas mensuales · {anio}</h2><p>Montos registrados por el servicio de pagos con estado SUCCESS</p></div></div>
          {pagos ? <div className="hc-report-chart" role="img" aria-label={`Ventas mensuales de ${anio}`}>
            {ventasPorMes.map((monto, indice) => <div key={meses[indice]} className="hc-report-chart-col" title={`${meses[indice]}: ${moneda(monto)}`}>
              <span className="hc-report-chart-bar" style={{ height: `${monto === 0 ? 0 : Math.max(3, monto / escalaVentas * 100)}%` }} />
              <small>{meses[indice]}</small>
            </div>)}
          </div> : <p className="hc-admin-muted">Sin datos de pagos.</p>}
          {pagos && <p className="hc-chart-footnote">El total corresponde a pagos exitosos; no descuenta automáticamente reembolsos ni incluye pedidos sin pago.</p>}
        </section>
        <section className="hc-dashboard-card">
          <div className="hc-card-heading"><div><h2>Estados de pedidos</h2><p>Pedidos registrados en {anio}</p></div></div>
          {pedidos ? estadosPedidos.map(({ estado, label, cantidad }) => <div className="hc-report-progress" key={estado}>
            <div className="hc-report-progress-label"><span>{label}</span><strong>{cantidad}</strong></div>
            <div className="hc-report-progress-track"><span style={{ width: `${cantidad / maxEstados * 100}%` }} /></div>
          </div>) : <p className="hc-admin-muted">Sin datos de pedidos.</p>}
        </section>
        <section className="hc-dashboard-card">
          <div className="hc-card-heading"><div><h2>Productos más solicitados</h2><p>Unidades en pedidos no cancelados de {anio}</p></div><Package size={19}/></div>
          {pedidos && (topProductos.length ? topProductos.map((p, i) => <div className="hc-report-progress" key={p.id}>
            <div className="hc-report-progress-label"><span>{i + 1}. {p.nombre}</span><strong>{p.unidades} uds.</strong></div>
            <div className="hc-report-progress-track"><span style={{ width: `${p.unidades / maxProductos * 100}%` }} /></div>
          </div>) : <p className="hc-admin-muted">No hay productos solicitados en este período.</p>)}
          {!pedidos && <p className="hc-admin-muted">Sin datos de pedidos.</p>}
        </section>
        <section className="hc-dashboard-card">
          <div className="hc-card-heading"><div><h2>Productos por categoría</h2><p>Distribución actual del catálogo y stock disponible</p></div></div>
          {productos && categorias ? (distribucion.length ? distribucion.map(c => <div className="hc-report-progress" key={c.id}>
            <div className="hc-report-progress-label"><span>{c.nombre}</span><strong>{c.cantidad} productos · {c.stock} uds.</strong></div>
            <div className="hc-report-progress-track"><span style={{ width: `${c.cantidad / maxCategorias * 100}%` }} /></div>
          </div>) : <p className="hc-admin-muted">No existen categorías registradas.</p>) :
            <p className="hc-admin-muted">Sin datos de catálogo o categorías.</p>}
        </section>
      </div>
      <p className="hc-report-footnote">Los reportes se actualizan con el botón «Actualizar» y al abrir la página. No se generan ventas ni registros ficticios desde el frontend.</p>
    </div>
  )
}
