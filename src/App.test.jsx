import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { filterGroups } from "./data/filters";
import { groups } from "./data/mock";

const login = () => {
  render(<App />);
  // El primero es la pestaña; el último es el botón de envío del formulario.
  fireEvent.click(screen.getAllByRole("button", { name: "Iniciar sesión" }).at(-1));
  fireEvent.click(screen.getByRole("button", { name: "Ya verifiqué mi correo" }));
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

  it("muestra el inicio de sesión, pide verificar el correo y entra al buscador", () => {
    render(<App />);
    expect(screen.getByText("¡Hola de nuevo! 👋")).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText("nombre@uc.cl"), {
      target: { value: "camila@uc.cl" },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Iniciar sesión" }).at(-1));

    expect(screen.getByRole("heading", { name: "Verifica tu correo" })).toBeInTheDocument();
    expect(screen.getByText("camila@uc.cl")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reenviar correo" }));
    expect(screen.getByText(/Te reenviamos el correo/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Ya verifiqué mi correo" }));

    expect(screen.getByRole("heading", { name: /Hola, Benjamín/ })).toBeInTheDocument();
  });

  it("busca un ramo, abre un grupo y solicita ingreso", () => {
    login();

    const input = screen.getByLabelText("Buscar asignatura");
    // Física I: el usuario aún no es integrante de ese grupo.
    fireEvent.change(input, { target: { value: "fisica" } });
    fireEvent.click(within(input.closest("form")).getByRole("button", { name: "Buscar" }));

    expect(screen.getByText("Encontramos 1 grupo")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Física I/ })[0]);
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

describe("Espacio del grupo", () => {
  beforeEach(mockFetchOk);
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const openRoom = () => {
    login();
    fireEvent.click(screen.getByRole("button", { name: "Mis grupos" }));
    fireEvent.click(screen.getByRole("tab", { name: "Participo" }));
    fireEvent.click(screen.getAllByRole("button", { name: /Cálculo II.*Abrir grupo/ })[0]);
  };

  it("muestra el asistente y los archivos del grupo", () => {
    openRoom();

    expect(screen.getByText("Espacio del grupo")).toBeInTheDocument();
    expect(screen.getByText(/Soy el asistente de estudio de Cálculo II/)).toBeInTheDocument();
    const files = screen.getByRole("complementary", { name: "Archivos del grupo" });
    expect(within(files).getByText("Guía integrales múltiples.pdf")).toBeInTheDocument();
  });

  it("responde preguntas usando los archivos y permite subir más", async () => {
    openRoom();

    fireEvent.change(screen.getByLabelText("Pregunta al asistente"), {
      target: { value: "Resume los archivos" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar" }));
    expect(screen.getByLabelText("El asistente está escribiendo")).toBeInTheDocument();
    expect(await screen.findByText(/Aquí va un resumen de los 2 archivos/, {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getByText("Fuentes:")).toBeInTheDocument();

    const file = new File(["apuntes"], "Apuntes clase 5.pdf", { type: "application/pdf" });
    fireEvent.change(screen.getByTestId("file-input"), { target: { files: [file] } });

    const files = screen.getByRole("complementary", { name: "Archivos del grupo" });
    expect(within(files).getByText("Apuntes clase 5.pdf")).toBeInTheDocument();
    expect(screen.getByText(/leí "Apuntes clase 5.pdf"/)).toBeInTheDocument();
    expect(screen.getByText("Usando 3 archivos")).toBeInTheDocument();
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
