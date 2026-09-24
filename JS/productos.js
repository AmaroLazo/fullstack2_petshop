/* =========================================================
   BASE DE PRODUCTOS - Huellitas Club
   ---------------------------------------------------------
   ========================================================= */

const PRODUCTOS = [

    /* ---------- Perros y gatos ---------- */
    { id: 1,  nombre: "Alimento para perros",  precio: 12990, animal: ["perros"],           categoria: "alimentos",  imagen: "img/prueba1.png",
      descripcion: "Alimento nutritivo para perros adultos, con proteínas de calidad, vitaminas y minerales para mantener su energía y un pelaje brillante." },
    { id: 2,  nombre: "Alimento para gatos",   precio: 10990, animal: ["gatos"],            categoria: "alimentos",  imagen: "img/prueba1.png",
      descripcion: "Alimento completo y equilibrado para gatos, ayuda a cuidar su salud digestiva y a mantener un peso saludable." },
    { id: 3,  nombre: "Juguete para perros",   precio: 7990,  animal: ["perros"],           categoria: "juguetes",   imagen: "img/prueba1.png",
      descripcion: "Juguete resistente para entretener a tu mascota, ideal para morder, jugar y liberar energía." },
    { id: 4,  nombre: "Juguete para gatos",    precio: 5990,  animal: ["gatos"],            categoria: "juguetes",   imagen: "img/prueba1.png",
      descripcion: "Juguete interactivo que estimula el instinto cazador de tu gato y lo mantiene activo y entretenido." },
    { id: 5,  nombre: "Collar para perro",     precio: 6990,  animal: ["perros"],           categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Collar cómodo y ajustable, fabricado con materiales resistentes para el uso diario." },
    { id: 6,  nombre: "Correa para perro",     precio: 8990,  animal: ["perros"],           categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Correa resistente y con buen agarre, pensada para paseos seguros y cómodos." },
    { id: 7,  nombre: "Cama para mascotas",    precio: 19990, animal: ["perros", "gatos"],  categoria: "camas",      imagen: "img/prueba1.png",
      descripcion: "Cama suave y cómoda para el descanso de tu mascota, con relleno mullido y fácil de limpiar." },
    { id: 8,  nombre: "Plato para mascotas",   precio: 4990,  animal: ["perros", "gatos"],  categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Plato práctico y estable para comida o agua, fácil de lavar y de larga duración." },
    { id: 9,  nombre: "Snack para perros",     precio: 3990,  animal: ["perros"],           categoria: "snacks",     imagen: "img/prueba1.png",
      descripcion: "Premios deliciosos para consentir y recompensar a tu perro durante el entrenamiento." },
    { id: 10, nombre: "Snack para gatos",      precio: 3490,  animal: ["gatos"],            categoria: "snacks",     imagen: "img/prueba1.png",
      descripcion: "Deliciosos premios para gatos, perfectos para momentos de cariño y juego." },
    { id: 11, nombre: "Shampoo para mascotas", precio: 7490,  animal: ["perros", "gatos"],  categoria: "higiene",    imagen: "img/prueba1.png",
      descripcion: "Shampoo suave para el cuidado del pelaje, deja a tu mascota limpia, perfumada y con un pelo suave." },
    { id: 12, nombre: "Cepillo para mascotas", precio: 5490,  animal: ["perros", "gatos"],  categoria: "higiene",    imagen: "img/prueba1.png",
      descripcion: "Cepillo que ayuda a eliminar el pelo suelto y a mantener el pelaje limpio y saludable." },
    { id: 13, nombre: "Casa para gatos",       precio: 24990, animal: ["gatos"],            categoria: "camas",      imagen: "img/prueba1.png",
      descripcion: "Espacio cómodo y acogedor para que tu gato descanse, juegue y se sienta seguro." },
    { id: 14, nombre: "Pelota para perros",    precio: 4990,  animal: ["perros"],           categoria: "juguetes",   imagen: "img/prueba1.png",
      descripcion: "Pelota resistente y rebotadora, perfecta para juegos de lanzar y buscar." },
    { id: 15, nombre: "Arena para gatos",      precio: 9990,  animal: ["gatos"],            categoria: "higiene",    imagen: "img/prueba1.png",
      descripcion: "Arena absorbente que controla los olores y mantiene limpio el espacio de tu gato." },
    { id: 16, nombre: "Transportadora",        precio: 29990, animal: ["perros", "gatos"],  categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Transportadora segura y ventilada, ideal para viajes y visitas al veterinario." },

    /* ---------- Aves ---------- */
    { id: 17, nombre: "Alimento para aves",        precio: 6990,  animal: ["aves"], categoria: "alimentos",  imagen: "img/prueba1.png",
      descripcion: "Mezcla de semillas seleccionadas para canarios, periquitos y otras aves pequeñas." },
    { id: 18, nombre: "Barra de semillas",         precio: 2990,  animal: ["aves"], categoria: "snacks",     imagen: "img/prueba1.png",
      descripcion: "Barra de semillas y miel que sirve de premio y entretiene a tu ave mientras la picotea." },
    { id: 19, nombre: "Jaula para aves",           precio: 34990, animal: ["aves"], categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Jaula amplia con perchas, comedero y bebedero, fácil de armar y de limpiar." },
    { id: 20, nombre: "Columpio para aves",        precio: 3990,  animal: ["aves"], categoria: "juguetes",   imagen: "img/prueba1.png",
      descripcion: "Columpio de madera natural que ayuda a que tu ave se ejercite y se divierta." },

    /* ---------- Roedores ---------- */
    { id: 21, nombre: "Alimento para conejos",     precio: 8990,  animal: ["roedores"], categoria: "alimentos",  imagen: "img/prueba1.png",
      descripcion: "Alimento en pellets con fibra para conejos, favorece una buena digestión y dientes sanos." },
    { id: 22, nombre: "Rueda para hámster",        precio: 6490,  animal: ["roedores"], categoria: "juguetes",   imagen: "img/prueba1.png",
      descripcion: "Rueda silenciosa y segura para que tu hámster corra y gaste energía todos los días." },
    { id: 23, nombre: "Heno para roedores",        precio: 5490,  animal: ["roedores"], categoria: "alimentos",  imagen: "img/prueba1.png",
      descripcion: "Heno natural y fresco, base de la dieta de conejos, cuyes y chinchillas." },
    { id: 24, nombre: "Casa para roedores",        precio: 7990,  animal: ["roedores"], categoria: "camas",      imagen: "img/prueba1.png",
      descripcion: "Refugio de madera donde tu mascota puede descansar y esconderse tranquila." },

    /* ---------- Peces ---------- */
    { id: 25, nombre: "Alimento para peces",       precio: 3490,  animal: ["peces"], categoria: "alimentos",  imagen: "img/prueba1.png",
      descripcion: "Hojuelas nutritivas para peces de agua dulce, con vitaminas para realzar sus colores." },
    { id: 26, nombre: "Pecera 20 litros",          precio: 39990, animal: ["peces"], categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Pecera de vidrio de 20 litros, ideal para comenzar tu propio acuario en casa." },
    { id: 27, nombre: "Filtro para pecera",        precio: 14990, animal: ["peces"], categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Filtro silencioso que mantiene el agua limpia y oxigenada para tus peces." },
    { id: 28, nombre: "Acondicionador de agua",    precio: 4990,  animal: ["peces"], categoria: "higiene",    imagen: "img/prueba1.png",
      descripcion: "Elimina el cloro del agua de la llave y la deja segura para tus peces." },

    /* ---------- Reptiles ---------- */
    { id: 29, nombre: "Alimento para reptiles",    precio: 5990,  animal: ["reptiles"], categoria: "alimentos",  imagen: "img/prueba1.png",
      descripcion: "Alimento balanceado para tortugas y otros reptiles, con calcio y vitaminas esenciales." },
    { id: 30, nombre: "Lámpara UVB",               precio: 19990, animal: ["reptiles"], categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Lámpara que entrega luz UVB y calor, necesaria para la salud de tu reptil." },
    { id: 31, nombre: "Terrario pequeño",          precio: 44990, animal: ["reptiles"], categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Terrario con buena ventilación y tapa de seguridad, ideal para reptiles pequeños." },
    { id: 32, nombre: "Escondite para reptiles",   precio: 8490,  animal: ["reptiles"], categoria: "camas",      imagen: "img/prueba1.png",
      descripcion: "Refugio que le da privacidad y tranquilidad a tu reptil dentro del terrario." },

    /* ---------- Más para perros y gatos ---------- */
    { id: 33, nombre: "Cama ortopédica para perros", precio: 32990, animal: ["perros"], categoria: "camas",    imagen: "img/prueba1.png",
      descripcion: "Cama con espuma ortopédica que da soporte a las articulaciones de perros grandes o mayores." },
    { id: 34, nombre: "Chaleco reflectante para perros", precio: 9990, animal: ["perros"], categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Chaleco con bandas reflectantes para paseos seguros de noche o con poca luz." },
    { id: 35, nombre: "Hueso masticable",          precio: 2990,  animal: ["perros"], categoria: "snacks",   imagen: "img/prueba1.png",
      descripcion: "Hueso masticable de larga duración que ayuda a mantener los dientes limpios." },
    { id: 36, nombre: "Cortauñas para mascotas",   precio: 4490,  animal: ["perros", "gatos"], categoria: "higiene", imagen: "img/prueba1.png",
      descripcion: "Cortauñas con hoja de acero y mango antideslizante para un corte fácil y seguro." },
    { id: 37, nombre: "Rascador para gatos",       precio: 27990, animal: ["gatos"],  categoria: "juguetes", imagen: "img/prueba1.png",
      descripcion: "Torre rascadora con varios niveles, ideal para que tu gato juegue, trepe y se afile las uñas." },
    { id: 38, nombre: "Fuente de agua para gatos", precio: 21990, animal: ["gatos"],  categoria: "accesorios", imagen: "img/prueba1.png",
      descripcion: "Fuente con agua en movimiento que invita a tu gato a hidratarse más durante el día." },
    { id: 39, nombre: "Snack dental para gatos",   precio: 4290,  animal: ["gatos"],  categoria: "snacks",   imagen: "img/prueba1.png",
      descripcion: "Premios crujientes que ayudan a reducir el sarro y cuidan la salud dental." },
    { id: 40, nombre: "Peine antipulgas",          precio: 3990,  animal: ["perros", "gatos"], categoria: "higiene", imagen: "img/prueba1.png",
      descripcion: "Peine de dientes finos que ayuda a detectar y retirar pulgas del pelaje." }
];

const NOMBRE_ANIMAL = {
    perros: "Perros", gatos: "Gatos", aves: "Aves",
    roedores: "Roedores", peces: "Peces", reptiles: "Reptiles"
};

const NOMBRE_CATEGORIA = {
    alimentos: "Alimentos", snacks: "Snacks y premios", juguetes: "Juguetes",
    accesorios: "Accesorios", higiene: "Higiene y cuidado", camas: "Camas y descanso"
};
