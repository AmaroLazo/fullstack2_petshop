document.addEventListener("DOMContentLoaded", function () {

    const sesionActiva = localStorage.getItem("sesionActiva");
    const nombreUsuario = localStorage.getItem("nombreUsuario");

    const botonUsuario = document.getElementById("botonUsuario");
    const textoUsuario = document.getElementById("textoUsuario");
    const menuUsuario = document.getElementById("menuUsuario");


    // ==========================================
    // USUARIO CON SESIÓN INICIADA
    // ==========================================

    if (sesionActiva === "true" && nombreUsuario) {

        textoUsuario.textContent = "Hola, " + nombreUsuario;

        // El botón funciona como dropdown
        botonUsuario.setAttribute("data-bs-toggle", "dropdown");

        // Mostrar menú
        menuUsuario.style.display = "";


    } else {

        // ==========================================
        // USUARIO SIN SESIÓN
        // ==========================================

        textoUsuario.textContent = "Iniciar Sesión";

        // Quitamos el dropdown
        botonUsuario.removeAttribute("data-bs-toggle");

        // Ocultamos el menú
        menuUsuario.style.display = "none";


        // Al hacer clic → login
        botonUsuario.addEventListener("click", function () {

            window.location.href = "login.html";

        });

    }

});


// ==========================================
// CERRAR SESIÓN
// ==========================================

function cerrarSesion() {

    localStorage.removeItem("sesionActiva");
    localStorage.removeItem("rol");
    localStorage.removeItem("nombreUsuario");

    // Redirigir al inicio
    window.location.href = "index.html";
}   