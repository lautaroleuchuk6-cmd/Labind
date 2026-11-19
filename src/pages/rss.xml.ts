import rss from '@astrojs/rss';
import type { APIContext } from 'astro';
import { SITIO } from '../config';
import { getNotas, seccion, urlNota } from '../lib/contenido';

export async function GET(context: APIContext) {
  const notas = await getNotas();
  return rss({
    title: SITIO.nombre,
    description: SITIO.descripcion,
    site: context.site!,
    items: notas.slice(0, 50).map((nota) => ({
      title: nota.data.titulo,
      description: nota.data.descripcion,
      pubDate: nota.data.fecha,
      link: urlNota(nota),
      categories: [seccion(nota.data.seccion).titulo],
    })),
    customData: `<language>${SITIO.idioma}</language>`,
  });
}
