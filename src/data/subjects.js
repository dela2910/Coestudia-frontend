// La sigla se guarda en mayúsculas y sin espacios, igual que en el backend:
// así "mat 1620" y "MAT1620" son la misma asignatura.
export const normalizeCode = (code) => code.toUpperCase().replace(/\s+/g, "");

export const findSubject = (catalog, code) =>
  catalog.find((s) => s.code === normalizeCode(code));

export const subjectLabel = (subject) => `${subject.code} · ${subject.name}`;
