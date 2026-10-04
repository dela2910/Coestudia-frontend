// Asistente de estudio (chatbot) que responde usando los archivos del grupo.
// Por ahora es una simulación local: cuando exista el endpoint en el backend
// (por ejemplo POST /api/groups/:id/assistant), basta con reemplazar esta función
// por un fetch. La API key del modelo debe vivir SOLO en el backend, nunca en VITE_*.

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function buildAnswer(question, files) {
  const q = question.toLowerCase();
  const names = files.map((f) => f.name);

  if (files.length === 0) {
    return "Aún no hay archivos en el grupo. Sube apuntes, guías o pruebas anteriores y podré responder usando su contenido.";
  }
  if (q.includes("resum")) {
    return `Aquí va un resumen de ${names.length === 1 ? "el archivo" : `los ${names.length} archivos`}:\n\n${names
      .map((n) => `• ${n}: ideas principales, definiciones clave y ejemplos resueltos.`)
      .join("\n")}\n\n¿Quieres que profundice en alguno?`;
  }
  if (q.includes("pregunta") || q.includes("práctica") || q.includes("practica") || q.includes("ejercicio")) {
    return `Te propongo 3 preguntas de práctica basadas en "${pick(names)}":\n\n1. ¿Cuál es la idea central del primer capítulo y por qué es importante?\n2. Resuelve el ejemplo 2 cambiando los datos iniciales.\n3. Compara los dos métodos presentados: ¿cuándo conviene usar cada uno?\n\nRespóndelas y te digo si vas bien.`;
  }
  if (q.includes("explica") || q.includes("qué es") || q.includes("que es")) {
    return `Según "${pick(names)}", el concepto se entiende mejor paso a paso: primero la definición, luego un ejemplo simple y al final un caso como los del certamen. ¿Te muestro el ejemplo?`;
  }
  return `Revisé ${names.length === 1 ? `"${names[0]}"` : `${names.length} archivos del grupo`} y encontré información relacionada con tu pregunta. En resumen: el material lo aborda con una definición, un ejemplo resuelto y ejercicios propuestos. ¿Quieres que te lo explique con más detalle o que te arme preguntas de práctica?`;
}

export function askAssistant({ question, files, delay = 900 }) {
  const sources = files.slice(0, 2).map((f) => f.name);
  return new Promise((resolve) => {
    setTimeout(() => resolve({ text: buildAnswer(question, files), sources }), delay);
  });
}
