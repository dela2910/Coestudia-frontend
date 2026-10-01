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
npm run build    # genera dist/
```

Se ejecutan automáticamente en GitHub Actions (Lint → Test → Build) en cada pull request y en cada
push a `main`.

## Estructura

```
src/
├── api/
│   └── client.js      # getHello() y URL base del backend
├── test/
│   └── setup.js       # configuración de Vitest + jest-dom
├── App.jsx            # llama a la API y muestra los 3 estados
├── App.test.jsx
├── App.css
├── index.css
└── main.jsx
.github/workflows/
└── ci.yml             # lint → test → build
```

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
