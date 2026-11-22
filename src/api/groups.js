import { request } from "./client";

// Grupos de estudio. Buscar y filtrar (B06): GET /api/grupos. Detalle (B07): GET /api/grupos/{id}.
// Crear: POST /api/grupos. Mis grupos (B09): GET /api/grupos/mios. Solicitudes para unirse:
// /api/grupos/{id}/solicitudes y /api/solicitudes/{id}. Mis solicitudes (B09):
// GET /api/solicitudes/mias. Administrar (B10, solo el creador): PUT y DELETE /api/grupos/{id} y
// DELETE /api/grupos/{id}/integrantes/{usuario}. Abandonar (B11): POST /api/grupos/{id}/abandonar.
// Invitaciones: el creador invita con /api/grupos/{id}/invitaciones y el invitado responde con
// GET /api/invitaciones/mias y /api/invitaciones/{id}.

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
  // El backend manda "HH:MM"; slice por si llegan segundos
  schedule: grupo.horarios.map((h) => ({
    day: h.dia_semana,
    start: h.hora_inicio.slice(0, 5),
    end: h.hora_fin.slice(0, 5),
  })),
});

// filters: { query, isOnline (null = cualquiera), days: [0-5], from y to: "HH:MM" o "" }.
// Con horas, calzan los grupos con algún horario que se cruce con ese rango.
export async function searchGroups({ query, isOnline, days, from, to }) {
  const params = new URLSearchParams();
  if (query.trim()) params.set("q", query.trim());
  if (isOnline !== null) params.set("es_online", String(isOnline));
  days.forEach((day) => params.append("dia", String(day)));
  if (from) params.set("desde", from);
  if (to) params.set("hasta", to);
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

// Datos del grupo que comparten crear y editar. schedule: [{ day, start, end }]
const groupBody = ({ description, isOnline, place, link, schedule, capacity, validUntil }) => ({
  descripcion: description.trim() || null,
  es_online: isOnline,
  lugar: isOnline ? null : place.trim(),
  enlace: isOnline ? link.trim() : null,
  cupo_maximo: capacity,
  vigente_hasta: validUntil,
  horarios: schedule.map((h) => ({ dia_semana: h.day, hora_inicio: h.start, hora_fin: h.end })),
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
// también las solicitudes y las invitaciones pendientes.
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
  // Invitaciones que aún no responden (solo el creador las recibe)
  invitations: (grupo.invitaciones ?? []).map((i) => ({
    id: i.id,
    name: i.usuario.nombre,
    career: i.usuario.carrera ?? "",
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

// Invitar por correo institucional y cancelar una invitación (solo el creador). Devuelven el
// grupo actualizado, con sus invitaciones pendientes.
export const inviteToGroup = async (groupId, email) =>
  toMyGroup(
    await request(`/api/grupos/${groupId}/invitaciones`, {
      method: "POST",
      body: { email: email.trim() },
    }),
  );

export const cancelInvitation = async (groupId, invitationId) =>
  toMyGroup(
    await request(`/api/grupos/${groupId}/invitaciones/${invitationId}`, { method: "DELETE" }),
  );

// Invitación pendiente que recibió el usuario. El grupo viene como en el buscador (sin lugar ni
// enlace: los ve al aceptar).
export const toMyInvitation = (invitacion) => ({
  id: invitacion.id,
  invitedBy: invitacion.invitado_por,
  sentAt: invitacion.creada_en,
  group: toGroup(invitacion.grupo),
});

export const getMyInvitations = async () =>
  (await request("/api/invitaciones/mias")).map(toMyInvitation);

// Aceptar devuelve el grupo al que entró el usuario, como en «mis grupos»
export const acceptInvitation = async (invitationId) =>
  toMyGroup(await request(`/api/invitaciones/${invitationId}/aceptar`, { method: "POST" }));

export const rejectInvitation = (invitationId) =>
  request(`/api/invitaciones/${invitationId}/rechazar`, { method: "POST" });
