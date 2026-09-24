/* =========================================================
   MI PERFIL - muestra los datos guardados de la cuenta activa
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const nombreUsuario = localStorage.getItem('nombreUsuario');
    const rol = localStorage.getItem('rol');
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');

    // Estos datos solo los tenemos para cuentas registradas por el propio usuario
    const esCuentaRegistrada = usuario && usuario.nombre === nombreUsuario;
    const correo = esCuentaRegistrada ? usuario.correo : null;
    const telefono = esCuentaRegistrada ? usuario.telefono : null;
    const direccion = esCuentaRegistrada ? usuario.direccion : null;

    let direccionTexto = 'No disponible';
    if (direccion && direccion.calle) {
        direccionTexto = direccion.calle;
        if (direccion.referencia) {
            direccionTexto += ', ' + direccion.referencia;
        }
    }

    document.getElementById('perfilDatos').innerHTML = `
        <ul class="detalle-lista">
            <li><span>Nombre</span><strong>${nombreUsuario || '—'}</strong></li>
            <li><span>Correo</span><strong>${correo || 'No disponible'}</strong></li>
            <li><span>Teléfono</span><strong>${telefono || 'No disponible'}</strong></li>
            <li><span>Dirección</span><strong>${direccionTexto}</strong></li>
            <li><span>Tipo de cuenta</span><strong>${rol === 'administrador' ? 'Administrador' : 'Cliente'}</strong></li>
        </ul>`;
});
