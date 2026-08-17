console.info('B4N CRM auth hotfix 2 loaded');
const API_BASE='https://b4n-intelligence-api.comomlffo.workers.dev';
const SUPABASE_URL='https://wazhhgcjrstfrxbwtcvj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_6Z-PWJ-Jnq2GJx_o5atuYw_o58DKlNX';
const AUTH_STORAGE_KEY='b4n_crm_staff_session';
const STAFF_ROLES=['super_admin','admin','manager','specialist','worker'];

const supabaseAuthClient = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY,{
      auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}
    })
  : null;
const CRM_REDIRECT_URL='https://b4ncrm.comomlffo.workers.dev/';


const barChart=document.getElementById('barChart');

document.getElementById('menuBtn')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
    e.preventDefault();document.getElementById('globalSearch')?.focus()
  }
});

// ===== View switching =====
const dashboardView=document.getElementById('dashboardView');
const geoView=document.getElementById('geoView');
const analyticsView=document.getElementById('analyticsView');
const detailView=document.getElementById('detailView');
const viewLinks=[...document.querySelectorAll('[data-view]')];

function hideAllViews(){
  [dashboardView,geoView,analyticsView,detailView].forEach(v=>v?.classList.remove('active-view'));
}
function showView(view,domain=null){
  hideAllViews();
  if(view==='dashboard') dashboardView?.classList.add('active-view');
  if(view==='geo') geoView?.classList.add('active-view');
  if(view==='analytics') analyticsView?.classList.add('active-view');
  if(view==='detail'){
    detailView?.classList.add('active-view');
    if(domain) renderAnalyticsDetail(domain);
  }
  viewLinks.forEach(a=>{
    const active = view==='detail'
      ? a.dataset.view==='detail' && a.dataset.domain===domain
      : a.dataset.view===view;
    a.classList.toggle('active',active)
  });
  if(view==='geo') window.setTimeout(()=>window.dispatchEvent(new Event('resize')),50);
  window.scrollTo({top:0,behavior:'smooth'});
}
viewLinks.forEach(a=>a.addEventListener('click',e=>{
  if(!a.dataset.view)return;
  e.preventDefault();
  const view=a.dataset.view;
  const domain=a.dataset.domain||null;
  showView(view,domain);
  history.replaceState(null,'',a.getAttribute('href')||'#dashboard');
}));
document.getElementById('backToAnalytics')?.addEventListener('click',()=>{showView('analytics');history.replaceState(null,'','#analytics')});

function routeFromHash(){
  const hash=location.hash.replace('#','');
  if(hash==='geo')return showView('geo');
  if(hash==='analytics')return showView('analytics');
  if(hash==='executive'||hash==='dashboard')return showView('dashboard');
  if(ANALYTICS_DOMAINS[hash])return showView('detail',hash);
  return showView('dashboard');
}



