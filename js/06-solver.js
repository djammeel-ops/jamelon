/* Solver: validated 2D truss stiffness analysis, reactions and equilibrium checks */

function gauss(A,n){
  for(let c=0;c<n;c++){
    let p=c;
    for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;
    const scale=Math.max(1,...A[p].slice(0,n).map(Math.abs));
    if(Math.abs(A[p][c])<1e-10*scale)throw new Error('تعذر حل المصفوفة: النموذج غير مستقر أو يحتوي على آلية حركة. راجع المساند واتصال القضبان.');
    [A[c],A[p]]=[A[p],A[c]];
    for(let r=c+1;r<n;r++){
      const q=A[r][c]/A[c][c];
      A[r][c]=0;
      for(let j=c+1;j<=n;j++)A[r][j]-=q*A[c][j];
    }
  }
  const x=Array(n).fill(0);
  for(let i=n-1;i>=0;i--){
    let v=A[i][n];
    for(let j=i+1;j<n;j++)v-=A[i][j]*x[j];
    x[i]=v/A[i][i];
  }
  return x;
}

function validateModel(){
  if(nodes.length<2||!bars.length)throw new Error('ارسم عقدتين وقضيبًا على الأقل.');
  if(!Object.keys(sup).length)throw new Error('أضف مسندًا واحدًا على الأقل.');
  for(let i=0;i<nodes.length;i++){
    const p=nodes[i];
    if(!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new Error('إحداثيات إحدى العقد غير صالحة.');
    for(let j=0;j<i;j++)if(Math.hypot(p.x-nodes[j].x,p.y-nodes[j].y)<1e-9)throw new Error('توجد عقدتان في الموضع نفسه: '+nm(j)+' و'+nm(i)+'.');
  }
  const seen=new Set();
  bars.forEach(([i,j])=>{
    if(!Number.isInteger(i)||!Number.isInteger(j)||!nodes[i]||!nodes[j]||i===j)throw new Error('يوجد قضيب مرتبط بعقدة غير صالحة.');
    const key=[Math.min(i,j),Math.max(i,j)].join(':');
    if(seen.has(key))throw new Error('يوجد قضيب مكرر بين العقدتين '+nm(i)+' و'+nm(j)+'.');
    seen.add(key);
    if(Math.hypot(nodes[j].x-nodes[i].x,nodes[j].y-nodes[i].y)<1e-9)throw new Error('طول أحد القضبان يساوي صفرًا.');
  });
  for(const i in sup)if(!nodes[+i]||!['pin','pinV','rollerY','rollerX'].includes(sup[i]))throw new Error('تعريف أحد المساند غير صالح.');
  for(const i in loads){
    if(!nodes[+i])throw new Error('يوجد حمل مرتبط بعقدة غير موجودة.');
    loads[i].forEach(v=>{if(!Array.isArray(v)||v.length<2||!Number.isFinite(+v[0])||!Number.isFinite(+v[1]))throw new Error('إحدى قيم الأحمال غير صالحة.');});
  }
}

function calc(){
  const out=$('out');
  try{
    validateModel();
    const aIn=$('A').value.trim()===''?NaN:Number($('A').value);
    const sIn=$('sg').value.trim()===''?NaN:Number($('sg').value);
    if($('A').value.trim()!==''&&!Number.isFinite(aIn))throw new Error('قيمة المساحة غير صالحة.');
    if($('sg').value.trim()!==''&&!Number.isFinite(sIn))throw new Error('قيمة الإجهاد غير صالحة.');
    if(Number.isFinite(aIn)&&aIn<=0)throw new Error('يجب أن تكون مساحة المقطع أكبر من صفر.');
    if(Number.isFinite(sIn)&&sIn<=0)throw new Error('يجب أن يكون الإجهاد المسموح أكبر من صفر.');
    if(Number.isFinite(aIn)&&Number.isFinite(sIn))throw new Error('أدخل المساحة أو الإجهاد المسموح، وليس الاثنين معًا.');
    const E=200e6; // kN/m² (steel, assumed)
    const area=(Number.isFinite(aIn)?aIn:10)*1e-4; // cm² -> m²
    const D=nodes.length*2;
    const K=Array.from({length:D},()=>Array(D).fill(0));
    const F=Array(D).fill(0);

    bars.forEach(([i,j])=>{
      const dx=nodes[j].x-nodes[i].x,dy=nodes[j].y-nodes[i].y,L=Math.hypot(dx,dy);
      const c=dx/L,s=dy/L,k=E*area/L,v=[c,s,-c,-s],d=[2*i,2*i+1,2*j,2*j+1];
      for(let a=0;a<4;a++)for(let b=0;b<4;b++)K[d[a]][d[b]]+=k*v[a]*v[b];
    });
    for(const i in loads)loads[i].forEach(([fx,fy])=>{F[2*i]+=+fx;F[2*i+1]+=+fy;});

    const restrained=Array(D).fill(false);
    for(const i in sup){
      if(sup[i]!=='rollerY')restrained[2*i]=true;
      if(sup[i]!=='rollerX')restrained[2*i+1]=true;
    }
    const free=[...Array(D).keys()].filter(i=>!restrained[i]);
    if(!free.length)throw new Error('كل درجات الحرية مقيّدة؛ لا توجد درجات حرية لحلها.');
    const scale=1/(E*area);
    const reduced=free.map(i=>[...free.map(j=>K[i][j]*scale),F[i]*scale]);
    const uf=gauss(reduced,free.length),u=Array(D).fill(0);
    free.forEach((dof,i)=>u[dof]=uf[i]);

    const R={};
    for(const i in sup){
      const r=[0,0];
      for(let q=0;q<2;q++){
        const dof=2*(+i)+q;
        if(restrained[dof]){
          let internal=0;
          for(let j=0;j<D;j++)internal+=K[dof][j]*u[j];
          r[q]=internal-F[dof];
        }
      }
      R[i]=r;
    }

    const f=bars.map(([i,j])=>{
      const dx=nodes[j].x-nodes[i].x,dy=nodes[j].y-nodes[i].y,L=Math.hypot(dx,dy);
      return E*area/L*((u[2*j]-u[2*i])*dx/L+(u[2*j+1]-u[2*i+1])*dy/L);
    });

    // Global equilibrium residuals: sum Fx, sum Fy, and sum moments about origin.
    let sumFx=0,sumFy=0,sumM=0,loadScale=0;
    for(const i in loads)loads[i].forEach(([fx,fy])=>{
      sumFx+=+fx;sumFy+=+fy;sumM+=nodes[i].x*(+fy)-nodes[i].y*(+fx);
      loadScale+=Math.hypot(+fx,+fy);
    });
    for(const i in R){
      const [rx,ry]=R[i];sumFx+=rx;sumFy+=ry;
      sumM+=nodes[i].x*ry-nodes[i].y*rx;
    }
    const forceResidual=Math.hypot(sumFx,sumFy);
    const equilibriumOK=forceResidual<=1e-6*Math.max(1,loadScale)&&Math.abs(sumM)<=1e-6*Math.max(1,loadScale*Math.max(1,...nodes.map(n=>Math.hypot(n.x,n.y))));
    res={f};render();

    let h='<div class="card"><h2>القوى الداخلية في القضبان</h2><div class="scroll"><table><tr><th>القضيب</th><th>الطول (m)</th><th>القوة (kN)</th><th>الحالة</th></tr>';
    f.forEach((v,k)=>{
      const [i,j]=bars[k],L=Math.hypot(nodes[j].x-nodes[i].x,nodes[j].y-nodes[i].y),zero=Math.abs(v)<1e-6,cls=zero?'':v>0?'t':'c';
      h+=`<tr><td>${nm(i)}–${nm(j)}</td><td>${fmt(L)}</td><td class="${cls}">${fmt(Math.abs(v))}</td><td class="${cls}">${zero?'قوة شبه معدومة':v>0?'شدّ':'انضغاط'}</td></tr>`;
    });
    h+='</table></div></div><div class="card"><h2>ردود أفعال المساند (kN)</h2><div class="scroll"><table><tr><th>العقدة</th><th>Rx</th><th>Ry</th></tr>';
    for(const i in R)h+=`<tr><td>${nm(+i)}</td><td>${fmt(R[i][0])}</td><td>${fmt(R[i][1])}</td></tr>`;
    h+='</table></div></div>';
    h+='<div class="card"><h2>إزاحات العقد (mm)</h2><div class="scroll"><table><tr><th>العقدة</th><th>Ux</th><th>Uy</th><th>المحصلة</th></tr>';
    nodes.forEach((node,i)=>{const ux=u[2*i]*1000,uy=u[2*i+1]*1000;h+=`<tr><td>${nm(i)}</td><td>${fmt(ux)}</td><td>${fmt(uy)}</td><td>${fmt(Math.hypot(ux,uy))}</td></tr>`;});
    h+='</table></div><small>الإزاحات محسوبة وفق فرضية التشوهات الصغيرة والسلوك المرن الخطي.</small></div>';
    h+=`<div class="card"><h2>التحقق من الاتزان العام</h2><p class="${equilibriumOK?'t':'c'}">${equilibriumOK?'الاتزان متحقق ضمن هامش الدقة العددي.':'تنبيه: بواقي الاتزان أكبر من حد الدقة المتوقع.'}</p><div class="scroll"><table><tr><th>ΣFx (kN)</th><th>ΣFy (kN)</th><th>ΣM₀ (kN·m)</th></tr><tr><td>${fmt(sumFx)}</td><td>${fmt(sumFy)}</td><td>${fmt(sumM)}</td></tr></table></div><small>التحقق العددي لا يغني عن مراجعة النموذج والفرضيات الهندسية.</small></div>`;
    let mi=0;
    f.forEach((v,k)=>{if(Math.abs(v)>Math.abs(f[mi]))mi=k;});
    const maxForce=Math.abs(f[mi]||0),member=bars.length?nm(bars[mi][0])+'–'+nm(bars[mi][1]):'—',kind=maxForce<1e-6?'':f[mi]>0?'شدّ':'انضغاط';
    const note=`<br><small>أكبر قوة محورية: ${fmt(maxForce)} kN في القضيب ${member}${kind?' ('+kind+')':''}</small>`;
    if(Number.isFinite(aIn))h+=`<div class="card"><h2>الإجهاد المحوري التقريبي</h2>σ = <b>${fmt(10*maxForce/aIn)}</b> MPa${note}<small>حُسب على أساس مساحة موحدة لجميع القضبان.</small></div>`;
    else if(Number.isFinite(sIn))h+=`<div class="card"><h2>مساحة المقطع المطلوبة مبدئيًا</h2>A = <b>${fmt(10*maxForce/sIn)}</b> cm²${note}<small>هذا تقدير محوري أولي، ولا يشمل فحص الانبعاج أو الوصلات أو معاملات التصميم.</small></div>`;
    out.innerHTML=h;
  }catch(e){
    res=null;render();
    out.innerHTML=`<div class="card err">${e.message}</div>`;
  }
}
