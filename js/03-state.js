/* State: history, undo, dirty-state handling */

const snapS=()=>JSON.stringify({nodes,bars,sup,loads});
function dirty(){const s=snapS();if(s!==cur){hist.push(cur);if(hist.length>60)hist.shift();cur=s;saveS();}res=null;$('out').innerHTML='';render();upd();}
function undo(){if(!hist.length)return;const s=JSON.parse(hist.pop());nodes=s.nodes;bars=s.bars;sup=s.sup;loads=s.loads;cur=JSON.stringify(s);saveS();pend=null;sel=null;res=null;$('out').innerHTML='';render();upd();}
$('ap').onclick=()=>{if(sel==null){$('hint').textContent='حدّد العقدة أولًا.';return;}const a=parseFloat($('fx').value)||0,b=parseFloat($('fy').value)||0;if(!a&&!b){$('hint').textContent='اكتب قيمة غير صفرية لـ Fx أو Fy.';return;}(loads[sel]=loads[sel]||[]).push([a,b]);dirty();};
$('ln').onchange=()=>{sel=$('ln').value===''?null:+$('ln').value;render();upd();};
const cv=$('cv');
