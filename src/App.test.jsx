import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { filterGroups } from "./data/filters";
import { groups } from "./data/mock";

const login = () => {
  render(<App />);
  // El primero es la pestaña; el último es el botón de envío del formulario.
  fireEvent.click(screen.getAllByRole("button", { name: "Iniciar sesión" }).at(-1));
};

const mockFetchOk = () =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: "Hola desde el backend de Coestudia" }),
    }),
  );

describe("Conexión con el backend", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el mensaje del backend cuando la llamada funciona", async () => {
    mockFetchOk();
    render(<App />);

    expect(screen.getByText("Conectando con el backend…")).toBeInTheDocument();
    expect(await screen.findByText(/Hola desde el backend de Coestudia/)).toBeInTheDocument();
    expect(screen.getByText("Backend conectado")).toBeInTheDocument();
  });

  it("muestra un error cuando el backend no responde", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
    render(<App />);

    expect(await screen.findByText("No se pudo conectar con el backend")).toBeInTheDocument();
  });
});

describe("App", () => {
  beforeEach(mockFetchOk);
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("muestra el inicio de sesión y entra al buscador", () => {
    render(<App />);
    expect(screen.getByText("¡Hola de nuevo! 👋")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "Iniciar sesión" }).at(-1));

    expect(screen.getByRole("heading", { name: /Hola, Benjamín/ })).toBeInTheDocument();
  });

  it("busca un ramo, abre un grupo y solicita ingreso", () => {
    login();

    const input = screen.getByLabelText("Buscar asignatura");
    fireEvent.change(input, { target: { value: "calculo" } });
    fireEvent.click(within(input.closest("form")).getByRole("button", { name: "Buscar" }));

    expect(screen.getByText("Encontramos 3 grupos")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Cálculo II/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Solicitar ingreso" }));

    expect(screen.getByText(/Solicitud enviada/)).toBeInTheDocument();
  });

  it("permite aceptar solicitudes en Mis grupos", () => {
    login();
    fireEvent.click(screen.getByRole("button", { name: "Mis grupos" }));

    expect(screen.getByText("2 solicitudes pendientes")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Aceptar" })[0]);

    expect(screen.getByText("Aceptado")).toBeInTheDocument();
    expect(screen.getByText("1 solicitud pendiente")).toBeInTheDocument();
  });
});

describe("filterGroups", () => {
  it("filtra por ramo sin importar tildes, modalidad y día", () => {
    const result = filterGroups(groups, {
      query: "CALCULO",
      modality: "online",
      days: ["J"],
      blocks: [],
    });
    expect(result.map((g) => g.id)).toEqual([2]);
  });
});