// ===== Complete B4N analytics catalogue =====
const ANALYTICS_DOMAINS={
  executive:{
    title:'Executive Dashboard',eyebrow:'BUSINESS COMMAND CENTRE',status:'protected',
    description:'Live top-line business performance with revenue, bookings, customers, ABV, service catalogue, RFM, staff and booking status.',
    readiness:'The executive dashboard is already connected to the live Intelligence API after staff sign-in. Event-derived widgets remain explicitly marked when historical telemetry is unavailable.',
    features:[
      ['Revenue','Booked revenue and daily trend'],
      ['Bookings','Volume and booking status'],
      ['Customers','Customer totals and intelligence'],
      ['Average Booking Value','Booked revenue ÷ bookings'],
      ['RFM summary','Live scored-customer segment snapshot'],
      ['Staff performance','Live staff booking/revenue performance'],
      ['Service catalogue','Live services and menu relationships'],
      ['Data integrity','No fictional KPI values']
    ]
  },
  customers:{
    title:'Customer Intelligence',eyebrow:'CUSTOMER 360',status:'protected',
    description:'Global customer profile + salon relationship intelligence without exposing unnecessary PII.',
    readiness:'Live operational customer counts are available now. Full Customer 360 enriches this with service/staff/time/channel/product affinities, churn, LTV and next-best-action from the CRM intelligence database.',
    endpoint:'/api/v1/intelligence/customers',
    features:[
      ['Customer 360','Global identity + salon-specific relationship'],
      ['Visit & value profile','Visits, spend, ABV, first/last visit'],
      ['Affinities','Service, staff, time, channel and product affinity'],
      ['Risk & prediction','Churn, no-show, LTV and predicted next visit'],
      ['Next Best Action','Who + what + when + where + staff + channel'],
      ['Customer continuity','Cross-visit relationship and retention intelligence']
    ]
  },
  revenue:{
    title:'Revenue Intelligence',eyebrow:'FINANCIAL & EXECUTIVE INTELLIGENCE',status:'protected',
    description:'Revenue performance, leakage, forecasts, customer value, capacity and executive action intelligence.',
    readiness:'Booked/completed revenue, ABV and daily revenue are live through the Intelligence API. Forecasting, leakage, cohort, concentration and recovery layers are designed in the CRM DB and require production ingestion/history.',
    endpoint:'/api/v1/intelligence/revenue',
    features:[
      ['Revenue trends','Gross/booked/completed revenue and daily movement'],
      ['Forecasting','Forward revenue and scenario forecasts'],
      ['Leakage & recovery','Revenue leakage, recovery opportunities and recovered revenue'],
      ['Customer value','LTV, portfolio value and revenue at risk'],
      ['Cohorts & concentration','Customer cohorts, dependency and concentration risk'],
      ['Channel / discount ROI','Channel ROI and promotion/discount effectiveness'],
      ['Capacity economics','Capacity, utilization and revenue opportunity'],
      ['Executive actions','Business health, actions and executive briefs']
    ]
  },
  rfm:{
    title:'World-Class Smart RFM',eyebrow:'RECENCY · FREQUENCY · MONETARY',status:'protected',
    description:'B4N Smart RFM with service-cycle adjusted recency, movement history and economic prioritization.',
    readiness:'Basic RFM can calculate from completed appointments now; the current completed-visit sample is small. Advanced Smart RFM is designed for service/product/combined RFM, segment movement, predicted LTV and revenue at risk.',
    endpoint:'/api/v1/intelligence/rfm',
    features:[
      ['Service RFM','Recency, frequency and monetary from completed salon services'],
      ['Product RFM','Separate product purchase recency/frequency/monetary'],
      ['Combined RFM','Unified customer value behavior'],
      ['Relative Recency','Days since visit ÷ expected service cycle'],
      ['Segment movement','Champion → Loyal → Need Attention → At Risk'],
      ['Revenue at Risk','Expected value × churn probability'],
      ['Action policies','Recovery, loyalty and next-visit strategies'],
      ['History','Snapshot and segment-transition history']
    ]
  },
  behavior:{
    title:'Behavior Analytics',eyebrow:'DIGITAL + TRANSACTION BEHAVIOR',status:'event',
    description:'How customers browse, compare, hesitate, select, book, return and abandon.',
    readiness:'Transactional behavior is partially available from appointments. True digital behavior needs Cloudflare-side event collection for sessions, views, clicks, comparisons, backtracking, dwell and abandonment.',
    endpoint:'/api/v1/intelligence/behavior',
    features:[
      ['Sessions & events','Session-based behavior timeline'],
      ['Intent signals','High-intent, exploratory and hesitant behavior'],
      ['Friction signals','Backtracking, uncertainty, repeated switching and failed availability'],
      ['Customer behavior profile','Preferred paths and recurring patterns'],
      ['Pattern movement','Behavior changes over time'],
      ['Behavior insights','Actionable customer journey findings']
    ]
  },
  motivation:{
    title:'Motivation Intelligence',eyebrow:'INFERRED CUSTOMER MOTIVATION',status:'event',
    description:'Evidence-based motivations such as maintenance, convenience, trust, self-care, event preparation and value.',
    readiness:'The CRM motivation model is designed, but reliable motivation requires behavioral evidence and confidence thresholds. Motivation must remain an inference, not a customer fact.',
    endpoint:'/api/v1/intelligence/motivation',
    features:[
      ['Routine maintenance','Natural replenishment / maintenance behavior'],
      ['Convenience','Fast/easy booking and time-fit behavior'],
      ['Specialist trust','Staff loyalty and specialist-led intent'],
      ['Self-care / confidence','Business-safe appearance/self-care motivation'],
      ['Event preparation','Time-bounded pre-event service intent'],
      ['Price / value','Discount/value sensitivity based on evidence'],
      ['Replenishment','Product re-order and refill motivation'],
      ['Confidence model','Score + confidence + evidence count + inferred flag']
    ]
  },
  trend:{
    title:'Trend Analysis',eyebrow:'DIRECTION · MOMENTUM · ANOMALY · SEASONALITY',status:'pending',
    description:'One canonical trend engine across Revenue, RFM, Behavior, Commerce, Workforce and Engagement.',
    readiness:'The CRM analytics schema contains metric observations, trend snapshots, seasonality profiles, anomaly events, trend relationships, insights and alert policies. The external API has not yet exposed these endpoints.',
    features:[
      ['Direction','Up / down / stable'],
      ['Momentum','Rate of change'],
      ['Acceleration','Whether momentum is strengthening or weakening'],
      ['Volatility','Stability and variability'],
      ['Seasonality','Day/week/month recurring patterns'],
      ['Anomalies','Unexpected deviations'],
      ['Relationships','Lead/lag and correlated KPI movement'],
      ['Trend alerts','Policy-driven alerts and insights']
    ]
  },
  funnel:{
    title:'Conversion, Abandonment & Friction',eyebrow:'BOOKING FUNNEL INTELLIGENCE',status:'event',
    description:'Conversion by stage, abandonment by stage, lost revenue, date/time incompatibility and recovery.',
    readiness:'Completed bookings exist, but true conversion/abandonment denominators require service-view, availability-check, booking-start and abandoned-session events. API correctly returns insufficient_event_data today.',
    endpoint:'/api/v1/intelligence/conversion',
    features:[
      ['Conversion rate','View → availability → start → booking → completed visit'],
      ['Abandonment rate','Drop-off at each funnel stage'],
      ['Revenue at risk','Estimated lost revenue from abandonment'],
      ['Availability mismatch','No suitable date/time, staff, capacity or duration'],
      ['Recovery','Changed date/time/staff/branch/service and recovered revenue'],
      ['Menu confusion','Repeated switching, backtracking, dwell and no selection'],
      ['Friction reason taxonomy','Measured reason codes instead of guesses']
    ]
  },
  peak:{
    title:'Peak Times & Device Usage',eyebrow:'WHEN + WHERE + DEVICE',status:'partial',
    description:'Separate booking-creation peaks from appointment-demand peaks, plus device performance.',
    readiness:'Peak booking creation and appointment demand are live now. Device usage needs behavior telemetry because device/browser/OS are not stored in operational booking facts.',
    endpoint:'/api/v1/intelligence/peak-times',
    features:[
      ['Booking creation peak','When customers create bookings'],
      ['Appointment demand peak','When customers want the service'],
      ['Time-band demand','Early morning, morning, midday, afternoon, evening, late evening'],
      ['Utilization peak','Demand vs available capacity'],
      ['Revenue peak','Revenue per time band/hour'],
      ['Device share','Mobile / desktop / tablet'],
      ['Device conversion','Conversion and abandonment by device'],
      ['Device errors','Technical error rate by OS/browser/device']
    ]
  },
  menu:{
    title:'Menu & Navigation Intelligence',eyebrow:'STRUCTURE · TRANSITION · SEQUENCE · COMBINATION',status:'partial',
    description:'How customers move through services and which services/products naturally belong together.',
    readiness:'Menu structure and booked combinations are available now. True transitions, navigation sequences and confusion patterns require behavior events.',
    endpoint:'/api/v1/public/menu',
    features:[
      ['Navigation Analysis','Category/service path movement'],
      ['Menu Structure Intelligence','Overlap, complexity, price/duration clusters and missing relationships'],
      ['Menu Transition Analysis','From service/category → next service/category'],
      ['behavior.menu_sequence_patterns','Efficient, exploratory, confused, high-intent and drop-off-prone sequences'],
      ['Combination Pattern Intelligence','Service+service, service+add-on, service+product, product+product'],
      ['Support / Confidence / Lift','Association strength and commercial relevance'],
      ['Menu confusion','Repeated switching, comparison loops and search-without-selection'],
      ['Bundle opportunities','Natural packages and contextual add-ons']
    ]
  },
  commerce:{
    title:'Commerce Analytics',eyebrow:'PRODUCT + OMNICHANNEL INTELLIGENCE',status:'partial',
    description:'Product sales, basket, channel, fulfillment, promotion and replenishment intelligence.',
    readiness:'Service-product relationships and booked products exist. The full CRM commerce analytics domain is designed but not yet exposed through the external API.',
    features:[
      ['Product performance','Revenue, units, attach and conversion'],
      ['Booking-product attach','Service → product attachment'],
      ['Customer product affinity','Who buys what and when'],
      ['Basket intelligence','Basket value, combinations and attach rate'],
      ['Sales channels','Salon, booking, online, marketplace, social, other'],
      ['Ecommerce funnel','View → cart → checkout → order'],
      ['Fulfillment','Order and fulfillment performance'],
      ['Promotion performance','Promotion ROI and incremental revenue'],
      ['Replenishment','Predicted reorder opportunities'],
      ['Product-service affinity','Cross-sell relationships']
    ]
  },
  workforce:{
    title:'Workforce Analytics',eyebrow:'STAFF PERFORMANCE + CAPACITY + RELIABILITY',status:'protected',
    description:'Fact-based workforce intelligence with safeguards against unfair employment decisions.',
    readiness:'Basic staff booking/revenue/completion/cancellation metrics are live. The CRM workforce schema contains deeper attendance, schedule, benchmark, demand and continuity models that need operational ingestion.',
    endpoint:'/api/v1/intelligence/staff',
    features:[
      ['Staff performance','Bookings, revenue, completion and cancellation'],
      ['Staff-customer continuity','Customer/staff relationship strength'],
      ['Service / product performance','Performance by service and product'],
      ['Time-band performance','Demand and outcomes by staff/time'],
      ['Quality metrics','Fact-based service quality indicators'],
      ['Reliability','Approved leave separated from unapproved absence/no-show'],
      ['Peer benchmarks','Context-aware benchmarking'],
      ['Demand forecast','Staffing demand and capacity forecast'],
      ['Leave impact','Coverage impact—not automatic leave rejection'],
      ['Development signals','Coaching/support signals, not automatic discipline']
    ]
  },
  engagement:{
    title:'Marketing & Engagement Analytics',eyebrow:'CAMPAIGNS · JOURNEYS · NOTIFICATIONS',status:'pending',
    description:'Campaign, journey, notification, channel preference, suppression and frequency-cap intelligence.',
    readiness:'The CRM engagement schema is ready; the external API does not yet expose campaign/journey/notification metrics.',
    features:[
      ['Campaign performance','Campaign audience, response and revenue'],
      ['Journey analytics','Journey membership and stage outcomes'],
      ['Notification delivery','Sent, delivered, opened and clicked'],
      ['Channel economics','Push/email/SMS/WhatsApp cost and performance'],
      ['Attribution','Booking and revenue attribution'],
      ['Channel preferences','Customer-preferred communication channel'],
      ['Suppressions','Consent and suppression enforcement'],
      ['Frequency caps','Marketing-only contact limits']
    ]
  },
  governance:{
    title:'Data Quality & Analytics Governance',eyebrow:'TRUST · PRIVACY · LINEAGE · MODEL CONTROL',status:'pending',
    description:'The control layer that makes every number explainable, secure and consistent.',
    readiness:'CRM governance tables exist for consent projections, model registry, experiments, privacy thresholds and data quality. The business UI now exposes this domain; detailed API endpoints remain to be added.',
    features:[
      ['Consent projection','Read-only CRM projection of Core consent'],
      ['Metric governance','Canonical KPI definition and ownership'],
      ['Model registry','Model/version/expiry/confidence'],
      ['Experiments','Experiment assignments and outcomes'],
      ['Privacy thresholds','Minimum cohort size and aggregation controls'],
      ['Data quality checks','Duplicate events, missing tenant IDs, invalid revenue, stale consent'],
      ['Lineage','Source → event → metric → insight → action'],
      ['Security controls','RLS, least privilege, audit and secret controls']
    ]
  },
  geo:{
    title:'Geo Analytics',eyebrow:'LOCATION INTELLIGENCE',status:'partial',
    description:'Salon/branch mapping, location-linked performance, catchment, demand and geographic opportunity intelligence.',
    readiness:'Live salon address, latitude, longitude and Google Maps URL are connected now. Regional ranking/distribution requires multiple real salon/branch locations and authoritative geographic attribution.',
    endpoint:'/api/v1/public/geo',
    features:[
      ['Salon map','Real salon/branch map locations'],
      ['Customer geography','Customer distribution by region when available'],
      ['Revenue geography','Revenue by salon/branch/area'],
      ['Booking geography','Demand and booking trend by location'],
      ['Geo opportunity','Demand gap, capacity, RFM and service affinity by geography'],
      ['Catchment intelligence','Customer catchment and growth opportunity'],
      ['Google Maps links','Stored operational location links'],
      ['Privacy thresholds','Aggregate geographic reporting']
    ]
  }
};

