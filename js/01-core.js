/* Core: constants, icons, application state */

const $=id=>document.getElementById(id);
const fmt=v=>Number.isFinite(Number(v))?Number(v).toLocaleString('en-US',{maximumFractionDigits:3}):'—';
const I={
select:'<path d="M5 3l12 8-5 1.5L9.5 18z"/>',
node:'<circle cx="12" cy="12" r="5" fill="currentColor"/>',
bar:'<circle cx="5" cy="19" r="2.5" fill="currentColor"/><circle cx="19" cy="5" r="2.5" fill="currentColor"/><path d="M6.5 17.5l11-11"/>',
load:'<path d="M12 3v15M6 12l6 7 6-7"/>',
pin:'<path d="M12 6l7 12H5z"/><path d="M3 21h18"/>',
rollerY:'<path d="M12 4l6 10H6z"/><circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/><path d="M3 22h18"/>',
rollerX:'<g transform="rotate(90 12 12)"><path d="M12 4l6 10H6z"/><circle cx="9" cy="18" r="2"/><circle cx="15" cy="18" r="2"/><path d="M3 22h18"/></g>',
del:'<path d="M5 5l14 14M19 5L5 19"/>',
calc:'<path d="M7 4l13 8-13 8z" fill="currentColor"/>',
clr:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
add:'<path d="M12 4v16M4 12h16"/>'};
Object.assign(I,{
select:'<path class="f" d="M5 3l13 8-5.5 1.8L9.5 19z"/>',
add:'<circle class="f" cx="12" cy="12" r="9"/><path d="M12 7.5v9M7.5 12h9"/>',
node:'<circle cx="12" cy="12" r="9" opacity=".35"/><circle class="s" cx="12" cy="12" r="5"/>',
bar:'<path d="M6 18L18 6"/><circle class="s" cx="6" cy="18" r="3"/><circle class="s" cx="18" cy="6" r="3"/>',
load:'<path d="M12 3v13"/><path class="f" d="M6.5 12.5L12 20l5.5-7.5z"/>',
pin:'<path class="f" d="M12 5l7 13H5z"/><path d="M3 21h18"/><circle class="s" cx="12" cy="5" r="2"/>',
rollerY:'<path class="f" d="M12 4l6.5 10h-13z"/><circle cx="8.5" cy="17.5" r="2"/><circle cx="15.5" cy="17.5" r="2"/><path d="M3 21.5h18"/>',
rollerX:'<g transform="rotate(90 12 12)"><path class="f" d="M12 4l6.5 10h-13z"/><circle cx="8.5" cy="17.5" r="2"/><circle cx="15.5" cy="17.5" r="2"/><path d="M3 21.5h18"/></g>',
del:'<circle class="f" cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>',
calc:'<path class="s" d="M8 5l11 7-11 7z" stroke-linejoin="round"/>',
clr:'<path class="f" d="M6 7l1 13h10l1-13z"/><path d="M4 7h16M9.5 7V4h5v3"/>',
undo:'<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 010 11H11"/>',
redo:'<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 000 11H13"/>' ,
sup:'<path class="f" d="M12 8l6 11H6z"/><path d="M3 21h18M12 3v5"/>',
pinV:'<g transform="rotate(90 12 12)"><path class="f" d="M12 5l7 13H5z"/><path d="M3 21h18"/><circle class="s" cx="12" cy="5" r="2"/></g>'});
const svg=k=>`<svg class="i" viewBox="0 0 24 24">${I[k]}</svg>`;
const HINT={select:'اسحب العقدة لتغيير موضعها، أو انقر على عنصر لاختياره ثم اضغط «حذف».',node:'انقر على الرسم لإضافة عقدة، أو اكتب الفاصلة والترتيبة ثم «إضافة».',bar:'انقر على عقدة ثم على عقدة أخرى لرسم قضيب.',load:'اكتب Fx وFy ثم انقر على العقدة لتطبيق الحمل.',
pin:'انقر على عقدة: مسند مفصلي أفقي (يمنع الحركتين).',pinV:'انقر على عقدة: مسند مفصلي شاقولي (يمنع الحركتين).',rollerY:'انقر على عقدة: مسند متحرك أفقي (يمنع الحركة الرأسية فقط).',rollerX:'انقر على عقدة: مسند متحرك شاقولي (يمنع الحركة الأفقية فقط).',del:'انقر على قضيب لحذفه. النقر المتكرر على عقدة يحذف المسند ثم الأحمال (آخر حمل أولًا) ثم العقدة.'};
const SUB=[['node','عقدة'],['bar','قضيب'],['load','حمل'],['sup','مسند']];
const SUP=[['pin','مفصلي أفقي'],['rollerY','متحرك أفقي'],['pinV','مفصلي شاقولي'],['rollerX','متحرك شاقولي']];
const MAIN=[['select','تحريك'],['pin','مفصلي'],['rollerY','متحرك أ'],['rollerX','متحرك ر'],['del','حذف']];
const nm=i=>(i>=26?nm(Math.floor(i/26)-1):'')+String.fromCharCode(65+i%26);
let tool='select',sub='bar',menu=false,pend=null,sel=null,picked=null,allPicked=false,drag=null,moved=false,res=null,V={x0:0,y0:0,w:12,h:8};
let nodes=[{x:2,y:2},{x:8,y:2},{x:5,y:5}],bars=[[0,1],[0,2],[1,2]],sup={0:'pin',1:'rollerY'},loads={2:[[0,-10]]};
const isC=t=>SUB.some(s=>s[0]==t)||SUP.some(s=>s[0]==t);
