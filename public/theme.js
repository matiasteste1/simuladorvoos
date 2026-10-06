(() => {
 let theme;
 try { theme=localStorage.getItem('travelTheme'); } catch {}
  if(theme!=='light' && theme!=='dark') theme='light';
 document.documentElement.dataset.theme=theme;
 document.addEventListener('DOMContentLoaded',()=>{
  const button=document.getElementById('themeToggle');
  function update(){const dark=document.documentElement.dataset.theme==='dark';button.textContent=dark?'☀ Tema claro':'☾ Tema escuro';button.setAttribute('aria-pressed',String(dark));button.setAttribute('aria-label',dark?'Ativar tema claro':'Ativar tema escuro');}
  button.onclick=()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('travelTheme',document.documentElement.dataset.theme);}catch{}update();};update();
 });
})();
