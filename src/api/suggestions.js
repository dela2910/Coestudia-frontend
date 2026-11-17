import { request } from "./client";
import { toGroup } from "./groups";
import { toSubject } from "./profile";

// Sugerencias para el usuario: grupos que le pueden servir (GET /api/sugerencias/grupos) y la
// búsqueda sugerida de asignaturas para el buscador (GET /api/sugerencias/asignaturas).

// Grupo como en el buscador, más los motivos de la sugerencia (ej. «Cursas MAT1620»).
export const toSuggestedGroup = (grupo) => ({
  ...toGroup(grupo),
  reasons: grupo.motivos,
});

export const getSuggestedGroups = async (limit = 6) =>
  (await request(`/api/sugerencias/grupos?limite=${limit}`)).map(toSuggestedGroup);

// Asignatura de la búsqueda sugerida. openGroups: grupos con cupo donde el usuario aún no está.
// reason: por qué se sugiere, o "" si solo calza con lo escrito.
export const toSuggestedSubject = (sugerencia) => ({
  ...toSubject(sugerencia.asignatura),
  openGroups: sugerencia.grupos_disponibles,
  reason: sugerencia.motivo ?? "",
});

// Sin texto: asignaturas con grupos disponibles. Con texto: las que calzan por sigla o nombre.
export async function getSuggestedSubjects(query = "") {
  const q = query.trim();
  const qs = q ? `?${new URLSearchParams({ q })}` : "";
  return (await request(`/api/sugerencias/asignaturas${qs}`)).map(toSuggestedSubject);
}
