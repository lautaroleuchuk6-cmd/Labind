// Calendario de Steam. Fuente: calendario de eventos de Steamworks.
// Las fechas pueden cambiar: revisalas ahí antes de preparar cada evento.
export const EVENTOS = [
  { nombre: 'Steam Winter Sale', desde: '2026-12-17', hasta: '2027-01-04', publicar: 'Resumen de ofertas indie y los mejores indies del año' },
  { nombre: 'Couch Co-Op Fest', desde: '2027-02-08', hasta: '2027-02-15', publicar: 'Indies cooperativos para jugar con amigos' },
  { nombre: 'Next Fest de febrero', desde: '2027-02-22', hasta: '2027-03-01', publicar: 'Demos que hay que probar, una nota por día y fichas nuevas' },
  { nombre: 'Rhythm Fest', desde: '2027-03-08', hasta: '2027-03-15', publicar: 'Lista temática corta' },
  { nombre: 'Steam Spring Sale', desde: '2027-03-18', hasta: '2027-03-25', publicar: 'Resumen de ofertas indie' },
  { nombre: 'Next Fest de junio', desde: '2027-06-14', hasta: '2027-06-21', publicar: 'Demos nuevas y seguimiento de las demos de febrero' },
  { nombre: 'Steam Summer Sale', desde: '2027-06-24', hasta: '2027-07-08', publicar: 'La rebaja más grande del año: varias notas de ofertas' },
] as const;

/** Eventos que todavía no terminaron, del más cercano al más lejano. */
export function proximosEventos(hoy = new Date(), cuantos = 3) {
  const dia = hoy.toISOString().slice(0, 10);
  return EVENTOS.filter((e) => e.hasta >= dia).slice(0, cuantos);
}