const ANALYTICS_COVERAGE_ORDER=['executive','customers','revenue','rfm','behavior','motivation','trend','funnel','peak','menu','geo','commerce','workforce','engagement','governance'];

function statusLabel(status){
  return {live:'Live',protected:'Protected Live',partial:'Partial',event:'Event Data Required',pending:'API / Pipeline Pending'}[status]||status
}
function renderAnalyticsCoverage(){
  const grid=document.getElementById('analyticsCoverageGrid');
  if(!grid)return;
  const rows=ANALYTICS_COVERAGE_ORDER.map(key=>[key,ANALYTICS_DOMAINS[key]]);
  grid.innerHTML=rows.map(([key,d])=>`
    <button type="button" class="coverage-card" data-open-domain="${key}">
      <div class="coverage-card-head"><strong>${escapeHtml(d.title)}</strong><span class="status-chip ${d.status}">${statusLabel(d.status)}</span></div>
      <p>${escapeHtml(d.description)}</p>
      <div class="coverage-mini-features">${d.features.slice(0,4).map(x=>`<span>${escapeHtml(x[0])}</span>`).join('')}</div>
      <b class="coverage-open">Open intelligence →</b>
    </button>`).join('');
  grid.querySelectorAll('[data-open-domain]').forEach(btn=>btn.addEventListener('click',()=>{
    const key=btn.dataset.openDomain;
    if(key==='executive'){showView('dashboard');history.replaceState(null,'','#dashboard');return}
    if(key==='geo'){showView('geo');history.replaceState(null,'','#geo');return}
    showView('detail',key);history.replaceState(null,'',`#${key}`)
  }));
  setText('coverageDomainCount',rows.length);
  setText('coverageVisibleCount',rows.length);
  setText('coverageLiveCount',rows.filter(([,d])=>['live','protected','partial'].includes(d.status)).length);
  setText('coverageTelemetryCount',rows.filter(([,d])=>d.status==='event').length);
}
async function renderAnalyticsDetail(key){
  const d=ANALYTICS_DOMAINS[key];
  if(!d)return;
  setText('detailEyebrow',d.eyebrow);
  setText('detailTitle',d.title);
  setText('detailDescription',d.description);
  const status=document.getElementById('detailStatus');
  if(status){status.className=`status-chip ${d.status}`;status.textContent=statusLabel(d.status)}
  const features=document.getElementById('detailFeatureGrid');
  if(features)features.innerHTML=d.features.map(([title,desc])=>`<article class="intel-card feature-card"><strong>${escapeHtml(title)}</strong><p>${escapeHtml(desc)}</p></article>`).join('');
  const ready=document.getElementById('detailReadiness');
  if(ready)ready.innerHTML=`<p>${escapeHtml(d.readiness)}</p><div id="domainLivePreview" class="domain-live-preview"><span>Checking current data availability…</span></div>`;
  setText('detailMethodologyLabel',d.endpoint?`Endpoint: ${d.endpoint}`:'Schema / pipeline layer');

  await renderDomainLivePreview(key,d);
}

