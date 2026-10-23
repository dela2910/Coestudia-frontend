import { request } from "./client";

// Grupos de estudio. Buscar y filtrar (B06): GET /api/grupos del backend.

// El backend usa los nombres del modelo de datos; las vistas usan los de src/data/mock.js.
export const toGroup = (grupo) => ({
  id: grupo.id,
  code: grupo.asignatura.sigla,
  subject: grupo.asignatura.nombre,
  description: grupo.descripcion ?? "",
  isOnline: grupo.es_online,
  capacity: grupo.cupo_maximo,
  members: grupo.miembros,
  isOpen: grupo.abierto,
  validUntil: grupo.vigente_hasta,
  schedule: grupo.horarios.map((h) => ({ day: h.dia_semana, isMorning: h.es_manana })),
});

// filters: { query, isOnline (null = cualquiera), days: [0-5], blocks: [isMorning] }
export async function searchGroups({ query, isOnline, days, blocks }) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (isOnline !== null) params.set("es_online", String(isOnline));
  days.forEach((day) => params.append("dia", String(day)));
  blocks.forEach((isMorning) => params.append("es_manana", String(isMorning)));
  const qs = params.toString();
  const grupos = await request(`/api/grupos${qs ? `?${qs}` : ""}`);
  return grupos.map(toGroup);
}
