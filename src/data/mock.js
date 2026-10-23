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

// HORARIO_GRUPO.es_manana
export const BLOCKS = [
  { id: true, label: "Mañana" },
  { id: false, label: "Tarde" },
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
    schedule: [{ day: 1, isMorning: false }],
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
    schedule: [{ day: 3, isMorning: true }],
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
    schedule: [{ day: 5, isMorning: true }],
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
    schedule: [{ day: 0, isMorning: false }],
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
    schedule: [{ day: 2, isMorning: true }],
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

// Archivos compartidos dentro de cada grupo (clave: id del grupo)
export const groupFiles = {
  1: [
    { id: 1, name: "Guía integrales múltiples.pdf", size: 1_240_000, uploadedBy: "Ana", date: "28 sep" },
    { id: 2, name: "Resumen series.docx", size: 356_000, uploadedBy: "Sofía", date: "30 sep" },
  ],
  2: [{ id: 3, name: "Control 2 - 2025.pdf", size: 820_000, uploadedBy: "Matías", date: "29 sep" }],
  5: [{ id: 4, name: "Ejercicios determinantes.pdf", size: 540_000, uploadedBy: "Benjamín", date: "1 oct" }],
};

export const dayLabel = (id) => DAYS.find((d) => d.id === id)?.label ?? id;
export const blockLabel = (isMorning) => (isMorning ? "Mañana" : "Tarde");
export const modalityLabel = (isOnline) => (isOnline ? "Online" : "Presencial");

// Resume los horarios de un grupo, ej. "Lun, Mié · Mañana"
export const scheduleLabel = (schedule) => {
  const days = [...new Set(schedule.map((h) => h.day))].sort((a, b) => a - b);
  const blocks = BLOCKS.filter((b) => schedule.some((h) => h.isMorning === b.id));
  return `${days.map(dayLabel).join(", ")} · ${blocks.map((b) => b.label).join(", ")}`;
};

// Lugar si es presencial, enlace si es online
export const meetingPoint = (group) => (group.isOnline ? group.link : group.place);

// Fecha de vigencia legible, ej. "27 nov"
export const formatDate = (isoDate) =>
  new Date(`${isoDate}T12:00:00`).toLocaleDateString("es-CL", { day: "numeric", month: "short" });
