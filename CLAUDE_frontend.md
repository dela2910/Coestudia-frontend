# CLAUDE.md — coestudia-frontend

## Contexto del proyecto

**Coestudia** es una plataforma web para que estudiantes universitarios de pregrado (Chile) encuentren
y creen grupos de estudio por asignatura, modalidad (presencial/online) y disponibilidad horaria.
Proyecto del ramo de ingeniería de software, equipo de 5 personas, con presupuesto cercano a cero
(solo capas gratuitas).

Este repositorio es **solo el frontend** (SPA en React). El backend vive en otro repositorio
(`coestudia-backend`, FastAPI) y se comunica con este por **API REST (JSON sobre HTTPS)**.

## Estado actual (actualizado 2026-10-01)

- Esqueleto React + Vite creado: `src/api/client.js`, `App.jsx` con 3 estados, 2 pruebas (éxito y
  error con `fetch` simulado). Lint, tests y build pasan en local.
- CI (`ci.yml`) creado con jobs `Lint` → `Test` → `Build`. Commit inicial en `main` y CI en verde.
  **Pendiente**: ruleset de `main`, Vercel y `release.yml`.
- Backend ya desplegado: https://coestudia-backend.onrender.com (su CORS ya permite
  `http://localhost:5173`).
- `CLAUDE_frontend.md` y todos los `.md` (excepto `README.md`) están en `.gitignore`: son
  documentación personal.

Decisiones que difieren de la especificación original:

1. **oxlint en lugar de ESLint**: la plantilla actual de Vite trae oxlint (`.oxlintrc.json`, script
   `lint: oxlint`); no hay `eslint.config.js`.
2. **Node 22 en lugar de 20**: Node 20 dejó de tener soporte en abril de 2026 y Vite 8 exige
   `^20.19 || >=22.12`.
3. **CI en tres jobs separados** (`Lint`, `Test`, `Build`, encadenados con `needs`) en lugar de un
   job con pasos, para que los stages se vean como etapas en GitHub Actions (igual que el backend).
4. **PR sin aprobaciones obligatorias**: 0 required approvals; cada uno puede mergear su PR con el
   CI en verde (igual que el backend).

## Objetivo: Entrega 2 — Walking Skeleton (frontend)

Lo que pide la pauta del curso:

- "Hello world" en el frontend **conectado al backend**: la página muestra el mensaje que devuelve
  `GET /api/hello` del backend.
- Pipeline CI/CD con **tag + release en GitHub**.
- **CI con stages definidos** (lint → test → build).
- **CD: despliegue automatizado a producción**. Si no se logra automatizar, debe quedar manual y
  argumentado.

El esqueleto debe ser **mínimo**. No implementar funcionalidades del producto todavía.

### Alcance de esta tarea (hacer)

1. Proyecto base con Vite + React.
2. Una página que llama al backend y muestra el resultado, con tres estados visibles:
   cargando, éxito y error.
3. URL del backend configurable por variable de entorno (`VITE_API_URL`).
4. Una capa mínima de acceso a la API (`src/api/`), para no dispersar `fetch` por los componentes.
5. Lint (oxlint) y pruebas (Vitest + Testing Library) con al menos una prueba real.
6. Workflow de CI (`.github/workflows/ci.yml`).
7. Workflow de release + deploy (`.github/workflows/release.yml`).
8. `README.md` con instrucciones de ejecución local, estructura, variables de entorno y cómo
   publicar una versión.
9. `.env.example`.

### Fuera de alcance (NO hacer ahora)

- React Router, manejo de sesión, login o registro.
- Pantallas del producto (buscador, grupos, perfil, mis grupos).
- Librerías de estado global (Redux, Zustand), librerías de UI (MUI, Chakra) o Tailwind.
- TypeScript, salvo que el equipo lo indique (por defecto: JavaScript).
- Cualquier dependencia que no se use en el esqueleto.

## Stack

- Node.js 22
- React (última versión estable) con Vite, plantilla `react` (JavaScript)
- oxlint (el linter que trae la plantilla de Vite)
- Vitest + @testing-library/react + jsdom
- GitHub Actions (CI y release)
- Vercel (despliegue del frontend, capa gratuita)

