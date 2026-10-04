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

export function filterGroups(groups, { query, modality, days, blocks }) {
  return groups.filter(
    (g) =>
      matchesQuery(g, query) &&
      (!modality || g.modality === modality) &&
      (days.length === 0 || days.includes(g.day)) &&
      (blocks.length === 0 || blocks.includes(g.block)),
  );
}
