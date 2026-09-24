/* =========================================================
   NAVBAR - botón de usuario (arriba a la derecha)
   Lo cargan todas las páginas que tengan este menú, con:
       <script src="js/navbar.js"></script>
   ---------------------------------------------------------
   Antes, si no había sesión iniciada, el botón dejaba de ser
   un menú desplegable (se le quitaba el atributo que lo abre)
   y el contenido de "Ver perfil / Historial / Opciones de
   cuenta / Cerrar sesión" quedaba igual en el HTML. Si algo
   fallaba antes de llegar a esa parte, se alcanzaba a ver ese
   menú completo aunque el usuario no tuviera sesión.
   Ahora el contenido del menú (los <li>) se rellena siempre
   desde acá, así que nunca muestra las opciones de una cuenta
   con sesión si no la hay.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {

    const botonUsuario = document.getElementById("botonUsuario");
    const textoUsuario = document.getElementById("textoUsuario");
    const menuUsuario = document.getElementById("menuUsuario");

    // Si esta página no tiene el menú de usuario, no hacemos nada
    if (!botonUsuario || !textoUsuario || !menuUsuario) return;

    const sesionActiva = localStorage.getItem("sesionActiva") === "true";
    const nombreUsuario = localStorage.getItem("nombreUsuario");

    if (sesionActiva && nombreUsuario) {

        // ==========================================
        // USUARIO CON SESIÓN INICIADA
        // ==========================================

        textoUsuario.textContent = "Hola, " + nombreUsuario;

        menuUsuario.innerHTML = `
            <li>
                <a class="dropdown-item" href="perfil.html">
                    <i class="bi bi-person"></i> Ver perfil
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="historial.html">
                    <i class="bi bi-clock-history"></i> Historial de compras
                </a>
            </li>
            <li>
                <a class="dropdown-item" href="cuenta.html">
                    <i class="bi bi-gear"></i> Opciones de cuenta
                </a>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
                <a class="dropdown-item" href="#" onclick="cerrarSesion()">
                    <i class="bi bi-box-arrow-right"></i> Cerrar sesión
                </a>
            </li>`;

    } else {

        // ==========================================
        // USUARIO SIN SESIÓN: solo puede registrarse
        // ==========================================

        textoUsuario.textContent = "Iniciar Sesión";

        menuUsuario.innerHTML = `
            <li>
                <a class="dropdown-item" href="login.html">
                    <i class="bi bi-person-plus"></i> Registrarse
                </a>
            </li>`;
    }
});


// ==========================================
// CERRAR SESIÓN
// ==========================================

function cerrarSesion() {

    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombreUsuario");

    window.location.href = "index.html";
}
