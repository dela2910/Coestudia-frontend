import { afterEach, describe, expect, it, vi } from "vitest";
import { createTopic, formatDateTime, toTopic, toTopicSummary } from "./forum";

const ISO = "2026-11-08T20:05:00Z";

describe("toTopicSummary", () => {
  it("traduce los nombres del backend a los de las vistas", () => {
    const summary = toTopicSummary({
      id: 3,
      titulo: "Guía 2 – Ejercicio 3",
      autor: "Ana Rojas",
      creado_en: ISO,
      ultima_actividad_en: ISO,
      total_respuestas: 2,
    });
    expect(summary).toEqual({
      id: 3,
      title: "Guía 2 – Ejercicio 3",
      author: "Ana Rojas",
      replies: 2,
      // La fecha se muestra en la zona horaria local, igual que la calcula formatDateTime
      lastActivity: formatDateTime(ISO),
    });
  });
});

describe("toTopic", () => {
  it("incluye la pregunta y las respuestas en orden", () => {
    const topic = toTopic({
      id: 3,
      titulo: "Ejercicio 3",
      autor: "Ana Rojas",
      es_mio: false,
      contenido: "¿Cómo parto?",
      creado_en: ISO,
      respuestas: [
        { id: 1, autor: "Luis Castro", es_mia: true, contenido: "Por partes", creado_en: ISO },
      ],
    });
    expect(topic).toMatchObject({ id: 3, title: "Ejercicio 3", isMine: false, text: "¿Cómo parto?" });
    expect(topic.replies).toEqual([
      { id: 1, author: "Luis Castro", isMine: true, text: "Por partes", date: formatDateTime(ISO) },
    ]);
  });
});

describe("createTopic", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("envía el título y el contenido con los nombres del backend", async () => {
    const created = { id: 1, titulo: "T", autor: "A", es_mio: true, contenido: "C", creado_en: ISO, respuestas: [] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 201, json: () => Promise.resolve(created) });
    vi.stubGlobal("fetch", fetchMock);

    await createTopic(11, { title: "T", text: "C" });

    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/api\/grupos\/11\/foro$/);
    expect(JSON.parse(options.body)).toEqual({ titulo: "T", contenido: "C" });
  });
});
