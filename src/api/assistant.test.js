import { afterEach, describe, expect, it, vi } from "vitest";
import { askAssistant, toMessage } from "./assistant";

describe("toMessage", () => {
  it("traduce los nombres del backend a los de las vistas", () => {
    expect(
      toMessage({
        id: 4,
        es_asistente: true,
        autor: null,
        es_mio: false,
        contenido: "Resumen del material",
        creado_en: "2026-11-12T15:00:00Z",
        fuentes: [
          { id: 9, nombre: "Guía 1.pdf", ubicacion: "pág. 4" },
          { id: 10, nombre: "Notas.txt", ubicacion: null },
        ],
        aviso: "No alcancé a leer: Libro.pdf.",
      }),
    ).toEqual({
      id: 4,
      role: "bot",
      author: null,
      isMine: false,
      text: "Resumen del material",
      sources: ["Guía 1.pdf, pág. 4", "Notas.txt"],
      notice: "No alcancé a leer: Libro.pdf.",
    });
  });

  it("marca las preguntas del usuario", () => {
    const message = toMessage({
      id: 3,
      es_asistente: false,
      contenido: "Hola",
      fuentes: [],
    });
    expect(message.role).toBe("user");
    expect(message.notice).toBeNull();
  });
});

// Respuesta de fetch con un cuerpo text/event-stream que llega en los pedazos indicados
const streamResponse = (chunks) => {
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return { ok: true, status: 200, body };
};

const event = (name, data) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`;

const saved = { id: 2, es_asistente: true, contenido: "Listo, aquí va", fuentes: [] };

describe("askAssistant", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("manda la pregunta, entrega las partes y devuelve la respuesta guardada", async () => {
    const stream = event("texto", { texto: "Listo, " }) + event("texto", { texto: "aquí va" });
    // Los pedazos de la red no coinciden con los eventos: se cortan en cualquier parte
    const fetchMock = vi.fn(() =>
      Promise.resolve(streamResponse([stream.slice(0, 10), stream.slice(10), event("listo", saved)])),
    );
    vi.stubGlobal("fetch", fetchMock);
    const parts = [];

    const answer = await askAssistant(11, "Hazme un control", (text) => parts.push(text));

    expect(parts).toEqual(["Listo, ", "aquí va"]);
    expect(answer.text).toBe("Listo, aquí va");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/grupos\/11\/asistente$/);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ contenido: "Hazme un control" });
  });

  it("lanza el error que manda el backend si Claude falla", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(streamResponse([event("error", { detail: "No disponible" })]))),
    );

    await expect(askAssistant(11, "Hola")).rejects.toThrow("No disponible");
  });

  it("avisa si la respuesta se corta antes del final", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(streamResponse([event("texto", { texto: "Medio" })]))),
    );

    await expect(askAssistant(11, "Hola")).rejects.toThrow("Se cortó la respuesta");
  });

  it("lanza los errores HTTP de antes de responder, como el límite diario", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 429,
          json: () => Promise.resolve({ detail: "Llegaste al máximo" }),
        }),
      ),
    );

    await expect(askAssistant(11, "Hola")).rejects.toThrow("Llegaste al máximo");
  });
});
