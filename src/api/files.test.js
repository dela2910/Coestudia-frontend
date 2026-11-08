import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "./client";
import { fileProblem, MAX_FILE_BYTES, toFile, uploadFile } from "./files";

const fileOf = (name, size) => ({ name, size });

describe("fileProblem", () => {
  it("acepta documentos e imágenes sin importar mayúsculas", () => {
    expect(fileProblem(fileOf("Guía.PDF", 100))).toBeNull();
    expect(fileProblem(fileOf("foto.jpeg", 100))).toBeNull();
  });

  it("rechaza tipos no permitidos, archivos vacíos y los de más de 10 MB", () => {
    expect(fileProblem(fileOf("pagina.html", 100))).toMatch(/no se puede subir/);
    expect(fileProblem(fileOf("sin_extension", 100))).toMatch(/no se puede subir/);
    expect(fileProblem(fileOf("vacio.pdf", 0))).toMatch(/está vacío/);
    expect(fileProblem(fileOf("enorme.pdf", MAX_FILE_BYTES + 1))).toMatch(/más de 10 MB/);
  });
});

describe("toFile", () => {
  it("traduce los nombres del backend a los de las vistas", () => {
    const file = toFile({
      id: 3,
      nombre: "Guía.pdf",
      tipo_mime: "application/pdf",
      tamano_bytes: 2048,
      subido_por: "Ana Rojas",
      creado_en: "2026-11-05T15:00:00Z",
      puede_eliminar: true,
    });
    expect(file).toMatchObject({ id: 3, name: "Guía.pdf", size: 2048, uploadedBy: "Ana Rojas", canDelete: true });
    expect(file.date).toMatch(/5/);
  });
});

describe("uploadFile", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("no llama al backend si el archivo no se puede subir", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const error = await uploadFile(1, new File(["x"], "virus.exe")).catch((e) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
