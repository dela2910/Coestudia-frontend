import { toUser } from "./auth";
import { request } from "./client";

// Perfil académico y «mis asignaturas» (B03). Endpoints en /api/perfil y /api/asignaturas.

// El backend usa los nombres del modelo de datos; las vistas usan los de src/data/subjects.js.
export const toSubject = (asignatura) => ({
  id: asignatura.id,
  code: asignatura.sigla,
  name: asignatura.nombre,
});

export const updateProfile = async ({ name, career, entryYear }) =>
  toUser(
    await request("/api/perfil", {
      method: "PUT",
      body: { nombre: name, carrera: career, anio_ingreso: Number(entryYear) },
    }),
  );

export const getMySubjects = async () => (await request("/api/perfil/asignaturas")).map(toSubject);

// Si la sigla no existe en la universidad, el backend la crea con este nombre.
// Sin nombre y con una sigla nueva responde 404.
export const addMySubject = async (code, name = "") =>
  toSubject(
    await request("/api/perfil/asignaturas", {
      method: "POST",
      body: name.trim() ? { sigla: code, nombre: name.trim() } : { sigla: code },
    }),
  );

export const removeMySubject = (id) =>
  request(`/api/perfil/asignaturas/${id}`, { method: "DELETE" });

// Asignaturas que ya existen en la universidad del usuario (para autocompletar la sigla).
export const getSubjectCatalog = async () => (await request("/api/asignaturas")).map(toSubject);
