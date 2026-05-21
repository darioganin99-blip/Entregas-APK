
const $ = id => document.getElementById(id);
const LS = { user:"elta_user", last:"elta_last_record" };
let step = 1;
let destinos = [];
let state = { gps:null, destino:null, lote:"", vins:[], obs:"Sin observaciones" };
let currentScanStream = null;

function load(k,f){ try{return JSON.parse(localStorage.getItem(k)) ?? f}catch(e){return f} }
function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }
function user(){ return load(LS.user,{fleet:"",driver:"",phone:""}); }
function fmtDate(d){ return new Date(d).toLocaleString("es-AR"); }
function regId(){ const d=new Date(); return "ELTA-"+d.getFullYear()+String(d.getMonth()+1).padStart(2,"0")+String(d.getDate()).padStart(2,"0")+"-"+String(d.getHours()).padStart(2,"0")+String(d.getMinutes()).padStart(2,"0")+String(d.getSeconds()).padStart(2,"0"); }

fetch("destinos.json")
  .then(r=>r.json())
  .then(j=>{destinos=Array.isArray(j)?j:[]; renderStep();})
  .catch(()=>{destinos=[]; renderStep();});

function show(id){
  ["entrega","usuario","ultimo"].forEach(s=>$(s).classList.toggle("hidden",s!==id));
  ["btn-entrega","btn-usuario","btn-ultimo"].forEach(b=>$(b).classList.remove("active"));
  $("btn-"+id).classList.add("active");
  if(id==="usuario") loadUserForm();
  if(id==="ultimo") renderLast();
}

function setProgress(){
  $("stepNum").innerText = step;
  for(let i=2;i<=5;i++) $("p"+i).classList.toggle("on", step>=i);
}

function renderStep(){
  setProgress();
  const u = user();

  if(step===1){
    $("stepTitle").innerText="Entrega";
    $("stepContent").innerHTML=`
      <div class="userLine">
        <div class="userBox">
          <span>Flota</span>
          <b>${u.fleet || "Sin flota"}</b>
        </div>
        <div class="userBox">
          <span>Chofer</span>
          <b>${u.driver || "Sin chofer"}</b>
        </div>
      </div>
      <p class="stepHint">Validar que la flota y el chofer sean correctos antes de registrar la entrega.</p>
      <button class="btn" onclick="validateUserAndNext()">Validar datos</button>
      <button class="btn light" onclick="show('usuario')">Editar usuario</button>`;
  }

  if(step===2){
    $("stepTitle").innerText="Destino GPS · Fecha y Hora";
    const gps = state.gps;
    const list = nearbyOptions();
    const opts = list.map((d,i)=>`<option value="${i}">${d.name} · ${Number(d.km || 0).toFixed(2)} km</option>`).join("");
    $("stepContent").innerHTML=`
      <p class="stepHint">Al validar GPS se calcula automáticamente el destino más cercano usando las coordenadas cargadas.</p>
      <label>Fecha y hora</label>
      <input readonly value="${gps ? fmtDate(gps.time) : ""}" placeholder="Se registra al validar GPS">
      <label>GPS</label>
      <input readonly value="${gps ? gps.lat.toFixed(6)+', '+gps.lng.toFixed(6)+' · precisión '+Math.round(gps.acc)+' m' : ""}" placeholder="Sin GPS">
      <button class="btn secondary" onclick="getGps()">Validar ubicación con GPS</button>
      <label>Destino más cercano</label>
      <input readonly value="${state.destino ? state.destino.name : ""}" placeholder="Se calcula con GPS">
      <div class="destInfo">${state.destino && state.destino.km != null ? 'Distancia aproximada: '+Number(state.destino.km).toFixed(2)+' km' : ''}</div>
      <label>Destinos cercanos</label>
      <select id="destSelect">${opts || '<option value="">Validá GPS para ver destinos cercanos</option>'}</select>
      <p class="debugDest">Destinos cargados: ${destinos.length}. Se muestran destinos dentro de 5 km; si no hay, los 10 más cercanos.</p>
      <button class="btn light" onclick="selectDestino()">Usar destino seleccionado</button>
      <button class="btn" onclick="nextFromGps()">Continuar</button>`;
  }

  if(step===3){
    $("stepTitle").innerText="Ingresar Número de Lote/Carga";
    $("stepContent").innerHTML=`
      <label>Lote / Carga</label>
      <input id="lote" inputmode="numeric" value="${state.lote}" placeholder="Ej: 1223">
      <button class="btn secondary" onclick="startScanner('lote')">Escanear código de barras</button>
      <div id="scannerBox" class="hidden"><video id="video" muted playsinline></video><button class="btn light" onclick="stopScanner()">Cerrar cámara</button></div>
      <button class="btn" onclick="saveLote()">Validar lote</button>`;
  }

  if(step===4){
    $("stepTitle").innerText="Ingresar Unidades";
    $("stepContent").innerHTML=`
      <p class="stepHint">Este paso es opcional. Podés continuar solo con lote o cargar uno o más VIN.</p>
      <label>VIN</label>
      <input id="vin" placeholder="Ingresar VIN o escanear">
      <button class="btn secondary" onclick="startScanner('vin')">Escanear VIN</button>
      <div id="scannerBox" class="hidden"><video id="video" muted playsinline></video><button class="btn light" onclick="stopScanner()">Cerrar cámara</button></div>
      <button class="btn light" onclick="addVin()">Agregar VIN</button>
      <h3>VIN cargados: ${state.vins.length}</h3>
      <div>${state.vins.map((v,i)=>`<span class="chip">${v}<button onclick="removeVin(${i})">×</button></span>`).join("") || '<p class="small">Sin VIN cargados.</p>'}</div>
      <label>Observación general</label>
      <textarea id="obs">${state.obs || "Sin observaciones"}</textarea>
      <button class="btn" onclick="saveUnits()">Continuar</button>`;
  }

  if(step===5){
    $("stepTitle").innerText="Generar y enviar por WhatsApp";
    const msg = buildMessage(false);
    $("stepContent").innerHTML=`
      <div class="summary">${escapeHtml(msg)}</div>
      <button class="btn" onclick="sendWhatsapp()">Enviar por WhatsApp</button>
      <button class="btn light" onclick="step=1;renderStep()">Volver al inicio</button>`;
  }
}

