const {spawn}=require('node:child_process');
const fs=require('node:fs/promises');
const path=require('node:path');
const os=require('node:os');
(async()=>{
 const base=process.platform==='win32'?path.join(process.env.LOCALAPPDATA,'Temp','opencode'):os.tmpdir();
 const dir=await fs.mkdtemp(path.join(base,'password-test-'));
 const child=spawn(process.execPath,['server.js'],{env:{...process.env,ADMIN_PASSWORD:'senha123',SERPAPI_KEY:'',PORT:'3099',DATA_DIR:dir,NODE_ENV:'test'},stdio:['ignore','pipe','pipe']});
 try{
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('error',reject);child.once('exit',()=>reject(new Error('Servidor encerrou')));});
  async function post(route,data,cookie){return fetch('http://localhost:3099/api/'+route,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(data)});}
  let r=await post('login',{password:'senha123'});if(r.status!==200)throw Error('login');
  const cookie=r.headers.get('set-cookie').split(';')[0];
  r=await post('password',{currentPassword:'errada',newPassword:'nova123'},cookie);if(r.status!==400)throw Error('Senha atual não validada');
  r=await post('password',{currentPassword:'senha123',newPassword:'nova123'},cookie);if(r.status!==200)throw Error('troca');
  r=await fetch('http://localhost:3099/api/status',{headers:{Cookie:cookie}});if(r.status!==401)throw Error('Sessão antiga não encerrada');
  r=await post('login',{password:'senha123'});if(r.status!==401)throw Error('Senha anterior aceita');
  r=await post('login',{password:'nova123'});if(r.status!==200)throw Error('Nova senha recusada');
  const saved=JSON.parse(await fs.readFile(path.join(dir,'auth.json'),'utf8'));if(!saved.hash || JSON.stringify(saved).includes('nova123'))throw Error('Persistência insegura');
  console.log('OK: troca de senha, validação, invalidação de sessão e armazenamento hash.');
 }finally{child.kill();}
})().catch(e=>{console.error(e);process.exitCode=1;});
