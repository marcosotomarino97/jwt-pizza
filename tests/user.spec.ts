import { test, expect } from 'playwright-test-coverage';
import { installAppMocks } from './pizzaTestUtils';

const waitForUpdateUserPut = (page: any) =>
  page.waitForRequest((r: any) => r.url().includes('/api/user') && r.method() === 'PUT');

async function mockUpdateUserSuccess(page: any, name: string) {
  await page.route('**/*', async (route: any) => {
    const req = route.request();

    if (req.method() === 'PUT' && req.url().includes('/api/user')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name }),
      });
      return;
    }

    await route.fallback();
  });
}

async function mockUpdateUserFailure(page: any) {
  await page.route('**/*', async (route: any) => {
    const req = route.request();

    if (req.method() === 'PUT' && req.url().includes('/api/user')) {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Update failed' }),
      });
      return;
    }

    await route.fallback();
  });
}

test('admin dashboard shows an Edit button for users', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });

  await page.goto('/admin-dashboard');

  await expect(page.getByRole('heading', { name: "Mama Ricci's kitchen" })).toBeVisible();

  const editButton = page.getByRole('button', { name: /^edit$/i });
  await expect(editButton.first()).toBeVisible();
});

test('Clicking Edit shows edit user form', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });

  await page.goto('/admin-dashboard');

  const editButton = page.getByRole('button', { name: /^edit$/i });
  await expect(editButton.first()).toBeVisible();

  await editButton.first().click();

  await expect(page.getByRole('heading', { name: /edit user/i })).toBeVisible();
});

test('Edit user form contains name input and Save button', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });

  await page.goto('/admin-dashboard');

  const editButton = page.getByRole('button', { name: /^edit$/i });
  await editButton.first().click();

  await expect(page.getByLabel(/name/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^save$/i })).toBeVisible();
});

test('Saving edited name replaces displayed user name', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });
  await mockUpdateUserSuccess(page, 'New Admin Name');

  await page.goto('/admin-dashboard');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('New Admin Name');

  await Promise.all([
    waitForUpdateUserPut(page),
    page.getByRole('button', { name: /^save$/i }).click(),
  ]);

  await expect(page.getByTestId('display-name')).toHaveText('New Admin Name');
});

test('Saving edited name closes the edit form', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });
  await mockUpdateUserSuccess(page, 'Another Name');

  await page.goto('/admin-dashboard');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('Another Name');

  await Promise.all([
    waitForUpdateUserPut(page),
    page.getByRole('button', { name: /^save$/i }).click(),
  ]);

  await expect(page.getByRole('heading', { name: /edit user/i })).not.toBeVisible();
});

test('Edit form is pre-filled with current user name', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });
  await mockUpdateUserSuccess(page, 'Prefill Name');

  await page.goto('/admin-dashboard');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('Prefill Name');

  await Promise.all([
    waitForUpdateUserPut(page),
    page.getByRole('button', { name: /^save$/i }).click(),
  ]);

  // Re-open edit
  await page.getByRole('button', { name: /^edit$/i }).first().click();

  await expect(page.getByLabel(/name/i)).toHaveValue('Prefill Name');
});

test('Cancel closes edit form without changing name', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });
  await page.goto('/admin-dashboard');

  await expect(page.getByTestId('display-name')).toHaveText('Admin');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('Name That Should Not Save');
  await page.getByRole('button', { name: /^cancel$/i }).click();

  await expect(page.getByRole('heading', { name: /edit user/i })).not.toBeVisible();

  await expect(page.getByTestId('display-name')).toHaveText('Admin');
  await expect(page.getByTestId('display-name')).not.toHaveText('Name That Should Not Save');
});

test('Edit input pre-fills from displayed name after cancel', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });
  await page.goto('/admin-dashboard');

  await expect(page.getByTestId('display-name')).toHaveText('Admin');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('Temp Name');
  await page.getByRole('button', { name: /^cancel$/i }).click();

  await expect(page.getByTestId('display-name')).toHaveText('Admin');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await expect(page.getByLabel(/name/i)).toHaveValue('Admin');
});

test('Saving edited name calls update user API', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });
  // We don't need success/failure here — only that PUT happened.
  await page.goto('/admin-dashboard');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('Backend Name');

  const [request] = await Promise.all([
    waitForUpdateUserPut(page),
    page.getByRole('button', { name: /^save$/i }).click(),
  ]);

  expect(request).toBeTruthy();
});

test('If update user API fails, name is not updated', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });
  await mockUpdateUserFailure(page);

  await page.goto('/admin-dashboard');

  await expect(page.getByTestId('display-name')).toHaveText('Admin');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('Should Not Apply');

  await Promise.all([
    waitForUpdateUserPut(page),
    page.getByRole('button', { name: /^save$/i }).click(),
  ]);

  await expect(page.getByTestId('display-name')).toHaveText('Admin');
});

test('If update user API fails, an error message is shown', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });
  await mockUpdateUserFailure(page);

  await page.goto('/admin-dashboard');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('Should Fail');

  await Promise.all([
    waitForUpdateUserPut(page),
    page.getByRole('button', { name: /^save$/i }).click(),
  ]);

  await expect(page.getByTestId('update-user-error')).toBeVisible();
});

test('Error clears and name updates after a failed save followed by a successful retry', async ({ page }) => {
  await installAppMocks(page, { seedLoginAs: 'admin' });

  // First PUT fails, second PUT succeeds
  let callCount = 0;
  await page.route('**/*', async (route) => {
    const req = route.request();
    if (req.method() === 'PUT' && req.url().includes('/api/user')) {
      callCount += 1;

      if (callCount === 1) {
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Update failed' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ name: 'Retry Name' }),
      });
      return;
    }

    await route.fallback();
  });

  await page.goto('/admin-dashboard');

  await page.getByRole('button', { name: /^edit$/i }).first().click();
  await page.getByLabel(/name/i).fill('Retry Name');

  // First save -> failure shows error
  await Promise.all([
    page.waitForRequest((r) => r.url().includes('/api/user') && r.method() === 'PUT'),
    page.getByRole('button', { name: /^save$/i }).click(),
  ]);

  await expect(page.getByTestId('update-user-error')).toBeVisible();

  // Second save -> success should clear error + close form + update display name
  await Promise.all([
    page.waitForRequest((r) => r.url().includes('/api/user') && r.method() === 'PUT'),
    page.getByRole('button', { name: /^save$/i }).click(),
  ]);

  await expect(page.getByTestId('update-user-error')).not.toBeVisible();
  await expect(page.getByRole('heading', { name: /edit user/i })).not.toBeVisible();
  await expect(page.getByTestId('display-name')).toHaveText('Retry Name');
});