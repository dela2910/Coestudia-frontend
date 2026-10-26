# Coestudia — frontend

SPA de Coestudia hecha con React + Vite. El backend vive en el repositorio `coestudia-backend`.

## Ejecutar en local

Requiere Node.js 22.

```bash
npm install
cp .env.example .env.local      # ajusta VITE_API_URL si hace falta
npm run dev
```

Abre http://localhost:5173. La página llama a `GET /api/hello` del backend y muestra:

- **Cargando**: mientras espera la respuesta.
- **Éxito**: el mensaje del backend y "Backend conectado".
- **Error**: si el backend no responde, junto a la URL que intentó usar.

Para usar el backend local, levántalo en `http://localhost:8000` (ver README del backend). También
puedes apuntar `VITE_API_URL` al backend en producción: `https://coestudia-backend.onrender.com`.

## Lint, tests y build

```bash
npm run lint     # oxlint
npm test         # vitest (no necesita el backend corriendo)
npm run coverage # vitest con el porcentaje de cobertura por archivo
npm run build    # genera dist/
```

Se ejecutan automáticamente en GitHub Actions (Lint → Test → Build) en cada pull request y en cada
push a `main`.

## Estructura

```
src/
├── api/
│   ├── client.js      # request() base, token de sesión y URL del backend
│   ├── auth.js        # registro, verificación del correo, login y sesión
│   ├── groups.js      # buscar y filtrar grupos
│   ├── profile.js     # editar el perfil y «mis asignaturas»
│   └── assistant.js   # asistente IA (simulado)
├── components/        # piezas reutilizables (Navbar, GroupCard, ui.jsx…)
├── data/
│   └── mock.js        # datos de ejemplo con la forma del modelo de datos
├── views/             # una vista por pantalla (Login, Home, Results, CreateGroup…)
├── test/
│   └── setup.js       # configuración de Vitest + jest-dom
├── App.jsx            # navegación entre vistas
├── App.test.jsx
├── App.css
├── index.css
└── main.jsx
.github/workflows/
├── ci.yml             # lint → test → build
└── release.yml        # tag v* → release en GitHub → deploy a Vercel
```

## Conectar una vista a la API

El inicio de sesión y el buscador (`Home` y `Results`) ya usan la API; las demás vistas todavía
usan los datos de `src/data/mock.js`. Cada tarea conecta su vista al backend:

1. Agrega la función del endpoint en `src/api/` usando `request()`, que ya envía JSON, agrega el
   token de sesión y lanza `ApiError` con el mensaje (`detail`) de FastAPI:

   ```js
   export const searchGroups = (params) => request(`/api/grupos?${new URLSearchParams(params)}`);
   ```

2. En la vista, reemplaza el dato de `mock.js` por la llamada y muestra los estados de carga y
   error.

La sesión ya funciona contra el backend: al iniciar sesión se guarda el JWT y `request()` lo
manda solo en cada llamada, así que los endpoints protegidos no necesitan nada extra. Si una
llamada responde 401 porque la sesión venció, `request()` borra el token y la app vuelve sola al
inicio de sesión: las vistas solo tienen que mostrar sus propios errores. El enlace
del correo de verificación abre `/?verificar=<token>` y `App.jsx` inicia la sesión. En local, ese
enlace aparece en la consola del backend.

Los datos de ejemplo ya tienen la forma del modelo: `isOnline` (es_online), `schedule` con
`{ day, isMorning }` (horario_grupo: día 0 = lunes … 5 = sábado), `place` o `link`, y
`validUntil` (vigente_hasta).

## Variables de entorno

| Variable       | Descripción                                 | Local                   |
| -------------- | ------------------------------------------- | ----------------------- |
| `VITE_API_URL` | URL base del backend, sin barra final.      | `http://localhost:8000` |

Las variables `VITE_*` se incrustan en el build: si cambian, hay que volver a construir y desplegar.
Nunca pongas secretos en ellas, porque quedan visibles en el navegador.

## Flujo de ramas

```
feat/x ──PR──► dev ──► release/vX.Y.Z ──PR──► main ──► tag vX.Y.Z (deploy)
```

- `main`: producción. Solo recibe PRs desde ramas `release/*`. Protegida (PR + CI en verde).
- `dev`: integración. Todo el trabajo diario entra aquí por PR desde ramas `feat/...`, `fix/...`,
  `chore/...`.
- `dev` contiene documentación personal (`CLAUDE*.md`) que **no** debe llegar a `main`. Para
  publicar:

  ```bash
  git switch dev && git pull
  git switch -c release/vX.Y.Z
  git rm CLAUDE*.md
  git commit -m "chore: preparar release vX.Y.Z"
  git push -u origin release/vX.Y.Z
  gh pr create --base main
  ```

  El CI hace fallar cualquier PR a `main` que traiga un `CLAUDE*.md`.
- **Nunca mergear `main` hacia `dev`**: borraría el CLAUDE.md de `dev`. Los arreglos urgentes
  también se hacen en `dev` y se publican con una release nueva.

Los commits usan prefijos convencionales: `feat:`, `fix:`, `chore:`, `docs:`, `ci:`, `test:`.

## Publicar una versión

El deploy a producción (Vercel) se hace creando un tag desde `main` actualizado:

```bash
git switch main
git pull
git tag v0.1.0
git push origin v0.1.0
```

El workflow `release.yml` crea el release en GitHub con notas autogeneradas y luego construye y
despliega en Vercel con la CLI, usando los secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID` y
`VERCEL_PROJECT_ID`. La URL del backend se toma de la variable de repositorio `VITE_API_URL`
(*Settings → Secrets and variables → Actions → Variables*), y el deploy se cancela si no queda en
el build. Los push a `main` **no** despliegan solos (`vercel.json` desactiva el
auto-deploy de Git). Usar versionado semántico (`vMAYOR.MENOR.PARCHE`).
