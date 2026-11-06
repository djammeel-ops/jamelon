/* App: persistence, keyboard behavior and startup */

const key=(id,fn)=>$(id).addEventListener('keydown',e=>{if(e.key=='Enter'){e.preventDefault();fn(e.target);}});
key('nx',()=>$('ny').focus());key('ny',t=>{t.blur();$('go').click();});key('fx',()=>$('fy').focus());key('fy',t=>{t.blur();$('ap').click();});
key('A',()=>$('sall').focus());key('sall',t=>t.blur());
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('focus',()=>setTimeout(()=>el.scrollIntoView({block:'center',behavior:'smooth'}),350)));
loadS();cur=snapS();hist=[];buildTb();render();$('hint').textContent='';
