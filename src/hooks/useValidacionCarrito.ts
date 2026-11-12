import { useCallback, useState } from 'react'
import { useCarrito } from './useCarrito'
import { revisarCarrito, type ProblemaCarrito } from '../services/validacion-carrito.service'

export const useValidacionCarrito = () => {
  const { items, actualizarPrecios } = useCarrito()
  const [validando, setValidando] = useState(false)
  const [noDisponibles, setNoDisponibles] = useState<ProblemaCarrito[]>([])
  const [errorValidacion, setErrorValidacion] = useState('')

  const validarAntesDeContinuar = useCallback(async () => {
    setValidando(true)
    setErrorValidacion('')
    setNoDisponibles([])
    try {
      if (!items.length) { setErrorValidacion('Tu carrito está vacío.'); return false }
      const resultado = await revisarCarrito(items)
      setNoDisponibles(resultado.problemas)
      if (resultado.problemas.length) return false
      if (resultado.cambiosPrecio) {
        actualizarPrecios(resultado.actualizados)
        setErrorValidacion('Algunos precios cambiaron. Revisa el nuevo total y vuelve a continuar.')
        return false
      }
      return true
    } catch (e) {
      setErrorValidacion(e instanceof Error ? e.message : 'No se pudo revisar el carrito.')
      return false
    } finally { setValidando(false) }
  }, [items, actualizarPrecios])

  const quitarAdvertencia = (productoId: number) =>
    setNoDisponibles((actual) => actual.filter((p) => p.productoId !== productoId))
  const limpiarAdvertencias = () => { setNoDisponibles([]); setErrorValidacion('') }

  return { validando, noDisponibles, errorValidacion, validarAntesDeContinuar, quitarAdvertencia, limpiarAdvertencias }
}
