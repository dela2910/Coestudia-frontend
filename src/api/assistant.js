import { ApiError, request } from "./client";

// Asistente de estudio del grupo (B13). Responde solo con los archivos que subió el grupo, usando
// Claude desde el backend: la API key vive SOLO en el backend, nunca en VITE_*. Cada integrante
// tiene su propia conversación con el asistente; el material es el de todo el grupo.
// Conversación: GET y DELETE /api/grupos/{id}/asistente. Preguntar: POST al mismo endpoint, que
// responde por partes (text/event-stream) para mostrar la respuesta mientras se escribe.

// Mismo límite que el backend (PreguntaAsistenteIn en app/schemas.py)
export const MAX_QUESTION_LENGTH = 2000;

export const toMessage = (mensaje) => ({
  id: mensaje.id,
  role: mensaje.es_asistente ? "bot" : "user",
  author: mensaje.autor,
  isMine: mensaje.es_mio,
  text: mensaje.contenido,
  // Con la página o diapositiva que citó, si se sabe: «Guía 2.pdf, pág. 4»
  sources: mensaje.fuentes.map((f) => (f.ubicacion ? `${f.nombre}, ${f.ubicacion}` : f.nombre)),
  // Aviso aparte de la respuesta (por ejemplo, material que no alcanzó a leer)
  notice: mensaje.aviso ?? null,
});

// Preguntas al asistente que le quedan al usuario hoy, en todos sus grupos
export const getDailyLimit = async () => {
  const limite = await request("/api/asistente/limite");
  return { remaining: limite.restantes, max: limite.maximo };
};

export const getConversation = async (groupId) =>
  (await request(`/api/grupos/${groupId}/asistente`)).map(toMessage);

// Un evento de Server-Sent Events: "event: nombre\ndata: {json}"
const parseEvent = (chunk) => {
  let event = "message";
  let data = "";
  for (const line of chunk.split("\n")) {
    if (line.startsWith("event: ")) event = line.slice(7);
    else if (line.startsWith("data: ")) data += line.slice(6);
  }
  return { event, data: data ? JSON.parse(data) : null };
};

// Pregunta al asistente. onText recibe cada parte de la respuesta mientras Claude la escribe.
// Devuelve la respuesta completa ya guardada (con sus fuentes); la pregunta queda guardada en el
// historial del backend. Si Claude falla, lanza un ApiError y el backend no guarda la pregunta.
export async function askAssistant(groupId, question, onText = () => {}) {
  const res = await request(`/api/grupos/${groupId}/asistente`, {
    method: "POST",
    body: { contenido: question },
    raw: true,
  });
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
    let end;
    while ((end = buffer.indexOf("\n\n")) >= 0) {
      const { event, data } = parseEvent(buffer.slice(0, end));
      buffer = buffer.slice(end + 2);
      if (event === "texto") onText(data.texto);
      else if (event === "listo") return toMessage(data);
      else if (event === "error") throw new ApiError(503, data.detail);
    }
    if (done) break;
  }
  // La conexión se cortó antes del final
  throw new ApiError(0, "Se cortó la respuesta del asistente. Intenta de nuevo.");
}

export const clearConversation = (groupId) =>
  request(`/api/grupos/${groupId}/asistente`, { method: "DELETE" });
