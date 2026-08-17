(() => {
  const API="https://b4n-salon-user-intelligence-api.comomlffo.workers.dev";
  const view=document.getElementById("salonUserIntelView");
  const nav=document.getElementById("salonUserIntelNav");
  if(!view||!nav) return;

  function token(){
    try{
      const s=JSON.parse(localStorage.getItem("b4n_crm_staff_session")||"null");
      return s?.access_token||null;
    }catch{return null}
  }
  function text(id,v){const e=document.getElementById(id);if(e)e.textContent=String(v??"—")}
  function status(kind,label){
    const e=document.getElementById("suiTrackingStatus");
    if(e){e.className=`sui-status ${kind}`;e.textContent=label}
  }
  async function get(path){
    const t=token();
    if(!t) throw new Error("Sign in required");
    const r=await fetch(API+path,{headers:{Authorization:`Bearer ${t}`,Accept:"application/json"}});
    const j=await r.json().catch(()=>({}));
    if(!r.ok)throw new Error(j.error||`API ${r.status}`);
    return j
  }
  function show(){
    document.querySelectorAll(".view-panel").forEach(x=>x.classList.remove("active-view"));
    view.classList.add("active-view");
    document.querySelectorAll(".side-nav a").forEach(x=>x.classList.remove("active"));
    nav.classList.add("active");
    history.replaceState(null,"","#salon-user-intelligence");
    load();
  }
  function hideOnOtherNavigation(e){
    const a=e.target.closest(".side-nav a");
    if(a && a!==nav && a.dataset.view) view.classList.remove("active-view");
  }
  nav.addEventListener("click",e=>{e.preventDefault();show()});
  document.addEventListener("click",hideOnOtherNavigation);
  if(location.hash==="#salon-user-intelligence") setTimeout(show,0);

  function renderList(id,rows,label,value){
    const host=document.getElementById(id);
    if(!host)return;
    if(!rows?.length){host.innerHTML="<p>No telemetry yet.</p>";return}
    host.innerHTML=rows.slice(0,10).map(r=>`<div><strong>${escapeHtml(label(r))}</strong><span>${escapeHtml(value(r))}</span></div>`).join("")
  }
  function escapeHtml(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

  async function load(){
    status("pending","Loading intelligence…");
    try{
      const [o,t,m]=await Promise.all([
        get("/api/v1/salon-user/overview"),
        get("/api/v1/salon-user/transitions"),
        get("/api/v1/salon-user/menu")
      ]);
      text("suiEvents",o.events||0);
      text("suiSessions",o.sessions||0);
      text("suiUsers",o.active_users_30d||0);
      text("suiErrors",o.errors_30d||0);
      text("suiMenuChanges",o.menu_changes_30d||0);

      if(o.data_status==="tracker_not_connected") status("pending","Tracker not connected");
      else status("live","Live telemetry");

      renderList("suiFeatures",o.feature_usage,r=>`${r.module_name||"Module"} · ${r.feature_name||"Feature"}`,r=>`${r.uses||0} uses · ${r.failures||0} failures`);
      renderList("suiRoles",o.roles,r=>r.role||"Unknown",r=>`${r.users||0} users · ${r.events||0} events`);

      const s=m.structure||o.latest_menu_structure;
      const menu=document.getElementById("suiMenuStructure");
      if(menu&&s){
        const cells=[
          ["Active services",s.active_services],["Add-on links",s.addon_links],
          ["Suggestions",s.suggestion_links],["Product links",s.product_links],
          ["Option groups",s.option_groups],["Option choices",s.option_choices],
          ["No add-ons",s.services_without_addons],["No products",s.services_without_products],
          ["Categories",s.categories]
        ];
        menu.innerHTML=cells.map(([k,v])=>`<div><span>${escapeHtml(k)}</span><b>${escapeHtml(v)}</b></div>`).join("");
      }

      renderList("suiMenuInsights",m.optimization_insights,r=>r.title,r=>`${r.recommended_action||r.summary||""}`);
      renderList("suiTransitions",t.module_transitions,r=>`${r.from_module} → ${r.to_module}`,r=>`${r.transition_count||0} transitions · ${Math.round(Number(r.backtrack_rate||0)*100)}% backtrack`);
      renderList("suiSequences",t.sequences,r=>r.pattern_class||r.sequence_key||"Sequence",r=>`${r.occurrence_count||0} occurrences`);
    }catch(e){
      status("error",e.message||"Unavailable");
    }
  }

  window.B4NSalonUserIntelligence={show,load};
})();
