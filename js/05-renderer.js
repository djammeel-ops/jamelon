/* Renderer: SVG drawing and visual feedback */

function render(){
  const xs=nodes.map(n=>n.x),ys=nodes.map(n=>n.y);
  const bx=xs;
  const by=ys;
  if(man)V=man;else if(bx.length){const mnx=Math.min(...bx),mxx=Math.max(...bx),mny=Math.min(...by),mxy=Math.max(...by),w=Math.max(12,mxx-mnx+3),h=Math.max(8,mxy-mny+3.5);V={x0:(mnx+mxx)/2-w/2,y0:(mny+mxy)/2-h/2,w,h};}else V={x0:0,y0:0,w:12,h:8};
  const S=1200/V.w,Hh=V.h*S;cv.setAttribute('viewBox',`0 0 1200 ${Hh}`);
  const X=n=>(n.x-V.x0)*S,Y=n=>(V.y0+V.h-n.y)*S;
  let s='';
  const g=[0.25,0.5,1,2,5,10,20,50,100,200,500,1000].find(q=>q*S>=80)||1000;V.g=g;
  for(let a=Math.ceil(V.x0/g)*g;a<=V.x0+V.w+1e-9;a+=g){const px=(a-V.x0)*S;s+=`<line class="g" x1="${px}" y1="0" x2="${px}" y2="${Hh}"/><text x="${px+4}" y="${Hh-8}" font-size="22" fill="var(--mut)">${+a.toFixed(2)}</text>`;}
  for(let b=Math.ceil(V.y0/g)*g;b<=V.y0+V.h+1e-9;b+=g){const py=(V.y0+V.h-b)*S;s+=`<line class="g" x1="0" y1="${py}" x2="1200" y2="${py}"/><text x="6" y="${py-6}" font-size="22" fill="var(--mut)">${+b.toFixed(2)}</text>`;}
  for(let i=0;i<0;i++){s+=`<line class="g" x1="${i*100}" y1="0" x2="${i*100}" y2="${V.h*100}"/>`;if((x0+i)%2==0)s+=`<text x="${i*100+4}" y="${V.h*100-6}" font-size="20" fill="var(--mut)">${x0+i}</text>`;}
  for(let j=0;j<0;j++){s+=`<line class="g" x1="0" y1="${j*100}" x2="${V.w*100}" y2="${j*100}"/>`;if((y1-j)%2==0&&j>0)s+=`<text x="4" y="${j*100-5}" font-size="20" fill="var(--mut)">${y1-j}</text>`;}
  bars.forEach(([i,j],k)=>{const a=nodes[i],b=nodes[j];let col='var(--fg)';
    if(res){const f=res.f[k];col=Math.abs(f)<1e-6?'var(--mut)':f>0?'var(--ten)':'var(--com)';}
    const chosen=allPicked||(picked?.type=='bar'&&picked.index==k);
    s+=`<line x1="${X(a)}" y1="${Y(a)}" x2="${X(b)}" y2="${Y(b)}" stroke="${chosen?'var(--ac)':col}" stroke-width="${chosen?17:9}" stroke-linecap="round"/>`;
    if(res)s+=`<text x="${(X(a)+X(b))/2}" y="${(Y(a)+Y(b))/2-14}" font-size="26" text-anchor="middle" fill="${col}" stroke="var(--card)" stroke-width="5" paint-order="stroke">${fmt(res.f[k])}</text>`;});
  for(const i in sup){const n=nodes[i],t=sup[i];
    const tri=(t=='pin'||t=='pinV')?'<path d="M0 0L-28 48H28Z"/><path d="M-38 48H38"/>':'<path d="M0 0L-26 38H26Z"/><circle cx="-13" cy="48" r="9"/><circle cx="13" cy="48" r="9"/><path d="M-38 66H38"/>';
    s+=`<g transform="translate(${X(n)},${Y(n)}) ${(t=='rollerX'||t=='pinV')?'rotate(90)':''}" stroke="${(allPicked||(picked?.type=='sup'&&picked.node==i))?'var(--ac)':'var(--fg)'}" stroke-width="5" fill="none">${tri}</g>`;}
  for(const i in loads)loads[i].forEach(([fx,fy],j)=>{const n=nodes[i],m=Math.hypot(fx,fy);if(!m)return;const L=110+j*45;
    const dx=fx/m,dy=-fy/m,x=X(n),y=Y(n),tx=x-dx*L,ty=y-dy*L,px=-dy,py=dx;
    s+=`<g stroke="${(allPicked||(picked?.type=='load'&&picked.node==i&&picked.index==j))?'var(--ac)':'var(--ld)'}" fill="${(allPicked||(picked?.type=='load'&&picked.node==i&&picked.index==j))?'var(--ac)':'var(--ld)'}"><line x1="${tx}" y1="${ty}" x2="${x-dx*18}" y2="${y-dy*18}" stroke-width="6"/><polygon stroke="none" points="${x},${y} ${x-dx*30+px*12},${y-dy*30+py*12} ${x-dx*30-px*12},${y-dy*30-py*12}"/><text stroke="none" x="${tx-dx*8}" y="${ty-dy*8+8}" font-size="24" text-anchor="middle">${fmt(m)}</text></g>`;});
  nodes.forEach((n,i)=>{const on=allPicked||pend===i||(picked?.type=='node'&&picked.index==i);s+=`<circle cx="${X(n)}" cy="${Y(n)}" r="${on?21:16}" fill="${on?'var(--ac)':'var(--fg)'}"/><text x="${X(n)+16}" y="${Y(n)-16}" font-size="32" font-weight="700" fill="var(--fg)" stroke="var(--card)" stroke-width="5" paint-order="stroke">${nm(i)}</text>`;});
  cv.innerHTML=s;
}
