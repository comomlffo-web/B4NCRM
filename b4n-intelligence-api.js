var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.ts
var VERSION = "1.0.0";
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
__name(nowIso, "nowIso");
function num(v) {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
}
__name(num, "num");
function round(v, p = 4) {
  const m = 10 ** p;
  return Math.round(v * m) / m;
}
__name(round, "round");
function dayName(s) {
  return new Intl.DateTimeFormat("en-US", { weekday: "long", timeZone: "Asia/Colombo" }).format(new Date(s));
}
__name(dayName, "dayName");
function hourColombo(s) {
  const parts = new Intl.DateTimeFormat("en-US", { hour: "2-digit", hourCycle: "h23", timeZone: "Asia/Colombo" }).formatToParts(new Date(s));
  return Number(parts.find((x) => x.type === "hour")?.value ?? 0);
}
__name(hourColombo, "hourColombo");
function dateColombo(s) {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Colombo" }).format(new Date(s));
}
__name(dateColombo, "dateColombo");
function timeBand(hour) {
  if (hour < 9) return "early_morning";
  if (hour < 12) return "morning";
  if (hour < 14) return "midday";
  if (hour < 17) return "afternoon";
  if (hour < 20) return "evening";
  return "late_evening";
}
__name(timeBand, "timeBand");
function meta(extra = {}) {
  return { api_version: VERSION, generated_at: nowIso(), timezone: "Asia/Colombo", methodology_version: "1.0", ...extra };
}
__name(meta, "meta");
function corsHeaders(request, env) {
  const origin = request.headers.get("Origin") || "";
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map((x) => x.trim()).filter(Boolean);
  const allowOrigin = !origin ? "*" : allowed.includes(origin) ? origin : "";
  return {
    "Access-Control-Allow-Origin": allowOrigin || "null",
    "Vary": "Origin",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
}
__name(corsHeaders, "corsHeaders");
function jsonResponse(request, env, body, status = 200) {
  return new Response(JSON.stringify(body, null, 2), { status, headers: corsHeaders(request, env) });
}
__name(jsonResponse, "jsonResponse");
function hasUserJwt(request) {
  const h = request.headers.get("Authorization") || "";
  return /^Bearer\s+[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/.test(h);
}
__name(hasUserJwt, "hasUserJwt");

const B4N_CRM_SUPER_ADMIN_EMAIL = "comomlffo@gmail.com";

async function assertB4NCRMSuperAdmin(request, env) {
  if (!hasUserJwt(request)) {
    throw new Response(JSON.stringify({ error: "authentication_required" }), {
      status: 401, headers: corsHeaders(request, env)
    });
  }
  const authorization = request.headers.get("Authorization");
  const userRes = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: authorization, Accept: "application/json" }
  });
  if (!userRes.ok) {
    throw new Response(JSON.stringify({ error: "invalid_session" }), {
      status: 401, headers: corsHeaders(request, env)
    });
  }
  const user = await userRes.json();
  const email = String(user?.email || "").trim().toLowerCase();
  if (!user?.id || email !== B4N_CRM_SUPER_ADMIN_EMAIL) {
    throw new Response(JSON.stringify({ error: "super_admin_required" }), {
      status: 403, headers: corsHeaders(request, env)
    });
  }
  const rolesRes = await fetch(
    `${env.SUPABASE_URL}/rest/v1/user_roles?select=role&user_id=eq.${encodeURIComponent(user.id)}`,
    { headers: { apikey: env.SUPABASE_PUBLISHABLE_KEY, Authorization: authorization, Accept: "application/json" } }
  );
  if (!rolesRes.ok) {
    throw new Response(JSON.stringify({ error: "role_verification_failed" }), {
      status: 403, headers: corsHeaders(request, env)
    });
  }
  const roles = await rolesRes.json();
  if (!(roles || []).some(row => String(row.role) === "super_admin")) {
    throw new Response(JSON.stringify({ error: "super_admin_required" }), {
      status: 403, headers: corsHeaders(request, env)
    });
  }
  return { user_id: String(user.id), email, role: "super_admin" };
}
__name(assertB4NCRMSuperAdmin, "assertB4NCRMSuperAdmin");

