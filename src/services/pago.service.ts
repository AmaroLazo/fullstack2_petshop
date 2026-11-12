import { apiRequest } from './api.service'

export interface PagoRegistrado {
  id: number
  orderId: number
  amount: number
  installments?: number
  method: 'DEBITO' | 'CREDITO'
  status: 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED'
  transactionId: string | null
  transactionDate: string
}

export const procesarPago = (datos: { orderId: number; method: 'DEBITO' | 'CREDITO'; idempotencyKey: string; installments: number }) =>
  apiRequest<PagoRegistrado>('/api/payments', { method: 'POST', body: JSON.stringify(datos) })

export const obtenerPagosPorPedido = (orderId: number) =>
  apiRequest<PagoRegistrado[]>(`/api/payments/by-order/${orderId}`)

export const reintentarPago = (paymentId: number) =>
  apiRequest<PagoRegistrado>(`/api/payments/${paymentId}/retry`, { method: 'POST' })
