import { test, expect } from 'playwright-test-coverage';
import { installAppMocks } from './pizzaTestUtils';

test('home loads and can navigate to menu', async ({ page }) => {
  await installAppMocks(page);

  await page.goto('/');
  await expect(page).toHaveTitle(/JWT Pizza/i);
  await page.getByRole('button', { name: 'Order now' }).click();
  await expect(page).toHaveURL(/\/menu$/);

  // The Menu page heading is the View title
  await expect(page.getByRole('heading', { name: 'Awesome is a click away' })).toBeVisible();
});


  test('register and logout', async ({ page }) => {
    await installAppMocks(page);

    await page.goto('/register');
    await page.getByPlaceholder('Full name').fill('New Diner');
    await page.getByPlaceholder('Email address').fill('new@jwt.com');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Register' }).click();

    // After registration, header should show initials "ND".
    await expect(page.getByRole('link', { name: 'ND' })).toBeVisible();

    await page.getByRole('link', { name: 'Logout' }).click();
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();
  });

  test('login shows an error on invalid credentials', async ({ page }) => {
    await installAppMocks(page);

    await page.goto('/login');
    await page.getByLabel('Email address').fill('diner@jwt.com');
    await page.getByLabel('Password').fill('wrong');
    await page.getByRole('button', { name: 'Login' }).click();

    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

  test('can order pizza: menu -> payment login -> pay now -> delivery -> verify', async ({ page }) => {
    await installAppMocks(page);

    await page.goto('/menu');

    // Wait until stores are actually loaded, then pick SLC (id "4")
    await expect(page.locator('select option', { hasText: 'SLC' })).toHaveCount(1);
    await page.getByRole('combobox').selectOption({ label: 'SLC' });


    // Click pizza cards (works because the card text is inside a button)
    await page.getByText('Veggie').click();
    await page.getByText('Pepperoni').click();

    await page.getByRole('button', { name: 'Checkout' }).click();

    // Payment redirects to /payment/login when not logged in
    await page.waitForURL(/\/payment\/login$/);
    await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();

    // Login form uses placeholders
    await page.getByPlaceholder('Email address').fill('diner@jwt.com');
    await page.getByPlaceholder('Password').fill('a');
    await page.getByRole('button', { name: 'Login' }).click();

    // Now we're on /payment
    await page.waitForURL(/\/payment$/);
    await expect(page.getByRole('heading', { name: 'So worth it' })).toBeVisible();

    await page.getByRole('button', { name: 'Pay now' }).click();

    await page.waitForURL(/\/delivery$/);
    await expect(page.getByRole('heading', { name: 'Here is your JWT Pizza!' })).toBeVisible();

    await page.getByRole('button', { name: 'Verify' }).click();

    // Robust check: modal content updates even if animation/overlay is quirky
    await expect(page.locator('#hs-jwt-modal')).toContainText('valid');
});


  test('diner dashboard shows order history', async ({ page }) => {
    await installAppMocks(page, { seedLoginAs: 'diner' });

    await page.goto('/diner-dashboard');
    await expect(page.getByRole('heading', { name: 'Your pizza kitchen' })).toBeVisible();

    // Seeded order id o-1 should render
    await expect(page.getByText('o-1')).toBeVisible();
  });

  test('franchisee can create and close a store', async ({ page }) => {
    await installAppMocks(page, { seedLoginAs: 'franchisee' });

    await page.goto('/franchise-dashboard');

    // Franchise dashboard title is the franchise name
    await expect(page.getByRole('heading', { name: 'FranCo Franchise' })).toBeVisible();

    await page.getByRole('button', { name: 'Create store' }).click();
    await expect(page).toHaveURL(/\/create-store$/);

    // Create-store input uses a placeholder (not a label)
    await page.getByPlaceholder('store name').fill('New Store');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/franchise-dashboard$/);
    await expect(page.getByText('New Store')).toBeVisible();

    // Close the specific store row we created (avoid clicking the wrong "Close")
    await page.locator('tr', { hasText: 'New Store' }).getByRole('button', { name: 'Close' }).click();
    await expect(page).toHaveURL(/\/close-store$/);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page).toHaveURL(/\/franchise-dashboard$/);
});


  test('admin can create and close a franchise', async ({ page }) => {
    await installAppMocks(page, { seedLoginAs: 'admin' });

    await page.goto('/admin-dashboard');

    await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();

    await page.getByRole('button', { name: 'Add Franchise' }).click();
    await expect(page).toHaveURL(/\/create-franchise$/);

    await page.getByPlaceholder('franchise name').fill('Test Franchise');
    await page.getByPlaceholder('franchisee admin email').fill('someone@jwt.com');
    await page.getByRole('button', { name: 'Create' }).click();

    await expect(page).toHaveURL(/\/admin-dashboard$/);
    await expect(page.getByText('Test Franchise')).toBeVisible();

    await page.locator('tr', { hasText: 'Test Franchise' }).getByRole('button', { name: 'Close' }).click();
    await expect(page).toHaveURL(/\/close-franchise$/);

    await page.getByRole('button', { name: 'Close' }).click();
    await expect(page).toHaveURL(/\/admin-dashboard$/);
});


  test('docs page renders', async ({ page }) => {
    await installAppMocks(page);

    await page.goto('/docs');
    await expect(page.getByRole('heading', { name: 'JWT Pizza API' })).toBeVisible();
    await expect(page.getByText('/api/order/menu')).toBeVisible();
  });

