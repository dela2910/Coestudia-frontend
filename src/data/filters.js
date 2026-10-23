// Quita tildes y pasa a minúsculas para comparar sin importar cómo se escribió.
const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

// Busca por nombre del ramo o por sigla (ej: "calculo" o "MAT1620").
const matchesQuery = (group, query) =>
  normalize(group.subject).includes(normalize(query)) ||
  normalize(group.code).includes(normalize(query).replace(/\s+/g, ""));

// Un horario calza si su día y su bloque están entre los elegidos (sin elegir = cualquiera).
const matchesSchedule = (group, days, blocks) =>
  group.schedule.some(
    (h) =>
      (days.length === 0 || days.includes(h.day)) &&
      (blocks.length === 0 || blocks.includes(h.isMorning)),
  );

// isOnline: null = cualquier modalidad; blocks: valores de isMorning elegidos.
export function filterGroups(groups, { query, isOnline, days, blocks }) {
  return groups.filter(
    (g) =>
      matchesQuery(g, query) &&
      (isOnline === null || g.isOnline === isOnline) &&
      matchesSchedule(g, days, blocks),
  );
}
