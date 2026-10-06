const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
const fields=['fare','nights','hotel','days','food','transport','extras'];
function message(text){$('message').textContent=text;}
async function request(url,body){const r=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}); const data=await r.json(); if(!r.ok)throw new Error(data.error);return data;}
async function quota(){try{const q=await request('/api/status');$('login').hidden=true;$('workspace').hidden=false;if(!q.configured){$('quotaText').textContent='Cadastre sua chave na aba Configurações.';$('meter').value=0;$('quotaDetail').textContent='';return;} const limit=Number(q.limit),used=Number(q.used),remaining=Number(q.remaining);const known=Number.isFinite(limit)&&limit>0&&Number.isFinite(used);const pct=known?Math.min(100,used/limit*100):0;$('meter').value=pct;$('meter').className=pct>=90?'danger':pct>=70?'warning':'';$('quotaText').textContent=known?`${used} de ${limit} consultas mensais utilizadas (${Math.round(pct)}%).`:'Cota mensal indisponível.';$('quotaDetail').textContent=`${Number.isFinite(remaining)?remaining+' consultas restantes. ':''}${q.plan||''}${q.hourLimit?' · Limite por hora: '+q.hourLimit:''}${pct>=90?' · Atenção: cota quase esgotada!':''}`;}catch(e){message(e.message);}}
$('loginForm').onsubmit=async e=>{e.preventDefault();try{await request('/api/login',{password:$('password').value});$('password').value='';message('');await quota();}catch(e){message(e.message);}};
function tab(settings){$('settings').hidden=!settings;$('trip').hidden=settings;$('settingsTab').setAttribute('aria-pressed',String(settings));$('tripTab').setAttribute('aria-pressed',String(!settings));}
$('settingsTab').onclick=()=>tab(true);$('tripTab').onclick=()=>tab(false);$('refresh').onclick=quota;
$('settingsForm').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{await request('/api/settings',{key:$('apiKey').value});$('apiKey').value='';message('Chave validada e salva no servidor.');await quota();}catch(e){message(e.message);}finally{button.disabled=false;}};
function calculate(){const n=id=>Math.max(0,Number($(id).value)||0);const hotel=n('nights')*n('hotel'),food=n('days')*n('food');$('total').textContent=money(n('fare')+hotel+food+n('transport')+n('extras'));$('breakdown').textContent=`Passagem: ${money(n('fare'))} · Hospedagem: ${money(hotel)} · Alimentação: ${money(food)} · Transporte: ${money(n('transport'))} · Extras: ${money(n('extras'))}`;try{localStorage.setItem('budget',JSON.stringify(Object.fromEntries(fields.map(id=>[id,$(id).value]))));}catch{}}
try{const saved=JSON.parse(localStorage.getItem('budget')||'{}');for(const id of fields)if(saved[id]!==undefined)$(id).value=saved[id];}catch{}for(const id of fields)$(id).oninput=calculate;calculate();
const today=new Date().toISOString().slice(0,10);$('departure').min=today;$('return').min=today;
$('departure').onchange=()=>{$('return').min=$('departure').value||today;};
let tripType='roundtrip';
function setTripType(type){tripType=type;const oneWay=type==='oneway';$('returnField').hidden=oneWay;$('return').required=!oneWay;$('return').disabled=oneWay;$('oneway').setAttribute('aria-pressed',String(oneWay));$('roundtrip').setAttribute('aria-pressed',String(!oneWay));$('searchHint').textContent=`1 adulto · Econômica · ${oneWay?'Só ida':'Ida e volta'} · Valores em reais.`;document.querySelector('label[for="fare"]')?.remove();$('fare').parentElement.firstChild.textContent=`Passagem — ${oneWay?'só ida':'ida e volta'} (R$)`;}
$('oneway').onclick=()=>setTripType('oneway');$('roundtrip').onclick=()=>setTripType('roundtrip');
$('searchForm').onsubmit=async e=>{
 e.preventDefault();
 const origin=airportCode($('origin').value),destination=airportCode($('destination').value);
 for(const id of ['origin','destination']){if(!airportCode($(id).value)){ $(id).setCustomValidity('Selecione um aeroporto nas sugestões ou informe seu código IATA.');$(id).reportValidity();return;}}
 const searchType=tripType,departure=$('departure').value,returnDate=$('return').value;
 $('searchButton').disabled=true;$('searchButton').textContent='Consultando…';$('results').replaceChildren();message('');
 try{
  const r=await request('/api/flights',{origin,destination,departure,return:returnDate,type:searchType});
  if(!r.flights.length)message('Nenhuma opção encontrada. Tente outras datas ou informe o preço manualmente.');
  for(const f of r.flights.slice(0,20)){
   const row=document.createElement('div');row.className='flight';const info=document.createElement('div');const price=document.createElement('strong');price.textContent=money(f.price);
   const description=document.createElement('p');description.textContent=f.segments.map(s=>`${s.airline} · ${s.from} → ${s.to} · ${s.time}`).join(' / ');
   const detail=document.createElement('p');detail.className='muted';detail.textContent=`${f.stops===0?'Direto':f.stops+' conexão(ões)'} · ${f.duration} min · ${r.type==='oneway'?'Só ida':'Ida e volta'}`;
   info.append(price,description,detail);const button=document.createElement('button');button.textContent='Selecionar';button.onclick=()=>{setTripType(r.type);$('fare').value=f.price;calculate();message(r.type==='oneway'?'Passagem de ida adicionada. Confira taxas e bagagem antes da compra.':'Passagem adicionada. Confirme a opção de volta e o preço final no Google Voos.');};row.append(info,button);$('results').append(row);
  }
  if(searchType==='roundtrip'){const nights=Math.round((Date.parse(returnDate)-Date.parse(departure))/86400000);$('nights').value=nights;$('days').value=nights+1;}else{message('Busca de só ida concluída. Defina manualmente os dias de viagem e as noites de hospedagem.');}
  calculate();await quota();
 }catch(e){message(e.message);}finally{$('searchButton').disabled=false;$('searchButton').textContent='Buscar passagens →';}
};
quota();
