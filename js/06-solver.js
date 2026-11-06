/* Solver: 2D truss stiffness analysis with the requested determinacy and ASD checks */

function gauss(A,n){
  for(let c=0;c<n;c++){
    let p=c;
    for(let r=c+1;r<n;r++)if(Math.abs(A[r][c])>Math.abs(A[p][c]))p=r;
    const scale=Math.max(1,...A[p].slice(0,n).map(Math.abs));
    if(Math.abs(A[p][c])<1e-10*scale)throw new Error('تعذر حل المصفوفة: النموذج غير مستقر هندسيًا أو يحتوي على آلية حركة. راجع اتصال القضبان وتوزيع المساند.');
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
  const reactionCount=Object.values(sup).reduce((sum,type)=>sum+(type==='pin'||type==='pinV'?2:1),0);
  if(reactionCount!==3)throw new Error(`شرط b = 2n−3 يفترض وجود ثلاث مركبات لردود الأفعال؛ عدد المركبات الحالية = ${reactionCount}.`);
  const b=bars.length,n=nodes.length,expected=2*n-3;
  if(b!==expected)throw new Error(`شرط التحديد السكوني غير متحقق: عدد القضبان b = ${b}، بينما 2n−3 = ${expected} لعدد العقد n = ${n}.`);
}

function calc(){
  const out=$('out');
  try{
    validateModel();
    const aText=$('A').value.trim(),sText=$('sall').value.trim();
    const aIn=aText===''?NaN:Number(aText),sIn=sText===''?NaN:Number(sText);
    if(aText!==''&&!Number.isFinite(aIn))throw new Error('قيمة المساحة غير صالحة.');
    if(sText!==''&&!Number.isFinite(sIn))throw new Error('قيمة الإجهاد المسموح غير صالحة.');
    if(Number.isFinite(aIn)&&aIn<=0)throw new Error('يجب أن تكون مساحة المقطع أكبر من صفر.');
    if(Number.isFinite(sIn)&&sIn<=0)throw new Error('يجب أن يكون الإجهاد المسموح أكبر من صفر.');

    const E=200e6; // kN/m²; assumed linear-elastic steel modulus
    // A common reference area is sufficient for force analysis; the entered area is used only in the ASD check.
    const area=Number.isFinite(aIn)?aIn*1e-4:1e-3;
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
    const reduced=free.map(i=>[...free.map(j=>K[i][j]/(E*area)),F[i]/(E*area)]);
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
    res={f};render();

    let h='<div class="card"><h2>القوى الداخلية في القضبان</h2><div class="scroll"><table><tr><th>القضيب</th><th>القوة (kN)</th><th>الحالة</th></tr>';
    f.forEach((v,k)=>{
      const [i,j]=bars[k],zero=Math.abs(v)<1e-6,cls=zero?'':v>0?'t':'c';
      h+=`<tr><td>${nm(i)}–${nm(j)}</td><td class="${cls}">${fmt(Math.abs(v))}</td><td class="${cls}">${zero?'قوة شبه معدومة':v>0?'شدّ':'انضغاط'}</td></tr>`;
    });
    h+='</table></div></div>';

    h+='<div class="card"><h2>ردود أفعال المساند (kN)</h2><div class="scroll"><table><tr><th>العقدة</th><th>Rx</th><th>Ry</th></tr>';
    for(const i in R)h+=`<tr><td>${nm(+i)}</td><td>${fmt(R[i][0])}</td><td>${fmt(R[i][1])}</td></tr>`;
    h+='</table></div></div>';

    const maxIndex=f.reduce((best,v,k)=>Math.abs(v)>Math.abs(f[best])?k:best,0);
    const maxForce=Math.abs(f[maxIndex]||0),member=bars.length?nm(bars[maxIndex][0])+'–'+nm(bars[maxIndex][1]):'—';
    h+='<div class="card"><h2>التحقق بالإجهاد المسموح</h2>';
    h+=`<p>أكبر قوة محورية: <b>${fmt(maxForce)} kN</b> في القضيب <b>${member}</b>.</p>`;
    if(Number.isFinite(sIn)&&Number.isFinite(aIn)){
      const stress=10*maxForce/aIn,ratio=stress/sIn,ok=ratio<=1;
      h+=`<p>مساحة المقطع المدخلة: <b>${fmt(aIn)} cm²</b></p><p>الإجهاد المحسوب: <b>${fmt(stress)} MPa</b></p><p>الإجهاد المسموح: <b>${fmt(sIn)} MPa</b></p><p>نسبة الاستغلال: <b>${fmt(ratio*100)}%</b></p><p class="${ok?'t':'c'}">${ok?'مقبول: الإجهاد المحسوب لا يتجاوز الإجهاد المسموح.':'غير مقبول: الإجهاد المحسوب يتجاوز الإجهاد المسموح.'}</p>`;
    }else if(Number.isFinite(sIn)){
      const requiredArea=10*maxForce/sIn;
      h+=`<p>الإجهاد المسموح: <b>${fmt(sIn)} MPa</b></p><p>مساحة المقطع المطلوبة: <b>${fmt(requiredArea)} cm²</b></p><p>أي يجب اختيار مساحة لا تقل عن هذه القيمة نظريًا وفق الفحص المحوري.</p>`;
    }else{
      h+='<p>أدخل الإجهاد المسموح. يمكنك ترك المساحة فارغة لحساب المساحة المطلوبة، أو إدخالها لإجراء المقارنة.</p>';
    }
    h+='<small>يُطبّق الإجهاد المسموح نفسه على أكبر قيمة مطلقة للقوة المحورية، دون التفريق بين الشد والانضغاط. إذا أُدخلت المساحة تُجرى المقارنة، وإذا تُركت فارغة تُحسب المساحة المطلوبة. الفحص محوري فقط.</small></div>';
    out.innerHTML=h;
  }catch(e){
    res=null;render();
    out.innerHTML=`<div class="card err">${e.message}</div>`;
  }
}
