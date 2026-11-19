# Labind

Sitio estático en Astro para seguir juegos indie en español, con foco en
Argentina y Latinoamérica. Se publica solo en Cloudflare Pages cada vez que se
aprueba un cambio en la rama principal. Todo el contenido son archivos Markdown.

## Antes de escribir

Leé `docs/guia-de-estilo.md` antes de redactar cualquier nota o ficha. Para la
tarea de cada mañana, seguí `docs/tarea-diaria.md`.

## Dónde está cada cosa

- `src/content/juegos/<slug>.md`: ficha de un juego.
- `src/content/desarrolladores/<slug>.md`: ficha de un estudio o dev.
- `src/content/notas/<slug>.md`: una nota. Su `seccion` decide la URL (`/<seccion>/<slug>/`).
- `src/content.config.ts`: los campos de cada colección. Es la fuente de verdad.
- `src/config.ts`: nombre del sitio, secciones, newsletter, redes, medición.
- `src/data/eventos.ts`: calendario de Steam.
- `docs/plantillas/`: una plantilla por tipo de archivo, para copiar.
- `scripts/novedades.mjs`: lee las fuentes de cada ficha (`npm run novedades`).

Los archivos `ejemplo-*` son contenido inventado en borrador. No los uses como
fuente ni los enlaces desde contenido real.

## Reglas del contenido

1. **Toda nota sobre un juego cuelga de su ficha.** Poné el slug en `juegos:`.
   Si el juego no tiene ficha, creá primero la ficha (y la del dev).
2. **Cada dato lleva fuente.** Las notas listan sus `fuentes` con link. No
   inventes fechas, precios, citas ni características: si no se sabe, se dice.
3. **La opinión es de una persona.** Nunca completes `porQueSeguirlo` ni
   escribas impresiones de juego ("lo probamos", "nos pareció"). Dejá el campo
   sin poner y marcá en la nota dónde va la opinión con un comentario
   `<!-- OPINIÓN: ... -->`.
4. **Imágenes** solo del press kit oficial o de la página de Steam del juego,
   siempre con `credito`. Nunca de un buscador. La `portada` es el arte
   oficial con el logo (en Steam, la cápsula de 616x353 en su versión 2x), para
   que el juego se reconozca de un vistazo; una captura del juego va en
   `captura`, que es opcional. Sin arte oficial, la ficha va sin `portada`.
5. **Rumores:** `seccion: rumores`, `rumor: sin confirmar` y al menos una
   fuente. Si se confirma o resulta falso, se actualiza la misma nota: cambiá
   `rumor`, poné `actualizada` y contá arriba qué pasó.
6. **Afiliados y patrocinios:** `afiliados: true` en toda nota con links de
   afiliado, `patrocinado: true` en toda nota paga. El sitio muestra el aviso.
7. **Estado de un juego** (`Anunciado`, `Con demo`, `Acceso anticipado`,
   `Lanzado`): si lo cambiás, decilo en la descripción del pull request para
   que se confirme.
8. **Precios** en dólares, con la tienda. `precio` es el precio de lista;
   `mejorOferta`, el más bajo conocido, con su fecha.
9. Al tocar una ficha, actualizá `actualizado` con la fecha del día.

## Publicar

- Nada se publica sin revisión: trabajá en una rama y abrí un pull request.
  Aprobarlo es publicarlo.
- `borrador: true` saca una nota o ficha del sitio publicado aunque esté en la
  rama principal. Se ve en `npm run dev` y en builds con `LABIND_BORRADORES=1`.
- Los slugs no se cambian después de publicar: son la URL y la etiqueta con la
  que la gente sigue el juego (`juego-<slug>`, `dev-<slug>`).

## Comandos

- `npm run dev`: sitio local, con borradores.
- `npm run build`: compila como en producción. Valida todos los campos; si un
  archivo está mal, falla y dice cuál. Corré esto antes de cada commit.
- `npm run novedades -- --dias 2`: informe de novedades y precios por ficha.

## Diseño

Fucsia `#D6247E` (logo, botones, títulos grandes; lleva texto blanco), fucsia
oscuro `#9E1660` (links y texto fucsia sobre crema), crema `#F7EDE0` (fondo),
marrón claro `#C9A47E` (bordes y etiquetas), marrón oscuro `#4A3426` (texto).
Las variables están en `src/styles/global.css`. El fucsia común no se usa para
texto chico sobre crema.
