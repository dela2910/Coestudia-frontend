import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const handlers = {};
vi.mock("web-vitals", () => {
  const register = (name) => (callback) => {
    handlers[name] = callback;
  };
  return {
    onCLS: register("CLS"),
    onFCP: register("FCP"),
    onINP: register("INP"),
    onLCP: register("LCP"),
    onTTFB: register("TTFB"),
  };
});

const { API_URL } = await import("./api/client");
const { flush, setVitalsView, startVitals, toPayload, vitalsEnabled } = await import("./vitals");

const ENDPOINT = `${API_URL}/api/metricas-web`;
const metric = (name, value, rating = "good", navigationType = "navigate") => ({
  name,
  value,
  rating,
  navigationType,
});

const hidePage = () => {
  Object.defineProperty(document, "visibilityState", { value: "hidden", configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("web vitals", () => {
  beforeEach(() => {
    startVitals();
    flush();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete navigator.sendBeacon;
    Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  });

  it("registra las cinco métricas", () => {
    expect(Object.keys(handlers).sort()).toEqual(["CLS", "FCP", "INP", "LCP", "TTFB"]);
  });

  it("arma el envío con la vista actual y redondea los valores", () => {
    setVitalsView("home");
    expect(toPayload(metric("LCP", 1834.6))).toEqual({
      nombre: "LCP",
      valor: 1835,
      calificacion: "good",
      vista: "home",
      navegacion: "navigate",
    });
    expect(toPayload(metric("CLS", 0.123456, "needs-improvement")).valor).toBe(0.1235);
    // Navegadores sin Navigation Timing no dan el tipo de navegación
    expect(toPayload({ name: "TTFB", value: 80, rating: "good" }).navegacion).toBeNull();
  });

  it("manda todo junto con sendBeacon al ocultarse la página", () => {
    const sendBeacon = vi.fn().mockReturnValue(true);
    navigator.sendBeacon = sendBeacon;
    setVitalsView("login");
    handlers.LCP(metric("LCP", 2000));
    handlers.CLS(metric("CLS", 0.01));

    hidePage();

    expect(sendBeacon).toHaveBeenCalledTimes(1);
    const [url, body] = sendBeacon.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(JSON.parse(body).map((m) => [m.nombre, m.vista])).toEqual([
      ["LCP", "login"],
      ["CLS", "login"],
    ]);

    // La cola quedó vacía: no se reenvía lo mismo
    hidePage();
    expect(sendBeacon).toHaveBeenCalledTimes(1);
  });

  it("usa fetch con keepalive si sendBeacon no está o lo rechaza", () => {
    navigator.sendBeacon = vi.fn().mockReturnValue(false);
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    handlers.INP(metric("INP", 120));

    flush();

    expect(fetchMock).toHaveBeenCalledWith(ENDPOINT, {
      method: "POST",
      body: expect.stringContaining('"nombre":"INP"'),
      keepalive: true,
    });
  });

  it("no manda nada si no hay métricas", () => {
    const sendBeacon = vi.fn();
    navigator.sendBeacon = sendBeacon;
    hidePage();
    expect(sendBeacon).not.toHaveBeenCalled();
  });

  it("se activa solo en producción o si se pide explícitamente", () => {
    expect(vitalsEnabled({ PROD: true })).toBe(true);
    expect(vitalsEnabled({ PROD: false })).toBe(false);
    expect(vitalsEnabled({ PROD: false, VITE_WEB_VITALS: "true" })).toBe(true);
  });
});
