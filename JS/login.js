function mostrarRegistro() {

    document.getElementById("login-form").style.display = "none";

    document.getElementById("registro-form").style.display = "block";
}


function mostrarLogin() {

    document.getElementById("registro-form").style.display = "none";

    document.getElementById("login-form").style.display = "block";
}


/* Lista de usuarios registrados ("usuarios"). Si existe un usuario
   del sistema anterior ("usuario"), se incorpora a la lista. */
function obtenerUsuarios() {

    let lista = [];

    try {
        lista = JSON.parse(localStorage.getItem("usuarios")) || [];
    } catch (e) {
        lista = [];
    }

    try {
        const antiguo = JSON.parse(localStorage.getItem("usuario"));

        if (antiguo && antiguo.correo && !lista.some(u => u.correo === antiguo.correo)) {
            lista.push(antiguo);
        }
    } catch (e) {}

    return lista;
}


function registrarse(event) {

    event.preventDefault();

    const nombre = document.getElementById("registro-nombre").value;
    const correo = document.getElementById("registro-correo").value.trim();
    const telefono = document.getElementById("registro-telefono").value;
    const direccionCalle = document.getElementById("registro-direccion-calle").value;
    const direccionReferencia = document.getElementById("registro-direccion-referencia").value;
    const password = document.getElementById("registro-password").value;
    const confirmar = document.getElementById("registro-password-confirmar").value;

    const error = document.getElementById("registro-error");


    if (password !== confirmar) {

        error.textContent = "Las contraseñas no coinciden.";

        return;
    }


    const usuarios = obtenerUsuarios();

    if (usuarios.some(u => u.correo.toLowerCase() === correo.toLowerCase())
        || correo.toLowerCase() === "admin@huellitas.cl"
        || correo.toLowerCase() === "usuario@gmail.cl") {

        error.textContent = "Ya existe una cuenta con ese correo.";

        return;
    }


    const usuario = {
        nombre: nombre,
        correo: correo,
        password: password,
        telefono: telefono,
        direccion: {
            calle: direccionCalle,
            referencia: direccionReferencia
        },
        fechaRegistro: new Date().toISOString()
    };


    usuarios.push(usuario);

    // El dashboard del administrador lee esta lista
    localStorage.setItem("usuarios", JSON.stringify(usuarios));

    // Se mantiene por compatibilidad con otros archivos que lean "usuario"
    localStorage.setItem("usuario", JSON.stringify(usuario));

    error.textContent = "";

    alert("Cuenta creada correctamente.");

    mostrarLogin();
}


function iniciarSesion(event) {

    event.preventDefault();

    const correo = document.getElementById("login-correo").value.trim();
    const password = document.getElementById("login-password").value;

    const error = document.getElementById("login-error");

    // Credenciales del administrador
    const correoAdmin = "admin@huellitas.cl";
    const passwordAdmin = "admin123";

    const correoprueba = "usuario@gmail.cl";
    const passwordprueba = "user123";

    // Comprobar si es administrador
    if (correo === correoAdmin && password === passwordAdmin) {

        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("rol", "administrador");
        localStorage.setItem("nombreUsuario", "Administrador");
        localStorage.setItem("correoUsuario", correoAdmin);

        window.location.href = "dashboard_admin.html";

        return;
    }

    if (correo === correoprueba && password === passwordprueba) {

        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("rol", "usuario");
        localStorage.setItem("nombreUsuario", "usuario");
        localStorage.setItem("correoUsuario", correoprueba);

        window.location.href = "index.html";

        return;
    }


    // Comprobar usuarios registrados
    const usuarios = obtenerUsuarios();

    if (usuarios.length === 0) {

        error.textContent = "No existe una cuenta registrada.";

        return;
    }


    const usuario = usuarios.find(u => u.correo.toLowerCase() === correo.toLowerCase() && u.password === password);

    if (usuario) {

        localStorage.setItem("sesionActiva", "true");
        localStorage.setItem("rol", "usuario");
        localStorage.setItem("nombreUsuario", usuario.nombre);
        localStorage.setItem("correoUsuario", usuario.correo);

        window.location.href = "index.html";

    } else {

        error.textContent = "Correo o contraseña incorrectos.";

    }
}
