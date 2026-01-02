
const TEMPLATE_ID = 'CHECK-GENERAL';
const STORAGE_KEY = 'ohsms_forms_responses';

const templateQuestions = [
  'هل تتوفر خطط إخلاء مكتوبة ومعلنة للموظفين؟',
  'هل يوجد نظام ابتكار وتقديم مقترحات تحسين؟',
  'هل تعرف أهداف الإدارة ودورك في تحقيقها؟',
  'هل يتم إجراء اجتماعات دورية لمناقشة السلامة والجودة؟',
  'هل تتوفر برامج تدريب منتظمة للموظفين؟',
  'هل يتم مراجعة الحوادث والدروس المستفادة منها؟',
  'هل بيئة العمل خالية من العوائق التي تعرقل الحركة؟',
  'هل تتوفر تهوية وإضاءة مناسبة في موقع العمل؟',
  'هل يتم استخدام معدات الوقاية الشخصية بشكل صحيح؟',
  'هل تعليمات وإجراءات العمل متاحة وواضحة للجميع؟',
  'هل يتم تطبيق نظام الإبلاغ عن المخاطر والأخطاء الوشيكة؟',
  'هل تتوفر خطط طوارئ محدثة ويتم تجربتها بشكل دوري؟',
  'هل يتم حماية بيانات وأصول المنشأة من الوصول غير المصرح به؟',
  'هل توجد قنوات فعّالة للتواصل بين الإدارة والموظفين؟',
  'هل تشعر أن ثقافة السلامة والجودة مدعومة من الإدارة العليا؟'
];

function loadResponses(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');}
  catch(e){return [];}
}
function saveResponses(arr){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
}

function generateFormId(){
  const year = new Date().getFullYear();
  const all = loadResponses();
  const nums = all
    .filter(r=>String(r.id||'').startsWith('FRM-'+year))
    .map(r=>parseInt(String(r.id).split('-').pop()||'0',10) || 0);
  const next = (nums.length?Math.max.apply(null,nums):0)+1;
  return 'FRM-'+year+'-'+String(next).padStart(4,'0');
}

let notesByIndex = {};
let currentQuestionIndex = null;

function buildQuestions(){
  const container = document.getElementById('questionsContainer');
  container.innerHTML = '';
  templateQuestions.forEach((q,idx)=>{
    const wrapper = document.createElement('div');
    wrapper.className = 'card';
    wrapper.style.marginBottom = '10px';
    wrapper.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;">
        <div style="font-size:13px;font-weight:600;">${idx+1}. ${q}</div>
        <div style="display:flex;gap:8px;align-items:center;font-size:13px;">
          <label><input type="radio" name="q_${idx}" value="yes"> نعم</label>
          <label><input type="radio" name="q_${idx}" value="no"> لا</label>
          <label><input type="radio" name="q_${idx}" value="na" checked> لا ينطبق</label>
          <button type="button" class="btn btn-small btn-secondary note-btn" data-index="${idx}">📝 ملاحظات</button>
        </div>
      </div>
    `;
    container.appendChild(wrapper);
  });
}

function updateCounters(){
  const responses = loadResponses();
  document.getElementById('formsCount').textContent = '1 نموذج';
  document.getElementById('sentCount').textContent = responses.length + ' مهمة/نموذج';
  document.getElementById('receivedCount').textContent = responses.length + ' رد';
}

function renderResponses(){
  const responses = loadResponses();
  const tbody = document.querySelector('#responsesTable tbody');
  tbody.innerHTML = '';
  if(!responses.length){
    document.getElementById('responsesEmpty').style.display = 'block';
    return;
  }
  document.getElementById('responsesEmpty').style.display = 'none';
  responses.forEach(r=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${new Date(r.createdAt).toLocaleString()}</td>
      <td>${r.sender||''}</td>
      <td>${r.receiver||''}</td>
      <td>${r.filler||''}</td>
      <td>${(r.answers||[]).length}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener('DOMContentLoaded', function(){
  buildQuestions();
  updateCounters();
  renderResponses();

  // notes modal logic
  const modal = document.getElementById('notesModal');
  const notesInput = document.getElementById('notesInput');
  document.getElementById('questionsContainer').addEventListener('click', function(e){
    const btn = e.target.closest('.note-btn');
    if(!btn) return;
    currentQuestionIndex = parseInt(btn.getAttribute('data-index'),10);
    notesInput.value = notesByIndex[currentQuestionIndex] || '';
    modal.classList.remove('hidden');
  });
  document.getElementById('cancelNotesBtn').addEventListener('click', function(){
    modal.classList.add('hidden');
    currentQuestionIndex = null;
  });
  document.getElementById('saveNotesBtn').addEventListener('click', function(){
    if(currentQuestionIndex==null) return;
    notesByIndex[currentQuestionIndex] = notesInput.value.trim();
    modal.classList.add('hidden');
    currentQuestionIndex = null;
  });

  document.getElementById('createLinkBtn').addEventListener('click', function(){
    const target = document.getElementById('target').value.trim();
    const note = document.getElementById('taskNote').value.trim();
    const msg = document.getElementById('shareInfo');
    let txt = 'تم إنشاء رابط تعبئة للنموذج. يمكن مشاركته داخل النظام.';
    if(target) txt += ' المستلم: '+target+'.';
    if(note) txt += ' ملاحظة: '+note;
    msg.textContent = txt;
  });

  document.getElementById('submitFormBtn').addEventListener('click', function(){
    const sender = document.getElementById('senderName').value.trim();
    const receiver = document.getElementById('receiverName').value.trim();
    const filler = document.getElementById('fillerName').value.trim();

    const answers = templateQuestions.map((q,idx)=>{
      const checked = document.querySelector('input[name="q_'+idx+'"]:checked');
      return {
        question: q,
        value: checked ? checked.value : 'na',
        notes: notesByIndex[idx] || ''
      };
    });

    const record = {
      id: generateFormId(),
      templateId: TEMPLATE_ID,
      sender,
      receiver,
      filler,
      answers,
      createdAt: new Date().toISOString()
    };

    const all = loadResponses();
    all.push(record);
    saveResponses(all);
    notesByIndex = {};
    document.getElementById('formMsg').textContent = '✔ تم إرسال النموذج وحفظه في السجل.';
    setTimeout(()=>{document.getElementById('formMsg').textContent='';},3000);
    document.getElementById('senderName').value='';
    document.getElementById('receiverName').value='';
    document.getElementById('fillerName').value='';
    document.querySelectorAll('#questionsContainer input[type="radio"][value="na"]').forEach(r=>{r.checked=true;});
    updateCounters();
    renderResponses();
  });
});
