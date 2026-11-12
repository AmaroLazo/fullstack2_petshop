import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { KeyRound, MapPin, Save, UserRound, UserX, Trash2 } from 'lucide-react'
import { useCuenta } from '../../hooks/useCuenta'
import { agregarDireccion, cambiarContrasena, desactivarCuenta, eliminarDireccion, actualizarPerfil } from '../../services/usuario.service'

const mensajeError = (error: unknown) => error instanceof Error ? error.message : 'No se pudo completar la operación.'

export const AjustesCuenta = () => {
  const navigate = useNavigate()
  const { usuario, perfil, cargando, error, refrescar, guardarEnSesion, validarUsuario, salir } = useCuenta()
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [actual, setActual] = useState('')
  const [nueva, setNueva] = useState('')
  const [calle, setCalle] = useState('')
  const [ciudad, setCiudad] = useState('')
  const [procesando, setProcesando] = useState('')
  const [aviso, setAviso] = useState('')
  const [fallo, setFallo] = useState('')

  useEffect(() => { if (perfil) { setNombre(perfil.name); setEmail(perfil.email) } }, [perfil])

  const ejecutar = async (accion: string, operacion: () => Promise<void>, exito: string) => {
    setProcesando(accion); setFallo(''); setAviso('')
    try { await operacion(); setAviso(exito) }
    catch (e) { setFallo(mensajeError(e)) }
    finally { setProcesando('') }
  }

  const guardarPerfil = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void ejecutar('perfil', async () => {
      const cuenta = await validarUsuario()
      const resultado = await actualizarPerfil(cuenta.userId, { name: nombre.trim(), email: email.trim() })
      guardarEnSesion(resultado)
    }, 'Tus datos se actualizaron correctamente.')
  }
  const guardarContrasena = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void ejecutar('contrasena', async () => {
      const cuenta = await validarUsuario()
      await cambiarContrasena(cuenta.userId, actual, nueva)
      setActual(''); setNueva('')
    }, 'Tu contraseña fue actualizada.')
  }
  const guardarDireccion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    void ejecutar('direccion', async () => {
      const cuenta = await validarUsuario()
      const resultado = await agregarDireccion(cuenta.userId, { street: calle.trim(), city: ciudad.trim() })
      guardarEnSesion(resultado); setCalle(''); setCiudad('')
    }, 'Dirección agregada correctamente.')
  }
  const borrarDireccion = (id: number) => {
    if (!window.confirm('¿Eliminar esta dirección?')) return
    void ejecutar(`direccion-${id}`, async () => {
      const cuenta = await validarUsuario()
      guardarEnSesion(await eliminarDireccion(cuenta.userId, id))
    }, 'Dirección eliminada.')
  }
  const desactivar = () => {
    if (!window.confirm('¿Seguro que deseas desactivar tu cuenta? No podrás iniciar sesión hasta que un administrador la reactive.')) return
    void ejecutar('desactivar', async () => {
      const cuenta = await validarUsuario()
      await desactivarCuenta(cuenta.userId)
      salir(); navigate('/', { replace: true })
    }, 'Cuenta desactivada.')
  }

  if (!usuario) return <section className="hc-profile-panel"><h1>Ajustes de cuenta</h1><p>Para modificar tu información, <Link to="/login?redirect=%2Fajustes" className="underline">inicia sesión</Link>.</p></section>
  return <section className="hc-profile-panel">
    <div className="hc-profile-heading"><div><span className="hc-profile-kicker">PERSONALIZACIÓN</span><h1>Ajustes de cuenta</h1><p>Administra tus datos con las opciones que permite el microservicio de usuarios.</p></div></div>
    {cargando && <p role="status">Cargando ajustes...</p>}
    {error && <div role="alert"><p>{error}</p><button type="button" className="hc-profile-secondary" onClick={refrescar}>Reintentar</button></div>}
    {fallo && <p role="alert" className="hc-profile-error">{fallo}</p>}
    {aviso && <p role="status" className="hc-profile-ok">{aviso}</p>}
    {perfil && <div className="hc-profile-settings">
      <section className="hc-profile-card"><h2><UserRound size={20}/> Datos personales</h2>
        <form onSubmit={guardarPerfil} className="hc-profile-form"><label>Nombre completo<input required minLength={2} maxLength={100} value={nombre} onChange={(e) => setNombre(e.target.value)}/></label><label>Correo electrónico<input required type="email" value={email} onChange={(e) => setEmail(e.target.value)}/></label>
          <label>Número de teléfono<input value={perfil.phone || ''} disabled aria-describedby="hc-phone-note"/></label><p id="hc-phone-note" className="hc-profile-muted">El backend actual permite registrar el teléfono, pero todavía no editarlo.</p>
          <button className="hc-profile-primary" type="submit" disabled={Boolean(procesando)}><Save size={16}/>{procesando === 'perfil' ? 'Guardando...' : 'Guardar cambios'}</button></form></section>
      <section className="hc-profile-card"><h2><MapPin size={20}/> Mis direcciones</h2>
        {perfil.addresses?.length ? <div className="hc-profile-addresses">{perfil.addresses.map((direccion) => <div className="hc-profile-address-row" key={direccion.id}><span>{direccion.street}, {direccion.city}</span><button type="button" className="hc-profile-danger-link" onClick={() => borrarDireccion(direccion.id)} disabled={Boolean(procesando)} aria-label={`Eliminar dirección ${direccion.street}`}><Trash2 size={16}/> Eliminar</button></div>)}</div> : <p>No tienes direcciones registradas.</p>}
        <h3>Agregar nueva dirección</h3><form onSubmit={guardarDireccion} className="hc-profile-form"><label>Calle y número<input required value={calle} onChange={(e) => setCalle(e.target.value)}/></label><label>Ciudad o comuna<input required value={ciudad} onChange={(e) => setCiudad(e.target.value)}/></label><button type="submit" className="hc-profile-primary" disabled={Boolean(procesando)}>{procesando === 'direccion' ? 'Guardando...' : 'Agregar dirección'}</button></form>
        <p className="hc-profile-muted">Para cambiar una dirección existente, elimínala y agrega la nueva. El backend no ofrece edición directa de direcciones.</p></section>
      <section className="hc-profile-card"><h2><KeyRound size={20}/> Cambiar contraseña</h2><form onSubmit={guardarContrasena} className="hc-profile-form"><label>Contraseña actual<input type="password" autoComplete="current-password" required value={actual} onChange={(e) => setActual(e.target.value)}/></label><label>Nueva contraseña<input type="password" autoComplete="new-password" required minLength={8} value={nueva} onChange={(e) => setNueva(e.target.value)}/></label><button type="submit" className="hc-profile-primary" disabled={Boolean(procesando)}>{procesando === 'contrasena' ? 'Guardando...' : 'Cambiar contraseña'}</button></form></section>
      <section className="hc-profile-card hc-profile-danger-zone"><h2><UserX size={20}/> Desactivar cuenta</h2><p>Tu cuenta quedará inactiva y se cerrará tu sesión. Esta acción no elimina tus pedidos.</p><button type="button" className="hc-profile-danger" disabled={Boolean(procesando)} onClick={desactivar}>Desactivar mi cuenta</button></section>
    </div>}
  </section>
}
