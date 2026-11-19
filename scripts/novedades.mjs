#!/usr/bin/env node
// Junta las novedades de cada ficha para la tarea diaria.
//
// Lee `fuentes` y `links` de src/content/juegos/*.md y consulta:
//   - las noticias de Steam del juego (API pública de noticias por juego)
//   - el RSS de devlogs de itch.io
//   - el canal de YouTube del dev (feed público del canal)
//   - la fecha de salida y si hay demo según Steam, para detectar cambios de estado
//
// Los precios van aparte: `npm run precios` los actualiza solo, por país.
//
// No escribe nada: imprime un informe para que Claude actualice las fichas y
// redacte los borradores. Si una fuente falla, sigue con las demás y lo avisa.
//
// Uso:
//   npm run novedades                      últimas 48 horas, todas las fichas
//   npm run novedades -- --dias 7          última semana
//   npm run novedades -- --juego mi-juego  una sola ficha
//   npm run novedades -- --json            salida en JSON

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { XMLParser } from 'fast-xml-parser';

const RAIZ = fileURLToPath(new URL('../', import.meta.url));
const CARPETA = process.env.LABIND_FICHAS ?? join(RAIZ, 'src/content/juegos');
const args = process.argv.slice(2);
const opcion = (nombre) => {
  const i = args.indexOf(`--${nombre}`);
  return i === -1 ? undefined : args[i + 1];
};
const dias = Number(opcion('dias') ?? 2);
const soloJuego = opcion('juego');
const enJson = args.includes('--json');
const desde = Date.now() - dias * 24 * 60 * 60 * 1000;

