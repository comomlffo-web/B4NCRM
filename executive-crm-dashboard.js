(() => {
  'use strict';

  const INTELLIGENCE_API = 'https://b4n-intelligence-api.comomlffo.workers.dev';
  const SALON_USER_API = 'https://b4n-salon-user-intelligence-api.comomlffo.workers.dev';
  const STORAGE_KEY = 'b4n_crm_staff_session';

  const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  }[c]));

  const money = (value) => new Intl.NumberFormat('en-LK', {
    style: 'currency', currency: 'LKR', maximumFractionDigits: 0
  }).format(Number(value || 0));

  function session() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }

  function token() { return session()?.access_token || null; }

  async function get(base, path, protectedRoute = true) {
    const headers = { Accept: 'application/json' };
    if (protectedRoute) {
      const t = token();
      if (!t) throw Object.assign(new Error('Sign in required'), { status: 401 });
      headers.Authorization = `Bearer ${t}`;
    }
    const response = await fetch(base + path, { headers });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw Object.assign(new Error(body.error || `API ${response.status}`), { status: response.status });
    return body;
  }

  function mount() {
    const dashboard = document.getElementById('dashboardView');
    const existing = document.getElementById('crmExecutiveCommand');
    if (!dashboard || existing) return;

    const layout = dashboard.querySelector('.layout');
    if (!layout) return;

    const section = document.createElement('section');
    section.id = 'crmExecutiveCommand';
    section.className = 'crm-exec-command';
    section.innerHTML = `
      <div class="crm-exec-head">
        <div>
          <span class="crm-exec-eyebrow">B4N CRM · EXECUTIVE INTELLIGENCE</span>
          <h2>Business command centre</h2>
          <p>Operational truth, customer intelligence and first-party telemetry — separated by evidence level.</p>
        </div>
        <div class="crm-exec-statuses">
          <span id="crmOpsStatus" class="crm-status protected">Operational API · Protected</span>
          <span id="crmTelemetryStatus" class="crm-status protected">Telemetry · Protected</span>
          <span id="crmModelStatus" class="crm-status warming">CRM models · Warming up</span>
        </div>
      </div>

      <div class="crm-exec-kpis">
        ${kpi('crmExecRevenue','Booked revenue','Live operational source')}
        ${kpi('crmExecBookings','Bookings','Live operational source')}
        ${kpi('crmExecCustomers','Customers','Live operational source')}
        ${kpi('crmExecABV','Avg. booking value','Revenue ÷ bookings')}
        ${kpi('crmExecRfm','RFM evidence','Completed-visit evidence')}
        ${kpi('crmExecTelemetry','Admin telemetry','First-party event stream')}
      </div>

      <div class="crm-exec-grid">
        <article class="crm-exec-panel">
          <div class="crm-panel-head"><div><span>Customer & RFM</span><strong>Value and risk signals</strong></div><button type="button" data-open-hash="rfm">Open RFM →</button></div>
          <div id="crmCustomerSignals" class="crm-signal-list"><div class="crm-skeleton"></div><div class="crm-skeleton"></div><div class="crm-skeleton"></div></div>
        </article>

        <article class="crm-exec-panel">
          <div class="crm-panel-head"><div><span>Bookings</span><strong>Operational attention</strong></div><button type="button" data-open-hash="revenue">Open revenue →</button></div>
          <div id="crmBookingSignals" class="crm-signal-list"><div class="crm-skeleton"></div><div class="crm-skeleton"></div><div class="crm-skeleton"></div></div>
        </article>

        <article class="crm-exec-panel">
          <div class="crm-panel-head"><div><span>Salon operations</span><strong>Team & menu intelligence</strong></div><button type="button" data-open-sui>Open salon intelligence →</button></div>
          <div id="crmSalonSignals" class="crm-signal-list"><div class="crm-skeleton"></div><div class="crm-skeleton"></div><div class="crm-skeleton"></div></div>
        </article>

        <article class="crm-exec-panel crm-action-panel">
          <div class="crm-panel-head"><div><span>Priority queue</span><strong>Evidence-based next actions</strong></div><span id="crmActionCount" class="crm-count">—</span></div>
          <div id="crmPriorityActions" class="crm-action-list"><div class="crm-skeleton"></div><div class="crm-skeleton"></div></div>
        </article>
      </div>

      <div class="crm-readiness-strip">
        <div><span class="ready-dot live"></span><strong>Operational facts</strong><small>Live bookings, customers, revenue, staff</small></div>
        <div><span class="ready-dot live"></span><strong>First-party telemetry</strong><small>Customer + salon-user tracking connected</small></div>
        <div><span class="ready-dot warming"></span><strong>Derived intelligence</strong><small>RFM, LTV, churn and forecasts mature with history</small></div>
        <div><span class="ready-dot governed"></span><strong>Data integrity</strong><small>No fictional KPI values</small></div>
      </div>
    `;

    layout.parentNode.insertBefore(section, layout);
    bindNavigation(section);
    load();
  }

  function kpi(id, label, note) {
    return `<article class="crm-exec-kpi"><span>${esc(label)}</span><strong id="${id}">—</strong><small>${esc(note)}</small></article>`;
  }

  function bindNavigation(host) {
    host.querySelectorAll('[data-open-hash]').forEach(btn => btn.addEventListener('click', () => {
      const hash = btn.dataset.openHash;
      const target = document.querySelector(`[data-view="detail"][data-domain="${CSS.escape(hash)}"]`);
      target?.click();
    }));
    host.querySelector('[data-open-sui]')?.addEventListener('click', () => document.getElementById('salonUserIntelNav')?.click());
  }

  function set(id, value) {
    const node = document.getElementById(id);
    if (node) node.textContent = String(value ?? '—');
  }

  function status(id, text, kind = 'live') {
    const node = document.getElementById(id);
    if (!node) return;
    node.textContent = text;
    node.className = `crm-status ${kind}`;
  }

  function signal(label, value, note = '', kind = '') {
    return `<div class="crm-signal ${kind}"><div><span>${esc(label)}</span>${note ? `<small>${esc(note)}</small>` : ''}</div><strong>${esc(value)}</strong></div>`;
  }

  function action(level, title, detail, route = '') {
    const routeAttr = route ? ` data-action-route="${esc(route)}"` : '';
    return `<button type="button" class="crm-action ${esc(level)}"${routeAttr}><i></i><div><strong>${esc(title)}</strong><span>${esc(detail)}</span></div><b>→</b></button>`;
  }

  async function load() {
    const t = token();
    if (!t) {
      status('crmOpsStatus', 'Operational API · Sign in required', 'protected');
      status('crmTelemetryStatus', 'Telemetry · Sign in required', 'protected');
      renderSignedOut();
      return;
    }

    const tasks = await Promise.allSettled([
      get(INTELLIGENCE_API, '/api/v1/intelligence/overview'),
      get(INTELLIGENCE_API, '/api/v1/intelligence/revenue'),
      get(INTELLIGENCE_API, '/api/v1/intelligence/customers'),
      get(INTELLIGENCE_API, '/api/v1/intelligence/rfm'),
      get(INTELLIGENCE_API, '/api/v1/intelligence/staff'),
      get(INTELLIGENCE_API, '/api/v1/public/menu', false),
      get(SALON_USER_API, '/api/v1/salon-user/overview'),
      get(SALON_USER_API, '/api/v1/salon-user/menu')
    ]);

    const val = (i) => tasks[i].status === 'fulfilled' ? tasks[i].value : null;
    const overview = val(0), revenue = val(1), customers = val(2), rfm = val(3), staff = val(4), menu = val(5), sui = val(6), suiMenu = val(7);

    if (overview) {
      status('crmOpsStatus', 'Operational API · Live', 'live');
      set('crmExecRevenue', money(overview.revenue?.booked));
      set('crmExecBookings', overview.bookings?.total ?? 0);
      set('crmExecCustomers', overview.customers?.total ?? 0);
      set('crmExecABV', money(overview.revenue?.avg_booking_value));
    } else {
      status('crmOpsStatus', 'Operational API · Unavailable', 'error');
    }

    const rfmCount = Number(rfm?.customer_count_with_completed_visits || 0);
    set('crmExecRfm', rfmCount ? `${rfmCount} scored` : 'Limited');

    if (sui) {
      status('crmTelemetryStatus', sui.data_status === 'tracker_not_connected' ? 'Telemetry · Not connected' : 'Telemetry · Live', sui.data_status === 'tracker_not_connected' ? 'warming' : 'live');
      set('crmExecTelemetry', `${Number(sui.events || 0)} events`);
    } else {
      status('crmTelemetryStatus', 'Telemetry · API unavailable', 'error');
      set('crmExecTelemetry', 'Unavailable');
    }

    const derivedLive = rfmCount >= 10;
    status('crmModelStatus', derivedLive ? 'CRM models · Evidence growing' : 'CRM models · Warming up', derivedLive ? 'partial' : 'warming');

    renderCustomerSignals(customers, rfm);
    renderBookingSignals(overview, revenue);
    renderSalonSignals(staff, menu, sui, suiMenu);
    renderActions({ overview, customers, rfm, staff, sui, suiMenu });
  }

  function renderSignedOut() {
    ['crmExecRevenue','crmExecBookings','crmExecCustomers','crmExecABV','crmExecRfm','crmExecTelemetry'].forEach(id => set(id, 'Protected'));
    const message = '<div class="crm-empty"><strong>Staff sign-in required</strong><span>Executive intelligence is protected and never exposes customer data anonymously.</span></div>';
    ['crmCustomerSignals','crmBookingSignals','crmSalonSignals','crmPriorityActions'].forEach(id => {
      const node = document.getElementById(id); if (node) node.innerHTML = message;
    });
    set('crmActionCount', '0');
  }

  function renderCustomerSignals(customers, rfm) {
    const host = document.getElementById('crmCustomerSignals');
    if (!host) return;
    if (!customers && !rfm) { host.innerHTML = '<div class="crm-empty">Customer intelligence unavailable.</div>'; return; }
    const segments = rfm?.segments || {};
    host.innerHTML = [
      signal('Customer base', customers?.total ?? '—', 'Operational customer records'),
      signal('Risk flagged', customers?.risk_flagged ?? '—', 'Requires review, not automatic action', Number(customers?.risk_flagged || 0) > 0 ? 'attention' : ''),
      signal('With no-shows', customers?.with_no_shows ?? '—', 'Historical booking behavior'),
      signal('RFM: Champions', segments.champions ?? 0, 'Completed-visit evidence only'),
      signal('RFM: At risk', segments.at_risk ?? 0, 'Use only when evidence is sufficient', Number(segments.at_risk || 0) > 0 ? 'attention' : '')
    ].join('');
  }

  function renderBookingSignals(overview, revenue) {
    const host = document.getElementById('crmBookingSignals');
    if (!host) return;
    if (!overview) { host.innerHTML = '<div class="crm-empty">Booking intelligence unavailable.</div>'; return; }
    const s = overview.bookings?.status || {};
    host.innerHTML = [
      signal('Pending', Number(s.pending || 0), 'Bookings awaiting confirmation', Number(s.pending || 0) > 0 ? 'attention' : ''),
      signal('Confirmed', Number(s.confirmed || 0), 'Upcoming confirmed bookings'),
      signal('Completed', Number(s.completed || 0), 'Completed appointments'),
      signal('Cancelled', Number(s.cancelled || 0), 'Cancellation volume', Number(s.cancelled || 0) > 0 ? 'muted-alert' : ''),
      signal('Revenue observations', Array.isArray(revenue?.by_day) ? revenue.by_day.length : 0, 'Daily revenue trend rows')
    ].join('');
  }

  function renderSalonSignals(staff, menu, sui, suiMenu) {
    const host = document.getElementById('crmSalonSignals');
    if (!host) return;
    const top = staff?.staff?.[0];
    const counts = menu?.counts || {};
    const structure = suiMenu?.structure || sui?.latest_menu_structure || {};
    host.innerHTML = [
      signal('Top staff by revenue', top?.name || 'Not enough data', top ? money(top.revenue) : '—'),
      signal('Live services', counts.services ?? structure.active_services ?? '—', 'Current bookable menu'),
      signal('Add-on links', counts.addons ?? structure.addon_links ?? '—', 'Cross-sell configuration'),
      signal('Product links', counts.service_product_links ?? structure.product_links ?? '—', 'Service-to-product relationships'),
      signal('Admin errors · 30d', sui?.errors_30d ?? '—', 'First-party salon-user telemetry', Number(sui?.errors_30d || 0) > 0 ? 'attention' : '')
    ].join('');
  }

  function renderActions({ overview, customers, rfm, sui, suiMenu }) {
    const host = document.getElementById('crmPriorityActions');
    if (!host) return;
    const actions = [];
    const pending = Number(overview?.bookings?.status?.pending || 0);
    const risk = Number(customers?.risk_flagged || 0);
    const noShows = Number(customers?.with_no_shows || 0);
    const rfmCount = Number(rfm?.customer_count_with_completed_visits || 0);
    const errors = Number(sui?.errors_30d || 0);
    const insights = suiMenu?.optimization_insights || [];

    if (pending > 0) actions.push(action('high', `Review ${pending} pending booking${pending === 1 ? '' : 's'}`, 'Operational queue requires attention', 'revenue'));
    if (risk > 0) actions.push(action('medium', `Review ${risk} risk-flagged customer${risk === 1 ? '' : 's'}`, 'Use human review; do not automate adverse treatment', 'customers'));
    if (noShows > 0) actions.push(action('medium', `${noShows} customer${noShows === 1 ? '' : 's'} with no-show history`, 'Consider reminders or deposit policy based on business rules', 'customers'));
    if (rfmCount < 10) actions.push(action('info', 'Grow RFM evidence', `Only ${rfmCount} customer${rfmCount === 1 ? '' : 's'} currently have completed-visit evidence`, 'rfm'));
    if (errors > 0) actions.push(action('high', `Investigate ${errors} admin error event${errors === 1 ? '' : 's'}`, 'Salon-user telemetry detected errors', 'salon-user-intelligence'));
    insights.slice(0, 2).forEach(i => actions.push(action('info', i.title || 'Menu optimization opportunity', i.recommended_action || i.summary || 'Review menu configuration', 'salon-user-intelligence')));

    if (!actions.length) actions.push(action('good', 'No urgent evidence-based actions', 'Continue collecting telemetry and completed-visit history'));
    host.innerHTML = actions.slice(0, 6).join('');
    set('crmActionCount', actions.length);

    host.querySelectorAll('[data-action-route]').forEach(btn => btn.addEventListener('click', () => {
      const route = btn.dataset.actionRoute;
      if (route === 'salon-user-intelligence') document.getElementById('salonUserIntelNav')?.click();
      else document.querySelector(`[data-view="detail"][data-domain="${CSS.escape(route)}"]`)?.click();
    }));
  }

  // Reload when staff auth changes in the existing CRM UI.
  window.addEventListener('storage', e => { if (e.key === STORAGE_KEY) setTimeout(load, 50); });
  document.getElementById('authButton')?.addEventListener('click', () => setTimeout(load, 1200));

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount);
  else mount();

  window.B4NExecutiveCRM = { reload: load };
})();