async function crmRpc(env, fn, payload) {
  if (!env.CRM_SUPABASE_URL || !env.CRM_SERVICE_ROLE_KEY) {
    throw new Response(JSON.stringify({ error: "crm_backend_not_configured" }), {
      status: 503, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" }
    });
  }
  const response = await fetch(`${env.CRM_SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: env.CRM_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${env.CRM_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`CRM RPC ${response.status}: ${detail}`);
  }
  return await response.json();
}
__name(crmRpc, "crmRpc");

async function customerWorkspace(request, env) {
  await assertB4NCRMSuperAdmin(request, env);
  const salonId = String(env.CRM_SALON_ID || "").trim();
  if (!salonId) {
    throw new Response(JSON.stringify({ error: "crm_salon_not_configured" }), {
      status: 503, headers: corsHeaders(request, env)
    });
  }
  return crmRpc(env, "b4n_customer_intelligence_workspace", { p_salon_id: salonId });
}
__name(customerWorkspace, "customerWorkspace");

async function supabase(request, env, path, authenticated = false) {
  if (authenticated && !hasUserJwt(request)) {
    throw new Response(JSON.stringify({ error: "authentication_required" }), { status: 401, headers: corsHeaders(request, env) });
  }
  const headers = {
    apikey: env.SUPABASE_PUBLISHABLE_KEY,
    Accept: "application/json"
  };
  if (authenticated) headers.Authorization = request.headers.get("Authorization");
  const res = await fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Supabase ${res.status}: ${detail}`);
  }
  return await res.json();
}
__name(supabase, "supabase");
async function publicSalon(request, env) {
  const rows = await supabase(
    request,
    env,
    "salon_settings?select=id,salon_name,business_name,address,business_area,postal_code,latitude,longitude,google_maps_url,timezone,currency"
  );
  return { meta: meta({ data_status: "complete" }), salons: rows };
}
__name(publicSalon, "publicSalon");
async function publicServices(request, env) {
  const rows = await supabase(
    request,
    env,
    "services?select=id,name,price,category_id,duration_min,active,featured,is_addon,short_description,audience,sort_order&active=eq.true&order=sort_order.asc"
  );
  return { meta: meta({ data_status: "complete" }), services: rows };
}
__name(publicServices, "publicServices");
async function publicGeo(request, env) {
  const s = await publicSalon(request, env);
  return {
    meta: s.meta,
    salons: s.salons.map((x) => ({
      salon_id: x.id,
      salon_name: x.salon_name,
      business_name: x.business_name,
      address: x.address,
      area: x.business_area,
      postal_code: x.postal_code,
      latitude: x.latitude == null ? null : num(x.latitude),
      longitude: x.longitude == null ? null : num(x.longitude),
      google_maps_url: x.google_maps_url
    }))
  };
}
__name(publicGeo, "publicGeo");
async function loadProtected(request, env) {
  const [appointments, customers, services, specialists, segments, products] = await Promise.all([
    supabase(request, env, "appointments?select=id,customer_id,service_id,specialist_id,start_at,status,source,price,total_price,created_at,completed_at,cancelled_at,payment_status", true),
    supabase(request, env, "customers?select=id,first_visit,no_show_count,risk_flag,created_at,loyalty_points,visit_count", true),
    supabase(request, env, "services?select=id,name,price,category_id,duration_min,active,featured,is_addon,short_description,audience,sort_order", true),
    supabase(request, env, "specialists?select=id,name,role,active", true),
    supabase(request, env, "booking_service_segments?select=appointment_id,service_id,specialist_id,start_at,end_at,sort_order", true),
    supabase(request, env, "booking_products?select=booking_id,product_id,quantity,price_at_time,name_at_time", true)
  ]);
  return { appointments, customers, services, specialists, segments, products };
}
__name(loadProtected, "loadProtected");
function statusCounts(appts) {
  const out = {};
  for (const a of appts) out[a.status] = (out[a.status] || 0) + 1;
  return out;
}
__name(statusCounts, "statusCounts");
function sourceCounts(appts) {
  const out = {};
  for (const a of appts) out[a.source] = (out[a.source] || 0) + 1;
  return out;
}
__name(sourceCounts, "sourceCounts");
function apptValue(a) {
  return num(a.total_price) || num(a.price);
}
__name(apptValue, "apptValue");
async function overview(request, env) {
  const d = await loadProtected(request, env);
  const completed = d.appointments.filter((a) => a.status === "completed");
  const cancelled = d.appointments.filter((a) => a.status === "cancelled");
  const bookedRevenue = d.appointments.reduce((s, a) => s + apptValue(a), 0);
  const completedRevenue = completed.reduce((s, a) => s + apptValue(a), 0);
  return {
    meta: meta({ data_status: "complete" }),
    bookings: {
      total: d.appointments.length,
      status: statusCounts(d.appointments),
      source: sourceCounts(d.appointments),
      cancellation_rate: d.appointments.length ? round(cancelled.length / d.appointments.length) : 0
    },
    customers: {
      total: d.customers.length,
      first_visit_flagged: d.customers.filter((c) => c.first_visit).length,
      risk_flagged: d.customers.filter((c) => c.risk_flag).length
    },
    revenue: {
      booked: round(bookedRevenue, 2),
      completed: round(completedRevenue, 2),
      avg_booking_value: d.appointments.length ? round(bookedRevenue / d.appointments.length, 2) : 0,
      currency: "LKR"
    },
    conversion: { rate: null, data_status: "insufficient_event_data", reason: "service views and booking-start events are not recorded in Lovable operational tables" },
    abandonment: { rate: null, data_status: "insufficient_event_data", reason: "abandoned sessions are not recorded in Lovable operational tables" },
    device_usage: { data_status: "insufficient_event_data", reason: "device context is not recorded in Lovable operational tables" }
  };
}
__name(overview, "overview");
async function revenue(request, env) {
  const d = await loadProtected(request, env);
  const serviceMap = new Map(d.services.map((x) => [x.id, x.name]));
  const staffMap = new Map(d.specialists.map((x) => [x.id, x.name]));
  const byService = /* @__PURE__ */ new Map();
  const byStaff = /* @__PURE__ */ new Map();
  const byDay = /* @__PURE__ */ new Map();
  let booked = 0, completed = 0;
  for (const a of d.appointments) {
    const v = apptValue(a);
    booked += v;
    if (a.status === "completed") completed += v;
    const sn = serviceMap.get(a.service_id) || a.service_id;
    byService.set(sn, (byService.get(sn) || 0) + v);
    if (a.specialist_id) {
      const st = staffMap.get(a.specialist_id) || a.specialist_id;
      byStaff.set(st, (byStaff.get(st) || 0) + v);
    }
    const day = dateColombo(a.start_at);
    byDay.set(day, (byDay.get(day) || 0) + v);
  }
  const sortMap = /* @__PURE__ */ __name((m) => [...m.entries()].map(([name, value]) => ({ name, value: round(value, 2) })).sort((a, b) => b.value - a.value), "sortMap");
  return {
    meta: meta({ data_status: "complete", currency: "LKR" }),
    totals: { booked: round(booked, 2), completed: round(completed, 2), avg_booking_value: d.appointments.length ? round(booked / d.appointments.length, 2) : 0 },
    by_service: sortMap(byService),
    by_staff: sortMap(byStaff),
    by_day: [...byDay.entries()].map(([date, value]) => ({ date, value: round(value, 2) })).sort((a, b) => a.date.localeCompare(b.date))
  };
}
__name(revenue, "revenue");
async function customersEndpoint(request, env) {
  const d = await loadProtected(request, env);
  const visitBuckets = { "0": 0, "1": 0, "2-4": 0, "5-9": 0, "10+": 0 };
  for (const c of d.customers) {
    const v = c.visit_count || 0;
    if (v === 0) visitBuckets["0"]++;
    else if (v === 1) visitBuckets["1"]++;
    else if (v < 5) visitBuckets["2-4"]++;
    else if (v < 10) visitBuckets["5-9"]++;
    else visitBuckets["10+"]++;
  }
  return {
    meta: meta({ data_status: "complete" }),
    total: d.customers.length,
    first_visit_flagged: d.customers.filter((c) => c.first_visit).length,
    risk_flagged: d.customers.filter((c) => c.risk_flag).length,
    with_no_shows: d.customers.filter((c) => c.no_show_count > 0).length,
    visit_distribution: visitBuckets
  };
}
__name(customersEndpoint, "customersEndpoint");
function scoreByRank(values, value, reverse = false) {
  if (!values.length) return 1;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = sorted.findIndex((x) => x >= value);
  const pos = idx < 0 ? sorted.length - 1 : idx;
  let score = Math.min(5, Math.max(1, Math.floor(pos / Math.max(1, sorted.length - 1) * 5) + 1));
  if (reverse) score = 6 - score;
  return score;
}
__name(scoreByRank, "scoreByRank");
function rfmSegment(r, f, m) {
  if (r >= 4 && f >= 4 && m >= 4) return "champions";
  if (r >= 3 && f >= 4) return "loyal";
  if (r >= 4 && f <= 2) return "promising";
  if (r <= 2 && f >= 4 && m >= 4) return "cannot_lose";
  if (r <= 2 && (f >= 3 || m >= 3)) return "at_risk";
  if (r <= 2 && f <= 2) return "hibernating";
  return "potential_loyalist";
}
__name(rfmSegment, "rfmSegment");
async function rfm(request, env) {
  const d = await loadProtected(request, env);
  const completed = d.appointments.filter((a) => a.status === "completed" && a.completed_at);
  const byCustomer = /* @__PURE__ */ new Map();
  for (const a of completed) {
    const t = new Date(a.completed_at || a.start_at).getTime();
    const x = byCustomer.get(a.customer_id) || { last: 0, freq: 0, mon: 0 };
    x.last = Math.max(x.last, t);
    x.freq++;
    x.mon += apptValue(a);
    byCustomer.set(a.customer_id, x);
  }
  const now = Date.now();
  const rows = [...byCustomer.entries()].map(([customer_id, x]) => ({
    customer_id,
    recency_days: Math.max(0, Math.floor((now - x.last) / 864e5)),
    frequency: x.freq,
    monetary: round(x.mon, 2)
  }));
  const rs = rows.map((x) => x.recency_days), fs = rows.map((x) => x.frequency), ms = rows.map((x) => x.monetary);
  const segments = {};
  const scored = rows.map((x) => {
    const r = scoreByRank(rs, x.recency_days, true), f = scoreByRank(fs, x.frequency), m = scoreByRank(ms, x.monetary);
    const segment = rfmSegment(r, f, m);
    segments[segment] = (segments[segment] || 0) + 1;
    return { ...x, r_score: r, f_score: f, m_score: m, rfm_code: `${r}${f}${m}`, segment };
  });
  return {
    meta: meta({
      data_status: completed.length >= 10 ? "complete" : "limited_evidence",
      evidence_count: completed.length,
      warning: completed.length < 10 ? "RFM is structurally valid but current completed-appointment sample is small." : void 0
    }),
    customer_count_with_completed_visits: scored.length,
    segments,
    customers: scored
  };
}
__name(rfm, "rfm");
async function peakTimes(request, env) {
  const d = await loadProtected(request, env);
  function summarize(items, field) {
    const byDay = {}, byHour = {}, byBand = {};
    for (const a of items) {
      const s = a[field];
      const day = dayName(s), hr = hourColombo(s), band = timeBand(hr);
      byDay[day] = (byDay[day] || 0) + 1;
      byHour[String(hr)] = (byHour[String(hr)] || 0) + 1;
      byBand[band] = (byBand[band] || 0) + 1;
    }
    const top = /* @__PURE__ */ __name((o) => Object.entries(o).sort((a, b) => b[1] - a[1])[0] || [null, 0], "top");
    return { by_day: byDay, by_hour: byHour, by_time_band: byBand, peak_day: top(byDay)[0], peak_hour: top(byHour)[0], peak_time_band: top(byBand)[0] };
  }
  __name(summarize, "summarize");
  return { meta: meta({ data_status: "complete" }), booking_creation: summarize(d.appointments, "created_at"), appointment_demand: summarize(d.appointments, "start_at") };
}
__name(peakTimes, "peakTimes");
async function menuStructure(request, env) {
  const [services, addons, suggestions, serviceProducts] = await Promise.all([
    supabase(request, env, "services?select=id,name,price,category_id,duration_min,active,featured,is_addon,short_description,audience,sort_order&order=sort_order.asc"),
    supabase(request, env, "service_addon_links?select=*"),
    supabase(request, env, "service_suggestion_links?select=*"),
    supabase(request, env, "service_products?select=*")
  ]);
  const priceGroups = {};
  const durationGroups = {};
  for (const s of services) {
    const p = num(s.price);
    const pk = p < 3e3 ? "under_3000" : p < 6e3 ? "3000_5999" : p < 1e4 ? "6000_9999" : "10000_plus";
    priceGroups[pk] = (priceGroups[pk] || 0) + 1;
    const d = s.duration_min;
    const dk = d <= 30 ? "0_30" : d <= 60 ? "31_60" : d <= 120 ? "61_120" : "120_plus";
    durationGroups[dk] = (durationGroups[dk] || 0) + 1;
  }
  return {
    meta: meta({ data_status: "complete" }),
    counts: { services: services.length, addons: addons.length, suggestions: suggestions.length, service_product_links: serviceProducts.length },
    price_distribution: priceGroups,
    duration_distribution: durationGroups,
    services,
    relationships: { addons, suggestions, service_products: serviceProducts },
    behavioral_confusion: { data_status: "insufficient_event_data", reason: "menu navigation/backtrack events are not yet collected" }
  };
}
__name(menuStructure, "menuStructure");
function pairKey(a, b) {
  return a < b ? `${a}|||${b}` : `${b}|||${a}`;
}
__name(pairKey, "pairKey");
async function combinations(request, env) {
  const d = await loadProtected(request, env);
  const serviceName = new Map(d.services.map((s) => [s.id, s.name]));
  const byAppt = /* @__PURE__ */ new Map();
  for (const s of d.segments) {
    if (!byAppt.has(s.appointment_id)) byAppt.set(s.appointment_id, /* @__PURE__ */ new Set());
    byAppt.get(s.appointment_id).add(s.service_id);
  }
  const pairCount = /* @__PURE__ */ new Map(), serviceCount = /* @__PURE__ */ new Map();
  for (const set of byAppt.values()) {
    const ids = [...set];
    ids.forEach((x) => serviceCount.set(x, (serviceCount.get(x) || 0) + 1));
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const k = pairKey(ids[i], ids[j]);
      pairCount.set(k, (pairCount.get(k) || 0) + 1);
    }
  }
  const n = Math.max(1, byAppt.size);
  const service_service = [...pairCount.entries()].map(([k, c]) => {
    const [a, b] = k.split("|||");
    const support = c / n;
    const confA = c / (serviceCount.get(a) || 1);
    const confB = c / (serviceCount.get(b) || 1);
    const lift = support / ((serviceCount.get(a) || 0) / n * ((serviceCount.get(b) || 0) / n) || 1);
    return { items: [serviceName.get(a) || a, serviceName.get(b) || b], frequency: c, support: round(support), confidence_a_to_b: round(confA), confidence_b_to_a: round(confB), lift: round(lift) };
  }).sort((a, b) => b.frequency - a.frequency);
  const productsByBooking = /* @__PURE__ */ new Map();
  for (const p of d.products) {
    if (!productsByBooking.has(p.booking_id)) productsByBooking.set(p.booking_id, []);
    productsByBooking.get(p.booking_id).push(p);
  }
  const sp = /* @__PURE__ */ new Map();
  for (const [appt, svcs] of byAppt) {
    const prods = productsByBooking.get(appt) || [];
    for (const sid of svcs) for (const p of prods) {
      const key = `${sid}|||${p.product_id}|||${p.name_at_time || ""}`;
      sp.set(key, (sp.get(key) || 0) + 1);
    }
  }
  const service_product = [...sp.entries()].map(([k, c]) => {
    const [sid, pid, pname] = k.split("|||");
    return { service: serviceName.get(sid) || sid, product: pname || pid, frequency: c };
  }).sort((a, b) => b.frequency - a.frequency);
  return { meta: meta({ data_status: "complete" }), service_service, service_product };
}
__name(combinations, "combinations");
async function staff(request, env) {
  const d = await loadProtected(request, env);
  const names = new Map(d.specialists.map((x) => [x.id, x.name]));
  const out = /* @__PURE__ */ new Map();
  for (const a of d.appointments) {
    if (!a.specialist_id) continue;
    const x = out.get(a.specialist_id) || { bookings: 0, completed: 0, cancelled: 0, revenue: 0 };
    x.bookings++;
    if (a.status === "completed") x.completed++;
    if (a.status === "cancelled") x.cancelled++;
    x.revenue += apptValue(a);
    out.set(a.specialist_id, x);
  }
  return { meta: meta({ data_status: "complete" }), staff: [...out.entries()].map(([id, x]) => ({ staff_id: id, name: names.get(id) || id, ...x, revenue: round(x.revenue, 2), completion_rate: x.bookings ? round(x.completed / x.bookings) : 0, cancellation_rate: x.bookings ? round(x.cancelled / x.bookings) : 0 })).sort((a, b) => b.revenue - a.revenue) };
}
__name(staff, "staff");
async function eventStatus(request, env, type) {
  if (!env.ANALYTICS_DB) return { meta: meta({ data_status: "insufficient_event_data" }), type, reason: "Cloudflare D1 ANALYTICS_DB is not configured yet." };
  const c = await env.ANALYTICS_DB.prepare("SELECT COUNT(*) n FROM behavior_events").first();
  if (!c?.n) return { meta: meta({ data_status: "insufficient_event_data" }), type, reason: "Behavior event store is enabled but contains no events yet." };
  return { meta: meta({ data_status: "available", event_count: c.n }), type };
}
__name(eventStatus, "eventStatus");
async function ingestEvent(request, env) {
  if (!env.ANALYTICS_DB) return { status: 503, body: { error: "behavior_event_store_not_configured" } };
  let body;
  try {
    body = await request.json();
  } catch {
    return { status: 400, body: { error: "invalid_json" } };
  }
  const allowedNames = /* @__PURE__ */ new Set(["session_started", "page_viewed", "menu_opened", "category_viewed", "service_viewed", "service_selected", "service_backtracked", "service_compared", "specialist_viewed", "specialist_selected", "date_viewed", "date_selected", "time_slot_viewed", "time_slot_selected", "availability_checked", "availability_failed", "booking_started", "booking_completed", "booking_abandoned", "product_viewed", "product_added", "product_removed", "session_ended"]);
  if (!body?.event_name || !allowedNames.has(body.event_name) || !body?.session_id) return { status: 400, body: { error: "invalid_event" } };
  const eventId = body.event_id || crypto.randomUUID(), occurred = body.occurred_at || nowIso();
  const props = JSON.stringify(body.properties || {});
  if (props.length > 1e4) return { status: 413, body: { error: "properties_too_large" } };
  await env.ANALYTICS_DB.prepare(`INSERT OR IGNORE INTO behavior_events
  (event_id,session_id,anonymous_id,customer_id,salon_id,branch_id,event_name,event_category,page,screen,menu_level,category_id,service_id,specialist_id,product_id,previous_item,current_item,device_type,os,browser,occurred_at,properties_json,received_at)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(eventId, body.session_id, body.anonymous_id || null, body.customer_id || null, body.salon_id || null, body.branch_id || null, body.event_name, body.event_category || "behavior", body.page || null, body.screen || null, body.menu_level ?? null, body.category_id || null, body.service_id || null, body.specialist_id || null, body.product_id || null, body.previous_item || null, body.current_item || null, body.device_type || null, body.os || null, body.browser || null, occurred, props, nowIso()).run();
  return { status: 202, body: { accepted: true, event_id: eventId } };
}
__name(ingestEvent, "ingestEvent");
var index_default = {
  async fetch(request, env) {
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    const url = new URL(request.url), p = url.pathname.replace(/\/+$/, "") || "/";
    try {
      if (p === "/health") return jsonResponse(request, env, { status: "ok", service: "b4n-intelligence-api", version: VERSION, time: nowIso() });
      if (request.method === "POST" && p === "/api/v1/events") {
        const r = await ingestEvent(request, env);
        return jsonResponse(request, env, r.body, r.status);
      }
      if (request.method !== "GET") return jsonResponse(request, env, { error: "method_not_allowed" }, 405);
      if (p === "/api/v1/crm/customer-workspace") return jsonResponse(request, env, await customerWorkspace(request, env));
      if (p === "/api/v1/public/salon") return jsonResponse(request, env, await publicSalon(request, env));
      if (p === "/api/v1/public/services") return jsonResponse(request, env, await publicServices(request, env));
      if (p === "/api/v1/public/geo") return jsonResponse(request, env, await publicGeo(request, env));
      if (p === "/api/v1/public/menu") return jsonResponse(request, env, await menuStructure(request, env));
      if (p === "/api/v1/intelligence/overview") return jsonResponse(request, env, await overview(request, env));
      if (p === "/api/v1/intelligence/revenue") return jsonResponse(request, env, await revenue(request, env));
      if (p === "/api/v1/intelligence/customers") return jsonResponse(request, env, await customersEndpoint(request, env));
      if (p === "/api/v1/intelligence/rfm") return jsonResponse(request, env, await rfm(request, env));
      if (p === "/api/v1/intelligence/peak-times") return jsonResponse(request, env, await peakTimes(request, env));
      if (p === "/api/v1/intelligence/menu/structure") return jsonResponse(request, env, await menuStructure(request, env));
      if (p === "/api/v1/intelligence/menu/combinations") return jsonResponse(request, env, await combinations(request, env));
      if (p === "/api/v1/intelligence/staff") return jsonResponse(request, env, await staff(request, env));
      if (p === "/api/v1/intelligence/navigation") return jsonResponse(request, env, await eventStatus(request, env, "navigation"));
      if (p === "/api/v1/intelligence/menu/transitions") return jsonResponse(request, env, await eventStatus(request, env, "menu_transitions"));
      if (p === "/api/v1/intelligence/menu/sequences") return jsonResponse(request, env, await eventStatus(request, env, "menu_sequences"));
      if (p === "/api/v1/intelligence/conversion") return jsonResponse(request, env, await eventStatus(request, env, "conversion"));
      if (p === "/api/v1/intelligence/abandonment") return jsonResponse(request, env, await eventStatus(request, env, "abandonment"));
      if (p === "/api/v1/intelligence/devices") return jsonResponse(request, env, await eventStatus(request, env, "device_usage"));
      if (p === "/api/v1/intelligence/behavior") return jsonResponse(request, env, await eventStatus(request, env, "behavior"));
      if (p === "/api/v1/intelligence/motivation") return jsonResponse(request, env, await eventStatus(request, env, "motivation"));
      return jsonResponse(request, env, { error: "not_found", path: p }, 404);
    } catch (err) {
      if (err instanceof Response) return err;
      console.error(err);
      return jsonResponse(request, env, { error: "upstream_error", message: String(err?.message || err) }, 502);
    }
  }
};
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
