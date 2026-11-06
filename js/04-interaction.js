/* Interaction: pointer events, drawing, pan and zoom */

let MPP=.03,man=null;
function pt(e){const r=cv.getBoundingClientRect();return{x:V.x0+(e.clientX-r.left)/r.width*V.w,y:V.y0+V.h-(e.clientY-r.top)/r.height*V.h};}
const snap=v=>{const q=(V.g||1)/2;return +(Math.round(v/q)*q).toFixed(3);};
function nodeAt(p){let b=-1,d=Math.max(.15,24*MPP);nodes.forEach((n,i)=>{const q=Math.hypot(n.x-p.x,n.y-p.y);if(q<d){d=q;b=i;}});return b;}
function barAt(p){let b=-1,d=Math.max(.12,16*MPP);bars.forEach(([i,j],k)=>{const a=nodes[i],c=nodes[j],dx=c.x-a.x,dy=c.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy))),q=Math.hypot(a.x+t*dx-p.x,a.y+t*dy-p.y);if(q<d){d=q;b=k;}});return b;}
function removeNode(k){nodes.splice(k,1);bars=bars.filter(b=>b[0]!=k&&b[1]!=k).map(b=>b.map(i=>i>k?i-1:i));
  const re=o=>{const r={};for(const i in o){const n=+i;if(n==k)continue;r[n>k?n-1:n]=o[i];}return r;};sup=re(sup);loads=re(loads);sel=null;pend=null;}
function tapAt(e){
  const p=pt(e),k=nodeAt(p);ensureMan();
  if(tool=='select'){sel=k>=0?k:null;upd();render();return;}
  if(tool=='node'){const x=snap(p.x),y=snap(p.y);if(!nodes.some(n=>n.x==x&&n.y==y)){nodes.push({x,y});dirty();}return;}
  if(tool=='bar'){if(k<0){pend=null;render();return;}
    if(pend===null){pend=k;render();return;}
    if(pend!=k&&!bars.some(b=>(b[0]==pend&&b[1]==k)||(b[0]==k&&b[1]==pend)))bars.push([pend,k]);
    pend=null;dirty();return;}
  if(tool=='del'){
    if(k>=0){if(sup[k])delete sup[k];else if(loads[k]){loads[k].pop();if(!loads[k].length)delete loads[k];}else removeNode(k);dirty();return;}
    const b=barAt(p);if(b>=0){bars.splice(b,1);dirty();}return;}
  if(k<0)return;
  if(tool=='load'){sel=k;upd();render();return;}sup[k]=tool;
  dirty();
}
function dragTo(e){const p=pt(e),x=snap(p.x),y=snap(p.y);
  if((nodes[drag].x!=x||nodes[drag].y!=y)&&!nodes.some((n,i)=>i!=drag&&n.x==x&&n.y==y)){nodes[drag].x=x;nodes[drag].y=y;moved=true;render();upd();}}
const SK='truss-v1',ptrs=new Map();let G=null,tapOk=false,sx=0,sy=0,pan0=null;
function saveS(){try{localStorage.setItem(SK,JSON.stringify({nodes,bars,sup,loads,A:$('A').value,sall:$('sall').value,v:4}));}catch(e){}}
function loadS(){try{const s=JSON.parse(localStorage.getItem(SK)||'null');if(s&&Array.isArray(s.nodes)&&s.nodes.every(n=>isFinite(n.x)&&isFinite(n.y))){nodes=s.nodes;bars=(s.bars||[]).filter(b=>nodes[b[0]]&&nodes[b[1]]);sup=s.sup||{};loads=s.loads||{};for(const i in loads)if(typeof loads[i][0]=='number')loads[i]=[loads[i]];if(s.A!==undefined)$('A').value=s.A;if(s.sall===undefined&&s.sgt!==undefined&&s.sgc!==undefined&&s.sgt===s.sgc)$('sall').value=s.sgt;if(s.sall!==undefined)$('sall').value=s.sall;}}catch(e){}}
function ensureMan(){if(!man)man={x0:V.x0,y0:V.y0,w:V.w,h:V.h};}
function zoom(f,cx,cy){ensureMan();const nw=Math.min(400,Math.max(1,man.w/f)),r=nw/man.w;man={x0:cx-(cx-man.x0)*r,y0:cy-(cy-man.y0)*r,w:nw,h:man.h*r};render();}
function gst(){ensureMan();const a=[...ptrs.values()];return{d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1,cx:(a[0].x+a[1].x)/2,cy:(a[0].y+a[1].y)/2,m:{...man}};}
cv.addEventListener('pointerdown',e=>{
  cv.setPointerCapture(e.pointerId);ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size==1){tapOk=true;moved=false;sx=e.clientX;sy=e.clientY;pan0=null;
    const k=nodeAt(pt(e));
    if(tool=='select'&&k>=0){ensureMan();drag=k;sel=k;upd();render();}}
  else{tapOk=false;drag=null;pan0=null;G=gst();}
});
cv.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size>=2&&G){const a=[...ptrs.values()],d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)||1,cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2,r=cv.getBoundingClientRect();
    const nw=Math.min(400,Math.max(1,G.m.w*G.d/d)),k=nw/G.m.w,nh=G.m.h*k;
    const mx=G.m.x0+(G.cx-r.left)/r.width*G.m.w,my=G.m.y0+G.m.h-(G.cy-r.top)/r.height*G.m.h;
    man={w:nw,h:nh,x0:mx-(cx-r.left)/r.width*nw,y0:my-nh+(cy-r.top)/r.height*nh};render();return;}
  if(drag!==null){dragTo(e);return;}
  if(tapOk&&Math.hypot(e.clientX-sx,e.clientY-sy)>10){tapOk=false;moved=true;ensureMan();pan0={x:e.clientX,y:e.clientY,m:{...man}};}
  if(pan0&&ptrs.size==1){const r=cv.getBoundingClientRect();man={...pan0.m,x0:pan0.m.x0-(e.clientX-pan0.x)/r.width*pan0.m.w,y0:pan0.m.y0+(e.clientY-pan0.y)/r.height*pan0.m.h};render();}
});
function up(e){
  if(!ptrs.has(e.pointerId))return;
  const was=ptrs.size;ptrs.delete(e.pointerId);
  if(was>=2){G=ptrs.size>=2?gst():null;if(ptrs.size==1){const a=[...ptrs.values()][0];sx=a.x;sy=a.y;tapOk=false;pan0=null;}return;}
  if(drag!==null){const m=moved;drag=null;if(m)dirty();else{upd();render();}return;}
  if(tapOk&&e.type=='pointerup')tapAt(e);
  tapOk=false;pan0=null;
}
cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
cv.addEventListener('wheel',e=>{e.preventDefault();const p=pt(e);zoom(e.deltaY<0?1.15:1/1.15,p.x,p.y);},{passive:false});
$('zm').onclick=e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.z=='fit'){man=null;render();return;}zoom(b.dataset.z=='in'?1.4:1/1.4,V.x0+V.w/2,V.y0+V.h/2);};