async function renderDomainLivePreview(key,d){
  const host=document.getElementById('domainLivePreview');
  if(!host)return;
  try{
    let token=null;
    const protectedDomain=['customers','revenue','rfm','workforce','peak','funnel'];
    if(protectedDomain.includes(key))token=await getStoredAccessToken();
    if(protectedDomain.includes(key)&&!token){
      host.innerHTML='<span class="preview-status protected">Sign in required for live preview.</span>';
      return;
    }

    if(key==='menu'){
      const [menu,combos]=await Promise.all([
        api('/api/v1/public/menu'),
        token?api('/api/v1/intelligence/menu/combinations',{token}).catch(()=>null):Promise.resolve(null)
      ]);
      host.innerHTML=`<b>${menu.counts?.services??0}</b><span>services</span><b>${menu.counts?.addons??0}</b><span>add-on links</span><b>${menu.counts?.suggestions??0}</b><span>suggestions</span><b>${menu.counts?.service_product_links??0}</b><span>product links</span>`;
      return;
    }

    if(d.endpoint){
      const result=await api(d.endpoint,{token});
      const status=result?.meta?.data_status||result?.data_status||'available';
      const count=result?.meta?.event_count;
      host.innerHTML=`<span class="preview-status ${status==='insufficient_event_data'?'event':'live'}">${escapeHtml(status)}</span>${count!=null?`<b>${count}</b><span>events</span>`:''}`;
      return;
    }

    host.innerHTML='<span class="preview-status pending">Schema designed; external API endpoint pending.</span>';
  }catch(err){
    host.innerHTML=`<span class="preview-status pending">Current preview unavailable: ${escapeHtml(err?.message||'API error')}</span>`;
  }
}


