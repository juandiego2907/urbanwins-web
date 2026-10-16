/* Urban Wings · datos editables del negocio y la carta.
   - Precios en dólares (REF). `price: null` muestra "Consultar" y llega a WhatsApp como "precio por confirmar".
   - Los precios con número salen de la carta oficial (assets/img/carta.jpg). */
window.UW_CONFIG = {
  nombre: "Urban Wings",
  slogan: "Sabor al Vuelo",
  whatsapp: "584247646499", // formato internacional sin "+" ni espacios
  instagram: "urbanwings.mrd",
  ciudad: "Mérida, Venezuela",
  direccion: "", // TODO: dirección del local
  // Lo que se busca en Google Maps para el mapa y el botón "Cómo llegar".
  // Lo más preciso: coordenadas "8.5897,-71.1561" o el nombre exacto del local en Maps.
  mapa: "Mérida, Venezuela",
  horarios: [ // TODO: confirmar horarios reales
    { dias: "Martes a Jueves", horas: "5:00 pm – 11:00 pm" },
    { dias: "Viernes y Sábado", horas: "5:00 pm – 12:00 am" },
    { dias: "Domingo", horas: "5:00 pm – 10:00 pm" },
    { dias: "Lunes", horas: "Cerrado" }
  ],
  // Tasa de respaldo si la API del BCV no responde y no hay una guardada
  tasaRespaldo: 880.12,
  // Datos para pagar. Si un campo queda vacío, la web dice que se envían por WhatsApp.
  pagos: {
    pagoMovil: { banco: "", telefono: "", cedula: "" },
    transferencia: { banco: "", cuenta: "", titular: "", cedula: "" },
    zelle: { correo: "", titular: "" }
  }
};

// Sectores de delivery en Mérida con su costo en dólares (TODO: poner los precios reales)
window.UW_SECTORES = [
  { nombre: "Alto Chama", precio: 0 },
  { nombre: "Av. Las Américas", precio: 0 },
  { nombre: "Av. Los Próceres", precio: 0 },
  { nombre: "Barrio Pueblo Nuevo", precio: 0 },
  { nombre: "Belén", precio: 0 },
  { nombre: "Belensate", precio: 0 },
  { nombre: "Campo de Oro", precio: 0 },
  { nombre: "Centro", precio: 0 },
  { nombre: "Chamita", precio: 0 },
  { nombre: "Ejido", precio: 0 },
  { nombre: "El Arenal", precio: 0 },
  { nombre: "El Carrizal", precio: 0 },
  { nombre: "El Encanto", precio: 0 },
  { nombre: "El Llano", precio: 0 },
  { nombre: "El Rosario", precio: 0 },
  { nombre: "El Valle", precio: 0 },
  { nombre: "Glorias Patrias", precio: 0 },
  { nombre: "Humboldt", precio: 0 },
  { nombre: "La Floresta", precio: 0 },
  { nombre: "La Hechicera", precio: 0 },
  { nombre: "La Hoyada de Milla", precio: 0 },
  { nombre: "La Mara", precio: 0 },
  { nombre: "La Parroquia", precio: 0 },
  { nombre: "La Pedregosa", precio: 0 },
  { nombre: "La Pedregosa Alta", precio: 0 },
  { nombre: "Las Tapias", precio: 0 },
  { nombre: "Los Curos", precio: 0 },
  { nombre: "Los Sauzales", precio: 0 },
  { nombre: "Milla", precio: 0 },
  { nombre: "Pie del Llano", precio: 0 },
  { nombre: "San Jacinto", precio: 0 },
  { nombre: "San José de las Flores", precio: 0 },
  { nombre: "Santa Bárbara", precio: 0 },
  { nombre: "Santa Elena", precio: 0 },
  { nombre: "Santa Juana", precio: 0 },
  { nombre: "Santa María Norte", precio: 0 },
  { nombre: "Santa María Sur", precio: 0 },
  { nombre: "Santa Mónica", precio: 0 },
  { nombre: "Tabay", precio: 0 },
  { nombre: "Zumba", precio: 0 }
];

window.UW_SALSAS = [
  { id: "bbq", nombre: "BBQ", tipo: "Clásica", picante: 0, desc: "El clásico ahumado que nunca falla. Dulce, espesa y perfecta.", color: "#3a1d17" },
  { id: "bbq-picante", nombre: "BBQ Picante", tipo: "Clásica", picante: 2, desc: "La favorita de siempre con un toque rebelde que te hará pedir otra ronda.", color: "#D32F2F" },
  { id: "mostaza-dulce", nombre: "Mostaza Dulce", tipo: "Clásica", picante: 0, desc: "El equilibrio perfecto. Suave, cremosa y con el punto exacto de miel.", color: "#F5B02E" },
  { id: "mango-habanero", nombre: "Mango Habanero", tipo: "Especial", picante: 3, desc: "Un viaje tropical con final explosivo. Dulce al principio, fuego al final.", color: "#3a1d17" },
  { id: "garlic-parmesan", nombre: "Garlic Parmesan", tipo: "Especial", picante: 0, desc: "Elegancia en cada bocado. Queso real y el toque justo de ajo mantequilloso.", color: "#D32F2F" },
  { id: "lemon-pepper", nombre: "Lemon Pepper", tipo: "Especial", picante: 0, desc: "Frescura pura. El toque cítrico que resalta el sabor crujiente de tu alita.", color: "#F5B02E" }
];

