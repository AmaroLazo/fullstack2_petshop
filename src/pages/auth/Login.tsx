import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { useAuth } from '../../hooks/useAuth'

export const Login = () => {
  const { ingresar } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const destino = params.get('redirect')
  const rutaDestino = destino?.startsWith('/') && !destino.startsWith('//') ? destino : '/'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setCargando(true)
    setError('')
    try {
      const perfil = await ingresar(email, password)
      // Las cuentas ADMIN entran directamente al dashboard; CUSTOMER vuelve a la tienda.
      const destinoCliente = rutaDestino.startsWith('/admin') ? '/' : rutaDestino
      navigate(perfil.role === 'ADMIN' ? '/admin' : destinoCliente, { replace: true })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo iniciar sesión.')
    } finally { setCargando(false) }
  }

  return (
    <section className="mx-auto w-full max-w-lg px-4 py-12">
      <Card className="border-[#e8daef] bg-white shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-3xl text-[#3D2645]">Iniciar sesión</CardTitle>
          <CardDescription className="text-base">
            Ingresa con una cuenta existente en Huellitas.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={enviar} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-base">Correo electrónico</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={cargando}
                className="h-12 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-base">Contraseña</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={cargando}
                className="h-12 text-base"
              />
            </div>
            {error && <p role="alert" className="text-base text-red-700">{error}</p>}
            <Button
              className="h-12 w-full bg-[#6C2A8A] text-base text-white hover:bg-[#502069]"
              type="submit"
              disabled={cargando}
            >
              {cargando ? 'Validando...' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-3 text-center text-base">
          <p>
            ¿No tienes cuenta?{' '}
            <Link className="font-semibold text-[#6C2A8A] underline" to={`/registro?redirect=${encodeURIComponent(rutaDestino)}`}>
              Regístrate
            </Link>
          </p>
          <Link to="/" className="text-[#6C2A8A] underline">Volver a la tienda</Link>
        </CardFooter>
      </Card>
    </section>
  )
}
