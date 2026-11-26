// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHistorialCompras } from '../../hooks/useHistorialCompras'
import { obtenerProductoPorId } from '../../services/producto.service'
import { revisarCarrito } from '../../services/validacion-carrito.service'
import { crearComprobante, descontarCompra } from '../../lib/compra'
import type { PedidoCliente } from '../../services/pedido.service'
import { Compras } from './Compras'

vi.mock('../../hooks/useHistorialCompras', () => ({ useHistorialCompras: vi.fn() }))
vi.mock('../../services/producto.service', () => ({ obtenerProductoPorId: vi.fn() }))

afterEach(cleanup)

const producto = { id: 1, name: 'Alimento para perro', price: 3000, stockQuantity: 5, active: true, available: true }
const item = { productoId: 1, nombre: producto.name, precio: 3000, cantidad: 2 }
const historial = {
  usuario: { userId: 7, name: 'Cliente Prueba', email: 'cliente@ejemplo.cl', role: 'CUSTOMER' as const, active: true },
  pedidos: [],
  pagos: {},
  pagosNoDisponibles: [],
  pagina: 0,
  totalPaginas: 1,
  setPagina: vi.fn(),
  cargando: false,
  error: '',
  reintentar: vi.fn(),
  recargar: vi.fn(),
}

const mostrarCompras = () => render(<MemoryRouter><Compras /></MemoryRouter>)
const pedidoGuardado: PedidoCliente = {
  orderId: 42, userId: 7, status: 'ENTREGADO', total: 6000, createdAt: '', updatedAt: '',
  shippingAddress: { street: 'Los Robles', houseNumber: '25', city: 'Coronel' },
  items: [{ id: 1, productId: 1, productName: producto.name, quantity: 2, unitPrice: 3000, subtotal: 6000 }],
}

describe('Compras', () => {
  it('recupera el comprobante del pedido guardado y conserva los productos nuevos del carrito', () => {
    const extra = { productoId: 2, nombre: 'Juguete', precio: 2000, cantidad: 1 }
    const pago = {
      id: 9, orderId: 42, amount: 6180, installments: 3, method: 'CREDITO' as const,
      status: 'SUCCESS' as const, transactionId: null, transactionDate: '',
    }
    const comprobante = crearComprobante(pedidoGuardado, pago)
    expect(comprobante.pedido.shippingAddress?.houseNumber).toBe('25')
    expect(comprobante.pedido.items.map(({ productName }) => productName)).toEqual([producto.name])
    expect(comprobante.pago.amount).toBe(6180)
    expect(comprobante.cuotas).toBe(3)
    expect(descontarCompra([{ ...item, cantidad: 3 }, extra], pedidoGuardado.items))
      .toEqual([{ ...item, cantidad: 1 }, extra])
  })

  it('bloquea una cantidad mayor al stock disponible', async () => {
    vi.mocked(obtenerProductoPorId).mockResolvedValueOnce({ ...producto, stockQuantity: 1 })
    const revision = await revisarCarrito([item])
    expect(revision.problemas).toEqual([
      { productoId: 1, nombre: item.nombre, motivo: 'Stock disponible: 1. Reduce la cantidad o elimina el producto.' },
    ])
  })

  it('detecta un cambio de precio y devuelve el precio actualizado', async () => {
    vi.mocked(obtenerProductoPorId).mockResolvedValueOnce({ ...producto, finalPrice: 2700 })
    const revision = await revisarCarrito([item])
    expect(revision.problemas).toEqual([])
    expect(revision.cambiosPrecio).toBe(true)
    expect(revision.actualizados).toEqual([{ ...item, precio: 2700 }])
  })

  it('muestra un pedido, su estado y el producto en el historial', () => {
    vi.mocked(useHistorialCompras).mockReturnValueOnce({
      ...historial,
      pedidos: [pedidoGuardado],
      pagosNoDisponibles: [42],
    })
    mostrarCompras()
    const pedido = within(screen.getByRole('article'))
    expect(pedido.getByRole('heading', { name: 'Pedido #42' })).toBeTruthy()
    expect(pedido.getByText('Entregado')).toBeTruthy()
    expect(pedido.getByText('2 × Alimento para perro')).toBeTruthy()
    expect(pedido.getByText('No se pudo consultar el pago de este pedido.')).toBeTruthy()
  })

  it('mantiene el snapshot del mensaje y el enlace cuando no hay pedidos', () => {
    vi.mocked(useHistorialCompras).mockReturnValueOnce(historial)
    mostrarCompras()
    expect([
      screen.getByRole('heading', { name: 'Aún no tienes pedidos' }),
      screen.getByRole('link', { name: 'Explorar catálogo' }),
    ]).toMatchSnapshot()
  })
})
