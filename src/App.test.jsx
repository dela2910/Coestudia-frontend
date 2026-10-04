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

describe("Registro", () => {
  beforeEach(mockFetchOk);
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const openRegister = () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Crear cuenta" }));
  };
  const submit = () =>
    fireEvent.click(screen.getAllByRole("button", { name: "Crear cuenta" }).at(-1));
  const fill = (label, value) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });

  it("pide carrera y año de ingreso, y deduce la universidad del correo", () => {
    openRegister();
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent("Completa todos los campos.");

    fill("Nombre completo", "Camila Pérez");
    fill(/Correo UC/, "camila@uc.cl");
    fill("Carrera", "Ingeniería Civil");
    fill("Año de ingreso", "2024");
    expect(screen.getByText("Pontificia Universidad Católica de Chile")).toBeInTheDocument();

    submit();
    expect(screen.getByRole("heading", { name: "Verifica tu correo" })).toBeInTheDocument();
  });

  it("rechaza correos de dominios no habilitados", () => {
    openRegister();
    fill("Nombre completo", "Camila Pérez");
    fill(/Correo UC/, "camila@gmail.com");
    fill("Carrera", "Ingeniería Civil");
    fill("Año de ingreso", "2024");
    submit();

    expect(screen.getByRole("alert")).toHaveTextContent("solo se aceptan correos @uc.cl");
  });
});

describe("Crear grupo", () => {
  beforeEach(mockFetchOk);
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const openCreate = () => {
    login();
    fireEvent.click(screen.getAllByRole("button", { name: /Crear grupo/ })[0]);
  };
  const publish = () => screen.getByRole("button", { name: "Publicar grupo" });

  it("reconoce una sigla existente y pide el lugar si es presencial", () => {
    openCreate();
    fireEvent.change(screen.getByLabelText(/Sigla de la asignatura/), {
      target: { value: "mat 1620" },
    });
    expect(screen.getAllByText("Cálculo II").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/Nombre del ramo/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Lun" }));
    fireEvent.click(screen.getByRole("button", { name: "Tarde" }));
    expect(publish()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Lugar/), { target: { value: "Biblioteca" } });
    expect(publish()).toBeEnabled();
    fireEvent.click(publish());
    expect(screen.getByText(/Tu grupo de Cálculo II ya está visible/)).toBeInTheDocument();
  });

  it("pide el nombre del ramo si la sigla es nueva y el enlace si es online", () => {
    openCreate();
    fireEvent.change(screen.getByLabelText(/Sigla de la asignatura/), {
      target: { value: "IIC2233" },
    });
    fireEvent.change(screen.getByLabelText(/Nombre del ramo/), {
      target: { value: "Programación Avanzada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Online" }));
    fireEvent.click(screen.getByRole("button", { name: "Mar" }));
    fireEvent.click(screen.getByRole("button", { name: "Mañana" }));
    expect(publish()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Enlace de la reunión/), {
      target: { value: "https://meet.google.com/abc" },
    });
    expect(screen.getByText("IIC2233 · Programación Avanzada")).toBeInTheDocument();
    expect(publish()).toBeEnabled();
  });
});

describe("Perfil", () => {
  beforeEach(mockFetchOk);
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("agrega asignaturas por sigla y crea las que no existen", () => {
    login();
    fireEvent.click(screen.getByRole("button", { name: "Mis grupos" }));
    expect(screen.getByText(/Ingreso 2023/)).toBeInTheDocument();
    expect(screen.getByText("MAT1620 · Cálculo II")).toBeInTheDocument();

    const code = screen.getByLabelText("Sigla de la asignatura");
    fireEvent.change(code, { target: { value: "iic2143" } });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("IIC2143 · Ingeniería de Software")).toBeInTheDocument();

    fireEvent.change(code, { target: { value: "IIC2233" } });
    expect(screen.getByRole("button", { name: "Agregar" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Nombre del ramo"), {
      target: { value: "Programación Avanzada" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agregar" }));
    expect(screen.getByText("IIC2233 · Programación Avanzada")).toBeInTheDocument();
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

  it("también encuentra grupos por sigla", () => {
    const result = filterGroups(groups, { query: "fis 1513", modality: null, days: [], blocks: [] });
    expect(result.map((g) => g.id)).toEqual([4]);
  });
});
