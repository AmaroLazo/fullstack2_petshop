import type { ReactNode } from 'react'

type Tono = 'success' | 'danger' | 'warning' | 'info' | 'neutral'

interface EstadoBadgeProps {
  tono: Tono
  children: ReactNode
}

// Una sola etiqueta para estados de todo el administrador.
export const EstadoBadge = ({ tono, children }: EstadoBadgeProps) => (
  <span className={`hc-admin-badge hc-admin-badge--${tono}`}>
    <span className="hc-admin-badge-dot" aria-hidden="true" />
    {children}
  </span>
)

export const EstadoActivo = ({ activo, femenino = false }: { activo: boolean; femenino?: boolean }) => (
  <EstadoBadge tono={activo ? 'success' : 'danger'}>
    {activo ? (femenino ? 'Activa' : 'Activo') : (femenino ? 'Inactiva' : 'Inactivo')}
  </EstadoBadge>
)

export const EstadoPedidoBadge = ({ estado }: { estado: string }) => {
  const estados: Record<string, { texto: string; tono: Tono }> = {
    PENDIENTE: { texto: 'Pendiente', tono: 'warning' },
    EN_PREPARACION: { texto: 'En preparación', tono: 'info' },
    ENVIADO: { texto: 'Enviado', tono: 'info' },
    ENTREGADO: { texto: 'Entregado', tono: 'success' },
    CANCELADO: { texto: 'Cancelado', tono: 'danger' }
  }
  const actual = estados[estado] ?? { texto: estado.replaceAll('_', ' '), tono: 'neutral' as Tono }
  return <EstadoBadge tono={actual.tono}>{actual.texto}</EstadoBadge>
}

export const EstadoStock = ({ cantidad, minimo }: { cantidad: number; minimo: number }) => {
  const stock = Number(cantidad)
  const limite = Number(minimo)
  const agotado = !Number.isFinite(stock) || stock <= 0
  const bajo = !agotado && stock <= (Number.isFinite(limite) ? limite : 0)
  return <EstadoBadge tono={agotado ? 'danger' : bajo ? 'warning' : 'success'}>
    {agotado ? 'Agotado' : bajo ? 'Stock bajo' : 'Stock OK'} · {Number.isFinite(stock) ? stock : 0}
  </EstadoBadge>
}
