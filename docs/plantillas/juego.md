---
nombre: Nombre del juego
dev: slug-del-dev            # archivo en src/content/desarrolladores/
pais: Argentina
generos: [Roguelike]
plataformas: [PC]
estado: Anunciado            # Anunciado | Con demo | Acceso anticipado | Lanzado
fechaSalida: Sin fecha       # una fecha, '2027' o Sin fecha
resumen: Una oración que cuenta qué es el juego, sin opinión. Hasta 200 caracteres.
# El bloque `precios` no se escribe a mano: lo carga `npm run precios` con el
# precio de Steam de cada país, a partir de `fuentes.steamAppId`.
links:                       # solo los que existan
  steam: https://store.steampowered.com/app/000000/
  itch: https://dev.itch.io/juego
  web: https://ejemplo.com
  presskit: https://ejemplo.com/press
  x: https://x.com/dev
  bluesky: https://bsky.app/profile/dev
  instagram: https://instagram.com/dev
  tiktok: https://tiktok.com/@dev
  youtube: https://youtube.com/@dev
  discord: https://discord.gg/xxxx
fuentes:                     # lo que lee la tarea diaria
  steamAppId: 000000         # el número de la URL de Steam
  itchRss: https://dev.itch.io/juego/devlog.rss
  youtubeCanalId: UCxxxxxxxxxxxxxxxxxxxxxx   # el id del canal, empieza con UC
portada:                     # arte oficial con el logo (press kit o Steam). Va en ./portadas/
  archivo: ./portadas/slug-del-juego.jpg
  alt: Arte de portada de Nombre del juego, con el logo del juego
  credito: Nombre del estudio (press kit)
captura:                     # opcional: una captura del juego. Va en ./capturas/
  archivo: ./capturas/slug-del-juego.jpg
  alt: Qué se ve en la captura
  credito: Nombre del estudio (captura de la página de Steam)
porQueSeguirlo: Lo escribe una persona. Una o dos oraciones con tu opinión.
actualizado: 2026-11-19
borrador: false
---

Opcional: un párrafo de contexto sobre el juego, con datos que tengan fuente.
