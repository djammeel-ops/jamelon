/* State: multi-step undo/redo and dirty-state handling */

const snapS=()=>JSON.stringify({nodes,bars,sup,loads});
let hist=[],redoHist=[],cur='';
function dirty(){
  const s=snapS();
  if(s!==cur){
    if(cur)hist.push(cur);
    if(hist.length>60)hist.shift();
    redoHist=[];
    cur=s;
    saveS();
  }
  res=null;$('out').innerHTML='';render();upd();
}
function restoreHistory(s){
  const v=JSON.parse(s);
  nodes=v.nodes;bars=v.bars;sup=v.sup;loads=v.loads;
  cur=s;saveS();pend=null;sel=null;picked=null;allPicked=false;res=null;
  $('out').innerHTML='';render();buildTb();
}
function undo(){
  if(!hist.length)return;
  redoHist.push(cur);
  restoreHistory(hist.pop());
}
function redo(){
  if(!redoHist.length)return;
  hist.push(cur);
  restoreHistory(redoHist.pop());
}
$('ap').onclick=()=>{
  if(sel==null){$('hint').textContent='حدّد العقدة أولًا.';return;}
  const a=parseFloat($('fx').value)||0,b=parseFloat($('fy').value)||0;
  if(!a&&!b){$('hint').textContent='اكتب قيمة غير صفرية لـ Fx أو Fy.';return;}
  (loads[sel]=loads[sel]||[]).push([a,b]);dirty();
};
$('ln').onchange=()=>{sel=$('ln').value===''?null:+$('ln').value;render();upd();};
const cv=$('cv');
