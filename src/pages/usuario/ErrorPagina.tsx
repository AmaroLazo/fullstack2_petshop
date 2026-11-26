import { Link, isRouteErrorResponse, useRouteError } from 'react-router'

export function PaginaNoEncontrada() {
  return <MensajePagina titulo="Página no encontrada" mensaje="Revisa la dirección o elige adónde quieres ir." />
}

export function ErrorPagina() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <PaginaNoEncontrada />
  return <MensajePagina titulo="No se pudo cargar la página" mensaje="Puedes volver a la tienda o explorar el catálogo." />
}

function MensajePagina({ titulo, mensaje }: { titulo: string; mensaje: string }) {
  return (
    <section className="mx-auto max-w-xl space-y-4 px-5 py-14">
      <h1 className="text-3xl font-bold text-[#3D2645]">{titulo}</h1>
      <p>{mensaje}</p>
      <nav aria-label="Opciones de navegación" className="flex flex-wrap gap-4 text-[#6C2A8A]">
        <Link className="underline" to="/">Volver a la tienda</Link>
        <Link className="underline" to="/catalogo">Explorar catálogo</Link>
      </nav>
    </section>
  )
}
