import { request } from "./client";

// Notificaciones de la campana: GET /api/notificaciones y POST /api/notificaciones/vistas.
// El backend las arma con las solicitudes y las invitaciones del usuario.

export const toNotification = (n) => ({
  id: n.id,
  // "solicitud_recibida" | "invitacion_recibida" | "solicitud_respondida" | "invitacion_respondida"
  type: n.tipo,
  date: n.fecha,
  groupId: n.grupo_id,
  subject: n.asignatura,
  person: n.persona,
  accepted: n.aceptada,
  isNew: n.nueva,
});

export async function getNotifications() {
  const data = await request("/api/notificaciones");
  return { unread: data.sin_leer, items: data.notificaciones.map(toNotification) };
}

export const markNotificationsSeen = () =>
  request("/api/notificaciones/vistas", { method: "POST" });

// Texto de cada notificación
export function notificationText({ type, person, subject, accepted }) {
  switch (type) {
    case "solicitud_recibida":
      return `${person} pidió unirse a tu grupo de ${subject}`;
    case "invitacion_recibida":
      return `${person} te invitó a su grupo de ${subject}`;
    case "solicitud_respondida":
      return accepted
        ? `Te aceptaron en el grupo de ${subject}`
        : `Tu solicitud al grupo de ${subject} fue rechazada`;
    case "invitacion_respondida":
      return `${person ?? "Tu invitado"} ${accepted ? "aceptó" : "rechazó"} tu invitación al grupo de ${subject}`;
    default:
      return subject;
  }
}

// Pestaña de «Mis grupos» donde se puede ver o responder cada notificación
export function notificationTab({ type, accepted }) {
  if (type === "solicitud_recibida" || type === "invitacion_respondida") return "created";
  if (type === "solicitud_respondida" && accepted) return "participating";
  return "requests";
}

// «hace 5 min», «hace 3 h», «hace 2 días»
export function timeAgo(date, now = Date.now()) {
  const minutes = Math.max(0, Math.floor((now - new Date(date).getTime()) / 60_000));
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return `hace ${days} ${days === 1 ? "día" : "días"}`;
}
