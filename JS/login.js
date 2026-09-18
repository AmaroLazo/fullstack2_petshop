function mostrarRegistro() {

    document.getElementById("login-form").style.display = "none";

    document.getElementById("registro-form").style.display = "block";
}


function mostrarLogin() {

    document.getElementById("registro-form").style.display = "none";

    document.getElementById("login-form").style.display = "block";
}


function registrarse(event) {

    event.preventDefault();

    const nombre = document.getElementById("registro-nombre").value;
    const correo = document.getElementById("registro-correo").value;
    const password = document.getElementById("registro-password").value;
    const confirmar = document.getElementById("registro-password-confirmar").value;

    const error = document.getElementById("registro-error");


    if (password !== confirmar) {

        error.textContent = "Las contraseñas no coinciden.";

        return;
    }


    const usuario = {
        nombre: nombre,
        correo: correo,
        password: password
    };


    localStorage.setItem("usuario", JSON.stringify(usuario));

    alert("Cuenta creada correctamente.");

    mostrarLogin();
}


function iniciarSesion(event) {

    event.preventDefault();

    const correo = document.getElementById("login-correo").value;
    const password = document.getElementById("login-password").value;

    const error = document.getElementById("login-error");

    const usuarioGuardado = localStorage.getItem("usuario");


    if (!usuarioGuardado) {

        error.textContent = "No existe una cuenta registrada.";

        return;
    }


    const usuario = JSON.parse(usuarioGuardado);


    if (correo === usuario.correo && password === usuario.password) {

        localStorage.setItem("sesionActiva", "true");

        window.location.href = "index.html";

    } else {

        error.textContent = "Correo o contraseña incorrectos.";
    }
}