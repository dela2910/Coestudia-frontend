// Datos de ejemplo para las maquetas. No se conectan a ningún endpoint.
// Tienen la misma forma que el modelo de datos del backend, para que al conectar cada vista a la
// API solo haya que reemplazar estos datos por la respuesta.

// HORARIO_GRUPO.dia_semana: 0 = lunes ... 5 = sábado
export const DAYS = [
  { id: 0, label: "Lun" },
  { id: 1, label: "Mar" },
  { id: 2, label: "Mié" },
  { id: 3, label: "Jue" },
  { id: 4, label: "Vie" },
  { id: 5, label: "Sáb" },
];

// GRUPO_ESTUDIO.es_online
export const MODALITIES = [
  { id: false, label: "Presencial" },
  { id: true, label: "Online" },
];

// Asignaturas que ya existen. En el backend no se cargan de antemano: se crean la primera vez
// que alguien arma un grupo de ese ramo o lo agrega a su perfil ("buscar o crear" por sigla).
export const subjects = [
  { code: "MAT1620", name: "Cálculo II" },
  { code: "FIS1513", name: "Física I" },
  { code: "MAT1203", name: "Álgebra" },
  { code: "IIC2143", name: "Ingeniería de Software" },
];

export const currentUser = {
  name: "Benjamín Soto",
  email: "benjamin.soto@uc.cl",
  university: "Pontificia Universidad Católica de Chile",
  career: "Ingeniería Civil Informática",
  entryYear: 2023,
  // Siglas de las asignaturas que cursa (en el backend, tabla USUARIO_ASIGNATURA).
  subjects: ["MAT1620", "FIS1513", "MAT1203"],
};

export const groups = [
  {
    id: 1,
    code: "MAT1620",
    subject: "Cálculo II",
    isOnline: false,
    schedule: [{ day: 1, start: "15:00", end: "17:00" }],
    members: 3,
    capacity: 5,
    place: "Biblioteca central, sala 2",
    validUntil: "2026-11-27",
    description:
      "Repasamos integrales múltiples y series antes del certamen. Traer guía de ejercicios resuelta hasta la parte 3.",
    owner: "Ana",
    integrants: [
      { name: "Ana", career: "Ing. Civil" },
      { name: "Luis", career: "Ing. Comercial" },
      { name: "Sofía", career: "Ing. Civil Industrial" },
    ],
  },
  {
    id: 2,
    code: "MAT1620",
    subject: "Cálculo II",
    isOnline: true,
    schedule: [{ day: 3, start: "09:00", end: "11:00" }],
    members: 2,
    capacity: 4,
    link: "https://meet.google.com/abc-defg-hij",
    validUntil: "2026-12-04",
    description: "Sesiones cortas de 1 hora resolviendo ejercicios de controles anteriores.",
    owner: "Matías",
    integrants: [
      { name: "Matías", career: "Ing. Civil Eléctrica" },
      { name: "Camila", career: "Geología" },
    ],
  },
  {
    id: 3,
    code: "MAT1620",
    subject: "Cálculo II",
    isOnline: false,
    schedule: [{ day: 5, start: "09:00", end: "11:00" }],
    members: 5,
    capacity: 5,
    place: "Sala de estudio Facultad de Ingeniería",
    validUntil: "2026-11-28",
    description: "Grupo intensivo de fin de semana.",
    owner: "Diego",
    integrants: [
      { name: "Diego", career: "Ing. Civil" },
      { name: "Valentina", career: "Ing. Civil Química" },
      { name: "Tomás", career: "Ing. Civil Informática" },
      { name: "Isidora", career: "Ing. Comercial" },
      { name: "Joaquín", career: "Ing. Civil Mecánica" },
    ],
  },
  {
    id: 4,
    code: "FIS1513",
    subject: "Física I",
    isOnline: true,
    schedule: [{ day: 0, start: "15:00", end: "17:00" }],
    members: 1,
    capacity: 4,
    link: "https://discord.gg/fisica1513",
    validUntil: "2026-12-11",
    description: "Dinámica y trabajo-energía. Nos juntamos a hacer la tarea semanal.",
    owner: "Fernanda",
    integrants: [{ name: "Fernanda", career: "Física" }],
  },
  {
    id: 5,
    code: "MAT1203",
    subject: "Álgebra",
    isOnline: false,
    schedule: [{ day: 2, start: "09:00", end: "11:00" }],
    members: 2,
    capacity: 6,
    place: "Casino central",
    validUntil: "2026-12-04",
    description: "Matrices, determinantes y espacios vectoriales.",
    owner: "Benjamín",
    integrants: [
      { name: "Benjamín", career: "Ing. Civil Informática" },
      { name: "Rocío", career: "Ing. Civil" },
    ],
  },
];

// Grupos del usuario actual para la vista "Mis grupos"
export const myGroups = {
  created: [
    {
      groupId: 5,
      requests: [
        { id: 101, name: "Pedro Rojas", career: "Ing. Civil Industrial" },
        { id: 102, name: "Javiera Muñoz", career: "Ing. Civil Biomédica" },
      ],
    },
  ],
  participating: [1, 2],
};

export const dayLabel = (id) => DAYS.find((d) => d.id === id)?.label ?? id;
const DAY_NAMES = ["lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
export const dayName = (id) => DAY_NAMES[id] ?? id;
export const modalityLabel = (isOnline) => (isOnline ? "Online" : "Presencial");

// HORARIO_GRUPO: día con hora de inicio y fin ("HH:MM"). Ordena por día y hora.
export const sortSchedule = (schedule) =>
  [...schedule].sort((a, b) => a.day - b.day || a.start.localeCompare(b.start));

// Resume los horarios de un grupo juntando los días con las mismas horas,
// ej. "Lun, Mié 10:00–11:30 · Jue 15:30–17:00"
export const scheduleLabel = (schedule) => {
  const byHours = new Map();
  for (const h of sortSchedule(schedule)) {
    const hours = `${h.start}–${h.end}`;
    byHours.set(hours, [...(byHours.get(hours) ?? []), h.day]);
  }
  return [...byHours]
    .map(([hours, days]) => `${[...new Set(days)].map(dayLabel).join(", ")} ${hours}`)
    .join(" · ");
};

// Primer problema de los horarios del formulario, o "" si están bien. Son las mismas reglas
// del backend: cada horario completo, el fin después del inicio y sin cruces el mismo día
// (uno puede empezar justo cuando termina el otro).
export const scheduleError = (schedule) => {
  if (schedule.length === 0) return "Agrega al menos un horario.";
  if (schedule.some((h) => !h.start || !h.end)) return "Completa la hora de inicio y de fin.";
  const bad = schedule.find((h) => h.end <= h.start);
  if (bad) return `El horario del ${dayName(bad.day)} debe terminar después de empezar.`;
  const sorted = sortSchedule(schedule);
  const clash = sorted.find(
    (h, i) => i > 0 && sorted[i - 1].day === h.day && h.start < sorted[i - 1].end,
  );
  if (clash) return `Hay dos horarios del ${dayName(clash.day)} que se cruzan.`;
  return "";
};

// Lugar si es presencial, enlace si es online
export const meetingPoint = (group) => (group.isOnline ? group.link : group.place);

// Fecha de vigencia legible, ej. "27 nov"
export const formatDate = (isoDate) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
