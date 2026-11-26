import { EstadoPedidoBadge } from '../../components/admin/EstadoBadge'
import { useState } from 'react'
import { RefreshCw, Save } from 'lucide-react'
import { useDatosAdmin } from '../../hooks/useDatosAdmin'
import type { EstadoPedido } from '../../services/pedido.service'

const clp = (valor: number | string) => Number(valor).toLocaleString('es-CL', {
  style: 'currency', currency: 'CLP', maximumFractionDigits: 0
})

const fecha = (valor: string) => new Date(valor).toLocaleString('es-CL')

const nombresEstado: Record<EstadoPedido, string> = {
  PENDIENTE: 'Pendiente',
  EN_PREPARACION: 'En preparación',
  ENVIADO: 'Enviado',
  ENTREGADO: 'Entregado',
  CANCELADO: 'Cancelado'
}

// Solo las transiciones permitidas por el microservicio de pedidos.
const siguientesEstados = (estado: EstadoPedido): EstadoPedido[] => {
  switch (estado) {
    case 'PENDIENTE': return ['EN_PREPARACION', 'CANCELADO']
    case 'EN_PREPARACION': return ['ENVIADO', 'CANCELADO']
    case 'ENVIADO': return ['ENTREGADO']
    case 'ENTREGADO':
    case 'CANCELADO': return []
  }
}


export const Pedidos = () => {
  const { pedidos, usuarios, cargando, errores, recargar, cambiarEstadoPedido } = useDatosAdmin()
  const [estadosElegidos, setEstadosElegidos] = useState<Record<number, EstadoPedido>>({})
  const [pedidoActualizando, setPedidoActualizando] = useState<number | null>(null)
  const [errorEstado, setErrorEstado] = useState('')
  const [exitoEstado, setExitoEstado] = useState('')

  const nombres = new Map((usuarios ?? []).map(usuario => [usuario.userId, usuario.name]))
  const ordenados = [...(pedidos ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )

  const guardarEstado = async (id: number, estado: EstadoPedido) => {
    if (pedidoActualizando !== null) return
    setPedidoActualizando(id)
    setErrorEstado('')
    setExitoEstado('')
    try {
      await cambiarEstadoPedido(id, estado)
      setEstadosElegidos(actuales => {
        const nuevos = { ...actuales }
        delete nuevos[id]
        return nuevos
      })
      setExitoEstado(`Pedido #${id} actualizado a «${nombresEstado[estado]}».`)
    } catch (error) {
      setErrorEstado(error instanceof Error ? error.message : 'No fue posible cambiar el estado.')
    } finally {
      setPedidoActualizando(null)
    }
  }

  return (
    <section className="hc-dashboard">
      <div className="hc-dashboard-heading">
        <div>
          <span className="hc-section-kicker">ADMINISTRACIÓN / PEDIDOS</span>
          <h1>Pedidos registrados</h1>
          <p>Consulta cada pedido y actualiza su estado desde el microservicio.</p>
        </div>
        <button
          type="button"
          className="hc-admin-btn secondary"
          disabled={cargando || pedidoActualizando !== null}
          onClick={() => { void recargar() }}
        >
          <RefreshCw size={16} /> {cargando ? 'Cargando...' : 'Actualizar'}
        </button>
      </div>

      {errores.length > 0 && <div className="hc-admin-error" role="alert">{errores.join(' · ')}</div>}
      {errorEstado && <div className="hc-admin-error" role="alert">{errorEstado}</div>}
      {exitoEstado && <div className="hc-admin-success" role="status">{exitoEstado}</div>}

      <div className="hc-dashboard-card">
        <div className="hc-card-heading">
          <div>
            <h2>{cargando ? 'Consultando...' : pedidos === null ? 'Sin conexión' : `${pedidos.length} pedido(s)`}</h2>
            <p>{pedidos === null ? 'No se pudo consultar el microservicio de pedidos.' : 'Datos reales de pedidos_db'}</p>
          </div>
        </div>

        <div className="hc-admin-order-list">
          {ordenados.map(pedido => {
            const opciones = siguientesEstados(pedido.status)
            const elegido = estadosElegidos[pedido.orderId] ?? pedido.status
            const guardando = pedidoActualizando === pedido.orderId
            const puedeGuardar = elegido !== pedido.status && pedidoActualizando === null && !cargando

            return (
              <article className="hc-admin-order-card" key={pedido.orderId}>
                <div className="hc-admin-order-header">
                  <div>
                    <h3>Pedido #{pedido.orderId}</h3>
                    <p>{nombres.get(pedido.userId) ?? `Usuario #${pedido.userId}`}</p>
                    <small>{fecha(pedido.createdAt)}</small>
                  </div>
                  <EstadoPedidoBadge estado={pedido.status} />
                </div>

                <div className="hc-admin-order-products">
                  <strong>Productos del pedido</strong>
                  {pedido.items?.length ? pedido.items.map((item, indice) => (
                    <div className="hc-admin-order-product" key={`${item.productId}-${item.id ?? indice}`}>
                      <span className="hc-admin-order-product-name">{item.productName}</span>
                      <span className="hc-admin-order-product-details">
                        {item.quantity} {item.quantity === 1 ? 'unidad' : 'unidades'} · {clp(item.subtotal)}
                      </span>
                    </div>
                  )) : <p className="hc-admin-muted">Sin detalles de productos.</p>}
                </div>

                <div className="hc-admin-order-footer">
                  <div className="hc-admin-order-total">
                    <span>Total del pedido</span>
                    <strong>{clp(pedido.total)}</strong>
                  </div>
                  <div className="hc-admin-order-edit">
                    <label htmlFor={`estado-${pedido.orderId}`}>Cambiar estado</label>
                    <div className="hc-admin-order-edit-actions">
                      <select
                        id={`estado-${pedido.orderId}`}
                        className="hc-order-status-select"
                        value={elegido}
                        disabled={pedidoActualizando !== null || opciones.length === 0}
                        onChange={evento => setEstadosElegidos(actuales => ({
                          ...actuales, [pedido.orderId]: evento.target.value as EstadoPedido
                        }))}
                      >
                        <option value={pedido.status}>{nombresEstado[pedido.status]}</option>
                        {opciones.map(estado => <option key={estado} value={estado}>{nombresEstado[estado]}</option>)}
                      </select>
                      <button
                        type="button"
                        className="hc-admin-btn"
                        disabled={!puedeGuardar}
                        onClick={() => { void guardarEstado(pedido.orderId, elegido) }}
                      >
                        <Save size={15} /> {guardando ? 'Guardando...' : 'Guardar cambio'}
                      </button>
                    </div>
                    {opciones.length === 0 && <small className="hc-admin-muted">Este pedido no admite más cambios.</small>}
                  </div>
                </div>
              </article>
            )
          })}
          {!cargando && pedidos?.length === 0 && (
            <p className="hc-admin-muted">No hay pedidos registrados en la base de datos.</p>
          )}
        </div>
      </div>
    </section>
  )
}
