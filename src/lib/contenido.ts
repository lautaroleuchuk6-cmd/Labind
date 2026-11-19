import { getCollection, type CollectionEntry } from 'astro:content';
import { SECCIONES, type SeccionId } from '../config';

export type Juego = CollectionEntry<'juegos'>;
export type Dev = CollectionEntry<'desarrolladores'>;
export type Nota = CollectionEntry<'notas'>;

// Los borradores se ven en `npm run dev` y en builds con LABIND_BORRADORES=1
// (útil para las vistas previas de Cloudflare). En producción no existen.
export const VER_BORRADORES = import.meta.env.DEV || process.env.LABIND_BORRADORES === '1';

const visible = (entrada: { data: { borrador: boolean } }) =>
  VER_BORRADORES || !entrada.data.borrador;

export async function getJuegos(): Promise<Juego[]> {
  const juegos = await getCollection('juegos', visible);
  return juegos.sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'));
}

export async function getDevs(): Promise<Dev[]> {
  const devs = await getCollection('desarrolladores', visible);
  return devs.sort((a, b) => a.data.nombre.localeCompare(b.data.nombre, 'es'));
}

/** Todas las notas visibles, de la más nueva a la más vieja. */
export async function getNotas(): Promise<Nota[]> {
  const notas = await getCollection('notas', visible);
  return notas.sort((a, b) => b.data.fecha.valueOf() - a.data.fecha.valueOf());
}

export const notasDeJuego = (notas: Nota[], juego: Juego) =>
  notas.filter((n) => n.data.juegos.some((j) => j.id === juego.id));

export const notasDeSeccion = (notas: Nota[], seccion: string) =>
  notas.filter((n) => n.data.seccion === seccion);

export const juegosDeDev = (juegos: Juego[], dev: Dev) =>
  juegos.filter((j) => j.data.dev.id === dev.id);

/** Notas que nombran al dev, o a alguno de sus juegos. */
export const notasDeDev = (notas: Nota[], dev: Dev, juegos: Juego[]) => {
  const suyos = new Set(juegosDeDev(juegos, dev).map((j) => j.id));
  return notas.filter(
    (n) => n.data.devs.some((d) => d.id === dev.id) || n.data.juegos.some((j) => suyos.has(j.id)),
  );
};

/** Fecha del último cambio de una ficha: el campo `actualizado` o su nota más nueva. */
export function ultimaActualizacion(juego: Juego, notas: Nota[]): Date {
  const fechas = notasDeJuego(notas, juego).map((n) => (n.data.actualizada ?? n.data.fecha).valueOf());
  return new Date(Math.max(juego.data.actualizado.valueOf(), ...fechas));
}

export const seccion = (id: string) => SECCIONES.find((s) => s.id === id)!;
export const urlNota = (nota: Nota) => `/${nota.data.seccion as SeccionId}/${nota.id}/`;
export const urlJuego = (juego: { id: string }) => `/juegos/${juego.id}/`;
export const urlDev = (dev: { id: string }) => `/devs/${dev.id}/`;

// Las fechas del contenido no llevan hora: se muestran en UTC para que no se corran un día.
const largo = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const corto = new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
export const fechaLarga = (d: Date) => largo.format(d);
export const fechaCorta = (d: Date) => corto.format(d);
export const fechaIso = (d: Date) => d.toISOString().slice(0, 10);

export const precioUsd = (usd: number) =>
  usd === 0 ? 'Gratis' : `US$ ${usd.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