(function () {
  var salsas = window.UW_SALSAS.map(function (s) { return s.nombre; }).concat(["Búfalo", "Ranch"]);
  var sazon = ["Lemon pepper", "Cajún", "Sal"];

  window.UW_MENU = [
    {
      id: "entradas", nombre: "Entradas", kicker: "Para picar mientras llega lo bueno",
      items: [
        { id: "papas-cargadas", nombre: "Papas Cargadas", desc: "Bañadas en queso cheddar con tocino crujiente, ranch y salsa buffalo.", price: null, tag: "Top" },
        { id: "papas-bacon", nombre: "Papas Bacon Cheddar", desc: "650 g de papas fritas con tocineta y salsa de queso cheddar.", price: 7.99 },
        { id: "papas-crispy", nombre: "Papas Crispy Chicken", desc: "500 g de papas fritas con pollo crispy, salsa de queso cheddar y salsa de la casa.", price: 7.50 },
        { id: "papas-salchicha", nombre: "Papas Urban", desc: "650 g de papas fritas con salchichas, queso cheddar, salsa de la casa y maíz.", price: 6.50 },
        { id: "papas-francesa", nombre: "Papas a la Francesa", desc: "Doradas y crujientes, con salsa de la casa. Sazónalas a tu gusto.", sizes: [{ label: "250 g", price: 2.50 }, { label: "500 g", price: 3.50 }], choices: { label: "Sazona tus papas", options: sazon, max: 1 } },
        { id: "papas-curly", nombre: "Papas Curly", desc: "Papas en espiral, sazonadas y crocantes por fuera.", price: null, choices: { label: "Sazona tus papas", options: sazon, max: 1 } },
        { id: "corn-ribs", nombre: "Corn Ribs", desc: "Costillas de elote fritas con queso molido, mayonesa y salsa a elegir.", price: null, tag: "Nuevo", choices: { label: "Tu salsa", options: salsas, max: 1 } },
        { id: "tequenos", nombre: "Tequeños", desc: "Servicio de tequeños con salsa de la casa.", price: 4.99 },
        { id: "dedos-queso", nombre: "Dedos de Queso", desc: "Artesanales, con aderezo ranch.", price: null }
      ]
    },
    {
      id: "burgers", nombre: "Burgers", kicker: "Pan de papa, carne del día y cero miedo",
      items: [
        { id: "doble-u", nombre: "Doble U", desc: "2 carnes de res del día, queso amarillo, gouda, 2 dedos de queso, tocino, pan de papa y papas.", price: null, tag: "La de la casa" },
        { id: "alito-burger", nombre: "Alito Burger", desc: "Pechuga fileteada empanizada, bañada en salsa dulce o búfalo, sobre base de chipotle.", price: null, choices: { label: "Bañada en", options: ["Salsa dulce", "Búfalo"], max: 1 } },
        { id: "cheesy", nombre: "Cheesy", desc: "Carne de res del día, queso amarillo, gouda, tocino y pan de papa.", price: null }
      ]
    },
    {
      id: "hotdogs", nombre: "Hot-Dogs", kicker: "22 cm de puro antojo",
      items: [
        { id: "polaco", nombre: "El Polaco", desc: "Salchicha polaca natural de 22 cm, quesos fundidos y tocino en pan suave.", price: null },
        { id: "ranchero", nombre: "El Ranchero", desc: "Salchicha de jalapeño de 22 cm, mezcla ranchera, cátsup y mayonesa.", price: null, picante: 1 },
        { id: "texano", nombre: "El Texano", desc: "Salchicha chipotle de 22 cm, aros de cebolla crujientes, quesos fundidos y salsa BBQ.", price: null },
        { id: "sultan", nombre: "El Sultán", desc: "Salchicha de 25 cm, quesos fundidos, tocino y papas doradas.", price: null, tag: "XL" }
      ]
    },
    {
      id: "alitas", nombre: "Alitas y Boneless", kicker: "Lo nuestro. Con tu aderezo favorito",
      items: [
        { id: "alitas", nombre: "Alitas", desc: "Frescas, con nuestra mezcla secreta. Incluyen papas y aderezos.", tag: "Estrella",
          sizes: [
            { label: "8 alitas + 250 g papas", price: 6.99 },
            { label: "16 alitas + 250 g papas", price: 9.50 },
            { label: "24 alitas + 500 g papas", price: 13.99 },
            { label: "32 alitas + 650 g papas", price: 18.99 },
            { label: "48 alitas + 750 g papas", price: 27.99 }
          ],
          choices: { label: "Elige hasta 2 salsas", options: salsas, max: 2 } },
        { id: "boneless", nombre: "Boneless", desc: "Pechuga sin hueso, crujiente, con papas y aderezo ranch. Elige 1 o 2 salsas.",
          sizes: [
            { label: "120 g + 250 g papas", price: 4.50 },
            { label: "150 g + 250 g papas", price: 4.99 },
            { label: "300 g + 500 g papas", price: 8.99 }
          ],
          choices: { label: "Elige hasta 2 salsas", options: salsas, max: 2 } },
        { id: "combo-4u", nombre: "Combos 4U", desc: "Pa' probar de TODO: incluyen papas, dedos de queso y aros de cebolla.", tag: "Para compartir",
          sizes: [{ label: "4U Boneless", price: null }, { label: "4U Alitas", price: null }, { label: "4U Mixto", price: null }],
          choices: { label: "Elige hasta 2 salsas", options: salsas, max: 2 } }
      ]
    },
    {
      id: "bebidas", nombre: "Bebidas y Coctelería", kicker: "Las Consentidas y Algo Bien",
      items: [
        { group: "Las Consentidas · Coctelería de la casa", id: "baby-mango", nombre: "Baby Mango", desc: "Mango, frescura y el toque secreto de la casa.", price: null, adult: true },
        { group: "Las Consentidas · Coctelería de la casa", id: "purple-rain", nombre: "Purple Rain", desc: "Color intenso, sabor afrutado. Para lucirlo.", price: null, adult: true },
        { group: "Las Consentidas · Coctelería de la casa", id: "bubulubu", nombre: "Bubulubú", desc: "Dulce, cremoso y travieso. El postre que se toma.", price: null, adult: true },
        { group: "Las Consentidas · Coctelería de la casa", id: "pistas-blue", nombre: "Pistas de Blue", desc: "Azul eléctrico, cítrico y bien frío.", price: null, adult: true },
        { group: "Las Consentidas · Coctelería de la casa", id: "pica-fresa", nombre: "Pica Fresa", desc: "Fresa con un toque enchilado que despierta.", price: null, adult: true, picante: 1 },
        { group: "Las Consentidas · Coctelería de la casa", id: "pina-colada", nombre: "Piña Colada", desc: "Piña, coco y ron. Un clásico tropical.", price: null, adult: true },
        { group: "Algo Bien · Clásicos y cervezas", id: "mojito", nombre: "Mojito", desc: "Hierbabuena, limón y ron.", price: null, adult: true },
        { group: "Algo Bien · Clásicos y cervezas", id: "margarita", nombre: "Margarita", desc: "Tequila, limón y borde escarchado.", price: null, adult: true },
        { group: "Algo Bien · Clásicos y cervezas", id: "vampiro", nombre: "Vampiro", desc: "Tequila con sangrita y cítricos.", price: null, adult: true },
        { group: "Algo Bien · Clásicos y cervezas", id: "long-island", nombre: "Long Island", desc: "El fuerte de la barra.", price: null, adult: true },
        { group: "Algo Bien · Clásicos y cervezas", id: "chelas", nombre: "Caguamas / Chelas", desc: "Cerveza bien fría, en botella o caguama.", price: null, adult: true },
        { group: "Sin alcohol", id: "frappe", nombre: "Frappé", desc: "Frío y espeso.", price: 2.50, choices: { label: "Sabor", options: ["Fresa", "Parchita", "Mora"], max: 1 } },
        { group: "Sin alcohol", id: "limonada", nombre: "Limonada", desc: "Natural y recién hecha.", sizes: [{ label: "16 oz", price: null }, { label: "32 oz", price: null }] },
        { group: "Sin alcohol", id: "jamaica", nombre: "Jamaica", desc: "Agua de flor de Jamaica, fría.", sizes: [{ label: "16 oz", price: null }, { label: "32 oz", price: null }] },
        { group: "Sin alcohol", id: "refresco", nombre: "Refresco", desc: "Tu refresco favorito.", sizes: [{ label: "Vaso", price: 0.99 }, { label: "1 L", price: 1.99 }, { label: "1,5 L", price: 2.50 }, { label: "2 L", price: 2.99 }] },
        { group: "Sin alcohol", id: "agua", nombre: "Agua", desc: "Mineral, bien fría.", price: null }
      ]
    },
    {
      id: "postres", nombre: "Postres", kicker: "El cierre dulce",
      items: [
        { id: "mookie", nombre: "Mookie Cookie con nieve", desc: "Galleta tibia con helado encima.", price: null, tag: "Favorito" },
        { id: "postre-alito", nombre: "Postre Alito", desc: "El postre de la casa.", price: null },
        { id: "brownie-helado", nombre: "Brownie con helado", desc: "Brownie de chocolate con bola de helado.", price: 4.99 },
        { id: "brownie-relleno", nombre: "Brownie relleno", desc: "Húmedo por dentro, relleno y generoso.", price: 1.99 },
        { id: "cookie-ny", nombre: "Cookie NY", desc: "Galleta estilo New York de 130 g.", price: 2.99 },
        { id: "merengada", nombre: "Merengada + helado", desc: "Batida espesa con helado.", price: 4.80, choices: { label: "Sabor", options: ["Chocolate", "Oreo", "Pirulín"], max: 1 } }
      ]
    }
  ];
})();
