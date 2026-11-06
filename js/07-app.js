/* App: persistence, keyboard behavior and startup */

const key=(id,fn)=>$(id).addEventListener('keydown',e=>{if(e.key=='Enter'){e.preventDefault();fn(e.target);}});
key('nx',()=>$('ny').focus());key('ny',t=>{t.blur();$('go').click();});key('fx',()=>$('fy').focus());key('fy',t=>{t.blur();$('ap').click();});
key('A',()=>$('sall').focus());key('sall',t=>t.blur());
// Keep the drawing workspace stationary when an input receives focus.
loadS();cur=snapS();hist=[];buildTb();render();$('hint').textContent='';
