/* Solver: stiffness matrix, reactions and member forces */

  for(let c=0;c<n;c++){let p=c;for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;
    if(Math.abs(A[p][c])<1e-6)throw new Error('المنشأ غير مستقر: أضف مساند أو قضبانًا، وتأكد أن كل عقدة متصلة بقضيب.');
    [A[c],A[p]]=[A[p],A[c]];
    for(let r=c+1;r<n;r++){const f=A[r][c]/A[c][c];for(let j=c;j<=n;j++)A[r][j]-=f*A[c][j];}}
  const x=Array(n).fill(0);for(let i=n-1;i>=0;i--){let s=A[i][n];for(let j=i+1;j<n;j++)s-=A[i][j]*x[j];x[i]=s/A[i][i];}return x;}
function calc(){
  const out=$('out');
  try{
    if(nodes.length<2||!bars.length)throw new Error('ارسم عقدتين وقضيبًا على الأقل.');
    if(!Object.keys(sup).length)throw new Error('أضف مساند للجمالون.');
    const aIn=parseFloat($('A').value),sIn=parseFloat($('sg').value),E=200e6,A=(aIn>0?aIn:10)*1e-4;
    
    const D=nodes.length*2,K=Array.from({length:D},()=>Array(D).fill(0)),F=Array(D).fill(0);
    bars.forEach(([i,j])=>{const dx=nodes[j].x-nodes[i].x,dy=nodes[j].y-nodes[i].y,L=Math.hypot(dx,dy),c=dx/L,s=dy/L,k=E*A/L,v=[c,s,-c,-s],d=[2*i,2*i+1,2*j,2*j+1];
      for(let a=0;a<4;a++)for(let b=0;b<4;b++)K[d[a]][d[b]]+=k*v[a]*v[b];});
    for(const i in loads)loads[i].forEach(([a,b])=>{F[2*i]+=a;F[2*i+1]+=b;});
    const fx=Array(D).fill(false);
    for(const i in sup){if(sup[i]!='rollerY')fx[2*i]=true;if(sup[i]!='rollerX')fx[2*i+1]=true;}
    const fr=[...Array(D).keys()].filter(i=>!fx[i]);
    if(!fr.length)throw new Error('كل درجات الحرية مقيّدة.');
    const sc=1/(E*A);
    const uf=gauss(fr.map(i=>[...fr.map(j=>K[i][j]*sc),F[i]*sc]),fr.length),u=Array(D).fill(0);
    fr.forEach((g,i)=>u[g]=uf[i]);
    const R={};
    for(const i in sup){const r=[0,0];[0,1].forEach(q=>{const g=2*i+q;if(fx[g]){let s=0;for(let j=0;j<D;j++)s+=K[g][j]*u[j];r[q]=s-F[g];}});R[i]=r;}
    const f=bars.map(([i,j])=>{const dx=nodes[j].x-nodes[i].x,dy=nodes[j].y-nodes[i].y,L=Math.hypot(dx,dy);
      return E*A/L*((u[2*j]-u[2*i])*dx/L+(u[2*j+1]-u[2*i+1])*dy/L);});
    res={f};render();
    let h='<div class="card"><h2>القوى الداخلية في القضبان</h2><div class="scroll"><table><tr><th>القضيب</th><th>الطول (m)</th><th>القوة (kN)</th><th>النوع</th></tr>';
    f.forEach((v,k)=>{const [i,j]=bars[k],L=Math.hypot(nodes[j].x-nodes[i].x,nodes[j].y-nodes[i].y),z=Math.abs(v)<1e-6,c=z?'':v>0?'t':'c';
      h+=`<tr><td>${nm(i)}${nm(j)}</td><td>${fmt(L)}</td><td class="${c}">${fmt(Math.abs(v))}</td><td class="${c}">${z?'صفر':v>0?'شدّ':'انضغاط'}</td></tr>`;});
    h+='</table></div></div><div class="card"><h2>ردود أفعال المساند (kN)</h2><div class="scroll"><table><tr><th>العقدة</th><th>Rx</th><th>Ry</th></tr>';
    for(const i in R)h+=`<tr><td>${nm(+i)}</td><td>${fmt(R[i][0])}</td><td>${fmt(R[i][1])}</td></tr>`;
    let mi=0;f.forEach((v,k)=>{if(Math.abs(v)>Math.abs(f[mi]))mi=k;});
    const Nm=Math.abs(f[mi]),bn=nm(bars[mi][0])+nm(bars[mi][1]),ty=Nm<1e-6?'':f[mi]>0?'شدّ':'انضغاط';
    const note=`<br><small>أكبر قوة: ${fmt(Nm)} kN في القضيب ${bn}${ty?' ('+ty+')':''}</small>`;
    let ex='';
    if(aIn>0)ex=`<div class="card"><h2>الإجهاد</h2>σ = <b>${fmt(10*Nm/aIn)}</b> MPa${note}</div>`;
    else if(sIn>0)ex=`<div class="card"><h2>المساحة المطلوبة</h2>A = <b>${fmt(10*Nm/sIn)}</b> cm²${note}</div>`;
    out.innerHTML=ex+h+'</table></div></div>';
  }catch(e){res=null;render();out.innerHTML=`<div class="card err">${e.message}</div>`;}
}
