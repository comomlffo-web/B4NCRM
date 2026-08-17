const API_BASE='https://b4n-intelligence-api.comomlffo.workers.dev';
const SUPABASE_URL='https://wazhhgcjrstfrxbwtcvj.supabase.co';
const SUPABASE_PUBLISHABLE_KEY='sb_publishable_6Z-PWJ-Jnq2GJx_o5atuYw_o58DKlNX';
const AUTH_STORAGE_KEY='b4n_crm_staff_session';
const STAFF_ROLES=['super_admin','admin','manager','specialist','worker'];

const bars=[45,54,63,71,38,57,68,76,83,52,72,89,100,94,84,69,52,35,64,55,76,88,98,82,62,48,73,91,72,61];
const barChart=document.getElementById('barChart');
if(barChart) bars.forEach(v=>{const i=document.createElement('i');i.style.height=v+'%';barChart.appendChild(i)});

document.getElementById('menuBtn')?.addEventListener('click',()=>document.getElementById('sidebar')?.classList.toggle('open'));
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){
    e.preventDefault();document.getElementById('globalSearch')?.focus()
  }
});

// ===== View switching =====
const dashboardView=document.getElementById('dashboardView');
const geoView=document.getElementById('geoView');
const viewLinks=[...document.querySelectorAll('[data-view]')];
function showView(view){
  dashboardView?.classList.toggle('active-view',view==='dashboard');
  geoView?.classList.toggle('active-view',view==='geo');
  viewLinks.forEach(a=>a.classList.toggle('active',a.dataset.view===view));
  if(view==='geo') window.setTimeout(()=>window.dispatchEvent(new Event('resize')),50);
}
viewLinks.forEach(a=>a.addEventListener('click',e=>{
  e.preventDefault();showView(a.dataset.view);history.replaceState(null,'',a.getAttribute('href'))
}));
if(location.hash==='#geo') showView('geo');

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
    const [overview,rfm,staff]=await Promise.all([
      api('/api/v1/intelligence/overview',{token}),
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

    updateRfmCard(rfm);
    updateStaffCard(staff);
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
function openAuth(){
  if(authModal){authModal.hidden=false;document.body.classList.add('auth-open');document.getElementById('authEmail')?.focus()}
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

// Clicking protected status opens sign-in.
document.querySelectorAll('.api-protected').forEach(el=>el.addEventListener('click',openAuth));

// Startup
Promise.allSettled([loadPublicMenu(),loadGeo(),loadProtectedAnalytics()]);
