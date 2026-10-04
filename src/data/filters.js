// Quita tildes y pasa a minúsculas para comparar sin importar cómo se escribió.
const normalize = (text) =>
  text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();

export function filterGroups(groups, { query, modality, days, blocks }) {
  return groups.filter(
    (g) =>
      normalize(g.subject).includes(normalize(query)) &&
      (!modality || g.modality === modality) &&
      (days.length === 0 || days.includes(g.day)) &&
      (blocks.length === 0 || blocks.includes(g.block)),
  );
}