## Estructura esperada

```
coestudia-frontend/
├── src/
│   ├── api/
│   │   └── client.js         # getHello() y configuración de la URL base
│   ├── App.jsx               # llama a la API y muestra los 3 estados
│   ├── App.test.jsx
│   ├── main.jsx
│   └── test/setup.js         # configuración de Vitest / jest-dom
├── public/
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
├── .env.example
├── .gitignore
├── .oxlintrc.json            # configuración de oxlint
├── index.html
├── package.json
├── vite.config.js            # incluye configuración de test (jsdom, setupFiles)
├── CLAUDE_frontend.md        # ignorado por git
└── README.md
```

Si el repo ya existe con README y `.gitignore`, crear el proyecto dentro del directorio actual con
`npm create vite@latest . -- --template react`, **sin sobrescribir** el `.gitignore` ni el README
existentes; fusionar su contenido si hace falta.

## Comportamiento de la página

`src/api/client.js`:

```js
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getHello() {
  const res = await fetch(`${API_URL}/api/hello`);
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
}
```

`App.jsx` muestra el título "Coestudia", y debajo:

- **Cargando**: "Conectando con el backend…"
- **Éxito**: el `message` recibido, y un indicador claro de "Backend conectado".
- **Error**: "No se pudo conectar con el backend" y, de forma discreta, la URL que intentó usar.

Debe ser legible y centrada, con CSS simple propio. Sin librerías de estilos.

## Variables de entorno

| Variable | Uso | Valor local | Valor en producción |
|---|---|---|---|
| `VITE_API_URL` | URL base del backend, sin barra final | `http://localhost:8000` | URL pública de Render (HTTPS) |

Las variables de Vite se incrustan en el build: **cambiarlas exige volver a construir y desplegar**.
Nunca poner secretos en variables `VITE_*`, porque quedan visibles en el navegador.

## Pruebas

- Una prueba con `fetch` simulado (mock) que verifica el estado de éxito: aparece el mensaje.
- Una prueba que verifica el estado de error cuando `fetch` falla.
- No depender de que el backend real esté corriendo.

Scripts en `package.json`: `dev`, `build`, `preview`, `lint`, `test` (ejecución única,
`vitest run`, apta para CI).

## CI (`ci.yml`)

Se ejecuta en `pull_request` y en `push` a `main`. Tres jobs separados que sirven como stages
(cada uno con checkout → setup Node 22 con cache de npm → `npm ci`):

1. Job **`Lint`**: `npm run lint` (oxlint).
2. Job **`Test`** (`needs: lint`): `npm test` (`vitest run`).
3. Job **`Build`** (`needs: test`): `npm run build`, con `VITE_API_URL` tomado de la variable de
   repositorio `vars.VITE_API_URL` y, si no está definida, `https://coestudia-backend.onrender.com`.

Los nombres de los jobs (`Lint`, `Test`, `Build`) serán los checks requeridos por el ruleset de
`main`: si se renombran, hay que actualizar el ruleset o los PR quedan bloqueados.

## Release y deploy (`release.yml`)

Se dispara con tags que cumplan `v*` (por ejemplo `v0.1.0`):

1. Job `release`: crea el release en GitHub con notas autogeneradas
   (`softprops/action-gh-release@v2`, permiso `contents: write`).
2. Job `deploy` (`needs: release`): despliega a producción en Vercel con la CLI:
   `vercel pull --yes --environment=production`, `vercel build --prod`, `vercel deploy --prebuilt --prod`.
   Usa los secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`.

## Convenciones

- Código y nombres de variables en inglés; mensajes de commit, README y comentarios en español.
- Componentes en `PascalCase.jsx`; funciones y archivos de utilidades en `camelCase.js`.
- Commits con prefijo convencional: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`, `test:`.
- Flujo de ramas: `feat/...` → PR a **`dev`** → rama `release/vX.Y.Z` desde `dev` (con `git rm` del
  CLAUDE) → PR a **`main`** → tag `vX.Y.Z`. PRs sin aprobaciones obligatorias, pero con CI en verde.
