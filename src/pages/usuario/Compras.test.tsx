// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useHistorialCompras } from '../../hooks/useHistorialCompras'
import { useAuth } from '../../hooks/useAuth'
import { CarritoProvider } from '../../hooks/useCarrito'
import { obtenerProductoPorId } from '../../services/producto.service'
import { revisarCarrito } from '../../services/validacion-carrito.service'
import { crearPedido, obtenerPedido, obtenerPedidoPorIntento, type PedidoCliente } from '../../services/pedido.service'
import { obtenerPagosPorPedido, procesarPago, reintentarPago } from '../../services/pago.service'
import { obtenerUsuario } from '../../services/usuario.service'
import { Checkout } from './Checkout'
import { Compras } from './Compras'

vi.mock('../../hooks/useHistorialCompras', () => ({ useHistorialCompras: vi.fn() }))
vi.mock('../../services/producto.service', () => ({ obtenerProductoPorId: vi.fn() }))
vi.mock('../../hooks/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../../services/usuario.service', () => ({ obtenerUsuario: vi.fn() }))
vi.mock('../../services/pedido.service', () => ({
  crearPedido: vi.fn(), obtenerPedido: vi.fn(), obtenerPedidoPorIntento: vi.fn(),
}))
vi.mock('../../services/pago.service', () => ({
  obtenerPagosPorPedido: vi.fn(), procesarPago: vi.fn(), reintentarPago: vi.fn(),
}))

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.resetAllMocks()
})

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
  it('repite el mismo intento de pedido, confirma las cuotas guardadas y recupera el pago sin repetirlo', async () => {
    const extra = { productoId: 2, nombre: 'Juguete', precio: 2000, cantidad: 1 }
    const pago = {
      id: 9, orderId: 42, amount: 6180, installments: 3, method: 'CREDITO' as const,
      status: 'FAILED' as const, transactionId: null, transactionDate: '',
    }
    const usuario = { ...historial.usuario, addresses: [{ id: 1, ...pedidoGuardado.shippingAddress!,
      street: 'Los Robles', city: 'Coronel' }] }
    const pedido = { ...pedidoGuardado, status: 'PENDIENTE' as const }
    const claveCarrito = 'huellitas_carrito_7'
    localStorage.setItem(claveCarrito, JSON.stringify([item]))
    vi.mocked(useAuth).mockReturnValue({
      usuario, validarUsuario: vi.fn().mockResolvedValue(usuario),
      ingresar: vi.fn(), salir: vi.fn(), actualizarUsuario: vi.fn(),
    })
    vi.mocked(obtenerUsuario).mockResolvedValue(usuario)
    vi.mocked(obtenerProductoPorId).mockResolvedValue(producto)
    vi.mocked(crearPedido).mockRejectedValueOnce(new Error('Sin respuesta')).mockResolvedValueOnce(pedido)
    vi.mocked(obtenerPedidoPorIntento).mockResolvedValue(null)
    vi.mocked(obtenerPedido).mockResolvedValue(pedido)
    let confirmado = false
    vi.mocked(obtenerPagosPorPedido).mockImplementation(async () =>
      [confirmado ? { ...pago, status: 'SUCCESS' } : pago])
    vi.mocked(reintentarPago).mockImplementation(async () => {
      confirmado = true
      throw new Error('Se perdió la respuesta del pago')
    })

    render(<MemoryRouter><CarritoProvider><Checkout /></CarritoProvider></MemoryRouter>)
    fireEvent.click(await screen.findByRole('button', { name: 'Continuar al método de pago' }))
    fireEvent.click(screen.getByRole('button', { name: 'Tarjeta de débito' }))
    fireEvent.change(screen.getByLabelText('Nombre del titular'), { target: { value: 'Cliente Prueba' } })
    fireEvent.change(screen.getByLabelText('Número de tarjeta'), { target: { value: '4111111111111111' } })
    fireEvent.change(screen.getByLabelText('Vencimiento (MM/AA)'), { target: { value: '12/99' } })
    fireEvent.change(screen.getByLabelText('CVV'), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Continuar al resumen' }))
    fireEvent.click(screen.getByRole('button', { name: 'Procesar el pago' }))

    await screen.findByText(/No se confirmó el pedido/)
    const intento = JSON.parse(localStorage.getItem('huellitas_compra_pendiente_7')!)
    expect(intento.datos.creationKey).toBe(intento.key)
    localStorage.setItem(claveCarrito, JSON.stringify([{ ...item, cantidad: 3 }, extra]))
    fireEvent.click(screen.getByRole('button', { name: 'Recuperar pedido' }))
    await screen.findByRole('heading', { name: 'Reintentar pago del pedido #42' })
    expect(crearPedido).toHaveBeenNthCalledWith(1, intento.datos)
    expect(crearPedido).toHaveBeenNthCalledWith(2, intento.datos)
    expect(screen.getByText('Método guardado:').parentElement?.textContent).toContain('Crédito')
    expect(screen.getByText('Cuotas:').parentElement?.textContent).toContain('3')

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar reintento' }))
    await screen.findByRole('heading', { name: '¡Compra completada!' })
    expect(reintentarPago).toHaveBeenCalledExactlyOnceWith(9)
    expect(procesarPago).not.toHaveBeenCalled()
    expect(screen.getByText('2 × Alimento para perro')).toBeTruthy()
    await waitFor(() => expect(JSON.parse(localStorage.getItem(claveCarrito)!))
      .toEqual([{ ...item, cantidad: 1 }, extra]))
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
