import os from 'node:os'
import path from 'node:path'
import { defineConfig, devices } from '@playwright/test'

// Tests e2e de los flujos principales contra la app real: levanta el backend (repo hermano
// coestudia-backend) con una base SQLite temporal y los datos de ejemplo, y el frontend con Vite.
// Puertos distintos a los de desarrollo (8000 y 5173) para no chocar con lo que tengas abierto.
const BACKEND_DIR = process.env.BACKEND_DIR ?? '../Coestudia-backend'
const PYTHON = process.env.BACKEND_PYTHON ?? '.venv/bin/python'
const DB_PATH = path.join(os.tmpdir(), 'coestudia-e2e.db')
const API_PORT = 8001
const WEB_PORT = 5174

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.e2e.js',
  // Los tests comparten la base de ejemplo: uno a la vez
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${WEB_PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      // Base nueva en cada corrida: migraciones + datos de ejemplo (usuarios verificados y grupos)
      command:
        `rm -f "${DB_PATH}" && ${PYTHON} -m alembic upgrade head && ${PYTHON} -m app.seed ` +
        `&& ${PYTHON} -m uvicorn app.main:app --port ${API_PORT}`,
      cwd: BACKEND_DIR,
      url: `http://localhost:${API_PORT}/health`,
      env: {
        DATABASE_URL: `sqlite:///${DB_PATH}`,
        FRONTEND_URL: `http://localhost:${WEB_PORT}`,
        UPLOADS_DIR: path.join(os.tmpdir(), 'coestudia-e2e-uploads'),
      },
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: `npx vite --port ${WEB_PORT} --strictPort`,
      url: `http://localhost:${WEB_PORT}`,
      env: { VITE_API_URL: `http://localhost:${API_PORT}` },
      reuseExistingServer: false,
      timeout: 60_000,
    },
  ],
})