function validateUserAndNext(){
  const u=user();
  if(!u.fleet || !u.driver || !u.phone){
    alert("Completá Flota, Chofer y WhatsApp en Usuario.");
    show("usuario");
    return;
  }
  show("entrega");
  step = 2;
  renderStep();
}

function getGps(){
  if(!navigator.geolocation){ alert("GPS no disponible."); return; }
  navigator.geolocation.getCurrentPosition(pos=>{
    state.gps={lat:pos.coords.latitude,lng:pos.coords.longitude,acc:pos.coords.accuracy || 0,time:new Date().toISOString()};
    const nearest = nearestDestino(state.gps.lat,state.gps.lng);
    if(nearest) state.destino = nearest;
    else alert("No hay destinos cargados para calcular cercanía.");
    renderStep();
  }, err=>alert("No se pudo obtener GPS: "+err.message), {enableHighAccuracy:true,timeout:20000,maximumAge:0});
}

function distKm(a,b,c,d){
  const R=6371, toRad=x=>x*Math.PI/180;
  const dLat=toRad(c-a), dLng=toRad(d-b);
  const s=Math.sin(dLat/2)**2 + Math.cos(toRad(a))*Math.cos(toRad(c))*Math.sin(dLng/2)**2;
  return R*2*Math.atan2(Math.sqrt(s),Math.sqrt(1-s));
}

function cleanDestinos(){
  return destinos
    .map(d => ({...d, lat:Number(d.lat), lng:Number(d.lng)}))
    .filter(d => Number.isFinite(d.lat) && Number.isFinite(d.lng));
}

function nearestDestino(lat,lng){
  const clean = cleanDestinos();
  if(!clean.length) return null;
  return clean.map(d=>({...d,km:distKm(lat,lng,d.lat,d.lng)})).sort((a,b)=>a.km-b.km)[0];
}

function nearbyOptions(){
  if(!state.gps) return [];
  const all = cleanDestinos().map(d=>({...d,km:distKm(state.gps.lat,state.gps.lng,d.lat,d.lng)})).sort((a,b)=>a.km-b.km);
  const within5 = all.filter(d=>d.km<=5);
  return within5.length ? within5 : all.slice(0,10);
}

