import { useEffect, useId, useRef } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Button } from './ui/button'

interface Props {
  titulo: string
  detalle?: string
  textoBoton?: string
  onClose: () => void
}

export function ConfirmacionExito({ titulo, detalle, textoBoton = 'Aceptar', onClose }: Props) {
  const ventana = useRef<HTMLDialogElement>(null)
  const tituloId = useId()

  useEffect(() => {
    const dialogo = ventana.current
    if (dialogo && !dialogo.open) dialogo.showModal()
  }, [])

  return (
    <dialog ref={ventana} aria-labelledby={tituloId} onClose={onClose}
      className="m-auto w-11/12 max-w-sm rounded-2xl border border-purple-100 bg-white p-6 text-center text-[#3D2645] shadow-xl backdrop:bg-black/45">
      <CheckCircle2 aria-hidden="true" className="mx-auto mb-3 text-green-700" size={36} />
      <h2 id={tituloId} className="text-xl font-bold">{titulo}</h2>
      {detalle && <p className="mt-2 text-sm">{detalle}</p>}
      <form method="dialog" className="mt-5">
        <Button type="submit">{textoBoton}</Button>
      </form>
    </dialog>
  )
}
