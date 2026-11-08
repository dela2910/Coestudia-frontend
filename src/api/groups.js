import { request } from "./client";

// Grupos de estudio. Buscar y filtrar (B06): GET /api/grupos. Detalle (B07): GET /api/grupos/{id}.
// Crear: POST /api/grupos. Mis grupos (B09): GET /api/grupos/mios. Solicitudes para unirse:
// /api/grupos/{id}/solicitudes y /api/solicitudes/{id}. Mis solicitudes (B09):
// GET /api/solicitudes/mias. Administrar (B10, solo el creador): PUT y DELETE /api/grupos/{id} y
// DELETE /api/grupos/{id}/integrantes/{usuario}. Abandonar (B11): POST /api/grupos/{id}/abandonar.

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
  // El usuario ya pidió unirse y el creador aún no responde
  pendingRequest: grupo.solicitud_pendiente,
  // La solicitud espera a que se libere un cupo (el grupo está lleno)
  waiting: grupo.solicitud_en_espera,
  place: grupo.lugar,
  link: grupo.enlace,
});

export const getGroup = async (id) => toGroupDetail(await request(`/api/grupos/${id}`));

// Datos del grupo que comparten crear y editar. Se guarda cada combinación de los días y bloques
// elegidos, salvo que venga schedule: los horarios exactos que ya tenía el grupo (al editar sin
// tocar días ni bloques, para no agregar combinaciones que no estaban).
const groupBody = ({
  description,
  isOnline,
  place,
  link,
  days,
  blocks,
  schedule,
  capacity,
  validUntil,
}) => ({
  descripcion: description.trim() || null,
  es_online: isOnline,
  lugar: isOnline ? null : place.trim(),
  enlace: isOnline ? link.trim() : null,
  cupo_maximo: capacity,
  vigente_hasta: validUntil,
  horarios: schedule
    ? schedule.map((h) => ({ dia_semana: h.day, es_manana: h.isMorning }))
    : days.flatMap((day) =>
        blocks.map((isMorning) => ({ dia_semana: day, es_manana: isMorning })),
      ),
});

// Crear grupo: POST /api/grupos. subjectName solo se usa si la sigla aún no existe (el backend
// crea la asignatura).
export const createGroup = async ({ code, subjectName, ...fields }) =>
  toGroupDetail(
    await request("/api/grupos", {
      method: "POST",
      body: {
        sigla: code,
        ...(subjectName ? { nombre_asignatura: subjectName } : {}),
        ...groupBody(fields),
      },
    }),
  );

// Editar (solo el creador): lo mismo que al crear, sin la asignatura, más isOpen (false = cerrado,
// no recibe solicitudes). Devuelve el detalle actualizado.
export const updateGroup = async (id, { isOpen, ...fields }) =>
  toGroupDetail(
    await request(`/api/grupos/${id}`, {
      method: "PUT",
      body: { ...groupBody(fields), abierto: isOpen },
    }),
  );

// Días y bloques elegidos a partir de los horarios del grupo, para llenar el formulario
export const scheduleChoices = (schedule) => ({
  days: [...new Set(schedule.map((h) => h.day))].sort((a, b) => a - b),
  blocks: [...new Set(schedule.map((h) => h.isMorning))],
});

export const deleteGroup = (id) => request(`/api/grupos/${id}`, { method: "DELETE" });

// Expulsar a un integrante (solo el creador). Devuelve el detalle actualizado.
export const removeMember = async (groupId, userId) =>
  toGroupDetail(
    await request(`/api/grupos/${groupId}/integrantes/${userId}`, { method: "DELETE" }),
  );

export const leaveGroup = (id) => request(`/api/grupos/${id}/abandonar`, { method: "POST" });

// Pedir unirse y cancelar la solicitud devuelven el detalle actualizado del grupo.
export const requestToJoin = async (id, message = "") =>
  toGroupDetail(
    await request(`/api/grupos/${id}/solicitudes`, {
      method: "POST",
      body: message.trim() ? { mensaje: message.trim() } : {},
    }),
  );

export const cancelRequest = async (id) =>
  toGroupDetail(await request(`/api/grupos/${id}/solicitudes`, { method: "DELETE" }));

// Grupo de «mis grupos»: el usuario es integrante, así que trae lugar y enlace. Si lo creó,
// también las solicitudes pendientes.
export const toMyGroup = (grupo) => ({
  ...toGroup(grupo),
  isOwner: grupo.es_creador,
  place: grupo.lugar,
  link: grupo.enlace,
  requests: grupo.solicitudes.map((s) => ({
    id: s.id,
    // "pendiente" | "en_espera" (el grupo está lleno: se puede aceptar cuando se libere un cupo)
    status: s.estado,
    name: s.usuario.nombre,
    career: s.usuario.carrera ?? "",
    message: s.mensaje ?? "",
  })),
});

export async function getMyGroups() {
  const { creados, participo } = await request("/api/grupos/mios");
  return { created: creados.map(toMyGroup), participating: participo.map(toMyGroup) };
}

// Solo el creador del grupo. Devuelven el grupo actualizado (integrantes, cupo y solicitudes).
export const acceptRequest = async (requestId) =>
  toMyGroup(await request(`/api/solicitudes/${requestId}/aceptar`, { method: "POST" }));

export const rejectRequest = async (requestId) =>
  toMyGroup(await request(`/api/solicitudes/${requestId}/rechazar`, { method: "POST" }));

// Solicitud enviada por el usuario. status: "pendiente" | "en_espera" | "aceptada" | "rechazada".
// El grupo viene como en el buscador (sin lugar ni enlace).
export const toMyRequest = (solicitud) => ({
  id: solicitud.id,
  status: solicitud.estado,
  message: solicitud.mensaje ?? "",
  sentAt: solicitud.creada_en,
  answeredAt: solicitud.respondida_en,
  group: toGroup(solicitud.grupo),
});

export const getMyRequests = async () => (await request("/api/solicitudes/mias")).map(toMyRequest);
