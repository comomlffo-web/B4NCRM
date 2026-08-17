const bars=[45,54,63,71,38,57,68,76,83,52,72,89,100,94,84,69,52,35,64,55,76,88,98,82,62,48,73,91,72,61];
const barChart=document.getElementById('barChart'); bars.forEach(v=>{const i=document.createElement('i');i.style.height=v+'%';barChart.appendChild(i)});
const services=[['Hair Colour','LKR 4,250,000',94],['Hair Cut','LKR 2,180,000',61],['Nail Art','LKR 1,320,000',39],['Facial','LKR 980,000',31],['Keratin Treatment','LKR 860,000',27]];
const list=document.getElementById('servicesList');services.forEach(([n,v,p])=>{const r=document.createElement('div');r.className='service-row';r.innerHTML=`<div class="service-icon"></div><div class="service-main"><strong>${n}</strong><div class="mini-progress"><span style="width:${p}%"></span></div></div><b>${v}</b>`;list.appendChild(r)});
document.getElementById('menuBtn').addEventListener('click',()=>document.getElementById('sidebar').classList.toggle('open'));
document.addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();document.getElementById('globalSearch').focus()}});