// ===== API helpers =====
async function api(path,{token}={}){
  const headers={Accept:'application/json'};
  if(token) headers.Authorization=`Bearer ${token}`;
  const response=await fetch(`${API_BASE}${path}`,{headers});
  const body=await response.json().catch(()=>({}));
  if(!response.ok){
    const error=new Error(body.message||body.error||`API ${response.status}`);
    error.status=response.status;error.body=body;throw error
  }
  return body
}
function formatLkr(value){
  const n=Number(value||0);
  return new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR',maximumFractionDigits:0}).format(n)
    .replace('LKR','LKR ')
}
function getStoredSession(){
  const raw=localStorage.getItem(AUTH_STORAGE_KEY);
  if(!raw)return null;
  try{return JSON.parse(raw)}catch{return null}
}
function saveSession(data,roles=[]){
  const expiresAt=Date.now()+Math.max(30,Number(data.expires_in||3600)-60)*1000;
  const session={
    access_token:data.access_token,
    refresh_token:data.refresh_token,
    expires_at:expiresAt,
    user:data.user||null,
    roles
  };
  localStorage.setItem(AUTH_STORAGE_KEY,JSON.stringify(session));
  return session
}
function clearSession(){localStorage.removeItem(AUTH_STORAGE_KEY)}
async function refreshStoredSession(session){
  if(!session?.refresh_token)return null;
  const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`,{
    method:'POST',
    headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({refresh_token:session.refresh_token})
  });
  if(!res.ok){clearSession();return null}
  const data=await res.json();
  return saveSession(data,session.roles||[])
}
async function getValidSession(){
  let session=getStoredSession();
  if(!session)return null;
  if(Number(session.expires_at||0)<=Date.now()+30000){
    session=await refreshStoredSession(session)
  }
  return session
}
async function getStaffRoles(accessToken,userId){
  const res=await fetch(`${SUPABASE_URL}/rest/v1/user_roles?select=role&user_id=eq.${encodeURIComponent(userId)}`,{
    headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${accessToken}`,Accept:'application/json'}
  });
  if(!res.ok)throw new Error('Unable to verify staff role');
  const rows=await res.json();
  return (rows||[]).map(r=>r.role).filter(Boolean)
}
async function signInStaff(email,password){
  const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{
    method:'POST',
    headers:{apikey:SUPABASE_PUBLISHABLE_KEY,'Content-Type':'application/json'},
    body:JSON.stringify({email,password})
  });
  const data=await res.json().catch(()=>({}));
  if(!res.ok)throw new Error(data?.msg||data?.error_description||data?.error||'Sign in failed');
  const uid=data.user?.id;
  if(!uid)throw new Error('No user returned by authentication service');
  const roles=await getStaffRoles(data.access_token,uid);
  if(!roles.some(r=>STAFF_ROLES.includes(r))){
    throw new Error('This account does not have B4N staff access')
  }
  return saveSession(data,roles)
}

async function requestMagicLink(email){
  if(!supabaseAuthClient)throw new Error('Authentication library failed to load');
  const {error}=await supabaseAuthClient.auth.signInWithOtp({
    email,
    options:{
      emailRedirectTo:CRM_REDIRECT_URL,
      shouldCreateUser:false
    }
  });
  if(error)throw error;
  return true;
}
async function consumeMagicLinkSession(){
  if(!supabaseAuthClient)return null;
  const {data,error}=await supabaseAuthClient.auth.getSession();
  if(error)throw error;
  const session=data?.session;
  if(!session?.access_token||!session?.user?.id)return null;

  const roles=await getStaffRoles(session.access_token,session.user.id);
  if(!roles.some(r=>STAFF_ROLES.includes(r))){
    await supabaseAuthClient.auth.signOut().catch(()=>{});
    clearSession();
    throw new Error('This account does not have B4N staff access');
  }

  // Normalize Supabase session into the format already used by B4NCRM.
  const normalized={
    access_token:session.access_token,
    refresh_token:session.refresh_token,
    expires_in:Math.max(60,(session.expires_at||Math.floor(Date.now()/1000)+3600)-Math.floor(Date.now()/1000)),
    user:session.user
  };
  return saveSession(normalized,roles);
}

