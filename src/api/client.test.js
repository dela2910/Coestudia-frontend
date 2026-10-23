import { afterEach, describe, expect, it, vi } from "vitest";
import { API_URL, ApiError, request, setToken } from "./client";

const mockFetch = (status, data) => {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

describe("request", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    setToken(null);
  });

  it("envía JSON y agrega el token de sesión", async () => {
    const fetchMock = mockFetch(200, { id: 1 });
    setToken("abc");

    const data = await request("/api/grupos", { method: "POST", body: { cupo_maximo: 4 } });

    expect(data).toEqual({ id: 1 });
    expect(fetchMock).toHaveBeenCalledWith(`${API_URL}/api/grupos`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer abc" },
      body: JSON.stringify({ cupo_maximo: 4 }),
    });
  });

  it("no manda Authorization si no hay sesión", async () => {
    const fetchMock = mockFetch(200, {});
    await request("/api/hello");
    expect(fetchMock.mock.calls[0][1].headers).toEqual({});
  });

  it("lanza ApiError con el detail de FastAPI", async () => {
    mockFetch(401, { detail: "Correo o contraseña incorrectos" });
    const error = await request("/api/auth/login").catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(401);
    expect(error.message).toBe("Correo o contraseña incorrectos");
  });

  it("usa un mensaje genérico si el error no trae detail", async () => {
    mockFetch(500, null);
    await expect(request("/api/hello")).rejects.toThrow("Error 500");
  });
});
