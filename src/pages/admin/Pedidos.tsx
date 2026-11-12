import { useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useDatosAdmin } from '../../hooks/useDatosAdmin'
import type { EstadoPedido } from '../../services/pedido.service'

const clp = (n: number | string) => Number(n).toLocaleString('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 })
const fecha = (s: string) => new Date(s).toLocaleString('es-CL')

const nombresEstado: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado'
}

// Estas opciones coinciden con las transiciones que valida el microservicio.
const siguientesEstados = (estado: EstadoPedido): EstadoPedido[] => {
  switch (estado) {
    case 'PENDIENTE': return ['EN_PREPARACION', 'CANCELADO']
    case 'EN_PREPARACION': return ['ENVIADO', 'CANCELADO']
    case 'ENVIADO': return ['ENTREGADO']
    case 'ENTREGADO':
    case 'CANCELADO': return []
  }
}

const claseEstado = (estado: EstadoPedido) => ({
  PENDIENTE: 'pending',
  EN_PREPARACION: 'preparing',
  ENVIADO: 'sent',
  ENTREGADO: 'delivered',
  CANCELADO: 'cancelled'
}[estado])

export const Pedidos = () => {
  const { pedidos, usuarios, cargando, errores, recargar, cambiarEstadoPedido } = useDatosAdmin()
  const [pedidoActualizando, setPedidoActualizando] = useState<number | null>(null)
  const [errorEstado, setErrorEstado] = useState('')
  const [exitoEstado, setExitoEstado] = useState('')
  const nombres = new Map((usuarios ?? []).map(u => [u.userId, u.name]))
  const ordenados = [...(pedidos ?? [])].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  const cambiarEstado = async (id: number, estado: EstadoPedido) => {
    setPedidoActualizando(id)
    setErrorEstado('')
    setExitoEstado('')
    try {
      await cambiarEstadoPedido(id, estado)
      setExitoEstado(`El pedido #${id} ahora está ${nombresEstado[estado].toLowerCase()}. El cambio quedó guardado en pedidos_db.`)
    } catch (error) {
      setErrorEstado(error instanceof Error ? error.message : 'No se pudo actualizar el estado del pedido.')
    } finally {
      setPedidoActualizando(null)
    }
  }

  return <section className="hc-dashboard">
    <div className="hc-dashboard-heading"><div><span className="hc-section-kicker">ADMINISTRACIÓN / PEDIDOS</span>
      <h1>Pedidos registrados</h1><p>Actualiza el estado de cada pedido. Los cambios se guardan en la base de datos.</p></div>
      <button type="button" className="hc-admin-btn secondary" onClick={() => { void recargar() }} disabled={cargando || pedidoActualizando !== null}><RefreshCw size={16}/> Actualizar</button>
    </div>
    {errores.length > 0 && <div className="hc-admin-error" role="alert">{errores.join(' · ')}</div>}
    {errorEstado && <div className="hc-admin-error" role="alert">{errorEstado}</div>}
    {exitoEstado && <div className="hc-admin-success" role="status">{exitoEstado}</div>}
    <div className="hc-dashboard-card"><div className="hc-card-heading"><div><h2>{cargando ? 'Consultando...' : pedidos === null ? 'Sin conexión' : `${pedidos.length} pedido(s)`}</h2>
      <p>{pedidos === null ? 'No se pudo consultar el microservicio.' : 'Pedidos existentes en pedidos_db'}</p></div></div>
      <div className="hc-table-wrap"><table className="hc-orders-table"><thead><tr><th>ID</th><th>Cliente</th><th>Fecha</th><th>Productos</th><th>Total</th><th>Estado / actualizar</th></tr></thead><tbody>
        {ordenados.map(p => {
          const opciones = siguientesEstados(p.status)
          const actualizando = pedidoActualizando === p.orderId
          return <tr key={p.orderId}><td>#{p.orderId}</td><td>{nombres.get(p.userId) ?? `Usuario #${p.userId}`}</td>
            <td>{fecha(p.createdAt)}</td><td>{p.items?.map(i => `${i.productName} (x${i.quantity})`).join(', ') || 'Sin detalles'}</td>
            <td><strong>{clp(p.total)}</strong></td><td>
              <span className={`hc-order-status ${claseEstado(p.status)}`}>{nombresEstado[p.status]}</span>
              <select
                className="hc-order-status-select"
                aria-label={`Cambiar estado del pedido #${p.orderId}`}
                value={p.status}
                disabled={actualizando || opciones.length === 0}
                onChange={evento => { void cambiarEstado(p.orderId, evento.target.value as EstadoPedido) }}
              >
                <option value={p.status}>{nombresEstado[p.status]}</option>
                {opciones.map(estado => <option key={estado} value={estado}>{nombresEstado[estado]}</option>)}
              </select>
              {actualizando && <small className="hc-admin-muted">Guardando...</small>}
              {!actualizando && opciones.length === 0 && <small className="hc-admin-muted">Sin cambios disponibles</small>}
            </td></tr>
        })}
        {!cargando && pedidos?.length === 0 && <tr><td colSpan={6}>No hay pedidos guardados en la base de datos.</td></tr>}
      </tbody></table></div>
    </div>
  </section>
}
