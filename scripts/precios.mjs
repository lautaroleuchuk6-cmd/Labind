#!/usr/bin/env node
// Actualiza el precio de Steam por país en cada ficha.
//
// Steam cobra distinto en cada región, así que se consulta un país por vez
// (la lista está en src/config.ts) y se guarda el bloque `precios` de la ficha.
// Solo toca las fichas donde algo cambió, y ahí también pone la fecha de hoy
// en `actualizado`. Los juegos sin precio todavía quedan sin el bloque.
//
// Uso:
//   npm run precios                      actualiza todas las fichas
//   npm run precios -- --seco            muestra qué cambiaría, sin escribir
//   npm run precios -- --juego mi-juego  una sola ficha

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseDocument, isMap } from 'yaml';
import { PAISES } from '../src/config.ts';

const CARPETA = process.env.LABIND_FICHAS ?? join(fileURLToPath(new URL('../', import.meta.url)), 'src/content/juegos');
const args = process.argv.slice(2);
const seco = args.includes('--seco');
const soloJuego = args.includes('--juego') ? args[args.indexOf('--juego') + 1] : undefined;
const hoy = new Date().toISOString().slice(0, 10);

const archivos = (await readdir(CARPETA)).filter((a) => a.endsWith('.md') && !a.startsWith('_'));
const fichas = [];
for (const archivo of archivos) {
  const ruta = join(CARPETA, archivo);
  const crudo = await readFile(ruta, 'utf8');
  const partes = crudo.match(/^---\r?\n([\s\S]*?)\r?\n---(\r?\n[\s\S]*)?$/);
  if (!partes) continue;
  const doc = parseDocument(partes[1]);
  const appId = doc.getIn(['fuentes', 'steamAppId']);
  const id = archivo.replace(/\.md$/, '');
  if (!appId || (soloJuego && soloJuego !== id)) continue;
  fichas.push({ id, ruta, doc, resto: partes[2] ?? '\n', appId, nombre: doc.get('nombre') });
}

// Un pedido por país para todas las fichas: Steam acepta varios juegos juntos
// cuando solo se pide el precio.
const porJuego = new Map(fichas.map((f) => [String(f.appId), {}]));
const fallaron = [];
for (const pais of PAISES) {
  for (let i = 0; i < fichas.length; i += 40) {
    const ids = fichas.slice(i, i + 40).map((f) => f.appId);
    try {
      const res = await fetch(
        `https://store.steampowered.com/api/appdetails?appids=${ids.join(',')}&filters=price_overview&cc=${pais.cc}`,
        { signal: AbortSignal.timeout(30_000) },
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const datos = await res.json();
      for (const [appId, r] of Object.entries(datos)) {
        const p = r?.success ? r.data?.price_overview : null;
        if (p) porJuego.get(appId)[pais.codigo] = { moneda: p.currency, lista: p.initial / 100, actual: p.final / 100 };
      }
    } catch (error) {
      fallaron.push(`${pais.nombre}: ${error.message}`);
    }
    await new Promise((r) => setTimeout(r, 400));
  }
}

const texto = (p) => (p ? `${p.moneda} ${p.actual}${p.actual < p.lista ? ` (antes ${p.lista})` : ''}` : 'sin precio');
let cambiadas = 0;
for (const f of fichas) {
  const nuevos = porJuego.get(String(f.appId));
  const viejos = f.doc.toJS().precios?.paises ?? {};
  // Si un país falló, se conserva el dato que ya estaba en lugar de borrarlo.
  for (const pais of PAISES) if (!nuevos[pais.codigo] && viejos[pais.codigo] && fallaron.length) nuevos[pais.codigo] = viejos[pais.codigo];
  const cambios = PAISES.filter((p) => JSON.stringify(viejos[p.codigo]) !== JSON.stringify(nuevos[p.codigo]));
  const tieneViejo = f.doc.has('precio') || f.doc.has('mejorOferta');
  if (cambios.length === 0 && !tieneViejo) continue;

  cambiadas++;
  console.log(`\n${f.nombre} (${f.id})`);
  for (const p of cambios) console.log(`  ${p.nombre}: ${texto(viejos[p.codigo])} → ${texto(nuevos[p.codigo])}`);
  if (seco) continue;

  const items = f.doc.contents.items;
  const indice = (clave) => items.findIndex((par) => par.key?.value === clave);
  for (const clave of ['mejorOferta', 'precio', 'precios']) if (indice(clave) !== -1) items.splice(indice(clave), 1);
  if (Object.keys(nuevos).length > 0) {
    const par = f.doc.createPair('precios', { tienda: 'Steam', fecha: hoy, paises: nuevos });
    // Cada país en una sola línea, para que el archivo se lea bien.
    const paises = par.value.get('paises', true);
    if (isMap(paises)) for (const item of paises.items) item.value.flow = true;
    items.splice(indice('resumen') + 1, 0, par);
  }
  f.doc.set('actualizado', hoy);
  await writeFile(f.ruta, `---\n${f.doc.toString({ lineWidth: 0, flowCollectionPadding: false })}---${f.resto}`);
}

console.log(`\n${seco ? 'Cambiarían' : 'Actualizadas'}: ${cambiadas} de ${fichas.length} fichas con juego en Steam.`);
if (fallaron.length) console.log(`No se pudo consultar: ${fallaron.join('; ')}`);
