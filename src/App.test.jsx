import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("App", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el mensaje del backend cuando la llamada funciona", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ message: "Hola desde el backend de Coestudia" }),
      }),
    );

    render(<App />);

    expect(screen.getByText("Conectando con el backend…")).toBeInTheDocument();
    expect(await screen.findByText("Hola desde el backend de Coestudia")).toBeInTheDocument();
    expect(screen.getByText("Backend conectado")).toBeInTheDocument();
  });

  it("muestra un error cuando el backend no responde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));

    render(<App />);

    expect(await screen.findByText("No se pudo conectar con el backend")).toBeInTheDocument();
  });
});
