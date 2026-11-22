import { expect, test } from '@playwright/test'

// Flujos principales del MVP contra el backend real con los datos de ejemplo
// (python -m app.seed: usuarios ya verificados, contraseña Coestudia2026).
const PASSWORD = 'Coestudia2026'
const ANA = { email: 'ana.rojas@uc.cl', name: 'Ana Rojas' }
const FERNANDA = 'fernanda.diaz@uc.cl'
const LUIS = 'luis.castro@uc.cl'
const BENJAMIN = 'benjamin.vera@uc.cl'
const MATIAS = 'matias.soto@uc.cl'

async function login(page, email) {
  await page.goto('/')
  await page.getByPlaceholder('nombre@uc.cl').fill(email)
  await page.getByLabel('Contraseña', { exact: true }).fill(PASSWORD)
  await page.locator('form button[type="submit"]').click()
  await expect(page.getByRole('heading', { name: /^Hola,/ })).toBeVisible()
}

async function goToMyGroups(page) {
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('button', { name: 'Mis grupos' }).click()
  await expect(page.getByRole('heading', { name: 'Mis grupos' })).toBeVisible()
}

// Fecha local en formato YYYY-MM-DD, `days` días desde hoy
function isoDateIn(days) {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return local.toISOString().slice(0, 10)
}

test('inicia sesión y llega al inicio', async ({ page }) => {
  await login(page, ANA.email)
  await expect(page.getByRole('heading', { name: 'Hola, Ana 👋' })).toBeVisible()
})

test('busca un grupo, pide ingreso y el creador lo acepta', async ({ page, browser }) => {
  // Ana busca Física I y pide entrar al grupo de Fernanda
  await login(page, ANA.email)
  await page.getByLabel('Buscar asignatura').fill('FIS1513')
  await page.getByRole('main').getByRole('button', { name: 'Buscar', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Resultados' })).toBeVisible()
  await page.locator('.group-card-main', { hasText: 'Física I' }).first().click()
  await page.getByRole('button', { name: 'Solicitar ingreso' }).click()
  await expect(page.getByText(/Solicitud enviada/)).toBeVisible()

  // Fernanda, la creadora, la acepta desde «Mis grupos»
  const ownerContext = await browser.newContext()
  const owner = await ownerContext.newPage()
  await login(owner, FERNANDA)
  await goToMyGroups(owner)
  await owner.getByRole('button', { name: `Aceptar a ${ANA.name}` }).click()
  await expect(owner.getByRole('button', { name: `Aceptar a ${ANA.name}` })).toHaveCount(0)
  await ownerContext.close()

  // Ana ya aparece como integrante
  await page.reload()
  await goToMyGroups(page)
  await page.getByRole('tab', { name: 'Participo' }).click()
  await expect(page.locator('.group-card-main', { hasText: 'Física I' })).toBeVisible()
})

test('crea un grupo', async ({ page }) => {
  await login(page, LUIS)
  await page.getByRole('navigation', { name: 'Principal' }).getByRole('button', { name: 'Crear grupo' }).click()
  await expect(page.getByRole('heading', { name: 'Crear grupo' })).toBeVisible()

  await page.getByPlaceholder('Ej: MAT1620').fill('MAT1203')
  await page.getByPlaceholder('Ej: Biblioteca central, sala 2').fill('Sala de estudio, edificio San Agustín')
  await page.getByLabel('Inicio, hora').selectOption('10')
  await page.getByLabel('Fin, hora').selectOption('12')
  await page.getByLabel('Vigente hasta').fill(isoDateIn(14))
  await page.getByRole('button', { name: 'Publicar grupo' }).click()

  await expect(page.getByText('¡Grupo publicado!')).toBeVisible()
})

test('publica un tema en el foro del grupo y lo responde', async ({ page }) => {
  // Ana es la creadora del grupo de Cálculo II
  await login(page, ANA.email)
  await goToMyGroups(page)
  await page.locator('.group-card-main', { hasText: 'Cálculo II' }).first().click()

  await page.getByRole('button', { name: 'Nuevo tema' }).click()
  await page.getByLabel('Título').fill('Guía 3 – Ejercicio 5')
  await page.getByLabel('Pregunta o enunciado').fill('¿Cómo se cambia el orden de integración en este ejercicio?')
  await page.getByRole('button', { name: 'Publicar tema' }).click()
  await expect(page.getByRole('heading', { name: 'Guía 3 – Ejercicio 5' })).toBeVisible()

  await page.getByLabel('Tu respuesta').fill('Dibuja la región primero y despeja x en función de y.')
  await page.getByRole('button', { name: 'Responder' }).click()
  await expect(page.getByRole('list', { name: 'Respuestas' })).toContainText('Dibuja la región primero')
})

test('el creador administra su grupo: edita, expulsa y lo cierra', async ({ page }) => {
  // Ana creó el grupo de Cálculo II, con Luis y Sofía como integrantes
  await login(page, ANA.email)
  await goToMyGroups(page)
  await page.getByRole('button', { name: 'Administrar Cálculo II' }).click()

  await page.getByRole('button', { name: 'Aumentar cupo' }).click()
  await page.getByRole('button', { name: 'Guardar cambios' }).click()
  await expect(page.getByText('Cambios guardados.')).toBeVisible()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Expulsar a Luis Castro' }).click()
  await expect(page.getByRole('button', { name: 'Expulsar a Luis Castro' })).toHaveCount(0)

  await page.getByRole('button', { name: 'Cerrar grupo' }).click()
  await expect(page.getByRole('button', { name: 'Reabrir grupo' })).toBeVisible()
})

test('abandona un grupo en el que participa', async ({ page }) => {
  // Benjamín participa en el grupo de Ingeniería de Software de Sofía
  await login(page, BENJAMIN)
  await goToMyGroups(page)
  await page.getByRole('tab', { name: 'Participo' }).click()
  await page.locator('.group-card-main', { hasText: 'Ingeniería de Software' }).click()

  page.once('dialog', (dialog) => dialog.accept())
  await page.getByRole('button', { name: 'Abandonar grupo' }).click()

  await goToMyGroups(page)
  await page.getByRole('tab', { name: 'Participo' }).click()
  await expect(page.locator('.group-card-main', { hasText: 'Ingeniería de Software' })).toHaveCount(0)
})

test('el creador invita a un compañero y este acepta', async ({ page, browser }) => {
  // Benjamín creó el grupo de Álgebra (con Sofía) e invita a Matías por su correo
  await login(page, BENJAMIN)
  await goToMyGroups(page)
  await page.getByRole('button', { name: 'Administrar Álgebra' }).click()
  await page.getByLabel('Correo institucional').fill(MATIAS)
  await page.getByRole('button', { name: 'Invitar', exact: true }).click()
  await expect(page.getByText(`Le enviamos la invitación a ${MATIAS}.`)).toBeVisible()
  await expect(page.getByText('Invitación pendiente')).toBeVisible()

  // Matías la acepta desde «Mis solicitudes» y el grupo pasa a «Participo»
  const guestContext = await browser.newContext()
  const guest = await guestContext.newPage()
  await login(guest, MATIAS)
  await goToMyGroups(guest)
  await guest.getByRole('tab', { name: /Mis solicitudes/ }).click()
  await guest.getByRole('button', { name: 'Aceptar la invitación a Álgebra' }).click()
  await expect(guest.getByText(/Ya eres integrante del grupo de Álgebra/)).toBeVisible()
  await guest.getByRole('tab', { name: 'Participo' }).click()
  await expect(guest.locator('.group-card-main', { hasText: 'Álgebra' })).toBeVisible()
  await guestContext.close()
})
