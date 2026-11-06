/* Image import: temporary reference layer for tracing a truss from a photo.
   The photo is deliberately not treated as verified engineering geometry. */
function pickTrussImage(){
  const input=$('trussImageFile');
  input.value='';
  input.click();
}
function clearImageGuide(){
  imgGuide=null;
  man=null;
  buildTb();
  render();
  $('hint').textContent='أزيلت الصورة المرجعية. بقي الرسم والعناصر التي أنشأتها.';
}
$('trussImageFile').addEventListener('change',e=>{
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){
    $('hint').textContent='الملف المحدد ليس صورة مدعومة.';
    return;
  }
  if((nodes.length||bars.length)&&!confirm('سيؤدي استيراد الصورة إلى بدء رسم جديد ومسح النموذج الحالي. هل تريد المتابعة؟'))return;
  const reader=new FileReader();
  reader.onerror=()=>{$('hint').textContent='تعذرت قراءة الصورة.';};
  reader.onload=()=>{
    const image=new Image();
    image.onerror=()=>{$('hint').textContent='تعذر فتح الصورة. جرّب صورة بصيغة JPG أو PNG.';};
    image.onload=()=>{
      const maxSide=1600,scale=Math.min(1,maxSide/Math.max(image.naturalWidth,image.naturalHeight));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(image.naturalWidth*scale));
      canvas.height=Math.max(1,Math.round(image.naturalHeight*scale));
      const ctx=canvas.getContext('2d');
      if(!ctx){$('hint').textContent='تعذر تجهيز الصورة على هذا الجهاز.';return;}
      ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.drawImage(image,0,0,canvas.width,canvas.height);
      imgGuide={src:canvas.toDataURL('image/jpeg',.82),x:0,y:0,w:12,h:12*canvas.height/canvas.width};
      nodes=[];bars=[];sup={};loads={};pend=null;sel=null;picked=null;allPicked=false;res=null;man=null;
      dirty();
      tool='node';sub='bar';menu=false;
      buildTb();render();
      $('hint').textContent='الصورة مرجع شفاف للرسم: ضع العقد فوق نقاط الاتصال، ثم اختر «قضيب» ووصل العقد. أضف المساند والأحمال من أدوات الإضافة. الصورة لا تُحلّل آليًا بعد؛ راجع كل عنصر وأبعاده قبل الحساب.';
    };
    image.src=reader.result;
  };
  reader.readAsDataURL(file);
});

/* Lightweight line-based detector for clean, high-contrast truss sketches.
   Detected geometry is a draft only; supports, loads and dimensions are not inferred. */
