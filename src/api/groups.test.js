import { afterEach, describe, expect, it, vi } from "vitest";
import { searchGroups, toGroup } from "./groups";

const grupo = {
  id: 7,
  asignatura: { id: 3, sigla: "MAT1620", nombre: "Cálculo II" },
  descripcion: null,
  es_online: true,
  cupo_maximo: 5,
  miembros: 2,
  abierto: true,
  vigente_hasta: "2026-12-04",
  horarios: [
    { dia_semana: 0, es_manana: true },
    { dia_semana: 2, es_manana: false },
  ],
};

describe("toGroup", () => {
  it("traduce los nombres del backend a los de las vistas", () => {
    expect(toGroup(grupo)).toEqual({
      id: 7,
      code: "MAT1620",
      subject: "Cálculo II",
      description: "",
      isOnline: true,
      capacity: 5,
      members: 2,
      isOpen: true,
      validUntil: "2026-12-04",
      schedule: [
        { day: 0, isMorning: true },
        { day: 2, isMorning: false },
      ],
    });
  });
});

describe("searchGroups", () => {
  afterEach(() => vi.unstubAllGlobals());

  const mockFetch = () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve([grupo]),
    });
    vi.stubGlobal("fetch", fetchMock);
    return fetchMock;
  };

  it("arma la consulta con los filtros", async () => {
    const fetchMock = mockFetch();
    const result = await searchGroups({
      query: " fis 1513 ",
      isOnline: false,
      days: [1, 3],
      blocks: [true, false],
    });

    const url = new URL(fetchMock.mock.calls[0][0]);
    expect(url.pathname).toBe("/api/grupos");
    expect(url.searchParams.get("q")).toBe("fis 1513");
    expect(url.searchParams.get("es_online")).toBe("false");
    expect(url.searchParams.getAll("dia")).toEqual(["1", "3"]);
    expect(url.searchParams.getAll("es_manana")).toEqual(["true", "false"]);
    expect(result[0].code).toBe("MAT1620");
  });

  it("omite los filtros vacíos", async () => {
    const fetchMock = mockFetch();
    await searchGroups({ query: "  ", isOnline: null, days: [], blocks: [] });
    expect(fetchMock.mock.calls[0][0]).toMatch(/\/api\/grupos$/);
  });
});
