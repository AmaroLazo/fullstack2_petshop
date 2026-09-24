/* =========================================================
   OPCIONES DE CUENTA - cambiar nombre y contraseña
   ---------------------------------------------------------
   El cambio de contraseña solo funciona para cuentas creadas
   por el propio usuario (las guardadas en localStorage bajo
   "usuario"). Las cuentas de prueba (admin y usuario demo) no
   se pueden editar porque no existen como registro real.
   ========================================================= */

const inputNombre = document.getElementById('cuentaNombre');
const formNombre = document.getElementById('formNombre');
const nombreMensaje = document.getElementById('nombreMensaje');

const nombreActual = localStorage.getItem('nombreUsuario') || '';
inputNombre.value = nombreActual;

formNombre.addEventListener('submit', (evento) => {
    evento.preventDefault();

    const nuevoNombre = inputNombre.value.trim();
    if (!nuevoNombre) {
        nombreMensaje.textContent = 'El nombre no puede quedar vacío.';
        return;
    }

    localStorage.setItem('nombreUsuario', nuevoNombre);

    // Si la cuenta es una registrada por el propio usuario, actualizamos también ese registro
    const usuario = JSON.parse(localStorage.getItem('usuario') || 'null');
    if (usuario && usuario.nombre === nombreActual) {
        usuario.nombre = nuevoNombre;
        localStorage.setItem('usuario', JSON.stringify(usuario));
    }

    nombreMensaje.style.color = '#2e7d32';
    nombreMensaje.textContent = 'Nombre actualizado.';
});


/* ---------- Cambiar contraseña ---------- */

const bloqueContrasena = document.getElementById('bloqueContrasena');
const formContrasena = document.getElementById('formContrasena');
const passwordMensaje = document.getElementById('passwordMensaje');

const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || 'null');
const esCuentaRegistrada = usuarioGuardado && usuarioGuardado.nombre === nombreActual;

if (!esCuentaRegistrada) {
    bloqueContrasena.innerHTML = `
        <h2 class="h5 mb-3">Cambiar contraseña</h2>
        <p class="text-muted">Esta es una cuenta de prueba y no se puede editar.</p>`;
} else {
    formContrasena.addEventListener('submit', (evento) => {
        evento.preventDefault();

        const actual = document.getElementById('cuentaPasswordActual').value;
        const nueva = document.getElementById('cuentaPasswordNueva').value;

        if (actual !== usuarioGuardado.password) {
            passwordMensaje.textContent = 'La contraseña actual no es correcta.';
            return;
        }

        usuarioGuardado.password = nueva;
        localStorage.setItem('usuario', JSON.stringify(usuarioGuardado));

        passwordMensaje.style.color = '#2e7d32';
        passwordMensaje.textContent = 'Contraseña actualizada.';
        formContrasena.reset();
    });
}