async function signOutStaff(){
  const session=getStoredSession();
  if(session?.access_token){
    try{
      await fetch(`${SUPABASE_URL}/auth/v1/logout`,{
        method:'POST',
        headers:{apikey:SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${session.access_token}`}
      })
    }catch{}
  }
  clearSession()
}
async function getStoredAccessToken(){
  const session=await getValidSession();
  return session?.access_token||null
}
function setText(id,value){const el=document.getElementById(id);if(el)el.textContent=String(value)}
function setProtectedState(id,label='Live'){
  const el=document.getElementById(id);if(el){el.textContent=label;el.classList.add('live')}
}

// ===== Live service/menu data =====
async function loadPublicMenu(){
  const list=document.getElementById('servicesList');
  const status=document.getElementById('menuApiStatus');
  const summary=document.getElementById('menuSummary');
  if(list) list.innerHTML='<div class="api-loading">Loading live services…</div>';
  try{
    const [servicesData,menuData]=await Promise.all([
      api('/api/v1/public/services'),
      api('/api/v1/public/menu')
    ]);
    const services=servicesData.services||[];
    const counts=menuData.counts||{};
    if(status) status.textContent=`${services.length} live services`;
    if(summary){
      summary.innerHTML=[
        ['Services',counts.services??services.length],
        ['Add-on links',counts.addons??0],
        ['Suggestions',counts.suggestions??0],
        ['Product links',counts.service_product_links??0]
      ].map(([k,v])=>`<span>${k}: <b>${v}</b></span>`).join('');
    }
    if(list){
      list.innerHTML='';
      const visible=services.slice(0,7);
      visible.forEach((s,index)=>{
        const r=document.createElement('div');
        r.className='service-row';
        const max=Math.max(...services.map(x=>Number(x.price||0)),1);
        const pct=Math.max(8,Math.min(100,(Number(s.price||0)/max)*100));
        r.innerHTML=`<div class="service-icon">${index+1}</div>
          <div class="service-main"><strong>${escapeHtml(s.name)}</strong>
          <span class="service-meta">${Number(s.duration_min||0)} min · ${escapeHtml(s.audience||'all')}</span>
          <div class="mini-progress"><span style="width:${pct}%"></span></div></div>
          <b>${formatLkr(s.price)}</b>`;
        list.appendChild(r)
      });
    }
  }catch(error){
    if(status){status.textContent='API unavailable';status.classList.add('api-error')}
    if(list)list.innerHTML='<div class="api-error">Unable to load live service data.</div>';
    console.error('Menu API',error)
  }
}
function escapeHtml(value){
  return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))
}

// ===== Live Geo Analytics =====
let salonLocations=[];
const salonList=document.getElementById('salonLocationList');
const hotspotLayer=document.getElementById('geoHotspots');
const mapFrame=document.getElementById('geoMapFrame');
const selectedSalonLabel=document.getElementById('selectedSalonLabel');
const openSelectedMap=document.getElementById('openSelectedMap');
const activeSalonCount=document.getElementById('activeSalonCount');
const bounds={minLat:5.75,maxLat:10.05,minLng:79.45,maxLng:82.10};

function markerPosition(lat,lng){
  const left=((lng-bounds.minLng)/(bounds.maxLng-bounds.minLng))*100;
  const top=((bounds.maxLat-lat)/(bounds.maxLat-bounds.minLat))*100;
  return {left:Math.max(4,Math.min(96,left)),top:Math.max(5,Math.min(95,top))}
}
function salonMapUrl(salon){
  if(salon.google_maps_url)return salon.google_maps_url;
  if(salon.latitude!=null&&salon.longitude!=null)
    return `https://www.google.com/maps/search/?api=1&query=${salon.latitude},${salon.longitude}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(salon.address||salon.area||'Sri Lanka')}`
}
function selectSalon(salon){
  const query=(salon.latitude!=null&&salon.longitude!=null)
    ? `${salon.latitude},${salon.longitude}`
    : `${salon.business_name||salon.salon_name||''}, ${salon.address||salon.area||'Sri Lanka'}`;
  if(mapFrame) mapFrame.src=`https://www.google.com/maps?q=${encodeURIComponent(query)}&z=15&output=embed`;
  if(selectedSalonLabel) selectedSalonLabel.textContent=salon.business_name||salon.salon_name||'Salon';
  if(openSelectedMap){openSelectedMap.href=salonMapUrl(salon);openSelectedMap.textContent='Open in Google Maps ↗'}
  document.querySelectorAll('.salon-location').forEach(x=>x.classList.toggle('selected',x.dataset.salonId===String(salon.salon_id)))
}
function renderSalons(){
  if(salonList)salonList.innerHTML='';
  if(hotspotLayer)hotspotLayer.innerHTML='';
  if(activeSalonCount)activeSalonCount.textContent=String(salonLocations.length);
  setText('geoLiveState',`${salonLocations.length} live location${salonLocations.length===1?'':'s'}`);
  salonLocations.forEach(salon=>{
    const name=salon.business_name||salon.salon_name||`Salon ${salon.salon_id}`;
    const address=[salon.address?.trim(),salon.area].filter(Boolean).join(', ');
    if(salonList){
      const el=document.createElement('div');
      el.className='salon-location';el.dataset.salonId=String(salon.salon_id);
      el.innerHTML=`<strong>${escapeHtml(name)}</strong>
        <address class="live-address">${escapeHtml(address||'Address not available')}</address>
        <div class="salon-metrics"><span>Live location</span><span>${salon.latitude!=null?'Mapped':'Address only'}</span></div>
        <button type="button">Show on map</button>
        <a href="${salonMapUrl(salon)}" target="_blank" rel="noopener">Google Maps ↗</a>`;
      el.querySelector('button')?.addEventListener('click',()=>selectSalon(salon));
      salonList.appendChild(el)
    }
    if(hotspotLayer&&salon.latitude!=null&&salon.longitude!=null){
      const pos=markerPosition(Number(salon.latitude),Number(salon.longitude));
      const marker=document.createElement('button');
      marker.type='button';marker.className='geo-hotspot hot';
      marker.style.left=pos.left+'%';marker.style.top=pos.top+'%';
      marker.title=`${name} — ${address}`;
      marker.innerHTML=`<span class="pulse"></span><label>${escapeHtml(name)}</label>`;
      marker.addEventListener('click',()=>selectSalon(salon));
      hotspotLayer.appendChild(marker)
    }
  });
  if(salonLocations.length===1)selectSalon(salonLocations[0])
}
async function loadGeo(){
  const status=document.getElementById('geoConnectionStatus');
  try{
    const data=await api('/api/v1/public/geo');
    salonLocations=data.salons||[];
    renderSalons();
    if(status){status.textContent='● Live API';status.classList.remove('api-error')}
  }catch(error){
    if(status){status.textContent='● API unavailable';status.classList.add('api-error')}
    if(activeSalonCount)activeSalonCount.textContent='—';
    if(salonList)salonList.innerHTML='<div class="api-error">Unable to load salon locations.</div>';
    console.error('Geo API',error)
  }
}
document.getElementById('resetSriLankaMap')?.addEventListener('click',()=>{
  if(mapFrame)mapFrame.src='https://www.google.com/maps?q=Sri%20Lanka&z=7&output=embed';
  if(selectedSalonLabel)selectedSalonLabel.textContent='All mapped salons';
  if(openSelectedMap){openSelectedMap.href='https://www.google.com/maps/search/?api=1&query=Sri%20Lanka';openSelectedMap.textContent='Open Sri Lanka in Google Maps ↗'}
});


function setDashboardDateRange(){
  const now=new Date();
  const end=new Date(now);
  const start=new Date(now);start.setDate(start.getDate()-6);
  const fmt=d=>new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'short',year:'numeric'}).format(d);
  setText('dashboardDateRange',`${fmt(start)} – ${fmt(end)}`);
}
function renderRevenueBars(byDay=[]){
  if(!barChart)return;
  barChart.innerHTML='';
  const rows=(byDay||[]).slice(-30);
  if(!rows.length){
    barChart.innerHTML='<div class="status-placeholder">No revenue trend rows available.</div>';
    return;
  }
  const max=Math.max(...rows.map(x=>Number(x.value||0)),1);
  rows.forEach(row=>{
    const el=document.createElement('i');
    const value=Number(row.value||0);
    el.style.height=`${Math.max(2,(value/max)*100)}%`;
    el.title=`${row.date}: ${formatLkr(value)}`;
    if(value===0)el.dataset.zero='true';
    barChart.appendChild(el)
  })
}
function renderBookingSnapshot(status={}){
  const host=document.getElementById('bookingStatusSnapshot');
  if(!host)return;
  const order=['pending','confirmed','completed','cancelled'];
  host.innerHTML=order.map(key=>`<div class="status-row"><span>${key.charAt(0).toUpperCase()+key.slice(1)}</span><b>${Number(status?.[key]||0)}</b></div>`).join('')
}

// ===== Protected intelligence =====
async function loadProtectedAnalytics(){
  const token=await getStoredAccessToken();
  if(!token){
    updateAuthUI(null);
    return;
  }
  try{
    const session=getStoredSession();
    updateAuthUI(session);
    const [overview,revenueData,customerData,rfm,staff]=await Promise.all([
      api('/api/v1/intelligence/overview',{token}),
      api('/api/v1/intelligence/revenue',{token}),
      api('/api/v1/intelligence/customers',{token}),
      api('/api/v1/intelligence/rfm',{token}),
      api('/api/v1/intelligence/staff',{token})
    ]);
    setText('dashRevenue',formatLkr(overview.revenue?.booked||0));
    setText('dashBookings',overview.bookings?.total??0);
    setText('dashCustomers',overview.customers?.total??0);
    setText('dashAvgBooking',formatLkr(overview.revenue?.avg_booking_value||0));
    ['dashRevenueState','dashBookingsState','dashCustomersState','dashAvgBookingState'].forEach(id=>setProtectedState(id,'Live'));
    ['dashRevenueNote','dashBookingsNote','dashCustomersNote','dashAvgBookingNote'].forEach(id=>setText(id,'Live Lovable data via Intelligence API'));

    setText('geoCustomers',overview.customers?.total??0);
    setText('geoRevenue',formatLkr(overview.revenue?.booked||0));
    setText('geoBookings',overview.bookings?.total??0);
    setText('geoAvgBooking',formatLkr(overview.revenue?.avg_booking_value||0));

    // Live revenue overview.
    setText('revenueOverviewTotal',formatLkr(revenueData.totals?.booked||0));
    setProtectedState('revenueOverviewState','Live');
    setText('revenueOverviewNote','Daily bars use live appointment revenue from the Intelligence API.');
    renderRevenueBars(revenueData.by_day||[]);

    // Live customer intelligence.
    setText('customerIntelTotal',customerData.total??overview.customers?.total??0);
    setText('customerIntelFirst',customerData.first_visit_flagged??0);
    setText('customerIntelRisk',customerData.risk_flagged??0);
    setText('customerIntelNoShow',customerData.with_no_shows??0);
    setText('customerIntelState','Live');

    // Live booking status snapshot.
    renderBookingSnapshot(overview.bookings?.status||{});
    setText('bookingSnapshotState','Live');

    // Live summary.
    setText('summaryRevenue',formatLkr(overview.revenue?.booked||0));
    setText('summaryBookings',overview.bookings?.total??0);
    setText('summaryCustomers',overview.customers?.total??0);
    setText('summaryABV',formatLkr(overview.revenue?.avg_booking_value||0));
    setText('summaryLiveState','Live');

    updateRfmCard(rfm);
    setText('rfmDashboardState',rfm?.meta?.data_status==='limited_evidence'?'Limited evidence':'Live');
    updateStaffCard(staff);
    setText('staffDashboardState','Live');
  }catch(error){
    if(error?.status===401||error?.status===403){clearSession();updateAuthUI(null)}
    console.warn('Protected analytics unavailable',error)
  }
}

function updateRfmCard(rfm){
  const totalEl=document.querySelector('.rfm-card .donut-hole strong');
  const legend=document.querySelector('.rfm-card .legend');
  const total=Number(rfm?.customer_count_with_completed_visits||0);
  if(totalEl)totalEl.textContent=String(total);
  if(legend){
    const order=[
      ['champions','Champions'],
      ['loyal','Loyal'],
      ['potential_loyalist','Potential Loyalist'],
      ['at_risk','At Risk'],
      ['cannot_lose','Cannot Lose']
    ];
    legend.innerHTML=order.map(([key,label],i)=>`<p><i class="g${i+1}"></i>${label} <b>${Number(rfm?.segments?.[key]||0)}</b></p>`).join('')
  }
}
function updateStaffCard(staffData){
  const card=document.querySelector('.staff-card');
  if(!card)return;
  const head=card.querySelector('.card-header');
  card.querySelectorAll('.staff-row').forEach(x=>x.remove());
  const rows=(staffData?.staff||[]).slice(0,3);
  rows.forEach((s,i)=>{
    const row=document.createElement('div');
    row.className='staff-row';
    const rankClass=['one','two','three'][i]||'three';
    const pct=Math.max(8,Math.min(100,Number(s.completion_rate||0)*100));
    row.innerHTML=`<b class="rank ${rankClass}">${i+1}</b><div class="avatar avatar-b"></div>
      <div><strong>${escapeHtml(s.name)}</strong><div class="progress"><span style="width:${pct}%"></span></div></div>
      <strong>${formatLkr(s.revenue||0)}</strong>`;
    card.appendChild(row)
  });
  if(!rows.length&&head){
    const empty=document.createElement('div');empty.className='api-loading';empty.textContent='No staff analytics available yet.';card.appendChild(empty)
  }
}

// ===== Staff authentication UI =====
const authModal=document.getElementById('authModal');
const authButton=document.getElementById('authButton');
const authClose=document.getElementById('authClose');
const authForm=document.getElementById('authForm');
const authMessage=document.getElementById('authMessage');
const authSubmit=document.getElementById('authSubmit');

const passwordTab=document.getElementById('passwordTab');
const magicTab=document.getElementById('magicTab');
const magicLinkForm=document.getElementById('magicLinkForm');
const magicEmail=document.getElementById('magicEmail');
const magicSubmit=document.getElementById('magicSubmit');


function setAuthMethod(method){
  const magic=method==='magic';
  passwordTab?.classList.toggle('active',!magic);
  magicTab?.classList.toggle('active',magic);
  if(authForm)authForm.hidden=magic;
  if(magicLinkForm)magicLinkForm.hidden=!magic;
  if(authMessage){authMessage.textContent='';authMessage.className='auth-message'}
  setTimeout(()=>magic?magicEmail?.focus():document.getElementById('authEmail')?.focus(),0);
}
passwordTab?.addEventListener('click',()=>setAuthMethod('password'));
magicTab?.addEventListener('click',()=>setAuthMethod('magic'));

function openAuth(){
  if(authModal){authModal.hidden=false;document.body.classList.add('auth-open');setAuthMethod('password')}
}
function closeAuth(){
  if(authModal){authModal.hidden=true;document.body.classList.remove('auth-open')}
}
function updateAuthUI(session){
  const name=document.getElementById('authProfileName');
  const role=document.getElementById('authProfileRole');
  if(session?.access_token){
    const email=session.user?.email||'Staff account';
    if(name)name.textContent=email.split('@')[0]||'B4N Staff';
    if(role)role.textContent=(session.roles||[]).join(' · ')||'Staff';
    if(authButton){authButton.textContent='Sign out';authButton.classList.add('signed-in')}
  }else{
    if(name)name.textContent='B4N CRM';
    if(role)role.textContent='Not signed in';
    if(authButton){authButton.textContent='Sign in';authButton.classList.remove('signed-in')}
  }
}
authButton?.addEventListener('click',async()=>{
  const session=await getValidSession();
  if(session){
    await signOutStaff();
    updateAuthUI(null);
    location.reload()
  }else openAuth()
});
authClose?.addEventListener('click',closeAuth);
authModal?.addEventListener('click',e=>{if(e.target===authModal)closeAuth()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeAuth()});
authForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  if(authMessage){authMessage.textContent='Signing in…';authMessage.className='auth-message'}
  if(authSubmit)authSubmit.disabled=true;
  try{
    const email=document.getElementById('authEmail')?.value.trim();
    const password=document.getElementById('authPassword')?.value||'';
    const session=await signInStaff(email,password);
    if(authMessage){authMessage.textContent='Signed in. Loading live intelligence…';authMessage.className='auth-message success'}
    updateAuthUI(session);
    await loadProtectedAnalytics();
    setTimeout(closeAuth,500)
  }catch(error){
    if(authMessage){authMessage.textContent=error?.message||'Sign in failed';authMessage.className='auth-message error'}
  }finally{
    if(authSubmit)authSubmit.disabled=false
  }
});


magicLinkForm?.addEventListener('submit',async e=>{
  e.preventDefault();
  const email=magicEmail?.value.trim();
  if(!email)return;
  if(authMessage){authMessage.textContent='Sending secure magic link…';authMessage.className='auth-message info'}
  if(magicSubmit)magicSubmit.disabled=true;
  try{
    await requestMagicLink(email);
    if(authMessage){
      authMessage.innerHTML='Magic link sent. Check your email and click the link to return securely to B4N CRM.';
      authMessage.className='auth-message success magic-success';
    }
  }catch(error){
    // Keep response generic to reduce account enumeration.
    if(authMessage){
      authMessage.textContent=error?.message||'Unable to send magic link. Check the email and try again.';
      authMessage.className='auth-message error';
    }
  }finally{
    if(magicSubmit)magicSubmit.disabled=false
  }
});

// Clicking protected status opens sign-in.
document.querySelectorAll('.api-protected').forEach(el=>el.addEventListener('click',openAuth));

// Startup
async function bootstrapB4NCRM(){
  setDashboardDateRange();
  renderAnalyticsCoverage();
  routeFromHash();

  // Handles a session returned by a Supabase Magic Link.
  try{
    const magicSession=await consumeMagicLinkSession();
    if(magicSession){
      updateAuthUI(magicSession);
      history.replaceState(null,'',location.pathname+location.hash);
    }
  }catch(error){
    console.warn('Magic-link callback rejected',error);
    clearSession();
    updateAuthUI(null);
    openAuth();
    if(authMessage){authMessage.textContent=error?.message||'Magic-link sign in was not authorized.';authMessage.className='auth-message error'}
  }

  await Promise.allSettled([loadPublicMenu(),loadGeo(),loadProtectedAnalytics()]);
}
bootstrapB4NCRM();
