import type { Page, Route } from '@playwright/test';

// Minimal shapes that match what the frontend expects.
export type Role = { role: 'diner' | 'franchisee' | 'admin'; objectId?: string };
export type User = { id: number; name: string; email: string; roles: Role[] };
export type Store = { id: string; name: string; totalRevenue: number };
export type Franchise = {
  id: string;
  name: string;
  admins: { email: string }[];
  stores: Store[];
};

type MenuItem = { title: string; description: string; image: string; price: number };

type OrderItem = { menuId: number; description: string; price: number };

export type MockUsers = {
  diner: User;
  franchisee: User;
  admin: User;
};

export function defaultUsers(): MockUsers {
  return {
    diner: { id: 1, name: 'Kevin Costa', email: 'diner@jwt.com', roles: [{ role: 'diner' }] },
    franchisee: {
      id: 2,
      name: 'Fran Chisee',
      email: 'fran@jwt.com',
      roles: [{ role: 'franchisee', objectId: '99' }],
    },
    admin: { id: 3, name: 'Admin User', email: 'admin@jwt.com', roles: [{ role: 'admin' }] },
  };
}

export type MockOptions = {
  // If provided, a token for this role will be set in localStorage before the first navigation.
  seedLoginAs?: keyof MockUsers;
};

export async function installAppMocks(page: Page, opts: MockOptions = {}) {
  // Reduce flakiness from missing globals + animations.
  await page.addInitScript(() => {
    window.HSStaticMethods = window.HSStaticMethods || { autoInit: () => {} };

    const style = document.createElement('style');
    style.innerHTML = `*, *::before, *::after { transition-duration: 0s !important; animation-duration: 0s !important; }`;
    document.head.appendChild(style);
  });

  const users = defaultUsers();

  // Simple auth/token model for mocks.
  const tokenByEmail = new Map<string, string>([
    [users.diner.email, 'token-diner'],
    [users.franchisee.email, 'token-franchisee'],
    [users.admin.email, 'token-admin'],
  ]);
  const userByToken = new Map<string, User>([
    ['token-diner', users.diner],
    ['token-franchisee', users.franchisee],
    ['token-admin', users.admin],
  ]);

  if (opts.seedLoginAs) {
    const seededUser = users[opts.seedLoginAs];
    const seededToken = tokenByEmail.get(seededUser.email) || `token-${seededUser.email}`;
    await page.addInitScript((token: string) => {
      localStorage.setItem('token', token);
    }, seededToken);
  }

  const menu: MenuItem[] = [
    { title: 'Veggie', description: 'A garden of delight', image: '/pizza1.png', price: 0.0042 },
    { title: 'Pepperoni', description: 'Spicy treat', image: '/pizza2.png', price: 0.0042 },
    { title: 'Hawaiian', description: 'Sweet and savory', image: '/pizza3.png', price: 0.0042 },
    { title: 'Cheese', description: 'Classic comfort', image: '/pizza4.png', price: 0.0042 },
  ];

  const franchises: Franchise[] = [
    {
      id: '1',
      name: "Papa's Palace",
      admins: [{ email: users.admin.email }],
      stores: [
        { id: '4', name: 'SLC', totalRevenue: 0 },
        { id: '5', name: 'Provo', totalRevenue: 0 },
      ],
    },
    {
      id: '99',
      name: 'FranCo Franchise',
      admins: [{ email: users.franchisee.email }],
      stores: [{ id: '9', name: 'Ogden', totalRevenue: 0 }],
    },
  ];

  const ordersByUserId: Record<number, any[]> = {
    [users.diner.id]: [
      {
        id: 'o-1',
        franchiseId: '1',
        storeId: '4',
        date: '2026-02-01',
        items: [
          { menuId: 0, description: menu[0].title, price: menu[0].price },
          { menuId: 1, description: menu[1].title, price: menu[1].price },
        ],
      },
    ],
  };

  let nextFranchiseId = 200;
  let nextStoreId = 300;
  let nextOrderId = 2;

  function authUserFromRoute(route: Route): User | null {
    const header = route.request().headers()['authorization'];
    const token = header?.replace('Bearer ', '');
    if (!token) return null;
    return userByToken.get(token) || null;
  }

  // ---- AUTH ----
  await page.route('**/api/auth', async (route) => {
    const method = route.request().method();
    const body = route.request().postDataJSON?.();

    if (method === 'PUT') {
      const email = body?.email;
      const password = body?.password;
      if (password !== 'a' || !email || !tokenByEmail.has(email)) {
        return route.fulfill({ status: 401, json: { message: 'Invalid credentials' } });
      }
      const token = tokenByEmail.get(email)!;
      const user = userByToken.get(token)!;
      return route.fulfill({ status: 200, json: { user, token } });
    }

    if (method === 'POST') {
      const name = body?.name || 'New User';
      const email = body?.email || 'new@jwt.com';
      const user: User = { id: 1000 + Math.floor(Math.random() * 1000), name, email, roles: [{ role: 'diner' }] };
      const token = `token-${email}`;
      tokenByEmail.set(email, token);
      userByToken.set(token, user);
      return route.fulfill({ status: 200, json: { user, token } });
    }

    if (method === 'DELETE') {
      return route.fulfill({ status: 200, json: { message: 'Logged out' } });
    }

    return route.fulfill({ status: 405, json: { message: 'Method not allowed' } });
  });

  // ---- USER ----
  await page.route('**/api/user/me', async (route) => {
    const user = authUserFromRoute(route);
    if (!user) return route.fulfill({ status: 401, json: { message: 'Unauthorized' } });
    return route.fulfill({ status: 200, json: user });
  });


  // ---- MENU ----
  await page.route('**/api/order/menu', async (route) => {
    return route.fulfill({ status: 200, json: menu });
  });

  // ---- ORDERS ----
  await page.route(/\/api\/order(\?.*)?$/, async (route) => {
    const method = route.request().method();

    if (method === 'GET') {
      const user = authUserFromRoute(route);
      // The app may request orders even before login; return empty.
      const orders = (user && ordersByUserId[user.id]) || [];
      return route.fulfill({ status: 200, json: { orders } });
    }

    if (method === 'POST') {
      const user = authUserFromRoute(route) || users.diner;
      const order = route.request().postDataJSON?.();
      const newId = `o-${nextOrderId++}`;
      const storedOrder = { ...order, id: newId, date: new Date().toISOString().slice(0, 10) };
      ordersByUserId[user.id] = ordersByUserId[user.id] || [];
      ordersByUserId[user.id].unshift(storedOrder);
      return route.fulfill({ status: 200, json: { order: storedOrder, jwt: `jwt-${newId}` } });
    }

    return route.fulfill({ status: 405, json: { message: 'Method not allowed' } });
  });

  // ---- VERIFY ----
  await page.route('**/api/order/verify', async (route) => {
    return route.fulfill({
      status: 200,
      json: {
        message: 'valid',
        payload: JSON.stringify({ sub: 'order', iat: 1700000000, aud: 'jwt-pizza' }, null, 2),
      },
    });
  });

  // ---- DOCS (service and factory) ----
  await page.route('**/api/docs', async (route) => {
    return route.fulfill({
      status: 200,
      json: {
        endpoints: [
          { method: 'GET', path: '/api/order/menu', description: 'List menu items', response: menu },
          { method: 'GET', path: '/api/order', description: 'List orders', response: { orders: [] } },
          { method: 'POST', path: '/api/order', description: 'Place order', response: { order: {}, jwt: '...' } },
        ],
      },
    });
  });

  // ---- FRANCHISE ----
  await page.route(/\/api\/franchise(\?.*)?(\/.*)?$/, async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    const path = url.pathname; // .../api/franchise/...

    // /api/franchise?page=..&limit=..&name=..
    if (method === 'GET' && path.endsWith('/api/franchise') && url.searchParams.has('page')) {
      const rawName = url.searchParams.get('name') || '';
      const nameFilter = rawName === '*' ? '' : rawName.toLowerCase();

      const pageNum = Number(url.searchParams.get('page') || 0);
      const limit = Number(url.searchParams.get('limit') || 0);

      const filtered = nameFilter
    ? franchises.filter((f) => f.name.toLowerCase().includes(nameFilter))
    : franchises;

      const paged = limit > 0 ? filtered.slice(pageNum * limit, pageNum * limit + limit) : filtered;
      const more = limit > 0 ? (pageNum + 1) * limit < filtered.length : false;

      return route.fulfill({ status: 200, json: { franchises: paged, more } });
}


    // /api/franchise (create)
    if (method === 'POST' && path.endsWith('/api/franchise')) {
      const body = route.request().postDataJSON?.();
      const created: Franchise = {
        id: String(nextFranchiseId++),
        name: body?.name || 'New Franchise',
        admins: body?.admins || [],
        stores: [],
      };
      franchises.unshift(created);
      return route.fulfill({ status: 200, json: created });
    }

    // /api/franchise/{userId}
    const matchUserOrFranchise = path.match(/\/api\/franchise\/(\w+)$/);
    if (method === 'GET' && matchUserOrFranchise) {
      const user = authUserFromRoute(route);
      if (user?.roles.some((r) => r.role === 'franchisee')) {
        const mine = franchises.filter((f) => f.admins.some((a) => a.email === user.email));
        return route.fulfill({ status: 200, json: mine });
      }
      return route.fulfill({ status: 200, json: [] });
    }


    // /api/franchise/{franchiseId}/store
    const matchStoreCreate = path.match(/\/api\/franchise\/(\w+)\/store$/);
    if (method === 'POST' && matchStoreCreate) {
      const fid = matchStoreCreate[1];
      const body = route.request().postDataJSON?.();
      const franchise = franchises.find((f) => f.id === fid);
      if (!franchise) return route.fulfill({ status: 404, json: { message: 'Franchise not found' } });

      const store: Store = { id: String(nextStoreId++), name: body?.name || 'New Store', totalRevenue: 0 };
      franchise.stores.push(store);
      return route.fulfill({ status: 200, json: store });
    }

    // /api/franchise/{franchiseId}/store/{storeId}
    const matchStoreClose = path.match(/\/api\/franchise\/(\w+)\/store\/(\w+)$/);
    if (method === 'DELETE' && matchStoreClose) {
      const [_, fid, sid] = matchStoreClose;
      const franchise = franchises.find((f) => f.id === fid);
      if (!franchise) return route.fulfill({ status: 404, json: { message: 'Franchise not found' } });

      franchise.stores = franchise.stores.filter((s) => s.id !== sid);
      return route.fulfill({ status: 200, json: null });
    }

    // /api/franchise/{franchiseId} (delete)
    if (method === 'DELETE' && matchUserOrFranchise) {
      const fid = matchUserOrFranchise[1];
      const idx = franchises.findIndex((f) => f.id === fid);
      if (idx >= 0) franchises.splice(idx, 1);
      return route.fulfill({ status: 200, json: { message: 'Deleted' } });
    }

    return route.fulfill({ status: 404, json: { message: 'Not found' } });
  });

  return { users, tokenByEmail };
}
