import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";
import { getToken, setToken } from "./api/client";

// Usuario tal como lo devuelve el backend (nombres del modelo de datos)
const apiUser = {
  id: 1,
  email: "benjamin.soto@uc.cl",
  nombre: "Benjamín Soto",
  universidad: "Pontificia Universidad Católica de Chile",
  carrera: "Ingeniería Civil Informática",
  anio_ingreso: 2023,
  email_verificado_en: "2026-10-01T12:00:00Z",
};
const session = { access_token: "jwt-de-prueba", token_type: "bearer", usuario: apiUser };

// Grupos tal como los devuelve GET /api/grupos
const apiGroup = (id, sigla, nombre, fields = {}) => ({
  id,
  asignatura: { id, sigla, nombre },
  descripcion: "Repaso para el certamen.",
  es_online: false,
  cupo_maximo: 4,
  miembros: 2,
  abierto: true,
  vigente_hasta: "2026-12-04",
  horarios: [{ dia_semana: 1, es_manana: false }],
  ...fields,
});
const apiGroups = [
  apiGroup(11, "MAT1620", "Cálculo II"),
  apiGroup(12, "FIS1513", "Física I", { es_online: true }),
  apiGroup(13, "MAT1620", "Cálculo II", { miembros: 2, abierto: false }),
];

// Búsqueda simulada: filtra por el texto de ?q= (el backend también ignora tildes)
const searchRoute = (options, url) => {
  const q = (new URL(url).searchParams.get("q") ?? "").toLowerCase();
  const plain = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const matches = (g) =>
    plain(g.asignatura.nombre).includes(plain(q)) || g.asignatura.sigla.toLowerCase().includes(q);
  return [200, apiGroups.filter(matches)];
};

const DEFAULT_ROUTES = {
  "GET /api/hello": () => [200, { message: "Hola desde el backend de Coestudia" }],
  "POST /api/auth/login": () => [200, session],
  "POST /api/auth/registro": () => [201, { ...apiUser, email_verificado_en: null }],
  "POST /api/auth/verificar": () => [200, session],
  "POST /api/auth/reenviar-verificacion": () => [202, { message: "ok" }],
  "GET /api/auth/me": () => [200, apiUser],
  "GET /api/grupos": searchRoute,
};

