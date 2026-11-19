// RSS de una ficha: la forma de "seguir" un juego sin dar el email.
import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITIO } from '../../../config';
import { getJuegos, getNotas, notasDeJuego, urlJuego, urlNota, type Juego } from '../../../lib/contenido';

export async function getStaticPaths() {
  const juegos = await getJuegos();
  return juegos.map((juego) => ({ params: { id: juego.id }, props: { juego } }));
}

export async function GET(context: APIContext) {
  const juego = context.props.juego as Juego;
  const notas = notasDeJuego(await getNotas(), juego);
  return rss({
    title: `${SITIO.nombre}: novedades de ${juego.data.nombre}`,
    description: juego.data.resumen,
    site: new URL(urlJuego(juego), context.site).href,
    items: notas.map((nota) => ({
      title: nota.data.titulo,
      description: nota.data.descripcion,
      pubDate: nota.data.fecha,
      link: urlNota(nota),
    })),
    customData: `<language>${SITIO.idioma}</language>`,
  });
}
