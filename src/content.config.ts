import { defineCollection, reference } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { ESTADOS, SECCIONES } from './config';

const url = z.string().url();

const links = z
  .object({
    steam: url,
    itch: url,
    web: url,
    x: url,
    bluesky: url,
    instagram: url,
    tiktok: url,
    youtube: url,
    discord: url,
    presskit: url,
  })
  .partial()
  .default({});

// Imágenes: solo del press kit oficial o de la página de Steam, siempre con crédito.
const portada = (image: () => z.ZodTypeAny) =>
  z
    .object({
      archivo: image(),
      alt: z.string(),
      credito: z.string(),
    })
    .optional();

const precio = z.object({
  usd: z.number().nonnegative(),
  tienda: z.string(),
  url: url.optional(),
  fecha: z.coerce.date().optional(),
});

const juegos = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/juegos' }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      dev: reference('desarrolladores'),
      pais: z.string(),
      generos: z.array(z.string()).min(1),
      plataformas: z.array(z.string()).min(1),
      estado: z.enum(ESTADOS),
      // Una fecha ("12 de marzo de 2027"), un año ("2027") o "Sin fecha".
      fechaSalida: z.string().default('Sin fecha'),
      // Una oración que cuenta qué es el juego, sin opinión.
      resumen: z.string().max(200),
      precio: precio.optional(),
      mejorOferta: precio.optional(),
      links,
      // Lo que lee la tarea diaria.
      fuentes: z
        .object({
          steamAppId: z.number().int().positive(),
          itchRss: url,
          youtubeCanalId: z.string(),
        })
        .partial()
        .default({}),
      portada: portada(image),
      // La opinión de quien escribe. La completa una persona, nunca Claude.
      porQueSeguirlo: z.string().optional(),
      actualizado: z.coerce.date(),
      borrador: z.boolean().default(false),
    }),
});

const desarrolladores = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/desarrolladores' }),
  schema: ({ image }) =>
    z.object({
      nombre: z.string(),
      pais: z.string(),
      // Quién es, en una o dos oraciones.
      resumen: z.string().max(300),
      links,
      portada: portada(image),
      borrador: z.boolean().default(false),
    }),
});

const notas = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/notas' }),
  schema: ({ image }) =>
    z
      .object({
        titulo: z.string(),
        descripcion: z.string().max(200),
        seccion: z.enum(SECCIONES.map((s) => s.id) as [string, ...string[]]),
        fecha: z.coerce.date(),
        actualizada: z.coerce.date().optional(),
        // Toda nota sobre un juego cuelga de su ficha.
        juegos: z.array(reference('juegos')).default([]),
        devs: z.array(reference('desarrolladores')).default([]),
        fuentes: z.array(z.object({ nombre: z.string(), url })).default([]),
        afiliados: z.boolean().default(false),
        patrocinado: z.boolean().default(false),
        // Solo para la sección Rumores.
        rumor: z.enum(['sin confirmar', 'confirmado', 'falso']).optional(),
        portada: portada(image),
        borrador: z.boolean().default(false),
      })
      .superRefine((nota, ctx) => {
        if (nota.seccion !== 'rumores') return;
        if (!nota.rumor) {
          ctx.addIssue({
            code: 'custom',
            path: ['rumor'],
            message: 'Un rumor lleva su estado: "sin confirmar", "confirmado" o "falso".',
          });
        }
        if (nota.fuentes.length === 0) {
          ctx.addIssue({
            code: 'custom',
            path: ['fuentes'],
            message: 'Un rumor lleva siempre el link a la fuente.',
          });
        }
      }),
});

export const collections = { juegos, desarrolladores, notas };
