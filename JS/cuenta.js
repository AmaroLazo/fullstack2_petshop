/* =========================================================
   OPCIONES DE CUENTA
   - Nombre de usuario: lo puede editar cualquier cuenta.
   - Datos de contacto y contraseña: solo cuentas registradas
     por el propio usuario (las de admin/prueba no tienen
     estos datos guardados, así que se ocultan esos bloques).
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

    const nombreUsuario = localStorage.getItem('nombreUsuario');
    const usuarioGuardado = JSON.parse(localStorage.getItem('usuario') || 'null');
    const esCuentaRegistrada = !!(usuarioGuardado && usuarioGuardado.nombre === nombreUsuario);

    const cuentaNombre = document.getElementById('cuentaNombre');
    const nombreMensaje = document.getElementById('nombreMensaje');

    const bloqueDatos = document.getElementById('bloqueDatos');
    const formDatos = document.getElementById('formDatos');
    const cuentaTelefono = document.getElementById('cuentaTelefono');
    const cuentaDireccionCalle = document.getElementById('cuentaDireccionCalle');
    const cuentaDireccionReferencia = document.getElementById('cuentaDireccionReferencia');
    const datosMensaje = document.getElementById('datosMensaje');

    const bloqueContrasena = document.getElementById('bloqueContrasena');
    const formContrasena = document.getElementById('formContrasena');
    const passwordMensaje = document.getElementById('passwordMensaje');

    // Precargar nombre actual
    cuentaNombre.value = nombreUsuario || '';

    if (esCuentaRegistrada) {
        // Precargar datos de contacto
        cuentaTelefono.value = usuarioGuardado.telefono || '';
        cuentaDireccionCalle.value = (usuarioGuardado.direccion && usuarioGuardado.direccion.calle) || '';
        cuentaDireccionReferencia.value = (usuarioGuardado.direccion && usuarioGuardado.direccion.referencia) || '';
    } else {
        // Cuentas de administrador/prueba: no hay datos de contacto
        // ni contraseña propia guardada para editar.
        if (bloqueDatos) bloqueDatos.style.display = 'none';
        if (bloqueContrasena) bloqueContrasena.style.display = 'none';
    }

    // ==========================================
    // GUARDAR NOMBRE
    // ==========================================
    document.getElementById('formNombre').addEventListener('submit', function (e) {
        e.preventDefault();

        const nuevoNombre = cuentaNombre.value.trim();

        if (!nuevoNombre) {
            nombreMensaje.textContent = 'El nombre no puede estar vacío.';
            return;
        }

        localStorage.setItem('nombreUsuario', nuevoNombre);

        if (esCuentaRegistrada) {
            usuarioGuardado.nombre = nuevoNombre;
            localStorage.setItem('usuario', JSON.stringify(usuarioGuardado));
        }

        nombreMensaje.textContent = 'Nombre actualizado correctamente.';
    });

    // ==========================================
    // GUARDAR DATOS DE CONTACTO
    // ==========================================
    if (formDatos) {
        formDatos.addEventListener('submit', function (e) {
            e.preventDefault();

            usuarioGuardado.telefono = cuentaTelefono.value.trim();
            usuarioGuardado.direccion = {
                calle: cuentaDireccionCalle.value.trim(),
                referencia: cuentaDireccionReferencia.value.trim()
            };

            localStorage.setItem('usuario', JSON.stringify(usuarioGuardado));

            datosMensaje.textContent = 'Datos actualizados correctamente.';
        });
    }

    // ==========================================
    // CAMBIAR CONTRASEÑA
    // ==========================================
    if (formContrasena) {
        formContrasena.addEventListener('submit', function (e) {
            e.preventDefault();

            const actual = document.getElementById('cuentaPasswordActual').value;
            const nueva = document.getElementById('cuentaPasswordNueva').value;

            if (actual !== usuarioGuardado.password) {
                passwordMensaje.textContent = 'La contraseña actual no es correcta.';
                return;
            }

            usuarioGuardado.password = nueva;
            localStorage.setItem('usuario', JSON.stringify(usuarioGuardado));

            passwordMensaje.textContent = 'Contraseña actualizada correctamente.';
            formContrasena.reset();
        });
    }
});
