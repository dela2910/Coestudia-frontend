import { request } from "./client";

// Asistente de estudio del grupo (B13). Responde solo con los archivos que subió el grupo, usando
// Claude desde el backend: la API key vive SOLO en el backend, nunca en VITE_*. La conversación es
// de todo el grupo: cada pregunta trae el nombre de quien la hizo.
// Conversación: GET y DELETE /api/grupos/{id}/asistente. Preguntar: POST al mismo endpoint.

// Mismo límite que el backend (PreguntaAsistenteIn en app/schemas.py)
export const MAX_QUESTION_LENGTH = 2000;

export const toMessage = (mensaje) => ({
  id: mensaje.id,
  role: mensaje.es_asistente ? "bot" : "user",
  author: mensaje.autor,
  isMine: mensaje.es_mio,
  text: mensaje.contenido,
  sources: mensaje.fuentes.map((f) => f.nombre),
});

export const getConversation = async (groupId) =>
  (await request(`/api/grupos/${groupId}/asistente`)).map(toMessage);

// Devuelve la respuesta del asistente; la pregunta queda guardada en el historial del backend
export const askAssistant = async (groupId, question) =>
  toMessage(
    await request(`/api/grupos/${groupId}/asistente`, {
      method: "POST",
      body: { contenido: question },
    }),
  );

export const clearConversation = (groupId) =>
  request(`/api/grupos/${groupId}/asistente`, { method: "DELETE" });