/* ===== B4N CRM top pill navigation ===== */
(() => {
  'use strict';

  const BOOK4NOW_ADMIN_URL = 'https://book4now.lovable.app/admin';

  function clickSidebar(selector) {
    const target = document.querySelector(selector);
    if (!target) return false;
    target.click();
    return true;
  }

  function setActive(buttons, activeButton) {
    buttons.forEach(btn => btn.classList.toggle('active', btn === activeButton));
  }

  function closeMoreMenu() {
    document.getElementById('b4nTopMoreMenu')?.remove();
  }

  function openMoreMenu(button) {
    closeMoreMenu();

    const menu = document.createElement('div');
    menu.id = 'b4nTopMoreMenu';
    menu.setAttribute('role', 'menu');

    Object.assign(menu.style, {
      position: 'fixed',
      zIndex: '9999',
      minWidth: '220px',
      padding: '8px',
      background: '#fff',
      border: '1px solid #e5e7eb',
      borderRadius: '14px',
      boxShadow: '0 16px 40px rgba(15,23,42,.14)'
    });

    const items = [
      ['Revenue Intelligence', '[data-view="detail"][data-domain="revenue"]'],
      ['RFM & Segments', '[data-view="detail"][data-domain="rfm"]'],
      ['Behavior Analytics', '[data-view="detail"][data-domain="behavior"]'],
      ['Geo Analytics', '[data-view="geo"]'],
      ['Salon User Intelligence', '#salonUserIntelNav']
    ];

    items.forEach(([label, selector]) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.textContent = label;
      item.setAttribute('role', 'menuitem');

      Object.assign(item.style, {
        display: 'block',
        width: '100%',
        padding: '10px 12px',
        border: '0',
        borderRadius: '9px',
        background: 'transparent',
        color: '#0f172a',
        textAlign: 'left',
        cursor: 'pointer',
        font: 'inherit'
      });

      item.addEventListener('mouseenter', () => item.style.background = '#f1f5f9');
      item.addEventListener('mouseleave', () => item.style.background = 'transparent');
      item.addEventListener('click', () => {
        closeMoreMenu();
        clickSidebar(selector);
      });

      menu.appendChild(item);
    });

    document.body.appendChild(menu);

    const rect = button.getBoundingClientRect();
    const menuWidth = 220;
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 12);
    menu.style.left = `${Math.max(12, left)}px`;
    menu.style.top = `${rect.bottom + 8}px`;
  }

  function bindTopPills() {
    const nav = document.querySelector('.pill-nav');
    if (!nav || nav.dataset.b4nBound === 'true') return;

    const buttons = [...nav.querySelectorAll('button')];
    if (buttons.length < 6) return;

    nav.dataset.b4nBound = 'true';

    const [dashboard, calendar, customers, team, reports, more] = buttons;

    dashboard.addEventListener('click', () => {
      closeMoreMenu();
      clickSidebar('[data-view="dashboard"]');
      setActive(buttons, dashboard);
    });

    calendar.addEventListener('click', () => {
      closeMoreMenu();
      window.open(BOOK4NOW_ADMIN_URL, '_blank', 'noopener,noreferrer');
    });

    customers.addEventListener('click', () => {
      closeMoreMenu();
      clickSidebar('[data-view="detail"][data-domain="customers"]');
      setActive(buttons, customers);
    });

    team.addEventListener('click', () => {
      closeMoreMenu();
      clickSidebar('[data-view="detail"][data-domain="workforce"]');
      setActive(buttons, team);
    });

    reports.addEventListener('click', () => {
      closeMoreMenu();
      clickSidebar('[data-view="analytics"]');
      setActive(buttons, reports);
    });

    more.addEventListener('click', (event) => {
      event.stopPropagation();
      const isOpen = !!document.getElementById('b4nTopMoreMenu');
      if (isOpen) closeMoreMenu();
      else openMoreMenu(more);
    });

    document.addEventListener('click', (event) => {
      const menu = document.getElementById('b4nTopMoreMenu');
      if (menu && !menu.contains(event.target) && event.target !== more) closeMoreMenu();
    });

    window.addEventListener('resize', closeMoreMenu);
    window.addEventListener('scroll', closeMoreMenu, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTopPills, { once: true });
  } else {
    bindTopPills();
  }
})();

