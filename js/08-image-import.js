/* AI truss image reader.
   The image is sent only to a configured HTTPS backend; no API key is stored in the APK. */
const TRUSS_AI_ENDPOINT = window.TRUSS_AI_ENDPOINT || '';

function pickTrussImage(){
  const input=$('trussImageFile');
  input.value='';
  input.click();
}

$('trussImageFile').addEventListener('change',async e=>{
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){
    $('hint').textContent='الملف المحدد ليس صورة مدعومة.';
    return;
  }
  if(!TRUSS_AI_ENDPOINT){
    $('hint').textContent='تم اختيار الصورة، لكن خدمة الذكاء الاصطناعي لم تُربط بالخادم بعد. لم تُضف الصورة كخلفية؛ يلزم إعداد خادم التحليل الآمن أولاً.';
    alert('قراءة الصور بالذكاء الاصطناعي لم تُفعّل بعد. يلزم ربط خادم التحليل الآمن قبل أن يتمكن التطبيق من قراءة النظام.');
    return;
  }
  if(!/^https:\/\//i.test(TRUSS_AI_ENDPOINT)){
    $('hint').textContent='عنوان خدمة تحليل الصور غير صالح؛ يجب أن يبدأ بـ HTTPS.';
    return;
  }
  const button=document.querySelector('#sm [data-a="image"]');
  if(button){button.disabled=true;button.textContent='جارٍ تحليل الصورة…';}
  $('hint').textContent='جارٍ إرسال الصورة إلى خدمة الذكاء الاصطناعي لقراءة العقد والقضبان والأحمال والمساند والأبعاد…';
  try{
    const body=new FormData();
    body.append('image',file,file.name||'truss-image');
    const response=await fetch(TRUSS_AI_ENDPOINT,{
      method:'POST',
      body,
      headers:{'Accept':'application/json'}
    });
    if(!response.ok)throw new Error('HTTP '+response.status);
    const data=await response.json();
    if(!data||!Array.isArray(data.nodes)||!Array.isArray(data.members)||
       !Array.isArray(data.supports)||!Array.isArray(data.loads)||
       !Array.isArray(data.dimensions)){
      throw new Error('استجابة الخادم لا تطابق مخطط بيانات الجمالون المطلوب.');
    }
    window.dispatchEvent(new CustomEvent('truss-ai-result',{detail:data}));
    $('hint').textContent='اكتمل التحليل الأولي. يجب مراجعة العقد والقضبان والأحمال والمساند والأبعاد قبل اعتماد النموذج للحساب.';
  }catch(error){
    console.error('Truss AI analysis failed:',error);
    $('hint').textContent='تعذر تحليل الصورة. تحقق من اتصال الإنترنت وإعداد خادم الذكاء الاصطناعي، ثم أعد المحاولة.';
    alert('تعذر تحليل الصورة: '+(error.message||'خطأ في الاتصال بالخادم'));
  }finally{
    if(button){button.disabled=false;button.innerHTML='<svg class="i" viewBox="0 0 24 24">'+I.image+'</svg>قراءة صورة بالذكاء الاصطناعي';}
  }
});
