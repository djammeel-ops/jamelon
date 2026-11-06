/* UI: toolbar, menus, input controls */

function buildTb(){
  let h=`<button data-c="1" class="${isC(tool)?'on':''}">${svg(sub)}إضافة ▴</button><button data-t="del" class="${tool=='del'?'on':''}">${svg('del')}حذف</button><button data-a="undo" title="تراجع">${svg('undo')}تراجع</button><button data-a="redo" title="إعادة">${svg('redo')}إعادة</button>`;

  h+=`<button data-a="image" title="${imgGuide?'إزالة الصورة المرجعية':'استيراد صورة'}">${svg('image')}${imgGuide?'إزالة الصورة':'صورة'}</button>`;
  h+=`<button data-a="calc" class="calc">${svg('calc')}حساب</button><button data-a="clr" class="cl">${svg('clr')}مسح</button>`;
  tb.innerHTML=h;
  sm.style.display=menu?'grid':'none';
  sm.className=menu=='sup'?'sup':'';sm.innerHTML=(menu=='sup'?SUP:SUB).map(([t,l])=>`<button data-s="${t}" class="${tool==t?'on':''}">${svg(t)}${l}</button>`).join('');
  upd();
}
const tb=$('tb'),sm=$('sm');
tb.onclick=e=>{const b=e.target.closest('button');if(!b)return;
  if(b.dataset.a=='image')return imgGuide?clearImageGuide():pickTrussImage();
  if(b.dataset.a=='calc')return calc();
  if(b.dataset.a=='redo')return redo();
  if(b.dataset.t=='del'&&picked||b.dataset.t=='del'&&allPicked)return deletePicked();
  if(b.dataset.a=='undo')return undo();
  if(b.dataset.a=='clr'){nodes=[];bars=[];sup={};loads={};pend=null;sel=null;man=null;dirty();return;}
  if(b.dataset.c){menu=menu?false:'main';tool=isC(tool)?tool:sub;}
  else{tool=b.dataset.t;menu=false;}
  pend=null;sel=null;picked=null;allPicked=false;buildTb();render();};
sm.onclick=e=>{const b=e.target.closest('button');if(!b)return;const t=b.dataset.s;if(t=='sup'){menu='sup';buildTb();return;}tool=sub=t;menu=false;pend=null;sel=null;buildTb();render();};
function upd(){
  const ns=tool=='select'&&picked?.type=='node'&&sel!=null;
  $('pn').style.display=(tool=='node'||ns)?'flex':'none';
  $('pl').style.display=tool=='load'?'flex':'none';
  $('pa').style.display=tool=='bar'?'flex':'none';
  $('ln').innerHTML='<option value="">—</option>'+nodes.map((_,i)=>`<option value="${i}">${nm(i)}</option>`).join('');$('ln').value=sel==null?'':sel;
  const u=document.querySelector('[data-a=undo]');if(u)u.disabled=!hist.length;
  const r=document.querySelector('[data-a=redo]');if(r)r.disabled=!redoHist.length;
  $('go').textContent=tool=='node'?'إضافة':'تحديث';
  if(ns){$('nx').value=nodes[sel].x;$('ny').value=nodes[sel].y;}
  $('hint').textContent=ns?`العقدة ${nm(sel)}: عدّل الفاصلة والترتيبة ثم «تحديث».`:tool=='load'?(sel!=null?`العقدة ${nm(sel)}: اكتب Fx وFy ثم «تطبيق» (يمكن تكرار ذلك لإضافة أحمال أخرى على العقدة نفسها).`:'حدّد العقدة أولًا (بالنقر عليها أو من القائمة) ثم اكتب Fx وFy.'):HINT[tool]||'';
}
$('go').onclick=()=>{
  const x=parseFloat($('nx').value),y=parseFloat($('ny').value);
  if(!isFinite(x)||!isFinite(y))return;
  if(tool=='node'){if(!nodes.some(n=>n.x==x&&n.y==y)){nodes.push({x,y});man=null;dirty();}}
  else if(sel!=null&&!nodes.some((n,i)=>i!=sel&&n.x==x&&n.y==y)){nodes[sel].x=x;nodes[sel].y=y;man=null;dirty();}
};