// Simula el backend: cada ruta "MÉTODO /ruta" responde [status, json]. Devuelve el mock de fetch.
const mockApi = (routes = {}) => {
  const handlers = { ...DEFAULT_ROUTES, ...routes };
  const fetchMock = vi.fn((url, options = {}) => {
    const key = `${options.method ?? "GET"} ${new URL(url).pathname}`;
    const [status, data] = handlers[key]?.(options, url) ?? [404, { detail: "No existe" }];
    return Promise.resolve({ ok: status < 300, status, json: () => Promise.resolve(data) });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
};

const fillLogin = (email = apiUser.email, password = "clave-segura-1") => {
  fireEvent.change(screen.getByPlaceholderText("nombre@uc.cl"), { target: { value: email } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: password } });
  // El primero es la pestaña; el último es el botón de envío del formulario.
  fireEvent.click(screen.getAllByRole("button", { name: "Iniciar sesión" }).at(-1));
};

const login = async () => {
  render(<App />);
  fillLogin();
  await screen.findByRole("heading", { name: /Hola, Benjamín/ });
};

afterEach(() => {
  vi.unstubAllGlobals();
  setToken(null);
  window.history.replaceState(null, "", "/");
});

describe("Conexión con el backend", () => {
  it("muestra el mensaje del backend cuando la llamada funciona", async () => {
    mockApi();
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
  beforeEach(() => {
    mockApi();
  });

  it("inicia sesión, guarda el token y entra al buscador", async () => {
    await login();
    expect(getToken()).toBe("jwt-de-prueba");
  });

  it("busca un ramo, abre un grupo y solicita ingreso", async () => {
    await login();

    const input = screen.getByLabelText("Buscar asignatura");
    // Física I: el usuario aún no es integrante de ese grupo.
    fireEvent.change(input, { target: { value: "fisica" } });
    fireEvent.click(within(input.closest("form")).getByRole("button", { name: "Buscar" }));

    expect(await screen.findByText("Encontramos 1 grupo")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Física I/ })[0]);
    fireEvent.click(screen.getByRole("button", { name: "Solicitar ingreso" }));

    expect(screen.getByText(/Solicitud enviada/)).toBeInTheDocument();
  });

  it("permite aceptar solicitudes en Mis grupos", async () => {
    await login();
    fireEvent.click(screen.getByRole("button", { name: "Mis grupos" }));

    expect(screen.getByText("2 solicitudes pendientes")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Aceptar" })[0]);

    expect(screen.getByText("Aceptado")).toBeInTheDocument();
    expect(screen.getByText("1 solicitud pendiente")).toBeInTheDocument();
  });
});

describe("Registro", () => {
  const openRegister = () => {
    render(<App />);
    fireEvent.click(screen.getByRole("tab", { name: "Crear cuenta" }));
  };
  const submit = () =>
    fireEvent.click(screen.getAllByRole("button", { name: "Crear cuenta" }).at(-1));
  const fill = (label, value) =>
    fireEvent.change(screen.getByLabelText(label), { target: { value } });
  const fillForm = (email = "camila@uc.cl") => {
    fill("Nombre completo", "Camila Pérez");
    fill(/Correo UC/, email);
    fill("Carrera", "Ingeniería Civil");
    fill("Año de ingreso", "2024");
    fill("Contraseña", "Clave-segura-1");
  };

  it("pide todos los datos, deduce la universidad y exige aceptar los términos", async () => {
    const fetchMock = mockApi();
    openRegister();
    submit();
    expect(screen.getByRole("alert")).toHaveTextContent("Completa todos los campos.");

    fillForm();
    expect(screen.getByText("Pontificia Universidad Católica de Chile")).toBeInTheDocument();

    submit();
    expect(screen.getByRole("alert")).toHaveTextContent("Debes aceptar los términos");

    fireEvent.click(screen.getByLabelText(/Acepto los términos y condiciones/));
    submit();
    expect(await screen.findByRole("heading", { name: "Verifica tu correo" })).toBeInTheDocument();
    expect(screen.getByText("camila@uc.cl")).toBeInTheDocument();

    const [, options] = fetchMock.mock.calls.find(([url]) => url.endsWith("/api/auth/registro"));
    expect(JSON.parse(options.body)).toEqual({
      email: "camila@uc.cl",
      password: "Clave-segura-1",
      nombre: "Camila Pérez",
      carrera: "Ingeniería Civil",
      anio_ingreso: 2024,
      acepta_terminos: true,
    });
  });

  it("permite corregir el correo sin volver a llenar el registro", async () => {
    const fetchMock = mockApi();
    openRegister();
    fillForm("camila@uc.cl");
    fireEvent.click(screen.getByLabelText(/Acepto los términos y condiciones/));
    submit();
    await screen.findByRole("heading", { name: "Verifica tu correo" });

    fireEvent.click(screen.getByRole("button", { name: "Corregir el correo" }));

    expect(screen.getByRole("heading", { name: "Crea tu cuenta" })).toBeInTheDocument();
    expect(screen.getByLabelText("Nombre completo")).toHaveValue("Camila Pérez");
    expect(screen.getByLabelText("Carrera")).toHaveValue("Ingeniería Civil");
    expect(screen.getByLabelText("Año de ingreso")).toHaveValue(2024);
    // El correo y la contraseña se vuelven a escribir
    expect(screen.getByLabelText(/Correo UC/)).toHaveValue("");
    expect(screen.getByLabelText("Contraseña")).toHaveValue("");

    fill(/Correo UC/, "camila.perez@uc.cl");
    fill("Contraseña", "Clave-segura-1");
    fireEvent.click(screen.getByLabelText(/Acepto los términos y condiciones/));
    submit();
    expect(await screen.findByText("camila.perez@uc.cl")).toBeInTheDocument();
    const registers = fetchMock.mock.calls.filter(([url]) => url.endsWith("/api/auth/registro"));
    expect(JSON.parse(registers[1][1].body).email).toBe("camila.perez@uc.cl");
  });

  it("rechaza correos de dominios no habilitados", () => {
    mockApi();
    openRegister();
    fillForm("camila@gmail.com");
    submit();

    expect(screen.getByRole("alert")).toHaveTextContent("solo se aceptan correos @uc.cl");
  });

  it.each(["Corta1", "sin-mayuscula-1", "SIN-MINUSCULA-1", "Sin-numero"])(
    "rechaza la contraseña débil %s",
    (password) => {
      mockApi();
      openRegister();
      fillForm();
      fill("Contraseña", password);
      submit();

      expect(screen.getByRole("alert")).toHaveTextContent("cumplir todos los requisitos");
    },
  );

  it("marca los requisitos de la contraseña a medida que se cumplen", () => {
    mockApi();
    openRegister();
    const rules = screen.getByRole("list", { name: "Requisitos de la contraseña" });
    const ok = () => within(rules).getAllByRole("listitem").filter((li) => li.className === "rule-ok");

    expect(ok()).toHaveLength(0);
    fill("Contraseña", "abc");
    expect(ok().map((li) => li.textContent)).toEqual(["Una minúscula"]);
    fill("Contraseña", "Abcdefg1");
    expect(ok()).toHaveLength(4);
  });

  it("muestra el error del backend si el correo ya tiene cuenta", async () => {
    mockApi({
      "POST /api/auth/registro": () => [409, { detail: "Ya existe una cuenta con ese correo." }],
    });
    openRegister();
    fillForm();
    fireEvent.click(screen.getByLabelText(/Acepto los términos y condiciones/));
    submit();

    expect(await screen.findByRole("alert")).toHaveTextContent("Ya existe una cuenta");
  });

  it("no muestra la casilla de términos al iniciar sesión", () => {
    mockApi();
    render(<App />);
    expect(screen.queryByLabelText(/Acepto los términos/)).not.toBeInTheDocument();
  });
});

describe("Inicio de sesión y verificación", () => {
  it("muestra el error si la contraseña es incorrecta", async () => {
    mockApi({
      "POST /api/auth/login": () => [401, { detail: "Correo o contraseña incorrectos." }],
    });
    render(<App />);
    fillLogin(apiUser.email, "otra-clave");

    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
    expect(getToken()).toBeNull();
  });

  it("avisa cuando hay demasiados intentos fallidos", async () => {
    mockApi({
      "POST /api/auth/login": () => [
        429,
        { detail: "Demasiados intentos fallidos. Intenta de nuevo en 15 minutos." },
      ],
    });
    render(<App />);
    fillLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent("Demasiados intentos fallidos");
  });

  it("no envía contraseñas de más de 72 caracteres", () => {
    const fetchMock = mockApi();
    render(<App />);
    fillLogin(apiUser.email, "x".repeat(100));

    expect(screen.getByRole("alert")).toHaveTextContent("demasiado larga");
    expect(fetchMock.mock.calls.some(([url]) => url.endsWith("/api/auth/login"))).toBe(false);
  });

  it("pide verificar el correo si la cuenta no está verificada y permite reenviarlo", async () => {
    const fetchMock = mockApi({
      "POST /api/auth/login": () => [403, { detail: "Debes verificar tu correo." }],
    });
    render(<App />);
    fillLogin("camila@uc.cl");

    expect(await screen.findByRole("heading", { name: "Verifica tu correo" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reenviar correo" }));
    expect(await screen.findByText(/Te reenviamos el correo/)).toBeInTheDocument();
    const resend = fetchMock.mock.calls.find(([url]) => url.endsWith("/reenviar-verificacion"));
    expect(JSON.parse(resend[1].body)).toEqual({ email: "camila@uc.cl" });

    fireEvent.click(screen.getByRole("button", { name: "Ya verifiqué mi correo" }));
    expect(screen.getByText("¡Hola de nuevo! 👋")).toBeInTheDocument();
  });

  it("si viene del inicio de sesión, usar otro correo vuelve al inicio de sesión", async () => {
    mockApi({ "POST /api/auth/login": () => [403, { detail: "Debes verificar tu correo." }] });
    render(<App />);
    fillLogin("camila@uc.cl");
    await screen.findByRole("heading", { name: "Verifica tu correo" });

    fireEvent.click(screen.getByRole("button", { name: "Usar otro correo" }));
    expect(screen.getByText("¡Hola de nuevo! 👋")).toBeInTheDocument();
  });

  it("avisa si no hay conexión con el servidor", async () => {
    mockApi();
    const failing = vi.fn((url) =>
      url.endsWith("/api/hello")
        ? Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({}) })
        : Promise.reject(new TypeError("Failed to fetch")),
    );
    vi.stubGlobal("fetch", failing);
    render(<App />);
    fillLogin();

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos conectar");
  });

  it("verifica el correo con el enlace y entra con la sesión iniciada", async () => {
    const fetchMock = mockApi();
    window.history.replaceState(null, "", "/?verificar=token-del-correo");
    render(<App />);

    expect(await screen.findByRole("heading", { name: /Hola, Benjamín/ })).toBeInTheDocument();
    const verify = fetchMock.mock.calls.find(([url]) => url.endsWith("/api/auth/verificar"));
    expect(JSON.parse(verify[1].body)).toEqual({ token: "token-del-correo" });
    expect(getToken()).toBe("jwt-de-prueba");
    // El token se saca de la URL
    expect(window.location.search).toBe("");
  });

  it("muestra el error si el enlace de verificación expiró", async () => {
    mockApi({
      "POST /api/auth/verificar": () => [400, { detail: "El enlace ya expiró. Pide uno nuevo." }],
    });
    window.history.replaceState(null, "", "/?verificar=viejo");
    render(<App />);

    expect(await screen.findByRole("alert")).toHaveTextContent("El enlace ya expiró");
  });

  it("recupera la sesión guardada al recargar", async () => {
    const fetchMock = mockApi();
    setToken("jwt-guardado");
    render(<App />);

    expect(await screen.findByRole("heading", { name: /Hola, Benjamín/ })).toBeInTheDocument();
    const me = fetchMock.mock.calls.find(([url]) => url.endsWith("/api/auth/me"));
    expect(me[1].headers.Authorization).toBe("Bearer jwt-guardado");
  });

  it("vuelve al login si la sesión guardada ya no sirve", async () => {
    mockApi({ "GET /api/auth/me": () => [401, { detail: "Debes iniciar sesión." }] });
    setToken("jwt-vencido");
    render(<App />);

    expect(await screen.findByText("¡Hola de nuevo! 👋")).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });

  it("cerrar sesión borra el token", async () => {
    mockApi();
    await login();
    fireEvent.click(screen.getByRole("button", { name: "Mis grupos" }));
    fireEvent.click(screen.getByRole("button", { name: /Cerrar sesión/ }));

    expect(screen.getByText("¡Hola de nuevo! 👋")).toBeInTheDocument();
    expect(getToken()).toBeNull();
  });
});

describe("Crear grupo", () => {
  beforeEach(() => {
    mockApi();
  });

  const openCreate = async () => {
    await login();
    fireEvent.click(screen.getAllByRole("button", { name: /Crear grupo/ })[0]);
  };
  const publish = () => screen.getByRole("button", { name: "Publicar grupo" });
  const setValidUntil = (value) =>
    fireEvent.change(screen.getByLabelText(/Vigente hasta/), { target: { value } });

  it("reconoce una sigla existente y pide el lugar si es presencial", async () => {
    await openCreate();
    fireEvent.change(screen.getByLabelText(/Sigla de la asignatura/), {
      target: { value: "mat 1620" },
    });
    expect(screen.getAllByText("Cálculo II").length).toBeGreaterThan(0);
    expect(screen.queryByLabelText(/Nombre del ramo/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Lun" }));
    fireEvent.click(screen.getByRole("button", { name: "Tarde" }));
    expect(publish()).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/Lugar/), { target: { value: "Biblioteca" } });
    // Sin fecha de vigencia no se puede publicar
    expect(publish()).toBeDisabled();
    setValidUntil("2099-12-01");
    expect(publish()).toBeEnabled();
    fireEvent.click(publish());
    expect(screen.getByText(/Tu grupo de Cálculo II ya está visible/)).toBeInTheDocument();
  });

  it("pide el nombre del ramo si la sigla es nueva y el enlace si es online", async () => {
    await openCreate();
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
    setValidUntil("2099-12-01");
    expect(screen.getByText("IIC2233 · Programación Avanzada")).toBeInTheDocument();
    expect(publish()).toBeEnabled();
  });

  it("no acepta una fecha de vigencia pasada", async () => {
    await openCreate();
    fireEvent.change(screen.getByLabelText(/Sigla de la asignatura/), {
      target: { value: "MAT1620" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Lun" }));
    fireEvent.click(screen.getByRole("button", { name: "Tarde" }));
    fireEvent.change(screen.getByLabelText(/Lugar/), { target: { value: "Biblioteca" } });

    setValidUntil("2020-01-01");
    expect(publish()).toBeDisabled();
  });
});

describe("Perfil", () => {
  beforeEach(() => {
    mockApi();
  });

  it("agrega asignaturas por sigla y crea las que no existen", async () => {
    await login();
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
  beforeEach(() => {
    mockApi();
  });

  const openRoom = async () => {
    await login();
    fireEvent.click(screen.getByRole("button", { name: "Mis grupos" }));
    fireEvent.click(screen.getByRole("tab", { name: "Participo" }));
    fireEvent.click(screen.getAllByRole("button", { name: /Cálculo II.*Abrir grupo/ })[0]);
  };

  it("muestra el asistente y los archivos del grupo", async () => {
    await openRoom();

    expect(screen.getByText("Espacio del grupo")).toBeInTheDocument();
    expect(screen.getByText(/Soy el asistente de estudio de Cálculo II/)).toBeInTheDocument();
    const files = screen.getByRole("complementary", { name: "Archivos del grupo" });
    expect(within(files).getByText("Guía integrales múltiples.pdf")).toBeInTheDocument();
  });

  it("responde preguntas usando los archivos y permite subir más", async () => {
    await openRoom();

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

describe("Buscador", () => {
  const searchFor = (text) => {
    const input = screen.getByLabelText("Buscar asignatura");
    fireEvent.change(input, { target: { value: text } });
    fireEvent.click(within(input.closest("form")).getByRole("button", { name: "Buscar" }));
  };
  const searchUrl = (fetchMock) =>
    new URL(fetchMock.mock.calls.findLast(([url]) => url.includes("/api/grupos"))[0]);

  it("manda los filtros al backend", async () => {
    const fetchMock = mockApi();
    await login();

    fireEvent.click(screen.getByRole("button", { name: "Online" }));
    fireEvent.click(screen.getByRole("button", { name: "Lun" }));
    fireEvent.click(screen.getByRole("button", { name: "Mié" }));
    fireEvent.click(screen.getByRole("button", { name: "Mañana" }));
    searchFor("  calculo ");
    await screen.findByText(/Encontramos/);

    const params = searchUrl(fetchMock).searchParams;
    expect(params.get("q")).toBe("calculo");
    expect(params.get("es_online")).toBe("true");
    expect(params.getAll("dia")).toEqual(["0", "2"]);
    expect(params.getAll("es_manana")).toEqual(["true"]);
  });

  it("sin filtros no manda parámetros", async () => {
    const fetchMock = mockApi();
    await login();
    searchFor("");
    await screen.findByText(/Encontramos/);

    expect(searchUrl(fetchMock).search).toBe("");
  });

  it("muestra los grupos cerrados como cerrados aunque tengan cupo", async () => {
    mockApi();
    await login();
    searchFor("calculo");

    expect(await screen.findByText("Encontramos 2 grupos")).toBeInTheDocument();
    expect(screen.getByText("Cerrado")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: /Cálculo II/ })[1]);
    expect(screen.getByRole("button", { name: "Grupo cerrado" })).toBeDisabled();
  });

  it("abre el detalle con los datos de la búsqueda", async () => {
    mockApi();
    await login();
    searchFor("calculo");
    await screen.findByText("Encontramos 2 grupos");

    fireEvent.click(screen.getAllByRole("button", { name: /Cálculo II/ })[0]);
    expect(screen.getByRole("heading", { name: "Cálculo II" })).toBeInTheDocument();
    expect(screen.getByText("Repaso para el certamen.")).toBeInTheDocument();
    expect(screen.getByText("Integrantes (2/4)")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Solicitar ingreso" })).toBeEnabled();
  });

  it("muestra el estado vacío si no hay resultados", async () => {
    mockApi();
    await login();
    searchFor("química");

    expect(await screen.findByText("Aún no hay grupos con esos filtros")).toBeInTheDocument();
  });

  it("muestra el error y permite reintentar", async () => {
    let fail = true;
    mockApi({
      "GET /api/grupos": () => (fail ? [500, { detail: "Error interno" }] : [200, apiGroups]),
    });
    await login();
    searchFor("");

    expect(await screen.findByText("Error interno")).toBeInTheDocument();
    fail = false;
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(await screen.findByText("Encontramos 3 grupos")).toBeInTheDocument();
  });
});