function selectDestino(){
  const idx = Number($("destSelect").value);
  const list = nearbyOptions();
  if(Number.isFinite(idx) && list[idx]) state.destino = list[idx];
  renderStep();
}

function nextFromGps(){
  if(!state.gps){ alert("Primero validá GPS."); return; }
  if(!state.destino){ alert("Seleccioná un destino."); return; }
  step=3; renderStep();
}

function saveLote(){
  const val=$("lote").value.trim();
  if(!val){ alert("Ingresá el número de lote/carga."); return; }
  state.lote=val; step=4; renderStep();
}

function addVin(){
  const v=$("vin").value.trim().toUpperCase();
  if(!v) return;
  if(!state.vins.includes(v)) state.vins.push(v);
  renderStep();
}

function removeVin(i){ state.vins.splice(i,1); renderStep(); }

function saveUnits(){
  state.obs = $("obs").value.trim() || "Sin observaciones";
  step=5; renderStep();
}

function buildMessage(finalize){
  const u=user(), gps=state.gps, id=regId();
  const unidades = state.vins.length ? "VIN informados:\n"+state.vins.map(v=>"- "+v).join("\n") : "Informado solo con lote.";
  const msg = `ELTA - Registro de Entrega de unidades
N° registro: ${id}
Chofer: ${u.driver}
Flota: ${u.fleet}
Fecha entrega: ${gps ? fmtDate(gps.time) : fmtDate(new Date())}
Lote: ${state.lote}
Destino: ${state.destino ? state.destino.name : ""}
GPS: ${gps ? gps.lat.toFixed(6)+", "+gps.lng.toFixed(6)+" · precisión "+Math.round(gps.acc)+" m · Fecha/hora: "+fmtDate(gps.time) : ""}
${unidades}
Observación general: ${state.obs || "Sin observaciones"}`;
  if(finalize) save(LS.last,{msg, date:new Date().toISOString()});
  return msg;
}

function sendWhatsapp(){
  const u=user();
  const msg=buildMessage(true);
  const url=`https://wa.me/${u.phone}?text=${encodeURIComponent(msg)}`;
  state={gps:null,destino:null,lote:"",vins:[],obs:"Sin observaciones"};
  step=1;
  window.location.href=url;
  setTimeout(renderStep,800);
}

function resendLast(){
  const last=load(LS.last,null), u=user();
  if(!last){ alert("No hay último registro."); return; }
  if(!u.phone){ alert("Cargá el teléfono en Usuario."); show("usuario"); return; }
  window.location.href=`https://wa.me/${u.phone}?text=${encodeURIComponent(last.msg)}`;
}

function renderLast(){
  const last=load(LS.last,null);
  $("lastBox").innerText = last ? last.msg : "Todavía no hay registros enviados.";
}

function loadUserForm(){
  const u=user();
  $("userFleet").value=u.fleet||"";
  $("userDriver").value=u.driver||"";
  $("userPhone").value=u.phone||"";
}

function saveUser(){
  save(LS.user,{fleet:$("userFleet").value.trim(),driver:$("userDriver").value.trim(),phone:$("userPhone").value.trim().replace(/\D/g,"")});
  $("userMsg").innerHTML='<span class="ok">Usuario guardado correctamente.</span>';
}

function startScanner(target){
  const box=$("scannerBox"), video=$("video");
  if(!navigator.mediaDevices){ alert("Cámara no disponible."); return; }
  box.classList.remove("hidden");
  navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}}).then(stream=>{
    currentScanStream=stream; video.srcObject=stream; video.play();
    alert("Cámara abierta. En esta versión se permite lectura visual; si el lector automático no está disponible, ingresá el dato manualmente.");
  }).catch(e=>alert("No se pudo abrir cámara: "+e.message));
}

function stopScanner(){
  if(currentScanStream){ currentScanStream.getTracks().forEach(t=>t.stop()); currentScanStream=null; }
  const box=$("scannerBox"); if(box) box.classList.add("hidden");
}

function escapeHtml(s){ return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[m])); }

show("entrega");
renderStep();
