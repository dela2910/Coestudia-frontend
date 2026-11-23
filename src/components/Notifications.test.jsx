import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { notificationTab, notificationText, timeAgo } from "../api/notifications";
import Notifications from "./Notifications";

const apiNotification = (id, tipo, fields = {}) => ({
  id: `${tipo}-${id}`,
  tipo,
  fecha: new Date(Date.now() - 5 * 60_000).toISOString(),
  grupo_id: 11,
  asignatura: "MAT1620 Cálculo II",
  persona: "Luis Castro",
  aceptada: null,
  nueva: true,
  ...fields,
});

const mockApi = (data) => {
  const fetchMock = vi.fn((url, options = {}) => {
    const post = options.method === "POST";
    return Promise.resolve({
      ok: true,
      status: post ? 204 : 200,
      json: () => Promise.resolve(post ? null : data),
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("Notifications", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("muestra cuántas hay nuevas y las marca como vistas al abrir", async () => {
    const fetchMock = mockApi({
      sin_leer: 2,
      notificaciones: [
        apiNotification(1, "solicitud_recibida"),
        apiNotification(2, "invitacion_recibida", { persona: "Ana Rojas" }),
        apiNotification(3, "solicitud_respondida", { aceptada: true, persona: null, nueva: false }),
      ],
    });
    render(<Notifications onOpen={() => {}} />);

    const bell = await screen.findByRole("button", { name: "Notificaciones (2 nuevas)" });
    fireEvent.click(bell);

    expect(screen.getByText("Luis Castro pidió unirse a tu grupo de MAT1620 Cálculo II")).toBeInTheDocument();
    expect(screen.getByText("Ana Rojas te invitó a su grupo de MAT1620 Cálculo II")).toBeInTheDocument();
    expect(screen.getByText("Te aceptaron en el grupo de MAT1620 Cálculo II")).toBeInTheDocument();
    expect(screen.getAllByText("hace 5 min")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Notificaciones" })).toBeInTheDocument();
    await waitFor(() =>
      expect(
        fetchMock.mock.calls.some(
          ([url, o]) => url.endsWith("/api/notificaciones/vistas") && o.method === "POST",
        ),
      ).toBe(true),
    );
  });

  it("no marca como vistas si no hay nuevas", async () => {
    const fetchMock = mockApi({ sin_leer: 0, notificaciones: [] });
    render(<Notifications onOpen={() => {}} />);
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Notificaciones" }));

    expect(await screen.findByText("No tienes notificaciones por ahora.")).toBeInTheDocument();
    expect(fetchMock.mock.calls.every(([, o]) => o?.method !== "POST")).toBe(true);
  });

  it("al elegir una notificación la entrega y cierra la lista", async () => {
    mockApi({ sin_leer: 0, notificaciones: [apiNotification(1, "solicitud_recibida", { nueva: false })] });
    const onOpen = vi.fn();
    render(<Notifications onOpen={onOpen} />);
    await waitFor(() => expect(fetch).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: "Notificaciones" }));
    fireEvent.click(await screen.findByText(/pidió unirse/));

    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ type: "solicitud_recibida", groupId: 11 }));
    expect(screen.queryByRole("region", { name: "Notificaciones" })).not.toBeInTheDocument();
  });

  it("se cierra con Escape", async () => {
    mockApi({ sin_leer: 0, notificaciones: [] });
    render(<Notifications onOpen={() => {}} />);
    fireEvent.click(screen.getByRole("button", { name: "Notificaciones" }));
    expect(screen.getByRole("region", { name: "Notificaciones" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("region", { name: "Notificaciones" })).not.toBeInTheDocument();
  });
});

describe("textos y destinos", () => {
  const base = { person: "Luis Castro", subject: "FIS1513 Física I" };

  it("arma el texto de cada tipo", () => {
    expect(notificationText({ ...base, type: "solicitud_respondida", accepted: false })).toBe(
      "Tu solicitud al grupo de FIS1513 Física I fue rechazada",
    );
    expect(notificationText({ ...base, type: "invitacion_respondida", accepted: true })).toBe(
      "Luis Castro aceptó tu invitación al grupo de FIS1513 Física I",
    );
    expect(
      notificationText({ ...base, person: null, type: "invitacion_respondida", accepted: false }),
    ).toBe("Tu invitado rechazó tu invitación al grupo de FIS1513 Física I");
  });

  it("lleva a la pestaña de «Mis grupos» que corresponde", () => {
    expect(notificationTab({ type: "solicitud_recibida" })).toBe("created");
    expect(notificationTab({ type: "invitacion_respondida", accepted: true })).toBe("created");
    expect(notificationTab({ type: "invitacion_recibida" })).toBe("requests");
    expect(notificationTab({ type: "solicitud_respondida", accepted: true })).toBe("participating");
    expect(notificationTab({ type: "solicitud_respondida", accepted: false })).toBe("requests");
  });

  it("muestra hace cuánto llegó", () => {
    const now = Date.parse("2026-11-22T12:00:00Z");
    expect(timeAgo("2026-11-22T11:59:40Z", now)).toBe("recién");
    expect(timeAgo("2026-11-22T09:00:00Z", now)).toBe("hace 3 h");
    expect(timeAgo("2026-11-21T11:00:00Z", now)).toBe("hace 1 día");
    expect(timeAgo("2026-11-18T12:00:00Z", now)).toBe("hace 4 días");
  });
});
