import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../components/ui/button'
import { registrarUsuario } from '../../services/usuario.service'
import { validarCorreo, validarNombre, validarTelefono } from '../../lib/validaciones-auth'

import { CamposDireccion } from '../../components/CamposDireccion'
import { ConfirmacionExito } from '../../components/ConfirmacionExito'
import { direccionVacia, limpiarDireccion, validarDireccionRegistro } from '../../lib/direccion'

export const Registro = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const destino = params.get('redirect')
  const rutaDestino = destino?.startsWith('/') && !destino.startsWith('//') ? destino : '/'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [datosDireccion, setDatosDireccion] = useState(direccionVacia)
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [registroExitoso, setRegistroExitoso] = useState(false)
  const [error, setError] = useState('')
  const [camposTocados, setCamposTocados] = useState({ name: false, email: false, phone: false })
  const errorNombre = validarNombre(name)
  const errorCorreo = validarCorreo(email)
  const errorTelefono = validarTelefono(phone)

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (cargando || registroExitoso) return
    setError('')
    setCamposTocados({ name: true, email: true, phone: true })
    const direccion = limpiarDireccion(datosDireccion)
    const primerError = errorNombre || errorCorreo || errorTelefono || validarDireccionRegistro(direccion)
    if (primerError) { setError(primerError); return }
    if (password !== confirmarPassword) { setError('Las contraseñas no coinciden.'); return }
    if (!name.trim() || !email.trim()) {
      setError('Completa todos los datos de la cuenta.'); return
    }
    setCargando(true)
    try {
      await registrarUsuario({
        name: name.trim().replace(/\s+/g, ' '), email: email.trim().toLowerCase(), password,
        phone: `+569${phone}`, ...direccion
      })
      setRegistroExitoso(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la cuenta.')
    } finally { setCargando(false) }
  }

  return (
    <section className="mx-auto max-w-md space-y-5 px-4 py-12">
      <h1 className="text-2xl font-bold">Crear cuenta</h1>
      <p className="text-sm text-muted-foreground">La cuenta se guardará en el microservicio de usuarios (MySQL).</p>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block space-y-1 text-sm font-medium">Nombre completo
          <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)} onBlur={() => setCamposTocados(s => ({ ...s, name: true }))} aria-invalid={camposTocados.name && Boolean(errorNombre)} aria-describedby={camposTocados.name && errorNombre ? "registro-error-nombre" : undefined} className="h-11 w-full rounded-md border px-3" />
          {camposTocados.name && errorNombre && <span id="registro-error-nombre" role="alert" className="block text-sm text-red-700">{errorNombre}</span>}
        </label>
        <label className="block space-y-1 text-sm font-medium">Correo electrónico
          <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} onBlur={() => setCamposTocados(s => ({ ...s, email: true }))} aria-invalid={camposTocados.email && Boolean(errorCorreo)} aria-describedby={camposTocados.email && errorCorreo ? "registro-error-correo" : undefined} className="h-11 w-full rounded-md border px-3" />
          {camposTocados.email && errorCorreo && <span id="registro-error-correo" role="alert" className="block text-sm text-red-700">{errorCorreo}</span>}
        </label>
        <label className="block space-y-1 text-sm font-medium">Número de teléfono
          <span className="flex items-center overflow-hidden rounded-md border">
            <span className="shrink-0 bg-muted px-3 py-3">+56 9</span>
            <input required type="tel" inputMode="numeric" minLength={8} maxLength={8} pattern="[0-9]{8}" placeholder="12345678" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 8))} onBlur={() => setCamposTocados(s => ({ ...s, phone: true }))} aria-invalid={camposTocados.phone && Boolean(errorTelefono)} aria-describedby={camposTocados.phone && errorTelefono ? "registro-error-telefono" : "registro-ayuda-telefono"} className="h-11 min-w-0 flex-1 px-3" />
          </span>
          <span id="registro-ayuda-telefono" className="block text-sm text-muted-foreground">Escribe los 8 dígitos que siguen al prefijo.</span>
          {camposTocados.phone && errorTelefono && <span id="registro-error-telefono" role="alert" className="block text-sm text-red-700">{errorTelefono}</span>}
        </label>
        <CamposDireccion value={datosDireccion} onChange={setDatosDireccion} inputClassName="h-11 w-full rounded-md border px-3" registro />
        <label className="block space-y-1 text-sm font-medium">Contraseña (mínimo 8 caracteres)
          <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="h-11 w-full rounded-md border px-3" />
        </label>
        <label className="block space-y-1 text-sm font-medium">Confirmar contraseña
          <input required type="password" minLength={8} autoComplete="new-password" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} aria-invalid={confirmarPassword.length > 0 && confirmarPassword !== password} className="h-11 w-full rounded-md border px-3" />
          {confirmarPassword.length > 0 && confirmarPassword !== password && <span className="block text-sm text-red-700">Las contraseñas no coinciden.</span>}
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={cargando || registroExitoso} className="w-full">{cargando ? 'Registrando...' : 'Registrarme'}</Button>
      </form>
      {registroExitoso && <ConfirmacionExito titulo="Registro exitoso" textoBoton="Ir a iniciar sesión"
        onClose={() => navigate(`/login?redirect=${encodeURIComponent(rutaDestino)}`, { replace: true })} />}
      <p className="text-sm">¿Ya tienes cuenta? <Link to={`/login?redirect=${encodeURIComponent(rutaDestino)}`} className="underline">Inicia sesión</Link></p>
    </section>
  )
}
