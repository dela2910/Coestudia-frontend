import { request } from "./client";

// Grupos de estudio. Buscar y filtrar (B06): GET /api/grupos. Detalle (B07): GET /api/grupos/{id}.
// Crear: POST /api/grupos.

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

// Detalle: lo del buscador más el creador y los integrantes. place y link llegan solo si el
// usuario es integrante.
export const toGroupDetail = (grupo) => ({
  ...toGroup(grupo),
  owner: grupo.creador,
  integrants: grupo.integrantes.map((m) => ({
    id: m.id,
    name: m.nombre,
    career: m.carrera ?? "",
    isOwner: m.es_creador,
  })),
  isMember: grupo.es_miembro,
  place: grupo.lugar,
  link: grupo.enlace,
});

export const getGroup = async (id) => toGroupDetail(await request(`/api/grupos/${id}`));

// Crear grupo: POST /api/grupos. Se guarda cada combinación de los días y bloques elegidos.
// subjectName solo se usa si la sigla aún no existe (el backend crea la asignatura).
export const createGroup = async ({
  code,
  subjectName,
  description,
  isOnline,
  place,
  link,
  days,
  blocks,
  capacity,
  validUntil,
}) =>
  toGroupDetail(
    await request("/api/grupos", {
      method: "POST",
      body: {
        sigla: code,
        ...(subjectName ? { nombre_asignatura: subjectName } : {}),
        descripcion: description.trim() || null,
        es_online: isOnline,
        lugar: isOnline ? null : place.trim(),
        enlace: isOnline ? link.trim() : null,
        cupo_maximo: capacity,
        vigente_hasta: validUntil,
        horarios: days.flatMap((day) =>
          blocks.map((isMorning) => ({ dia_semana: day, es_manana: isMorning })),
        ),
      },
    }),
  );
