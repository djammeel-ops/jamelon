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
