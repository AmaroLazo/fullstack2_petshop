import { Link } from 'react-router'
import { Package, RefreshCw } from 'lucide-react'
import { useHistorialCompras } from '../../hooks/useHistorialCompras'

const dinero = (valor: number) => Number(valor ?? 0).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const estados: Record<string, string> = { PENDIENTE: 'Pendiente', CANCELADO: 'Cancelado', EN_PREPARACION: 'En preparación', ENVIADO: 'Enviado', ENTREGADO: 'Entregado' }

export const Compras = () => {
  const { usuario, pedidos, pagos, cargando, error, reintentar } = useHistorialCompras()
  if (!usuario) return <section className="hc-profile-panel"><h1>Historial de compras</h1><p>Debes <Link to="/login?redirect=%2Fcompras" className="underline">iniciar sesión</Link> para consultar tus pedidos.</p></section>
  return <section className="hc-profile-panel">
    <div className="hc-profile-heading"><div><span className="hc-profile-kicker">MIS PEDIDOS</span><h1>Historial de compras</h1><p>Pedidos registrados en el microservicio de pedidos. Los pendientes aún no son compras finalizadas.</p></div></div>
    {cargando && <p role="status">Consultando tus pedidos...</p>}
    {error && <div role="alert" className="hc-profile-card"><p>{error}</p><button type="button" className="hc-profile-secondary" onClick={reintentar}><RefreshCw size={16}/> Reintentar</button></div>}
    {!cargando && !error && !pedidos.length && <div className="hc-profile-empty"><Package size={38}/><h2>Aún no tienes pedidos</h2><p>Cuando realices un pedido aparecerá aquí.</p><Link to="/catalogo" className="hc-profile-primary">Explorar catálogo</Link></div>}
    {!cargando && !error && pedidos.length > 0 && <div className="hc-profile-order-list">{[...pedidos].sort((a,b) => new Date(b.createdAt).getTime()-new Date(a.createdAt).getTime()).map((pedido) => <article className="hc-profile-card" key={pedido.orderId}>
      <div className="hc-profile-order-top"><div><h2>Pedido #{pedido.orderId}</h2><p>{pedido.createdAt ? new Date(pedido.createdAt).toLocaleString('es-CL') : 'Fecha no disponible'}</p></div><span className="hc-profile-status">{estados[pedido.status] || pedido.status}</span></div>
      <div className="hc-profile-order-items">{pedido.items?.map((item) => <div key={item.id}><span>{item.quantity} × {item.productName}</span><strong>{dinero(item.subtotal)}</strong></div>)}</div>
      <div className="hc-profile-order-total"><span>Total de productos</span><strong>{dinero(pedido.total)}</strong></div>
      {pagos[pedido.orderId] && <div className="hc-profile-order-total"><span>Total pagado ({pagos[pedido.orderId].installments ?? 1} cuota(s))</span><strong>{dinero(pagos[pedido.orderId].amount)}</strong></div>}
    </article>)}</div>}
  </section>
}
