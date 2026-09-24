/* =========================================================
   MI PERFIL - muestra los datos guardados de la cuenta activa
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const nombreUsuario = localStorage.getItem('nombreUsuario');
    const rol = localStorage.getItem('rol');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

    // El correo solo lo tenemos para cuentas registradas por el propio usuario
    const correo = (usuario && usuario.nombre === nombreUsuario) ? usuario.correo : null;

    document.getElementById('perfilDatos').innerHTML = `
        <ul class="detalle-lista">
            <li><span>Nombre</span><strong>${nombreUsuario || '—'}</strong></li>
            <li><span>Correo</span><strong>${correo || 'No disponible'}</strong></li>
            <li><span>Tipo de cuenta</span><strong>${rol === 'administrador' ? 'Administrador' : 'Cliente'}</strong></li>
        </ul>`;
});
