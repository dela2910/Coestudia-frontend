import { request } from "./client";

// Foro del grupo (B16): temas con su pregunta y respuestas debajo.
// Lista y abrir tema: /api/grupos/{id}/foro. Ver tema: GET /api/foro/{id}.
// Responder: POST /api/foro/{id}/respuestas. No hay consultas periódicas: se carga al abrir y con
// el botón «Actualizar», para no mantener despierta la base de datos.

// Mismos límites que el backend (TemaForoIn y RespuestaForoIn en app/schemas.py)
export const MAX_TITLE_LENGTH = 150;
export const MAX_TEXT_LENGTH = 5000;

// Fecha y hora cortas en la zona horaria local, ej. «8 nov, 17:05»
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("es-CL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

export const toTopicSummary = (tema) => ({
  id: tema.id,
  title: tema.titulo,
  author: tema.autor,
  replies: tema.total_respuestas,
  lastActivity: formatDateTime(tema.ultima_actividad_en),
});

export const toReply = (respuesta) => ({
  id: respuesta.id,
  author: respuesta.autor,
  isMine: respuesta.es_mia,
  text: respuesta.contenido,
  date: formatDateTime(respuesta.creado_en),
});

export const toTopic = (tema) => ({
  id: tema.id,
  title: tema.titulo,
  author: tema.autor,
  isMine: tema.es_mio,
  text: tema.contenido,
  date: formatDateTime(tema.creado_en),
  replies: tema.respuestas.map(toReply),
});

export const getTopics = async (groupId) =>
  (await request(`/api/grupos/${groupId}/foro`)).map(toTopicSummary);

export const createTopic = async (groupId, { title, text }) =>
  toTopic(
    await request(`/api/grupos/${groupId}/foro`, {
      method: "POST",
      body: { titulo: title, contenido: text },
    }),
  );

export const getTopic = async (topicId) => toTopic(await request(`/api/foro/${topicId}`));

export const replyTopic = async (topicId, text) =>
  toReply(await request(`/api/foro/${topicId}/respuestas`, { method: "POST", body: { contenido: text } }));
