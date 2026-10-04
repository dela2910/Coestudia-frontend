// Datos de ejemplo para las maquetas. No se conectan a ningún endpoint.

export const DAYS = [
  { id: "L", label: "Lun" },
  { id: "M", label: "Mar" },
  { id: "X", label: "Mié" },
  { id: "J", label: "Jue" },
  { id: "V", label: "Vie" },
  { id: "S", label: "Sáb" },
];

export const BLOCKS = [
  { id: "AM", label: "Mañana" },
  { id: "PM", label: "Tarde" },
];

export const MODALITIES = [
  { id: "presencial", label: "Presencial" },
  { id: "online", label: "Online" },
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
    modality: "presencial",
    day: "M",
    block: "PM",
    members: 3,
    capacity: 5,
    place: "Biblioteca central, sala 2",
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
    modality: "online",
    day: "J",
    block: "AM",
    members: 2,
    capacity: 4,
    place: "Google Meet",
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
    modality: "presencial",
    day: "S",
    block: "AM",
    members: 5,
    capacity: 5,
    place: "Sala de estudio Facultad de Ingeniería",
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
    modality: "online",
    day: "L",
    block: "PM",
    members: 1,
    capacity: 4,
    place: "Discord",
    description: "Dinámica y trabajo-energía. Nos juntamos a hacer la tarea semanal.",
    owner: "Fernanda",
    integrants: [{ name: "Fernanda", career: "Física" }],
  },
  {
    id: 5,
    code: "MAT1203",
    subject: "Álgebra",
    modality: "presencial",
    day: "X",
    block: "AM",
    members: 2,
    capacity: 6,
    place: "Casino central",
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
export const blockLabel = (id) => BLOCKS.find((b) => b.id === id)?.label ?? id;
export const modalityLabel = (id) => MODALITIES.find((m) => m.id === id)?.label ?? id;
