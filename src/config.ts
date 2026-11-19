// Configuración de Labind. Todo lo que cambia sin tocar el diseño vive acá.
// Los campos vacíos ('') apagan la función correspondiente: el sitio no
// muestra nada que todavía no funcione.

export const SITIO = {
  nombre: 'Labind',
  url: 'https://labind.pages.dev',
  lema: 'Seguí juegos indie desde el anuncio hasta el lanzamiento.',
  descripcion:
    'Labind es el lugar para seguir juegos indie y a sus desarrolladores, en español: novedades, demos, ofertas y entrevistas, con foco en Latinoamérica.',
  autor: 'Lau',
  idioma: 'es-AR',
};

export const SECCIONES = [
  {
    id: 'novedades',
    titulo: 'Novedades',
    descripcion: 'Avances de los juegos que seguimos: trailers, demos, parches y fechas.',
  },
  {
    id: 'radar',
    titulo: 'Radar',
    descripcion: 'Juegos recién anunciados que vale la pena empezar a seguir.',
  },
  {
    id: 'guias',
    titulo: 'Guías',
    descripcion: 'Trucos, logros, cómo pasar esa parte y recomendaciones por tema.',
  },
  {
    id: 'ofertas',
    titulo: 'Ofertas',
    descripcion: 'Indies en descuento y mínimos históricos.',
  },
  {
    id: 'entrevistas',
    titulo: 'Entrevistas',
    descripcion: 'Charlas cortas con quienes hacen los juegos, sobre todo devs latinos.',
  },
  {
    id: 'rumores',
    titulo: 'Rumores',
    descripcion: 'Filtraciones y pistas sobre los juegos que seguimos. Siempre con la fuente.',
  },
] as const;

export type SeccionId = (typeof SECCIONES)[number]['id'];

export const ESTADOS = ['Anunciado', 'Con demo', 'Acceso anticipado', 'Lanzado'] as const;

// "Seguir" por email, etapa 1: un servicio de newsletter con etiquetas.
// `accion` es la URL a la que el formulario hace POST (la da el servicio).
// Cada ficha manda su etiqueta: "juego-<slug>" o "dev-<slug>".
// Mientras `accion` esté vacío, el botón Seguir ofrece solo el RSS de la ficha.
export const NEWSLETTER = {
  // Nombre del servicio (se muestra en la política de privacidad).
  servicio: '',
  accion: '',
  campoEmail: 'email',
  campoEtiqueta: 'tag',
  etiquetaSemanal: 'semanal',
};

// Página "Mandá tu juego": URL de un formulario externo (Tally, Google Forms…)
// o, si no hay formulario, un email público de contacto.
export const CONTACTO = {
  formularioJuego: '',
  email: '',
};

export const REDES = {
  x: '',
  bluesky: '',
  instagram: '',
  tiktok: '',
  youtube: '',
  discord: '',
};

export const APORTES = {
  cafecito: '',
  kofi: '',
};

// Medición. Umami: pegá la URL del script y el id del sitio.
// Search Console: pegá el contenido de la meta "google-site-verification".
export const MEDICION = {
  umamiScript: '',
  umamiSitio: '',
  searchConsole: '',
};
