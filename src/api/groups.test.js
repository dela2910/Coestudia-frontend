import { afterEach, describe, expect, it, vi } from "vitest";
import {
  requestToJoin,
  searchGroups,
  toGroup,
  toGroupDetail,
  toMyGroup,
  toMyRequest,
} from "./groups";

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

describe("toGroupDetail", () => {
  it("deja la carrera vacía si el integrante no la tiene", () => {
    const detail = toGroupDetail({
      ...grupo,
      creador: "Ana",
      integrantes: [{ id: 1, nombre: "Ana", carrera: null, es_creador: true }],
      es_miembro: false,
      solicitud_pendiente: true,
      lugar: null,
      enlace: null,
    });
    expect(detail.integrants).toEqual([{ id: 1, name: "Ana", career: "", isOwner: true }]);
    expect(detail.pendingRequest).toBe(true);
  });
});

describe("toMyGroup", () => {
  it("traduce las solicitudes pendientes", () => {
    const mine = toMyGroup({
      ...grupo,
      es_creador: true,
      lugar: null,
      enlace: "https://meet.google.com/abc",
      solicitudes: [
        {
          id: 5,
          usuario: { id: 9, nombre: "Luis", carrera: null },
          mensaje: null,
          creada_en: "2026-10-29T12:00:00Z",
        },
      ],
    });
    expect(mine).toMatchObject({ isOwner: true, place: null, link: "https://meet.google.com/abc" });
    expect(mine.requests).toEqual([{ id: 5, name: "Luis", career: "", message: "" }]);
  });
});

describe("requestToJoin", () => {
  afterEach(() => vi.unstubAllGlobals());

  const detail = {
    ...grupo,
    creador: "Ana",
    integrantes: [],
    es_miembro: false,
    solicitud_pendiente: true,
    lugar: null,
    enlace: null,
  };

  it.each([
    ["  Voy atrasado  ", { mensaje: "Voy atrasado" }],
    ["   ", {}],
    [undefined, {}],
  ])("manda el mensaje solo si tiene texto (%j)", async (message, body) => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: () => Promise.resolve(detail),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await requestToJoin(7, message);

    expect(new URL(fetchMock.mock.calls[0][0]).pathname).toBe("/api/grupos/7/solicitudes");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual(body);
    expect(result.pendingRequest).toBe(true);
  });
});

describe("toMyRequest", () => {
  it("traduce la solicitud y su grupo", () => {
    expect(
      toMyRequest({
        id: 3,
        estado: "rechazada",
        mensaje: null,
        creada_en: "2026-10-29T15:00:00Z",
        respondida_en: "2026-10-29T18:00:00Z",
        grupo,
      }),
    ).toEqual({
      id: 3,
      status: "rechazada",
      message: "",
      sentAt: "2026-10-29T15:00:00Z",
      answeredAt: "2026-10-29T18:00:00Z",
      group: toGroup(grupo),
    });
  });
});
