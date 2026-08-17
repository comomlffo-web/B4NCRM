const bars=[45,54,63,71,38,57,68,76,83,52,72,89,100,94,84,69,52,35,64,55,76,88,98,82,62,48,73,91,72,61];
const barChart=document.getElementById('barChart'); bars.forEach(v=>{const i=document.createElement('i');i.style.height=v+'%';barChart.appendChild(i)});
const services=[['Hair Colour','LKR 4,250,000',94],['Hair Cut','LKR 2,180,000',61],['Nail Art','LKR 1,320,000',39],['Facial','LKR 980,000',31],['Keratin Treatment','LKR 860,000',27]];
const list=document.getElementById('servicesList');services.forEach(([n,v,p])=>{const r=document.createElement('div');r.className='service-row';r.innerHTML=`<div class="service-icon"></div><div class="service-main"><strong>${n}</strong><div class="mini-progress"><span style="width:${p}%"></span></div></div><b>${v}</b>`;list.appendChild(r)});
document.getElementById('menuBtn').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('globalSearch').focus()}});


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
viewLinks.forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showView(a.dataset.view);history.replaceState(null,'',a.getAttribute('href'));}));
if(location.hash==='#geo') showView('geo');

// ===== Geo Analytics demo salon records =====
// Replace these records with live salon_id/name/address/lat/lng/google_maps_url from B4N Core.
const salonLocations=[
  {id:'SLN-001',name:'Dilani Salon · Colombo',address:'Colombo 07, Sri Lanka',lat:6.9147,lng:79.8731,revenue:'LKR 1.25M',growth:'+18.6%',heat:'hot'},
  {id:'SLN-002',name:'Kandy Beauty Studio',address:'Kandy, Sri Lanka',lat:7.2906,lng:80.6337,revenue:'LKR 0.98M',growth:'+15.2%',heat:'hot'},
  {id:'SLN-003',name:'Negombo Beauty Studio',address:'Negombo, Sri Lanka',lat:7.2083,lng:79.8358,revenue:'LKR 0.77M',growth:'+13.8%',heat:'warm'},
  {id:'SLN-004',name:'Galle Beauty Studio',address:'Galle, Sri Lanka',lat:6.0329,lng:80.2168,revenue:'LKR 0.64M',growth:'+11.5%',heat:'hot'},
  {id:'SLN-005',name:'Jaffna Beauty Studio',address:'Jaffna, Sri Lanka',lat:9.6615,lng:80.0255,revenue:'LKR 0.51M',growth:'+10.1%',heat:''},
  {id:'SLN-006',name:'Batticaloa Beauty Studio',address:'Batticaloa, Sri Lanka',lat:7.7170,lng:81.7000,revenue:'LKR 0.47M',growth:'+9.6%',heat:'warm'}
].map(x=>({...x,mapUrl:`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.address)}`}));

const salonList=document.getElementById('salonLocationList');
const hotspotLayer=document.getElementById('geoHotspots');
const mapFrame=document.getElementById('geoMapFrame');
const selectedSalonLabel=document.getElementById('selectedSalonLabel');
const openSelectedMap=document.getElementById('openSelectedMap');
const activeSalonCount=document.getElementById('activeSalonCount');
if(activeSalonCount) activeSalonCount.textContent=String(salonLocations.length);

const bounds={minLat:5.75,maxLat:10.05,minLng:79.45,maxLng:82.10};
function markerPosition(lat,lng){
  const left=((lng-bounds.minLng)/(bounds.maxLng-bounds.minLng))*100;
  const top=((bounds.maxLat-lat)/(bounds.maxLat-bounds.minLat))*100;
  return {left:Math.max(4,Math.min(96,left)),top:Math.max(5,Math.min(95,top))};
}
function selectSalon(salon){
  const q=encodeURIComponent(`${salon.name}, ${salon.address}`);
  if(mapFrame) mapFrame.src=`https://www.google.com/maps?q=${q}&z=14&output=embed`;
  if(selectedSalonLabel) selectedSalonLabel.textContent=salon.name;
  if(openSelectedMap){openSelectedMap.href=salon.mapUrl;openSelectedMap.textContent='Open in Google Maps ↗';}
  document.querySelectorAll('.salon-location').forEach(x=>x.classList.toggle('selected',x.dataset.salonId===salon.id));
}
if(salonList){
  salonLocations.forEach(salon=>{
    const el=document.createElement('div');
    el.className='salon-location';el.dataset.salonId=salon.id;
    el.innerHTML=`<strong>${salon.name}</strong><address>${salon.address}</address><div class="salon-metrics"><span>${salon.revenue}</span><span>↑ ${salon.growth.replace('+','')}</span></div><button type="button">Show on map</button><a href="${salon.mapUrl}" target="_blank" rel="noopener">Google Maps ↗</a>`;
    el.querySelector('button').addEventListener('click',()=>selectSalon(salon));
    salonList.appendChild(el);

    const pos=markerPosition(salon.lat,salon.lng);
    const marker=document.createElement('button');
    marker.type='button';marker.className=`geo-hotspot ${salon.heat}`;marker.style.left=pos.left+'%';marker.style.top=pos.top+'%';marker.title=`${salon.name} — ${salon.address}`;
    marker.innerHTML=`<span class="pulse"></span><label>${salon.name.split(' · ')[0]}</label>`;
    marker.addEventListener('click',()=>selectSalon(salon));
    hotspotLayer?.appendChild(marker);
  });
}
document.getElementById('resetSriLankaMap')?.addEventListener('click',()=>{
  if(mapFrame) mapFrame.src='https://www.google.com/maps?q=Sri%20Lanka&z=7&output=embed';
  if(selectedSalonLabel) selectedSalonLabel.textContent='All mapped salons';
  if(openSelectedMap){openSelectedMap.href='https://www.google.com/maps/search/?api=1&query=Sri%20Lanka';openSelectedMap.textContent='Open Sri Lanka in Google Maps ↗';}
});
