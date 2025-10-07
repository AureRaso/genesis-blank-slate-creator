import { test, expect, Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

// Configuración de credenciales
const TEST_CREDENTIALS = {
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@test.com',
    password: process.env.ADMIN_PASSWORD || 'admin123',
  },
  trainer: {
    email: process.env.TRAINER_EMAIL || 'trainer@test.com',
    password: process.env.TRAINER_PASSWORD || 'trainer123',
  },
  player: {
    email: process.env.PLAYER_EMAIL || 'player@test.com',
    password: process.env.PLAYER_PASSWORD || 'player123',
  },
};

// Rutas por rol
const ROUTES = {
  admin: [
    { path: '/dashboard', name: 'dashboard' },
    { path: '/dashboard/my-classes', name: 'my-classes' },
    { path: '/dashboard/classes', name: 'classes' },
    { path: '/dashboard/players', name: 'players' },
    { path: '/dashboard/clubs', name: 'clubs' },
    { path: '/dashboard/trainers', name: 'trainers' },
    { path: '/dashboard/scheduled-classes', name: 'scheduled-classes' },
    { path: '/dashboard/today-attendance', name: 'today-attendance' },
    { path: '/dashboard/payment-control', name: 'payment-control' },
  ],
  trainer: [
    { path: '/dashboard', name: 'dashboard' },
    { path: '/dashboard/students', name: 'students' },
    { path: '/dashboard/scheduled-classes', name: 'scheduled-classes' },
    { path: '/dashboard/today-attendance', name: 'today-attendance' },
    { path: '/dashboard/waitlist-notifications', name: 'waitlist-notifications' },
  ],
  player: [
    { path: '/dashboard', name: 'dashboard' },
    { path: '/dashboard/my-classes', name: 'my-classes' },
    { path: '/dashboard/scheduled-classes', name: 'scheduled-classes' },
  ],
  public: [
    { path: '/landing', name: 'landing' },
    { path: '/auth', name: 'auth' },
    { path: '/privacy', name: 'privacy' },
    { path: '/terms', name: 'terms' },
  ],
};

async function login(page: Page, email: string, password: string) {
  await page.goto('/auth');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(2000);

  // Verificar si ya estamos en el dashboard
  const currentUrl = page.url();
  if (currentUrl.includes('/dashboard')) {
    console.log('Already logged in');
    return;
  }

  // Buscar el tab de "Iniciar Sesión" - puede estar con diferentes selectores
  try {
    // Intentar con el selector del TabsTrigger
    const signinTab = page.locator('[value="signin"]').first();
    const isVisible = await signinTab.isVisible({ timeout: 2000 });
    if (isVisible) {
      await signinTab.click();
      await page.waitForTimeout(500);
    }
  } catch (e) {
    console.log('Tab selector not found, continuing...');
  }

  // Llenar el formulario - buscar los inputs de diferentes formas
  const emailInput = page.locator('input[type="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();

  await emailInput.fill(email);
  await passwordInput.fill(password);

  // Click en el botón de iniciar sesión
  const submitButton = page.locator('button[type="submit"]').first();
  await submitButton.click();

  // Esperar a que la navegación complete
  try {
    await page.waitForURL(/\/dashboard/, { timeout: 20000 });
    await page.waitForLoadState('networkidle', { timeout: 10000 });
  } catch (e) {
    console.log('Login may have failed, current URL:', page.url());
    throw e;
  }
}

async function captureScreenshot(
  page: Page,
  role: string,
  routeName: string,
  deviceType: string
) {
  const screenshotsDir = path.join(process.cwd(), 'screenshots', deviceType, role);

  // Crear directorio si no existe
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  const screenshotPath = path.join(screenshotsDir, `${routeName}.png`);

  // Esperar a que la página se cargue completamente
  await page.waitForLoadState('networkidle');

  // Scroll a la parte superior
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);

  // Capturar screenshot de página completa
  await page.screenshot({
    path: screenshotPath,
    fullPage: true,
  });

  console.log(`✓ Captured: ${deviceType}/${role}/${routeName}.png`);
}

// Tests para vistas públicas
test.describe('Public Views', () => {
  test('Capture public pages - Desktop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || test.info().project.name !== 'chromium-desktop');

    for (const route of ROUTES.public) {
      await page.goto(route.path);
      await captureScreenshot(page, 'public', route.name, 'desktop');
    }
  });

  test('Capture public pages - Mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || test.info().project.name !== 'chromium-mobile');

    for (const route of ROUTES.public) {
      await page.goto(route.path);
      await captureScreenshot(page, 'public', route.name, 'mobile');
    }
  });
});

// Tests para vistas de admin
test.describe('Admin Views', () => {
  test('Capture admin pages - Desktop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || test.info().project.name !== 'chromium-desktop');

    await login(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);

    for (const route of ROUTES.admin) {
      await page.goto(route.path);
      await captureScreenshot(page, 'admin', route.name, 'desktop');
    }
  });

  test('Capture admin pages - Mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || test.info().project.name !== 'chromium-mobile');

    await login(page, TEST_CREDENTIALS.admin.email, TEST_CREDENTIALS.admin.password);

    for (const route of ROUTES.admin) {
      await page.goto(route.path);
      await captureScreenshot(page, 'admin', route.name, 'mobile');
    }
  });
});

// Tests para vistas de trainer
test.describe('Trainer Views', () => {
  test('Capture trainer pages - Desktop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || test.info().project.name !== 'chromium-desktop');

    await login(page, TEST_CREDENTIALS.trainer.email, TEST_CREDENTIALS.trainer.password);

    for (const route of ROUTES.trainer) {
      await page.goto(route.path);
      await captureScreenshot(page, 'trainer', route.name, 'desktop');
    }
  });

  test('Capture trainer pages - Mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || test.info().project.name !== 'chromium-mobile');

    await login(page, TEST_CREDENTIALS.trainer.email, TEST_CREDENTIALS.trainer.password);

    for (const route of ROUTES.trainer) {
      await page.goto(route.path);
      await captureScreenshot(page, 'trainer', route.name, 'mobile');
    }
  });
});

// Tests para vistas de player
test.describe('Player Views', () => {
  test('Capture player pages - Desktop', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || test.info().project.name !== 'chromium-desktop');

    await login(page, TEST_CREDENTIALS.player.email, TEST_CREDENTIALS.player.password);

    for (const route of ROUTES.player) {
      await page.goto(route.path);
      await captureScreenshot(page, 'player', route.name, 'desktop');
    }
  });

  test('Capture player pages - Mobile', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium' || test.info().project.name !== 'chromium-mobile');

    await login(page, TEST_CREDENTIALS.player.email, TEST_CREDENTIALS.player.password);

    for (const route of ROUTES.player) {
      await page.goto(route.path);
      await captureScreenshot(page, 'player', route.name, 'mobile');
    }
  });
});
