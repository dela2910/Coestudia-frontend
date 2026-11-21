import { ApiError, request } from "./client";

// Archivos compartidos en el grupo (B12). Listar y subir: /api/grupos/{id}/archivos.
// Descargar: GET /api/archivos/{id}/descarga. Eliminar: DELETE /api/archivos/{id}.

// Mismos límites que el backend (app/routers/archivos.py), para avisar sin subir el archivo
export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = [
  "pdf", "doc", "docx", "odt", "rtf",
  "ppt", "pptx", "odp",
  "xls", "xlsx", "ods", "csv",
  "txt", "md",
  "png", "jpg", "jpeg", "gif", "webp", "heic",
];

const extension = (name) => (name.includes(".") ? name.split(".").at(-1).toLowerCase() : "");

// Mensaje si el archivo no se puede subir, o null si está bien
export const fileProblem = (file) => {
  if (!ALLOWED_EXTENSIONS.includes(extension(file.name)))
    return `"${file.name}" no se puede subir: usa PDF, Word, PowerPoint, Excel, texto o imágenes.`;
  if (file.size > MAX_FILE_BYTES) return `"${file.name}" pesa más de 10 MB.`;
  if (file.size === 0) return `"${file.name}" está vacío.`;
  return null;
};

export const toFile = (archivo) => ({
  id: archivo.id,
  name: archivo.nombre,
  size: archivo.tamano_bytes,
  uploadedBy: archivo.subido_por,
  date: new Date(archivo.creado_en).toLocaleDateString("es-CL", { day: "numeric", month: "short" }),
  canDelete: archivo.puede_eliminar,
});

export const getFiles = async (groupId) =>
  (await request(`/api/grupos/${groupId}/archivos`)).map(toFile);

export async function uploadFile(groupId, file) {
  const problem = fileProblem(file);
  if (problem) throw new ApiError(422, problem);
  const body = new FormData();
  body.append("archivo", file);
  return toFile(await request(`/api/grupos/${groupId}/archivos`, { method: "POST", body }));
}

export const deleteFile = (fileId) => request(`/api/archivos/${fileId}`, { method: "DELETE" });

// La descarga necesita el token de sesión, así que no basta con un enlace: se pide el archivo y
// se guarda con un enlace temporal.
export async function downloadFile(file) {
  const blob = await request(`/api/archivos/${file.id}/descarga`, { blob: true });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  // Se libera después, para que el navegador alcance a empezar la descarga
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
