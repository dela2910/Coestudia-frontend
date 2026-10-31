// Reglas de la contraseña: las mismas que valida el backend (app/schemas.py). Se usan al crear la
// cuenta y al elegir una contraseña nueva.
export const MIN_PASSWORD = 8;
// bcrypt (backend) usa solo los primeros 72 bytes
const MAX_PASSWORD_BYTES = 72;

export const PASSWORD_RULES = [
  { label: `${MIN_PASSWORD} caracteres o más`, test: (p) => p.length >= MIN_PASSWORD },
  { label: "Una mayúscula", test: (p) => p !== p.toLowerCase() },
  { label: "Una minúscula", test: (p) => p !== p.toUpperCase() },
  { label: "Un número", test: (p) => /\d/.test(p) },
];

export const passwordTooLong = (password) =>
  new TextEncoder().encode(password).length > MAX_PASSWORD_BYTES;

export const passwordIsStrong = (password) => PASSWORD_RULES.every((rule) => rule.test(password));
