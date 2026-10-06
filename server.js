const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.join(__dirname, 'public');
const data = process.env.DATA_DIR || path.join(__dirname, 'data');
const password = process.env.ADMIN_PASSWORD;
if (!password || password.length < 12) { console.error('Defina ADMIN_PASSWORD com pelo menos 12 caracteres antes de iniciar.'); process.exit(1); }
const sessions = new Map();
const attempts = new Map();
let key = process.env.SERPAPI_KEY || '';
let quota;
let quotaTime = 0;
let searching = false;
async function init() { await fs.mkdir(data, {recursive:true}); try { key = (JSON.parse(await fs.readFile(path.join(data,'settings.json'),'utf8'))).key || key; } catch(e) { if(e.code !== 'ENOENT') throw e; } }
function json(res, status, body) { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}); res.end(JSON.stringify(body)); }
async function body(req) { let text=''; for await (const chunk of req) { text+=chunk; if(text.length>8192) throw new Error('Dados muito grandes.'); } return JSON.parse(text || '{}'); }
function authorized(req) { const token = /(?:^|;\s*)session=([a-f0-9]+)/.exec(req.headers.cookie || '')?.[1]; return sessions.get(token)>Date.now(); }
async function api(endpoint, params={}, candidate=key) { const url=new URL('https://serpapi.com/'+endpoint); url.search=new URLSearchParams({...params,api_key:candidate}); const response=await fetch(url,{signal:AbortSignal.timeout(45000)}); const result=await response.json(); if(!response.ok || result.error) throw new Error('A SerpApi recusou a consulta. Confira a chave e a cota.'); return result; }
async function usage(force=false) { if(!key) return {configured:false}; if(!quota || force || Date.now()-quotaTime>60000) { const a=await api('account.json'); quota={configured:true,plan:a.plan_name,limit:a.searches_per_month,used:a.this_month_usage,remaining:a.total_searches_left,hourLimit:a.account_rate_limit_per_hour}; quotaTime=Date.now(); } return quota; }
const server=http.createServer(async(req,res)=>{ try {
 const url=new URL(req.url,'http://localhost');
 if(req.method==='POST' && req.headers.origin && req.headers.origin!==`${req.headers['x-forwarded-proto'] || 'http'}://${req.headers.host}`) return json(res,403,{error:'Origem não permitida.'});
 if(url.pathname==='/api/login' && req.method==='POST') { const ip=req.socket.remoteAddress; let attempt=attempts.get(ip); if(!attempt || attempt.until<Date.now()) attempt={count:0,until:Date.now()+900000}; if(attempt.count>=10) return json(res,429,{error:'Muitas tentativas. Aguarde 15 minutos.'}); const b=await body(req); const a=crypto.createHash('sha256').update(String(b.password||'')).digest(); const z=crypto.createHash('sha256').update(password).digest(); if(!crypto.timingSafeEqual(a,z)) {attempt.count++; attempts.set(ip,attempt); return json(res,401,{error:'Senha incorreta.'});} const token=crypto.randomBytes(32).toString('hex'); sessions.set(token,Date.now()+8*3600000); res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`); return json(res,200,{ok:true}); }
 if(url.pathname.startsWith('/api/')) {
 if(!authorized(req)) return json(res,401,{error:'Entre com a senha para acessar.'});
 if(url.pathname==='/api/status' && req.method==='GET') return json(res,200,await usage());
 if(url.pathname==='/api/settings' && req.method==='POST') { const b=await body(req); const candidate=String(b.key||'').trim(); if(!/^[a-fA-F0-9]{64}$/.test(candidate)) return json(res,400,{error:'Informe uma chave SerpApi válida.'}); await api('account.json',{},candidate); const temp=path.join(data,'settings.tmp'); await fs.writeFile(temp,JSON.stringify({key:candidate}),{mode:0o600}); await fs.rename(temp,path.join(data,'settings.json')); key=candidate; quota=null; return json(res,200,await usage(true)); }
 if(url.pathname==='/api/flights' && req.method==='POST') { if(!key) return json(res,400,{error:'Cadastre a chave em Configurações.'}); if(searching) return json(res,429,{error:'Já existe uma busca em andamento. Aguarde.'}); const b=await body(req); if(!/^[A-Z]{3}$/.test(b.origin||'') || !/^[A-Z]{3}$/.test(b.destination||'') || b.origin===b.destination) return json(res,400,{error:'Use códigos diferentes de aeroportos, como GRU e REC.'}); const today=new Date().toISOString().slice(0,10); if(!/^\d{4}-\d{2}-\d{2}$/.test(b.departure||'') || !/^\d{4}-\d{2}-\d{2}$/.test(b.return||'') || b.departure<today || b.return<b.departure) return json(res,400,{error:'Confira as datas de ida e volta.'}); searching=true; try { const r=await api('search.json',{engine:'google_flights',departure_id:b.origin,arrival_id:b.destination,outbound_date:b.departure,return_date:b.return,type:'1',adults:'1',currency:'BRL',hl:'pt-BR',gl:'br',sort_by:'2'}); quotaTime=0; const flights=[...(r.best_flights||[]),...(r.other_flights||[])].filter(f=>Number.isFinite(f.price)).sort((a,b)=>a.price-b.price).map(f=>({price:f.price,duration:f.total_duration,segments:(f.flights||[]).map(s=>({airline:s.airline,from:s.departure_airport.id,to:s.arrival_airport.id,time:s.departure_airport.time})),stops:(f.flights||[]).length-1})); return json(res,200,{flights,checkedAt:new Date().toISOString()}); } finally { searching=false; } }
 return json(res,404,{error:'Não encontrado.'}); }
 if(req.method!=='GET') return json(res,405,{error:'Método não permitido.'});
 const names={'/':'index.html','/app.js':'app.js','/style.css':'style.css'}; const filename=names[url.pathname]; if(!filename) return json(res,404,{error:'Não encontrado.'});
 res.writeHead(200,{'Content-Type':filename.endsWith('.js')?'text/javascript; charset=utf-8':filename.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'}); res.end(await fs.readFile(path.join(root,filename)));
 } catch(e) { console.error('Falha na operação:',e.name); json(res,502,{error:e.name==='TimeoutError'?'A consulta demorou demais. Tente novamente.':e.message.startsWith('A SerpApi')?e.message:'Não foi possível concluir a operação.'}); } });
init().then(()=>server.listen(process.env.PORT || 3000,'0.0.0.0',()=>console.log('Simulador disponível na porta '+(process.env.PORT || 3000))));
