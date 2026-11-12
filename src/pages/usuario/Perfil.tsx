import { Link } from 'react-router'
import { Mail, MapPin, Phone, UserRound, Pencil, CalendarDays } from 'lucide-react'
import { useCuenta } from '../../hooks/useCuenta'

export const Perfil = () => {
  const { usuario, perfil, cargando, error, refrescar } = useCuenta()
  if (!usuario) return <section className="hc-profile-panel"><h1>Mi cuenta</h1><p>Para ver tu información, <Link className="underline" to="/login?redirect=%2Fperfil">inicia sesión</Link>.</p></section>
  return <section className="hc-profile-panel">
    <div className="hc-profile-heading"><div><span className="hc-profile-kicker">TU PERFIL</span><h1>Mi cuenta</h1><p>Información que tienes registrada en Huellitas Club.</p></div><Link className="hc-profile-primary" to="/ajustes"><Pencil size={17}/> Editar mis datos</Link></div>
    {cargando && <p role="status">Cargando información...</p>}
    {error && <div role="alert"><p>{error}</p><button className="hc-profile-secondary" onClick={refrescar}>Reintentar</button></div>}
    {perfil && <div className="hc-profile-card"><div className="hc-profile-avatar"><UserRound size={28}/></div>
      <div className="hc-profile-info-grid">
        <div><span><UserRound size={15}/> Nombre completo</span><strong>{perfil.name}</strong></div>
        <div><span><Mail size={15}/> Correo electrónico</span><strong>{perfil.email}</strong></div>
        <div><span><Phone size={15}/> Número de teléfono</span><strong>{perfil.phone || 'No registrado'}</strong></div>
        <div><span><CalendarDays size={15}/> Fecha de registro</span><strong>{perfil.createdAt ? new Date(perfil.createdAt).toLocaleDateString('es-CL') : 'No disponible'}</strong></div>
        <div><span>Estado de la cuenta</span><strong>{perfil.active ? 'Activa' : 'Inactiva'}</strong></div>
      </div>
      <h2><MapPin size={18}/> Mis direcciones</h2>
      {perfil.addresses?.length ? <div className="hc-profile-addresses">{perfil.addresses.map((direccion) => <div key={direccion.id}>{direccion.street}, {direccion.city}</div>)}</div> : <p>No tienes direcciones registradas.</p>}
    </div>}
  </section>
}
