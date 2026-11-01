// La universidad no la elige el usuario: se deduce del dominio de su correo.
// Por ahora solo está habilitada la UC; sumar otra es agregar una línea aquí (y en el backend).
export const UNIVERSITIES_BY_DOMAIN = {
  "uc.cl": "Pontificia Universidad Católica de Chile",
};

export function universityFromEmail(email) {
  const domain = email.trim().toLowerCase().split("@")[1];
  return UNIVERSITIES_BY_DOMAIN[domain] ?? null;
}
