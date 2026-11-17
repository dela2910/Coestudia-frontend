import { afterEach, describe, expect, it, vi } from "vitest";
import { getSuggestedGroups, getSuggestedSubjects } from "./suggestions";

const mockFetch = (data) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(data),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

afterEach(() => vi.unstubAllGlobals());

describe("getSuggestedGroups", () => {
  it("pide los grupos sugeridos y agrega los motivos", async () => {
    const fetchMock = mockFetch([
      {
        id: 7,
        asignatura: { id: 3, sigla: "MAT1620", nombre: "Cálculo II" },
        descripcion: null,
        es_online: false,
        cupo_maximo: 4,
        miembros: 2,
        abierto: true,
        vigente_hasta: "2026-12-04",
        horarios: [{ dia_semana: 1, es_manana: false }],
        motivos: ["Cursas MAT1620", "Grupo nuevo"],
      },
    ]);

    const [group] = await getSuggestedGroups(4);

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/sugerencias/grupos");
    expect(url.searchParams.get("limite")).toBe("4");
    expect(group).toMatchObject({
      id: 7,
      code: "MAT1620",
      subject: "Cálculo II",
      schedule: [{ day: 1, isMorning: false }],
      reasons: ["Cursas MAT1620", "Grupo nuevo"],
    });
  });
});

describe("getSuggestedSubjects", () => {
  const sugerencia = {
    asignatura: { id: 3, sigla: "MAT1620", nombre: "Cálculo II" },
    grupos_disponibles: 2,
    motivo: null,
  };

  it("sin texto no manda q", async () => {
    const fetchMock = mockFetch([sugerencia]);

    const [subject] = await getSuggestedSubjects("  ");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/sugerencias/asignaturas");
    expect(url.search).toBe("");
    expect(subject).toEqual({
      id: 3,
      code: "MAT1620",
      name: "Cálculo II",
      openGroups: 2,
      reason: "",
    });
  });

  it("manda lo escrito, codificado", async () => {
    const fetchMock = mockFetch([]);

    await getSuggestedSubjects(" cálculo & co ");

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.searchParams.get("q")).toBe("cálculo & co");
  });
});