const xml = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' });
const lista = (x) => (x === undefined ? [] : Array.isArray(x) ? x : [x]);
const texto = (x) => (typeof x === 'object' && x !== null ? (x['#text'] ?? '') : String(x ?? ''));
const limpiar = (html) =>
  String(html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[\/?[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 400);

async function pedir(url, tipo = 'json') {
  const res = await fetch(url, {
    headers: { 'user-agent': 'novedades-indie/1.0', accept: tipo === 'json' ? 'application/json' : '*/*' },
    signal: AbortSignal.timeout(20_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return tipo === 'json' ? res.json() : res.text();
}

async function leerFichas() {
  const archivos = (await readdir(CARPETA, { recursive: true })).filter(
    (a) => a.endsWith('.md') && !a.split('/').pop().startsWith('_'),
  );
  const fichas = [];
  for (const archivo of archivos) {
    const crudo = await readFile(join(CARPETA, archivo), 'utf8');
    const frente = crudo.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    if (!frente) continue;
    fichas.push({ id: archivo.replace(/\.md$/, ''), archivo: `src/content/juegos/${archivo}`, ...parseYaml(frente[1]) });
  }
  return fichas.filter((f) => !soloJuego || f.id === soloJuego);
}

async function noticiasSteam(appId) {
  const datos = await pedir(
    `https://api.steampowered.com/ISteamNews/GetNewsForApp/v2/?appid=${appId}&count=10&maxlength=600&format=json`,
  );
  return (datos.appnews?.newsitems ?? []).map((n) => ({
    fuente: 'Steam',
    titulo: n.title,
    url: n.url,
    fecha: new Date(n.date * 1000),
    resumen: limpiar(n.contents),
    // Las noticias de prensa externa también salen acá: solo las del dev son fuente oficial.
    oficial: n.feedname === 'steam_community_announcements',
  }));
}

async function devlogsItch(rss) {
  const datos = xml.parse(await pedir(rss, 'texto'));
  return lista(datos.rss?.channel?.item).map((i) => ({
    fuente: 'itch.io',
    titulo: texto(i.title),
    url: texto(i.link),
    fecha: new Date(texto(i.pubDate)),
    resumen: limpiar(texto(i.description)),
    oficial: true,
  }));
}

async function videosYoutube(canalId) {
  const datos = xml.parse(await pedir(`https://www.youtube.com/feeds/videos.xml?channel_id=${canalId}`, 'texto'));
  return lista(datos.feed?.entry).map((e) => ({
    fuente: 'YouTube',
    titulo: texto(e.title),
    url: lista(e.link)[0]?.['@href'] ?? '',
    fecha: new Date(texto(e.published)),
    resumen: limpiar(texto(e['media:group']?.['media:description'])),
    oficial: true,
  }));
}

// Fecha de salida y demo según Steam, para detectar cambios de estado.
async function estadoSteam(appId) {
  const steam = (await pedir(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=spanish&filters=basic,release_date,demos,genres`))[appId];
  if (!steam?.success) return null;
  const d = steam.data;
  return {
    proximamente: d.release_date?.coming_soon ?? null,
    fecha: d.release_date?.date ?? null,
    demo: Array.isArray(d.demos) && d.demos.length > 0,
    accesoAnticipado: (d.genres ?? []).some((g) => g.id === '70'),
    gratis: d.is_free === true,
  };
}

async function revisar(ficha) {
  const f = ficha.fuentes ?? {};
  const resultado = { id: ficha.id, nombre: ficha.nombre, archivo: ficha.archivo, novedades: [], steam: null, errores: [], avisos: [] };
  const intentar = async (nombre, tarea) => {
    try {
      return await tarea();
    } catch (error) {
      resultado.errores.push(`${nombre}: ${error.message}`);
      return null;
    }
  };

  const tandas = await Promise.all([
    f.steamAppId ? intentar('Noticias de Steam', () => noticiasSteam(f.steamAppId)) : null,
    f.itchRss ? intentar('RSS de itch.io', () => devlogsItch(f.itchRss)) : null,
    f.youtubeCanalId ? intentar('YouTube', () => videosYoutube(f.youtubeCanalId)) : null,
  ]);
  resultado.novedades = tandas
    .flatMap((t) => t ?? [])
    .filter((n) => !Number.isNaN(n.fecha.valueOf()) && n.fecha.valueOf() >= desde)
    .sort((a, b) => b.fecha - a.fecha);
  if (f.steamAppId) resultado.steam = await intentar('Estado en Steam', () => estadoSteam(f.steamAppId));

  if (!f.steamAppId && !f.itchRss && !f.youtubeCanalId) resultado.avisos.push('La ficha no tiene ninguna fuente cargada.');
  if (!ficha.porQueSeguirlo) resultado.avisos.push('Falta "Por qué seguirlo" (lo escribe una persona).');
  if (!ficha.portada) resultado.avisos.push('Falta la imagen de portada del press kit.');
  if (ficha.borrador) resultado.avisos.push('La ficha está en borrador.');
  const st = resultado.steam;
  if (st) {
    const sugerido = st.proximamente ? (st.demo ? 'Con demo' : 'Anunciado') : st.accesoAnticipado ? 'Acceso anticipado' : 'Lanzado';
    if (sugerido !== ficha.estado) resultado.avisos.push(`Según Steam el estado sería "${sugerido}" (la ficha dice "${ficha.estado}"). Confirmar.`);
  }
  return resultado;
}

const fichas = await leerFichas();
const resultados = [];
// De a pocas fichas por vez, para no golpear las APIs.
for (let i = 0; i < fichas.length; i += 4) {
  resultados.push(...(await Promise.all(fichas.slice(i, i + 4).map(revisar))));
}

if (enJson) {
  console.log(JSON.stringify({ desde: new Date(desde).toISOString(), fichas: resultados }, null, 2));
} else {
  console.log(`# Novedades de los últimos ${dias} días (${fichas.length} fichas)\n`);
  if (fichas.length === 0) console.log('No hay fichas para revisar.\n');
  for (const r of resultados) {
    console.log(`## ${r.nombre} (${r.archivo})\n`);
    if (r.novedades.length === 0) console.log('Sin novedades.\n');
    for (const n of r.novedades) {
      console.log(`- **${n.titulo}** · ${n.fuente}${n.oficial ? '' : ' (prensa externa, no oficial)'} · ${n.fecha.toISOString().slice(0, 10)}`);
      console.log(`  ${n.url}`);
      if (n.resumen) console.log(`  ${n.resumen}`);
    }
    if (r.novedades.length) console.log();
    if (r.steam) console.log(`Steam: salida ${r.steam.fecha ?? 'sin dato'}${r.steam.proximamente ? ' (todavía no salió)' : ''}, ${r.steam.demo ? 'con demo' : 'sin demo'}\n`);
    for (const a of r.avisos) console.log(`- Aviso: ${a}`);
    for (const e of r.errores) console.log(`- No se pudo leer ${e}`);
    if (r.avisos.length || r.errores.length) console.log();
  }
}