- Este archivo está versionado **solo en `dev`** y ramas de trabajo (se agregó con `git add -f`
  porque `*.md` está en `.gitignore`). El job `Lint` falla en PRs a `main` si existe un `CLAUDE*.md`.
- **Nunca mergear `main` hacia `dev`**: borraría este archivo de `dev`. Los hotfix se hacen en `dev`.
- Mantener el código simple y legible; el equipo tiene experiencia limitada.
- Fijar versiones con el `package-lock.json` y **commitearlo** (el CI usa `npm ci`).

## Definición de terminado

- `npm run lint`, `npm test` y `npm run build` pasan sin errores.
- `npm run dev` levanta en `http://localhost:5173` y, con el backend corriendo local, muestra el
  mensaje del backend. Sin backend, muestra el estado de error (no una pantalla en blanco).
- El workflow de CI corre en verde en GitHub.
- El README permite a otro integrante levantar el proyecto desde cero.

## Pasos que debe hacer el humano (no intentar automatizarlos)

Claude Code no tiene acceso a estos paneles; dejar las instrucciones en el README o avisar en el
resumen final:

1. ~~Desplegar primero el backend~~ (hecho): https://coestudia-backend.onrender.com
2. Crear el proyecto en Vercel importando este repo: framework Vite, build command `npm run build`,
   output `dist`. Definir `VITE_API_URL` en el entorno *Production* con la URL de Render.
3. Obtener los IDs para el pipeline: ejecutar `npx vercel link` en local y leer
   `.vercel/project.json` (`orgId` y `projectId`). Esa carpeta **no se commitea**.
4. Crear un token en Vercel (*Account Settings → Tokens*).
5. Guardar en *GitHub → Settings → Secrets and variables → Actions* los secrets `VERCEL_TOKEN`,
   `VERCEL_ORG_ID` y `VERCEL_PROJECT_ID`, y la variable de repositorio `VITE_API_URL`.
6. Desactivar el auto-deploy de Git en Vercel (*Settings → Git*), porque el despliegue lo dispara
   el pipeline por tag.
7. Con la URL de Vercel ya definida, ponerla como `FRONTEND_URL` en Render (CORS del backend).
8. Activar la protección de `main` **después** de que el CI exista: ruleset "Protect main" igual que
   el backend (PR obligatorio, 0 aprobaciones, checks `Lint`, `Test` y `Build`, bloquear force push y
   borrado).

## Reglas de trabajo para Claude Code

- Si falta algo que no se puede inferir (por ejemplo el nombre de usuario de GitHub o si `gh` está
  autenticado), **preguntar antes de asumir**.
- Si el repositorio remoto aún no existe y `gh` está autenticado, se puede crear con
  `gh repo create coestudia-frontend`. Si no, indicar al usuario que lo cree.
- **Nunca** escribir secretos, tokens ni IDs privados en archivos versionados. Usar `.env.local`
  (ignorado por git) y `.env.example` con valores de ejemplo.
- Confirmar que `.gitignore` incluya como mínimo: `node_modules`, `dist`, `.env`, `.env.local`,
  `.vercel`, `coverage` y logs.
- No hacer `git push --force` ni reescribir historia.
- Antes de dar la tarea por terminada, ejecutar `npm run lint`, `npm test` y `npm run build`, y
  mostrar el resultado.
- No agregar dependencias que no se usen.
- Al terminar, entregar un resumen corto con: archivos creados, comandos ejecutados, y la lista de
  pasos manuales pendientes del bloque anterior.

## Para la presentación (evidencia que se va a mostrar)

Dejar el proyecto de modo que sea fácil capturar: el pipeline de GitHub Actions en verde con sus
stages visibles, la página de Releases con `v0.1.0`, y la página en producción mostrando el mensaje
que viene del backend (idealmente con la pestaña Network del navegador abierta, para mostrar la
llamada HTTPS al backend).
