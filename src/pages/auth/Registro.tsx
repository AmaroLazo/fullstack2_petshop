import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../components/ui/button'
import { registrarUsuario } from '../../services/usuario.service'

export const Registro = () => {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const destino = params.get('redirect')
  const rutaDestino = destino?.startsWith('/') && !destino.startsWith('//') ? destino : '/'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [password, setPassword] = useState('')
  const [confirmarPassword, setConfirmarPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    if (password !== confirmarPassword) { setError('Las contraseñas no coinciden.'); return }
    if (!name.trim() || !email.trim() || !street.trim() || !city.trim()) {
      setError('Completa todos los datos de la cuenta.'); return
    }
    setCargando(true)
    try {
      await registrarUsuario({
        name: name.trim(), email: email.trim(), password,
        phone: phone.trim(), street: street.trim(), city: city.trim()
      })
      // El servidor guarda en MySQL. Se inicia sesión de forma separada.
      navigate(`/login?redirect=${encodeURIComponent(rutaDestino)}`, { replace: true })
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
          <input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e => setName(e.target.value)} className="h-11 w-full rounded-md border px-3" />
        </label>
        <label className="block space-y-1 text-sm font-medium">Correo electrónico
          <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="h-11 w-full rounded-md border px-3" />
        </label>
        <label className="block space-y-1 text-sm font-medium">Número de teléfono
          <input required type="tel" minLength={8} maxLength={30} autoComplete="tel" placeholder="Ej.: +56 9 1234 5678" value={phone} onChange={e => setPhone(e.target.value)} className="h-11 w-full rounded-md border px-3" />
        </label>
        <label className="block space-y-1 text-sm font-medium">Dirección (calle y número)
          <input required maxLength={100} autoComplete="street-address" placeholder="Ej.: Av. Los Aromos 123" value={street} onChange={e => setStreet(e.target.value)} className="h-11 w-full rounded-md border px-3" />
        </label>
        <label className="block space-y-1 text-sm font-medium">Ciudad o comuna
          <input required maxLength={50} autoComplete="address-level2" placeholder="Ej.: Coronel" value={city} onChange={e => setCity(e.target.value)} className="h-11 w-full rounded-md border px-3" />
        </label>
        <label className="block space-y-1 text-sm font-medium">Contraseña (mínimo 8 caracteres)
          <input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="h-11 w-full rounded-md border px-3" />
        </label>
        <label className="block space-y-1 text-sm font-medium">Confirmar contraseña
          <input required type="password" minLength={8} autoComplete="new-password" value={confirmarPassword} onChange={e => setConfirmarPassword(e.target.value)} aria-invalid={confirmarPassword.length > 0 && confirmarPassword !== password} className="h-11 w-full rounded-md border px-3" />
          {confirmarPassword.length > 0 && confirmarPassword !== password && <span className="block text-sm text-red-700">Las contraseñas no coinciden.</span>}
        </label>
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="submit" disabled={cargando} className="w-full">{cargando ? 'Registrando...' : 'Registrarme'}</Button>
      </form>
      <p className="text-sm">¿Ya tienes cuenta? <Link to={`/login?redirect=${encodeURIComponent(rutaDestino)}`} className="underline">Inicia sesión</Link></p>
    </section>
  )
}
