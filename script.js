const API_BASE='https://b4n-intelligence-api.comomlffo.workers.dev';

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
function getStoredAccessToken(){
  // Optional future CRM login integration.
  const direct=localStorage.getItem('b4n_supabase_access_token');
  if(direct) return direct;
  const raw=localStorage.getItem('sb-wazhhgcjrstfrxbwtcvj-auth-token');
  if(!raw) return null;
  try{
    const parsed=JSON.parse(raw);
    return parsed?.access_token||parsed?.currentSession?.access_token||null
  }catch{return null}
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
  const token=getStoredAccessToken();
  if(!token)return; // UI intentionally remains "Protected".
  try{
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

    console.info('B4N protected intelligence loaded',{overview,rfm,staff});
  }catch(error){
    console.warn('Protected analytics unavailable',error)
  }
}

// Startup
Promise.allSettled([loadPublicMenu(),loadGeo(),loadProtectedAnalytics()]);
