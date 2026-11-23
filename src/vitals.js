import { onCLS, onFCP, onINP, onLCP, onTTFB } from "web-vitals";
import { API_URL } from "./api/client";

// Core Web Vitals medidas en el navegador de cada usuario (LCP, INP y CLS, más FCP y TTFB para
// entender el LCP). Se juntan en una cola y se mandan de una vez al backend cuando la página se
// oculta (cambio de pestaña, cierre o navegación), que es cuando web-vitals da los valores finales.

const ENDPOINT = `${API_URL}/api/metricas-web`;

// La app no tiene URLs por vista: App avisa en cuál está para saber dónde se midió cada métrica
let currentView = "loading";
export const setVitalsView = (view) => {
  currentView = view;
};

const queue = [];

export const toPayload = (metric) => ({
  nombre: metric.name,
  // CLS no tiene unidad y es pequeño (ej. 0.05): se redondea a 4 decimales; el resto, a ms enteros
  valor: metric.name === "CLS" ? Math.round(metric.value * 10_000) / 10_000 : Math.round(metric.value),
  calificacion: metric.rating,
  vista: currentView,
  navegacion: metric.navigationType ?? null,
});

const enqueue = (metric) => {
  queue.push(toPayload(metric));
};

// sendBeacon sobrevive al cierre de la pestaña. Se manda como texto plano (no JSON) para que el
// navegador no haga una consulta CORS previa, que se perdería al cerrar la página
export function flush() {
  if (queue.length === 0) return;
  const body = JSON.stringify(queue.splice(0));
  const sent = navigator.sendBeacon?.(ENDPOINT, body);
  if (!sent) {
    fetch(ENDPOINT, { method: "POST", body, keepalive: true }).catch(() => {
      // Las métricas son best-effort: si no llegan, la app sigue igual
    });
  }
}

let started = false;

export function startVitals() {
  if (started) return;
  started = true;
  onLCP(enqueue);
  onINP(enqueue);
  onCLS(enqueue);
  onFCP(enqueue);
  onTTFB(enqueue);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush();
  });
  // Safari no siempre dispara visibilitychange al cerrar la pestaña
  window.addEventListener("pagehide", flush);
}

// Solo en producción (el build de Vercel), para no llenar la tabla con mediciones de desarrollo.
// VITE_WEB_VITALS=true las activa en local para probar.
export const vitalsEnabled = (env = import.meta.env) => env.PROD || env.VITE_WEB_VITALS === "true";
