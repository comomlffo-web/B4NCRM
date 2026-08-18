console.info('B4N CRM Super Admin Guard loaded');

(() => {
  'use strict';

  const AUTH_STORAGE_KEY = 'b4n_crm_staff_session';
  const ALLOWED_EMAIL = 'comomlffo@gmail.com';
  const REQUIRED_ROLE = 'super_admin';
  const PROTECTED_HOSTS = new Set([
    'b4n-intelligence-api.comomlffo.workers.dev',
    'b4n-salon-user-intelligence-api.comomlffo.workers.dev'
  ]);

  function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
  }

  function isAuthorizedSession(session) {
    if (!session || !session.access_token) return false;
    const email = normalizeEmail(session.user?.email);
    const roles = Array.isArray(session.roles) ? session.roles : [];
    return email === ALLOWED_EMAIL && roles.includes(REQUIRED_ROLE);
  }

  function readSession() {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function clearUnauthorizedSession() {
    const session = readSession();
    if (session && !isAuthorizedSession(session)) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return true;
    }
    return false;
  }

  const originalSetItem = Storage.prototype.setItem;
  Storage.prototype.setItem = function(key, value) {
    if (this === localStorage && key === AUTH_STORAGE_KEY) {
      let candidate = null;
      try { candidate = JSON.parse(value); } catch {}
      if (!isAuthorizedSession(candidate)) {
        this.removeItem(AUTH_STORAGE_KEY);
        throw new Error('B4NCRM access is restricted to the authorized Super Admin account.');
      }
    }
    return originalSetItem.call(this, key, value);
  };

  const originalFetch = window.fetch.bind(window);
  window.fetch = async function(input, init) {
    let url;
    try {
      url = new URL(typeof input === 'string' ? input : input.url, location.href);
    } catch {
      return originalFetch(input, init);
    }

    const isProtectedHost = PROTECTED_HOSTS.has(url.hostname);
    const isProtectedPath =
      url.pathname.startsWith('/api/v1/intelligence/') ||
      url.pathname.startsWith('/api/v1/salon-user/');

    if (isProtectedHost && isProtectedPath && !isAuthorizedSession(readSession())) {
      return new Response(JSON.stringify({
        error: 'forbidden',
        message: 'B4NCRM Super Admin authorization required.'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return originalFetch(input, init);
  };

  clearUnauthorizedSession();

  Object.defineProperty(window, 'B4NCRM_SUPER_ADMIN_AUTHORIZED', {
    configurable: false,
    enumerable: false,
    get: () => isAuthorizedSession(readSession())
  });
})();
