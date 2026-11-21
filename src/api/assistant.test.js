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
        fuentes: [{ id: 9, nombre: "Guía 1.pdf" }],
      }),
    ).toEqual({
      id: 4,
      role: "bot",
      author: null,
      isMine: false,
      text: "Resumen del material",
      sources: ["Guía 1.pdf"],
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
  });
});

describe("askAssistant", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("manda la pregunta al grupo y devuelve la respuesta", async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 201,
        json: () =>
          Promise.resolve({
            id: 2,
            es_asistente: true,
            contenido: "Listo",
            fuentes: [],
          }),
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const answer = await askAssistant(11, "Hazme un control");

    expect(answer.text).toBe("Listo");
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/grupos\/11\/asistente$/);
    expect(options.method).toBe("POST");
    expect(JSON.parse(options.body)).toEqual({ contenido: "Hazme un control" });
  });
});
