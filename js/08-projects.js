/* Projects: local project library and print-to-PDF export */

const PROJECTS_KEY='truss-projects-v1';
const projectPanel=$('projectPanel');
const projectList=$('projectList');
const projectName=$('projectName');

function readProjects(){
  try{
    const value=JSON.parse(localStorage.getItem(PROJECTS_KEY)||'[]');
    return Array.isArray(value)?value:[];
  }catch(e){return [];}
}
function writeProjects(items){
  try{localStorage.setItem(PROJECTS_KEY,JSON.stringify(items));return true;}
  catch(e){alert('تعذر حفظ المشروع. قد تكون مساحة التخزين ممتلئة.');return false;}
}
function projectSnapshot(){
  return {
    nodes:JSON.parse(JSON.stringify(nodes)),
    bars:JSON.parse(JSON.stringify(bars)),
    sup:JSON.parse(JSON.stringify(sup)),
    loads:JSON.parse(JSON.stringify(loads)),
    A:$('A').value,
    sall:$('sall').value
  };
}
function openProjects(){
  renderProjectList();
  projectPanel.hidden=false;
  projectName.focus();
}
function closeProjects(){projectPanel.hidden=true;}
function renderProjectList(){
  const items=readProjects().sort((a,b)=>(b.updated||0)-(a.updated||0));
  projectList.replaceChildren();
  if(!items.length){
    const empty=document.createElement('p');
    empty.className='modal-note';
    empty.textContent='لا توجد مشاريع محفوظة حتى الآن.';
    projectList.appendChild(empty);
    return;
  }
  items.forEach(item=>{
    const row=document.createElement('div');row.className='project-item';
    const meta=document.createElement('div');meta.className='project-meta';
    const name=document.createElement('strong');name.textContent=item.name||'مشروع دون اسم';
    const date=document.createElement('small');
    date.textContent=new Date(item.updated||item.created||Date.now()).toLocaleString('ar-DZ');
    meta.append(name,date);
    const actions=document.createElement('div');actions.className='project-actions';
    const load=document.createElement('button');load.type='button';load.className='load-project';load.textContent='فتح';
    load.addEventListener('click',()=>loadProject(item.id));
    const del=document.createElement('button');del.type='button';del.textContent='حذف';
    del.addEventListener('click',()=>{
      if(!confirm('حذف المشروع «'+(item.name||'دون اسم')+'»؟'))return;
      writeProjects(readProjects().filter(p=>p.id!==item.id));renderProjectList();
    });
    actions.append(load,del);row.append(meta,actions);projectList.appendChild(row);
  });
}
function saveProject(){
  const name=(projectName.value||'').trim();
  if(!name){alert('اكتب اسمًا للمشروع أولًا.');projectName.focus();return;}
  const items=readProjects();
  const item={id:String(Date.now())+'-'+Math.random().toString(36).slice(2,7),name,created:Date.now(),updated:Date.now(),model:projectSnapshot()};
  items.unshift(item);
  if(!writeProjects(items))return;
  projectName.value='';
  renderProjectList();
}
function validProjectModel(m){
  if(!m||!Array.isArray(m.nodes)||!Array.isArray(m.bars)||!m.sup||typeof m.sup!=='object'||!m.loads||typeof m.loads!=='object')return false;
  if(!m.nodes.every(n=>n&&Number.isFinite(+n.x)&&Number.isFinite(+n.y)))return false;
  if(!m.bars.every(b=>Array.isArray(b)&&b.length===2&&Number.isInteger(+b[0])&&Number.isInteger(+b[1])&&m.nodes[+b[0]]&&m.nodes[+b[1]]))return false;
  return true;
}
function loadProject(id){
  const item=readProjects().find(p=>p.id===id);
  if(!item||!validProjectModel(item.model)){alert('تعذر فتح المشروع: بياناته غير صالحة.');return;}
  if(!confirm('فتح هذا المشروع سيستبدل الرسم الحالي. هل تريد المتابعة؟'))return;
  const m=item.model;
  nodes=JSON.parse(JSON.stringify(m.nodes));
  bars=JSON.parse(JSON.stringify(m.bars));
  sup=JSON.parse(JSON.stringify(m.sup));
  loads=JSON.parse(JSON.stringify(m.loads));
  if(m.A!==undefined)$('A').value=m.A;
  if(m.sall!==undefined)$('sall').value=m.sall;
  hist=[];redoHist=[];cur=snapS();
  picked=null;allPicked=false;sel=null;pend=null;man=null;res=null;
  saveS();$('out').innerHTML='';closeProjects();buildTb();render();
  $('hint').textContent='تم فتح المشروع: '+(item.name||'دون اسم');
}
function exportPDF(){
  const report=$('printReport');
  report.replaceChildren();
  const title=document.createElement('h1');title.textContent='الأنظمة المثلثية — تقرير المشروع';
  const date=document.createElement('div');date.className='print-date';
  date.textContent='تاريخ التصدير: '+new Date().toLocaleString('ar-DZ')+' | عدد العقد: '+nodes.length+' | عدد القضبان: '+bars.length;
  report.append(title,date);
  const drawing=$('cv').cloneNode(true);
  drawing.removeAttribute('id');
  drawing.setAttribute('role','img');
  drawing.setAttribute('aria-label','رسم النظام المثلثي');
  report.appendChild(drawing);
  const results=$('out').cloneNode(true);
  results.removeAttribute('id');
  if(!results.children.length){
    const note=document.createElement('p');note.textContent='لم يُنفّذ التحليل بعد؛ يعرض هذا التقرير الرسم الحالي فقط.';
    report.appendChild(note);
  }else report.appendChild(results);
  const finish=()=>{report.replaceChildren();window.removeEventListener('afterprint',finish);};
  window.addEventListener('afterprint',finish,{once:true});
  setTimeout(()=>{
    try{window.print();}
    catch(e){finish();alert('تعذر فتح نافذة الطباعة على هذا الجهاز.');}
  },250);
  setTimeout(finish,120000);
}
$('saveProject').addEventListener('click',saveProject);
$('closeProjects').addEventListener('click',closeProjects);
projectPanel.addEventListener('click',e=>{if(e.target===projectPanel)closeProjects();});
projectName.addEventListener('keydown',e=>{if(e.key==='Enter')saveProject();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!projectPanel.hidden)closeProjects();});
buildTb();
