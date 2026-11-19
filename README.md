# Labind

El lugar para seguir juegos indie y a sus desarrolladores, en español. Sitio
estático hecho con [Astro](https://astro.build), pensado para Cloudflare Pages.

## Probarlo

Hace falta Node 22.

```sh
npm install
npm run dev      # http://localhost:4321, con borradores
npm run build    # compila en dist/ como en producción
```

## Cómo se carga contenido

Todo son archivos Markdown en `src/content/`. Hay una plantilla de cada tipo en
`docs/plantillas/`.

| Qué | Dónde | URL |
| --- | --- | --- |
| Ficha de juego | `src/content/juegos/<slug>.md` | `/juegos/<slug>/` |
| Ficha de dev | `src/content/desarrolladores/<slug>.md` | `/devs/<slug>/` |
| Nota | `src/content/notas/<slug>.md` | `/<seccion>/<slug>/` |

Cada nota dice a qué juegos pertenece (`juegos: [slug]`) y la ficha arma su
línea de tiempo sola. Si a un archivo le falta un campo o tiene uno mal,
`npm run build` falla y dice cuál.

`borrador: true` deja una nota o ficha fuera del sitio publicado. Los archivos
`ejemplo-*` son contenido inventado en borrador: sirven para ver el diseño en
`npm run dev` y se pueden borrar cuando haya fichas reales.

## Publicar en Cloudflare Pages

1. En Cloudflare: Workers & Pages → Create → Pages → conectar este repositorio.
2. Proyecto `labind` (queda en `labind.pages.dev`), preset **Astro**, comando
   `npm run build`, carpeta de salida `dist`.
3. Variable de entorno `NODE_VERSION` = `22`.
4. Opcional: en el entorno **Preview**, `LABIND_BORRADORES` = `1`. Así la vista
   previa de cada pull request muestra también los borradores.

Desde ahí, cada cambio aprobado en la rama principal se publica solo, y cada
pull request tiene su vista previa.

## Qué falta conectar

Todo se configura en `src/config.ts`. Lo que está vacío queda apagado y el
sitio no muestra nada que todavía no funcione.

| Función | Campo | Mientras esté vacío |
| --- | --- | --- |
| Seguir por email | `NEWSLETTER.accion` (y `servicio`) | "Seguir" ofrece el RSS de la ficha |
| Mandá tu juego | `CONTACTO.formularioJuego` o `CONTACTO.email` | La página avisa que el formulario está en camino |
| Redes y aportes | `REDES`, `APORTES` | No aparecen en el pie |
| Analítica | `MEDICION.umamiScript` y `umamiSitio` | No se carga ningún script |
| Search Console | `MEDICION.searchConsole` | No se agrega la meta de verificación |

**Newsletter.** El formulario manda un POST a `NEWSLETTER.accion` con el email
y una etiqueta por ficha (`juego-<slug>`, `dev-<slug>` o `semanal`). Sirve
cualquier servicio que acepte un formulario HTML con una etiqueta en un campo
oculto; ajustá `campoEmail` y `campoEtiqueta` a los nombres que pida.

**Privacidad.** `src/pages/privacidad.astro` cambia sola según lo que esté
prendido, pero es un punto de partida y no asesoramiento legal: leela cada vez
que sumes un servicio, sobre todo antes de activar anuncios.

**Dominio propio.** Al registrarlo, cambiá la URL en `astro.config.mjs`,
`src/config.ts` y `public/robots.txt`.

## Automatización diaria

`docs/tarea-diaria.md` tiene las instrucciones para la tarea programada de
Claude: lee las fuentes de cada ficha con `npm run novedades`, actualiza
precios y datos, y abre un pull request con 1 a 3 borradores. `CLAUDE.md` y
`docs/guia-de-estilo.md` son las reglas que sigue al escribir.

```sh
npm run novedades -- --dias 2          # informe de las últimas 48 horas
npm run novedades -- --juego mi-juego  # una sola ficha
```

El informe usa las APIs públicas de Steam, los RSS de itch.io y YouTube, y
CheapShark para el mínimo histórico. Antes de monetizar con datos de precios,
leé las condiciones de uso comercial de la API que uses.
