const $=id=>document.getElementById(id);
const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
let selectedFlights=[];
function message(text){$('message').textContent=text;}
async function request(url,body){const r=await fetch(url,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{}); const data=await r.json(); if(!r.ok)throw new Error(data.error);return data;}
async function quota(){
 try{await request('/api/session');}catch(e){$('login').hidden=false;$('workspace').hidden=true;return;}
 $('login').hidden=true;$('workspace').hidden=false;
 try{const q=await request('/api/status');if(!q.configured){$('quotaText').textContent='Cadastre sua chave na aba Configurações.';$('meter').hidden=true;$('quotaDetail').textContent='';return;} const limit=Number(q.limit),used=Number(q.used),remaining=Number(q.remaining);const known=Number.isFinite(limit)&&limit>0&&Number.isFinite(used);const pct=known?Math.min(100,used/limit*100):0;$('meter').hidden=!known;$('meter').value=pct;$('meter').className=pct>=90?'danger':pct>=70?'warning':'';$('quotaText').textContent=known?`${used} de ${limit} consultas mensais utilizadas (${Math.round(pct)}%).`:'Cota mensal indisponível.';$('quotaDetail').textContent=`${Number.isFinite(remaining)?remaining+' consultas restantes. ':''}${q.plan||''}${q.hourLimit?' · Limite por hora: '+q.hourLimit:''}${pct>=90?' · Atenção: cota quase esgotada!':''}`;}catch(e){$('meter').hidden=true;$('quotaText').textContent='Não foi possível consultar a cota da API.';$('quotaDetail').textContent=e.message+' Você pode trocar a chave em Configurações.';}
}
$('loginForm').onsubmit=async e=>{e.preventDefault();try{await request('/api/login',{password:$('password').value});$('password').value='';message('');await quota();}catch(e){message(e.message);}};
function tab(settings){$('settings').hidden=!settings;$('trip').hidden=settings;$('settingsTab').setAttribute('aria-pressed',String(settings));$('tripTab').setAttribute('aria-pressed',String(!settings));}
$('settingsTab').onclick=()=>tab(true);$('tripTab').onclick=()=>tab(false);$('refresh').onclick=quota;
$('settingsForm').onsubmit=async e=>{e.preventDefault();const button=e.target.querySelector('button');button.disabled=true;try{await request('/api/settings',{key:$('apiKey').value});$('apiKey').value='';message('Chave validada e salva no servidor.');await quota();}catch(e){message(e.message);}finally{button.disabled=false;}};
$('passwordForm').onsubmit=async e=>{e.preventDefault();if($('newPassword').value!==$('confirmPassword').value){message('A confirmação não corresponde à nova senha.');return;}const button=e.target.querySelector('button');button.disabled=true;try{await request('/api/password',{currentPassword:$('currentPassword').value,newPassword:$('newPassword').value});e.target.reset();$('workspace').hidden=true;$('login').hidden=false;tab(false);message('Senha alterada. Entre novamente com sua nova senha.');$('password').focus();}catch(e){message(e.message);}finally{button.disabled=false;}};
function calculate(){
 $('selectedFlights').replaceChildren();
 if(!selectedFlights.length){const empty=document.createElement('p');empty.className='muted';empty.textContent='Nenhum voo selecionado. Busque seu primeiro trecho acima.';$('selectedFlights').append(empty);}
 for(const [index,f] of selectedFlights.entries()){
  const row=document.createElement('div');row.className='flight';const info=document.createElement('div');const title=document.createElement('strong');title.textContent=`${index+1}. ${f.origin} → ${f.destination}`;
  const details=document.createElement('p');details.textContent=`${f.departure}${f.type==='roundtrip'?' · Volta: '+f.returnDate:''} · ${f.type==='oneway'?'Só ida':'Ida e volta'}`;
  const airlines=document.createElement('p');airlines.className='muted';airlines.textContent=f.description;const price=document.createElement('p');price.textContent=money(f.price);info.append(title,details,airlines,price);
  const remove=document.createElement('button');remove.type='button';remove.textContent='Remover';remove.setAttribute('aria-label',`Remover passagem ${index+1}: ${f.origin} para ${f.destination}`);remove.onclick=()=>{selectedFlights.splice(index,1);calculate();};row.append(info,remove);$('selectedFlights').append(row);
 }
 $('flightCount').textContent=`${selectedFlights.length} passagem(ns) selecionada(s) · 1 pessoa`;
 $('total').textContent=money(selectedFlights.reduce((sum,f)=>sum+f.price,0));
 try{localStorage.setItem('selectedFlights',JSON.stringify(selectedFlights));}catch{message('Não foi possível salvar a lista neste navegador. Ela será perdida ao fechar a página.');}
}
try{const saved=JSON.parse(localStorage.getItem('selectedFlights')||'[]');if(Array.isArray(saved))selectedFlights=saved.filter(f=>f && Number.isFinite(f.price) && f.price>=0 && typeof f.origin==='string' && typeof f.destination==='string');}catch{}calculate();
const today=new Date().toISOString().slice(0,10);$('departure').min=today;$('return').min=today;
$('departure').onchange=()=>{$('return').min=$('departure').value||today;};
let tripType='roundtrip';
function setTripType(type){tripType=type;const oneWay=type==='oneway';$('returnField').hidden=oneWay;$('return').required=!oneWay;$('return').disabled=oneWay;$('oneway').setAttribute('aria-pressed',String(oneWay));$('roundtrip').setAttribute('aria-pressed',String(!oneWay));$('searchHint').textContent=`1 adulto · Econômica · ${oneWay?'Só ida':'Ida e volta'} · Valores em reais.`;}
$('oneway').onclick=()=>setTripType('oneway');$('roundtrip').onclick=()=>setTripType('roundtrip');
$('searchForm').onsubmit=async e=>{
 e.preventDefault();
 const origin=airportCode($('origin').value),destination=airportCode($('destination').value);
 for(const id of ['origin','destination']){if(!airportCode($(id).value)){ $(id).setCustomValidity('Selecione um aeroporto nas sugestões ou informe seu código IATA.');$(id).reportValidity();return;}}
 const searchType=tripType,departure=$('departure').value,returnDate=$('return').value;
 $('searchButton').disabled=true;$('searchButton').textContent='Consultando…';$('results').replaceChildren();message('');
 try{
  const r=await request('/api/flights',{origin,destination,departure,return:returnDate,type:searchType});
  if(!r.flights.length)message('Nenhuma opção encontrada. Tente outras datas ou aeroportos.');
  for(const f of r.flights.slice(0,20)){
   const row=document.createElement('div');row.className='flight';const info=document.createElement('div');const price=document.createElement('strong');price.textContent=money(f.price);
   const description=document.createElement('p');description.textContent=f.segments.map(s=>`${s.airline} · ${s.from} → ${s.to} · ${s.time}`).join(' / ');
   const detail=document.createElement('p');detail.className='muted';detail.textContent=`${f.stops===0?'Direto':f.stops+' conexão(ões)'} · ${f.duration} min · ${r.type==='oneway'?'Só ida':'Ida e volta'}`;
   info.append(price,description,detail);const button=document.createElement('button');button.textContent='Adicionar à viagem';button.onclick=()=>{const signature=JSON.stringify([origin,destination,departure,r.type,r.type==='roundtrip'?returnDate:'',f.price,f.segments]);if(selectedFlights.some(item=>item.signature===signature)){message('Esta opção já está na sua lista.');return;}selectedFlights.push({origin,destination,departure,returnDate:r.type==='roundtrip'?returnDate:'',type:r.type,price:f.price,description:description.textContent,signature});calculate();message('Passagem adicionada! Pesquise o próximo trecho; sua lista será mantida.');};row.append(info,button);$('results').append(row);
  }
  await quota();
 }catch(e){message(e.message);}finally{$('searchButton').disabled=false;$('searchButton').textContent='Buscar passagens →';}
};
quota();