function detectTrussFromImage(){
  if(!imgGuide?.src)return;
  const image=new Image();
  image.onerror=()=>{$('hint').textContent='تعذر تحليل الصورة المرجعية.';};
  image.onload=()=>{
    const scale=Math.min(1,700/Math.max(image.naturalWidth,image.naturalHeight));
    const w=Math.max(1,Math.round(image.naturalWidth*scale)),h=Math.max(1,Math.round(image.naturalHeight*scale));
    const c=document.createElement('canvas');c.width=w;c.height=h;
    const ctx=c.getContext('2d',{willReadFrequently:true});
    if(!ctx){$('hint').textContent='تعذر تجهيز الصورة للتحليل.';return;}
    ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);
    const data=ctx.getImageData(0,0,w,h).data,pts=[];
    for(let y=2;y<h-2;y+=2)for(let x=2;x<w-2;x+=2){
      const k=(y*w+x)*4,gray=(data[k]*299+data[k+1]*587+data[k+2]*114)/1000;
      if(gray<145)pts.push({x,y});
    }
    if(pts.length<35){$('hint').textContent='لم أعثر على خطوط واضحة. استخدم صورة أوضح بخلفية فاتحة وخطوط داكنة.';return;}
    const diag=Math.ceil(Math.hypot(w,h)),rhoN=diag*2+1,acc=new Uint16Array(180*rhoN);
    const cs=[],sn=[];
    for(let a=0;a<180;a++){const t=a*Math.PI/180;cs[a]=Math.cos(t);sn[a]=Math.sin(t);}
    for(const p of pts)for(let a=0;a<180;a++){
      const r=Math.round(p.x*cs[a]+p.y*sn[a])+diag;
      if(r>=0&&r<rhoN){const ix=a*rhoN+r;if(acc[ix]<65535)acc[ix]++;}
    }
    const peaks=[];
    for(let a=0;a<180;a++)for(let r=2;r<rhoN-2;r++){
      const v=acc[a*rhoN+r];if(v<Math.max(12,Math.min(w,h)*.045))continue;
      let peak=true;
      for(let da=-3;da<=3&&peak;da++)for(let dr=-7;dr<=7;dr++){
        if(!da&&!dr)continue;const aa=(a+da+180)%180,rr=r+dr;
        if(rr>=0&&rr<rhoN&&acc[aa*rhoN+rr]>v){peak=false;break;}
      }
      if(peak)peaks.push({a,rho:r-diag,v});
    }
    peaks.sort((a,b)=>b.v-a.v);
    const segments=[];
    for(const line of peaks.slice(0,45)){
      const a=line.a,co=cs[a],si=sn[a],on=[];
      for(const p of pts)if(Math.abs(p.x*co+p.y*si-line.rho)<2.8)on.push({p,t:-p.x*si+p.y*co});
      on.sort((a,b)=>a.t-b.t);
      let group=[];
      const save=()=>{
        if(group.length>=8&&group[group.length-1].t-group[0].t>Math.min(w,h)*.055){
          segments.push({a:group[0].p,b:group[group.length-1].p,co,si,rho:line.rho});
        }
      };
      for(const q of on){if(group.length&&q.t-group[group.length-1].t>Math.max(12,Math.min(w,h)*.035)){save();group=[];}group.push(q);}
      save();
    }
    const uniq=[];
    for(const s of segments){
      const len=Math.hypot(s.b.x-s.a.x,s.b.y-s.a.y);
      if(len<Math.min(w,h)*.06)continue;
      const dup=uniq.some(q=>Math.abs(q.rho-s.rho)<5&&Math.abs(q.co-s.co)<.035&&Math.abs(q.si-s.si)<.035);
      if(!dup)uniq.push(s);
    }
    const candidates=[];
    const add=(p)=>{if(p.x>=0&&p.x<=w&&p.y>=0&&p.y<=h&&!candidates.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<Math.max(9,Math.min(w,h)*.018)))candidates.push(p);};
    for(const s of uniq){add(s.a);add(s.b);}
    for(let i=0;i<uniq.length;i++)for(let j=i+1;j<uniq.length;j++){
      const a=uniq[i],b=uniq[j],det=a.co*b.si-a.si*b.co;
      if(Math.abs(det)<.025)continue;
      const x=(a.rho*b.si-a.si*b.rho)/det,y=(a.co*b.rho-a.rho*b.co)/det;
      const onSeg=(s)=>{const t=-x*s.si+y*s.co,ta=-s.a.x*s.si+s.a.y*s.co,tb=-s.b.x*s.si+s.b.y*s.co;return t>=Math.min(ta,tb)-10&&t<=Math.max(ta,tb)+10;};
      if(onSeg(a)&&onSeg(b))add({x,y});
    }
    if(candidates.length<3||uniq.length<2){$('hint').textContent='لم يتمكن التحليل من تمييز شبكة جمالون. جرّب صورة أوضح ومن دون أبعاد أو كتابات متداخلة.';return;}
    const nodesPx=candidates.slice(0,80);
    const links=[];
    for(const s of uniq){
      const along=nodesPx.map((p,i)=>({i,t:-p.x*s.si+p.y*s.co,d:Math.abs(p.x*s.co+p.y*s.si-s.rho)})).filter(q=>q.d<7);
      along.sort((a,b)=>a.t-b.t);
      for(let k=0;k<along.length-1;k++){
        const u=along[k],v=along[k+1];
        if(Math.hypot(nodesPx[u.i].x-nodesPx[v.i].x,nodesPx[u.i].y-nodesPx[v.i].y)>18&&!links.some(q=>(q[0]===u.i&&q[1]===v.i)||(q[0]===v.i&&q[1]===u.i)))links.push([u.i,v.i]);
      }
    }
    if(!links.length){$('hint').textContent='عُثر على خطوط، لكن لم تتكون شبكة قضبان موثوقة. جرّب صورة أوضح.';return;}
    const sx=12/image.naturalWidth,sy=imgGuide.h/image.naturalHeight;
    const newNodes=nodesPx.map(p=>({x:+(p.x/scale*sx).toFixed(3),y:+((image.naturalHeight-p.y/scale)*sy).toFixed(3)}));
    const summary='اكتشاف أولي: '+newNodes.length+' عقد و'+links.length+' قضيبًا. هذه النتائج قد تتضمن عناصر زائدة أو ناقصة. هل تريد عرضها على الرسم لتراجعها وتصححها قبل الحساب؟';
    if(!confirm(summary))return;
    nodes=newNodes;bars=links;sup={};loads={};pend=null;sel=null;picked=null;allPicked=false;res=null;man=null;
    dirty();tool='select';menu=false;buildTb();render();
    $('hint').textContent='تم وضع الشبكة المكتشفة فوق الصورة. راجع العقد والقضبان واحذف الزائد أو أضف الناقص، ثم أدخل المساند والأحمال والأبعاد يدويًا قبل الحساب.';
  };
  image.src=imgGuide.src;
}
