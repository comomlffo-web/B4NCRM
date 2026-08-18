(() => {
'use strict';
const API='https://b4n-intelligence-api.comomlffo.workers.dev';
const STORAGE_KEY='b4n_crm_staff_session';
let cache=null, loading=false;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
const money=v=>new Intl.NumberFormat('en-LK',{style:'currency',currency:'LKR',maximumFractionDigits:0}).format(Number(v||0));
const date=v=>v?new Intl.DateTimeFormat('en-LK',{year:'numeric',month:'short',day:'numeric'}).format(new Date(v)):'—';
function session(){try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null')}catch{return null}}
function token(){return session()?.access_token||null}
async function getWorkspace(){
 if(cache)return cache;
 const t=token(); if(!t)throw new Error('Super Admin sign-in required');
 const r=await fetch(`${API}/api/v1/crm/customer-workspace`,{headers:{Accept:'application/json',Authorization:`Bearer ${t}`}});
 const body=await r.json().catch(()=>({}));
 if(!r.ok)throw new Error(body.error||`API ${r.status}`);
 cache=body; return body;
}
function shortId(id){const s=String(id||'');return s.length>12?`${s.slice(0,8)}…${s.slice(-4)}`:s||'—'}
function badge(value,kind='neutral'){return `<span class="ci-badge ${esc(kind)}">${esc(value)}</span>`}
function evidenceBadge(status){const m={strong:['Strong evidence','good'],growing:['Growing','partial'],limited:['Limited','warn'],insufficient:['Insufficient','neutral']};const [l,k]=m[status]||['Unknown','neutral'];return badge(l,k)}
function segmentBadge(rfm){if(!rfm?.segment)return badge('Not scored');const label=String(rfm.segment).replaceAll('_',' ').replace(/\b\w/g,m=>m.toUpperCase());return badge(label,rfm.segment==='champions'?'good':rfm.segment==='hibernating'?'warn':'partial')}
function kpi(label,value,note){return `<article class="ci-kpi"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`}
function listOrEmpty(items,formatter){if(!Array.isArray(items)||!items.length)return '<span class="ci-muted">Not enough evidence yet</span>';return `<div class="ci-mini-list">${items.slice(0,3).map(formatter).join('')}</div>`}
function renderDetail(host,c){
 const detail=host.querySelector('#ciDetail'); if(!detail)return;
 const a=c.affinities||{}, r=c.risk, p=c.predictions, nba=c.next_best_action;
 detail.hidden=false;
 detail.innerHTML=`<div class="ci-detail-head"><div><span>Customer 360</span><h2>${esc(shortId(c.customer_id))}</h2></div><button type="button" id="ciCloseDetail">×</button></div>
 <div class="ci-detail-grid">
 <article><span>Relationship</span><b>${Number(c.visits||0)} visits · ${Number(c.completed_visits||0)} completed</b><small>First: ${esc(date(c.first_visit_at))} · Last: ${esc(date(c.last_visit_at))}</small></article>
 <article><span>Value profile</span><b>${esc(money(c.booked_value))} booked</b><small>${esc(money(c.value?.completed_lifetime_revenue))} completed · ${esc(money(c.avg_booking_value))} ABV</small></article>
 <article><span>RFM</span><b>${c.rfm?esc(String(c.rfm.segment).replaceAll('_',' ')):'Not scored'}</b><small>${c.rfm?`R${c.rfm.code?.[0]||'—'} F${c.rfm.code?.[1]||'—'} M${c.rfm.code?.[2]||'—'} · ${Number(c.rfm.evidence_count||0)} evidence`:'Completed-visit evidence required'}</small></article>
 <article><span>Evidence</span><b>${esc(c.evidence_status||'unknown')}</b><small>Predictions remain unavailable until thresholds are met.</small></article>
 </div>
 <div class="ci-intel-grid">
 <article><h3>Affinities</h3>
 <div class="ci-affinity-block"><b>Services</b>${listOrEmpty(a.services,x=>`<span>${esc(shortId(x.service_id))} · score ${esc(x.score)}</span>`)}</div>
 <div class="ci-affinity-block"><b>Staff</b>${listOrEmpty(a.staff,x=>`<span>${esc(shortId(x.staff_id))} · score ${esc(x.score)}</span>`)}</div>
 <div class="ci-affinity-block"><b>Time</b>${listOrEmpty(a.time,x=>`<span>Day ${esc(x.day_of_week)} · ${esc(x.time_window)} · score ${esc(x.score)}</span>`)}</div>
 <div class="ci-affinity-block"><b>Products</b>${listOrEmpty(a.products,x=>`<span>${esc(shortId(x.product_id))} · score ${esc(x.affinity_score)}</span>`)}</div></article>
 <article><h3>Risk & prediction</h3>${r?`<p>Evidence-backed risk signals are available.</p><pre>${esc(JSON.stringify(r,null,2))}</pre>`:`<div class="ci-not-ready"><strong>Not scored</strong><span>Not enough completed-history evidence for a responsible churn/no-show score.</span></div>`}${p?'<p class="ci-prediction-note">Prediction evidence available.</p>':''}</article>
 <article><h3>Next Best Action</h3>${nba?`<div class="ci-nba"><strong>${esc(nba.action_type)}</strong><span>Confidence: ${esc(nba.confidence??'—')}</span><small>${esc(nba.reason_code||'')}</small></div>`:`<div class="ci-not-ready"><strong>Not ready</strong><span>No recommendation is generated until sufficient behavioral and transaction evidence exists.</span></div>`}</article>
 </div>`;
 detail.scrollIntoView({behavior:'smooth',block:'nearest'});
 detail.querySelector('#ciCloseDetail')?.addEventListener('click',()=>{detail.hidden=true});
}
function renderShell(host,data){
 const s=data.summary||{};
 host.innerHTML=`<div class="ci-shell">
 <div class="ci-header"><div><button type="button" class="ci-back" id="ciBack">← Analytics Hub</button><span class="ci-eyebrow">CUSTOMER 360 · CRM INTELLIGENCE</span><h1>Customer Intelligence</h1><p>Live salon relationship intelligence from synchronized CRM data, without unnecessary customer PII.</p></div><span class="ci-live">Super Admin · Live</span></div>
 <div class="ci-kpis">${kpi('Customers',s.customers??0,'Synchronized CRM profiles')}${kpi('Booked value',money(s.booked_value),'Operational relationship value')}${kpi('Completed revenue',money(s.completed_revenue),`${Number(s.completed_visits||0)} completed visits`)}${kpi('RFM scored',s.rfm_scored??0,'Completed-visit evidence')}${kpi('Risk scored',s.risk_scored??0,'Evidence-gated only')}${kpi('NBA ready',s.nba_ready??0,'No recommendation without confidence')}</div>
 <div class="ci-controls"><div class="ci-search"><span>⌕</span><input id="ciSearch" type="search" placeholder="Search customer ID or segment…" /></div>
 <select id="ciEvidenceFilter"><option value="">All evidence levels</option><option value="growing">Growing</option><option value="limited">Limited</option><option value="insufficient">Insufficient</option><option value="strong">Strong</option></select>
 <select id="ciRfmFilter"><option value="">All RFM states</option><option value="scored">RFM scored</option><option value="unscored">Not scored</option></select></div>
 <section class="ci-table-card"><div class="ci-table-head"><div><strong>Customer portfolio</strong><span id="ciResultCount">${Number(s.customers||0)} customers</span></div><small>No names, phone numbers or email addresses are displayed.</small></div>
 <div class="ci-table-wrap"><table class="ci-table"><thead><tr><th>Customer</th><th>Visits</th><th>Completed</th><th>Booked value</th><th>Avg booking</th><th>RFM</th><th>Evidence</th><th>Last activity</th></tr></thead><tbody id="ciRows"></tbody></table></div></section>
 <section class="ci-detail-card" id="ciDetail" hidden></section>
 <div class="ci-methodology"><strong>Data readiness & methodology</strong><p>Booked value comes from the synchronized salon relationship profile. Completed revenue and RFM use completed-visit evidence. Risk, LTV predictions and Next Best Action remain empty until evidence is sufficient.</p><div>${badge('Live CRM snapshot','good')} ${badge('PII excluded')} ${badge('Risk/NBA evidence-gated')}</div></div></div>`;
 host.querySelector('#ciBack')?.addEventListener('click',()=>document.querySelector('[data-view="analytics"]')?.click());
 const renderRows=()=>{
   const q=String(host.querySelector('#ciSearch')?.value||'').trim().toLowerCase();
   const e=host.querySelector('#ciEvidenceFilter')?.value||'', rf=host.querySelector('#ciRfmFilter')?.value||'';
   const all=data.customers||[];
   const rows=all.filter(c=>{const seg=String(c.rfm?.segment||'').toLowerCase();return (String(c.customer_id||'').toLowerCase().includes(q)||seg.includes(q))&&(!e||c.evidence_status===e)&&(!rf||(rf==='scored'&&!!c.rfm)||(rf==='unscored'&&!c.rfm))});
   host.querySelector('#ciResultCount').textContent=`${rows.length} customer${rows.length===1?'':'s'}`;
   const tbody=host.querySelector('#ciRows');
   tbody.innerHTML=rows.map(c=>`<tr data-ci-index="${all.indexOf(c)}"><td><button class="ci-customer-link" type="button">${esc(shortId(c.customer_id))}</button><small>${esc(c.salon_customer_id||'')}</small></td><td>${Number(c.visits||0)}</td><td>${Number(c.completed_visits||0)}</td><td><strong>${esc(money(c.booked_value))}</strong></td><td>${esc(money(c.avg_booking_value))}</td><td>${segmentBadge(c.rfm)}</td><td>${evidenceBadge(c.evidence_status)}</td><td>${esc(date(c.last_activity_at||c.last_visit_at))}</td></tr>`).join('')||'<tr><td colspan="8"><div class="ci-empty">No customers match the current filters.</div></td></tr>';
   tbody.querySelectorAll('tr[data-ci-index]').forEach(row=>row.addEventListener('click',()=>renderDetail(host,all[Number(row.dataset.ciIndex)])));
 };
 ['ciSearch','ciEvidenceFilter','ciRfmFilter'].forEach(id=>host.querySelector(`#${id}`)?.addEventListener(id==='ciSearch'?'input':'change',renderRows)); renderRows();
}
async function renderCustomerWorkspace(){
 const view=document.getElementById('detailView'); if(!view?.classList.contains('active-view'))return;
 if(document.getElementById('detailTitle')?.textContent?.trim()!=='Customer Intelligence')return;
 if(loading)return; const host=view.querySelector('.intel-shell'); if(!host)return;
 loading=true; host.innerHTML='<div class="ci-loading"><strong>Customer Intelligence</strong><span>Loading governed CRM snapshot…</span></div>';
 try{renderShell(host,await getWorkspace())}catch(err){host.innerHTML=`<div class="ci-error"><strong>Customer Intelligence unavailable</strong><span>${esc(err?.message||err)}</span><button type="button" id="ciRetry">Retry</button></div>`;host.querySelector('#ciRetry')?.addEventListener('click',()=>{cache=null;loading=false;renderCustomerWorkspace()})}finally{loading=false}
}
document.addEventListener('click',e=>{if(e.target.closest?.('[data-view="detail"][data-domain="customers"]'))setTimeout(renderCustomerWorkspace,0)},true);
const view=document.getElementById('detailView'); if(view)new MutationObserver(()=>{if(view.classList.contains('active-view')&&document.getElementById('detailTitle')?.textContent?.trim()==='Customer Intelligence')setTimeout(renderCustomerWorkspace,0)}).observe(view,{attributes:true,subtree:true,childList:true,characterData:true});
if(location.hash==='#customers')setTimeout(renderCustomerWorkspace,0);
})();