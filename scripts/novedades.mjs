#!/usr/bin/env node
// Junta las novedades de cada ficha para la tarea diaria.
//
// Lee `fuentes` y `links` de src/content/juegos/*.md y consulta:
//   - las noticias de Steam del juego (API pública de noticias por juego)
//   - el RSS de devlogs de itch.io
//   - el canal de YouTube del dev (feed público del canal)
//   - el precio en Steam en dólares y el mínimo histórico según CheapShark
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

async function precios(appId) {
  const salida = {};
  // Precio de lista y actual en Steam, en dólares (cc=us).
  const steam = (await pedir(`https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&filters=basic,price_overview,release_date`))[appId];
  if (steam?.success) {
    const d = steam.data;
    salida.gratis = d.is_free === true;
    if (d.price_overview?.currency === 'USD') {
      salida.steam = {
        usd: d.price_overview.final / 100,
        lista: d.price_overview.initial / 100,
        descuento: d.price_overview.discount_percent,
      };
    }
    if (d.release_date) salida.salida = { proximamente: d.release_date.coming_soon, fecha: d.release_date.date };
  }
  // Mínimo histórico y mejor precio de hoy entre varias tiendas.
  // CheapShark: leé sus condiciones de uso comercial antes de monetizar con estos datos.
  const busqueda = await pedir(`https://www.cheapshark.com/api/1.0/games?steamAppID=${appId}`);
  if (busqueda[0]?.gameID) {
    const juego = await pedir(`https://www.cheapshark.com/api/1.0/games?id=${busqueda[0].gameID}`);
    if (juego.cheapestPriceEver?.price) {
      salida.minimoHistorico = {
        usd: Number(juego.cheapestPriceEver.price),
        fecha: new Date(juego.cheapestPriceEver.date * 1000).toISOString().slice(0, 10),
      };
    }
    const mejor = lista(juego.deals).sort((a, b) => Number(a.price) - Number(b.price))[0];
    if (mejor) {
      salida.mejorHoy = {
        usd: Number(mejor.price),
        tiendaId: mejor.storeID,
        url: `https://www.cheapshark.com/redirect?dealID=${mejor.dealID}`,
      };
    }
  }
  return salida;
}

async function revisar(ficha) {
  const f = ficha.fuentes ?? {};
  const resultado = { id: ficha.id, nombre: ficha.nombre, archivo: ficha.archivo, novedades: [], precios: null, errores: [], avisos: [] };
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
  if (f.steamAppId) resultado.precios = await intentar('Precios', () => precios(f.steamAppId));

  if (!f.steamAppId && !f.itchRss && !f.youtubeCanalId) resultado.avisos.push('La ficha no tiene ninguna fuente cargada.');
  if (!ficha.porQueSeguirlo) resultado.avisos.push('Falta "Por qué seguirlo" (lo escribe una persona).');
  if (!ficha.portada) resultado.avisos.push('Falta la imagen de portada del press kit.');
  if (ficha.borrador) resultado.avisos.push('La ficha está en borrador.');
  const p = resultado.precios;
  if (p?.steam && ficha.precio?.usd !== p.steam.lista) {
    resultado.avisos.push(`Precio de lista en Steam: US$ ${p.steam.lista} (la ficha dice ${ficha.precio?.usd ?? 'nada'}).`);
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
    if (r.precios && Object.keys(r.precios).length) console.log(`Precios: ${JSON.stringify(r.precios)}\n`);
    for (const a of r.avisos) console.log(`- Aviso: ${a}`);
    for (const e of r.errores) console.log(`- No se pudo leer ${e}`);
    if (r.avisos.length || r.errores.length) console.log();
  }
}
