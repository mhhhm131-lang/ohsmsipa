let currentStepIndex = null;
let currentStepReport = null;
// =============================
// Step Notes - LocalStorage
// =============================
const STEP_NOTES_KEY = 'ohsms_step_notes_v1';

function _readStepNotesStore() {
  try {
    return JSON.parse(localStorage.getItem(STEP_NOTES_KEY) || '{}');
  } catch (e) {
    return {};
  }
}

function _writeStepNotesStore(store) {
  localStorage.setItem(STEP_NOTES_KEY, JSON.stringify(store));
}

function loadStepNotesForReport(reportId) {
  if (!reportId) return [];
  const store = _readStepNotesStore();
  const arr = store[reportId];
  return Array.isArray(arr) ? arr : [];
}

function saveStepNotesForReport(reportId, notesArray) {
  if (!reportId) return;
  const store = _readStepNotesStore();
  store[reportId] = Array.isArray(notesArray) ? notesArray : [];
  _writeStepNotesStore(store);
}

function openStepNoteModal(i, title, report) {
  currentStepIndex = i;
  currentStepReport = report;

  document.getElementById('stepNoteTitle').textContent =
    'ملاحظات المرحلة: ' + title;

  const textarea = document.getElementById('stepNoteTextarea');
  textarea.value = report.stepNotes?.[i] || '';

  document.getElementById('stepNoteModal').classList.remove('hidden');
}
function saveStepNote() {
  if (!currentStepReport || currentStepIndex === null) {
    alert('حدث خطأ: لم يتم تحديد المرحلة');
    return;
  }

  if (!Array.isArray(currentStepReport.stepNotes)) {
    currentStepReport.stepNotes = [];
  }

  const text = document
    .getElementById('stepNoteTextarea')
    .value
    .trim();

  currentStepReport.stepNotes[currentStepIndex] = text;

  closeStepNoteModal();

  // إعادة بناء المسار لتحديث الملاحظة مباشرة
  buildTimeline(currentStepReport);
}
function closeStepNoteModal() {
  document.getElementById('stepNoteModal').classList.add('hidden');
}

// خطوات مسار البلاغ (Workflow)
const WF_STEPS = [
  'تم إرسال البلاغ',
  'استلام موظف السلامة',
  'إحالة إلى الإدارة المعنية',
  'استلام الإحالة من موظف الإدارة',
  'إرسال إلى الموظف المعني بالإجراء التصحيحي والوقائي',
  'جاري العمل على البلاغ',
  'تم تنفيذ الإجراء التصحيحي والوقائي',
  'إغلاق البلاغ'
];

// ضمان أن جميع البلاغات فيها الحقول الأساسية (statusIndex, status, history, escalationLevel, stepNotes)
function normalizeReports(list) {
  let changed = false;
  const now = new Date().toLocaleString();

  list.forEach(r => {
    if (typeof r.statusIndex !== 'number') {
      r.statusIndex = 0;
      changed = true;
    }

    if (!r.status) {
      r.status = WF_STEPS[r.statusIndex] || 'تم إرسال البلاغ';
      changed = true;
    }

    if (!Array.isArray(r.history)) {
      r.history = [{
        action: 'إدخال البلاغ (' + (r.type || '-') + ')',
        note: '',
        at: r.createdAt || now
      }];
      changed = true;
    }

    if (typeof r.escalationLevel !== 'number') {
      r.escalationLevel = 0;
      changed = true;
    }

    if (!Array.isArray(r.stepNotes)) {
      r.stepNotes = [];
      changed = true;
    }
  });

  if (changed) saveReports(list);
  return list;
}

// الحصول على جميع البلاغات
function getAllReports() {
  return normalizeReports(loadReports());
}

// البحث عن بلاغ برقم معيّن
function getReportById(id) {
  return getAllReports().find(r => r.id === id);
}

// تحديث بلاغ واحد وحفظه
function updateReport(rep) {
  const list = getAllReports();
  const i = list.findIndex(r => r.id === rep.id);
  if (i !== -1) {
    list[i] = rep;
    saveReports(list);
  }
}

// رسم جدول البلاغات في صفحة reports.html
function renderReportsTable() {
  const container = document.getElementById('reports-table');
  const reports = getAllReports();

  if (!reports.length) {
    container.innerHTML =
      '<div class="empty">لا توجد بلاغات مسجلة حتى الآن. يمكن إدخال البلاغات من الصفحة الرئيسية.</div>';
    renderTimelineGlobal();
    return;
  }

  let h = '<div class="table-wrapper"><table class="reports"><thead><tr>' +
    '<th>رقم البلاغ</th>' +
    '<th>النوع</th>' +
    '<th>الموقع / الجهة</th>' +
    '<th>التاريخ</th>' +
    '<th>الحالة الحالية</th>' +
    '<th>الإجراءات</th>' +
    '</tr></thead><tbody>';

  reports.forEach(r => {
    const cls =
      r.type === 'عاجل'
        ? 'badge-urgent'
        : (r.type === 'سري' ? 'badge-secret' : 'badge-normal');

    const status = WF_STEPS[r.statusIndex] || r.status || 'تم إرسال البلاغ';

    h += '<tr>' +
      '<td>' + (r.id || '-') + '</td>' +
      '<td><span class="badge ' + cls + '">' + (r.type || '-') + '</span></td>' +
      '<td>' + (r.location || '') + '</td>' +
      '<td>' + (r.createdAt || '') + '</td>' +
      '<td><span class="badge badge-status">' + status + '</span></td>' +
      '<td><button class="btn btn-small btn-primary" onclick="openReportModal(\'' + (r.id || '') + '\')">إدارة / تتبع</button></td>' +
      '</tr>';
  });

  h += '</tbody></table></div>';

  container.innerHTML = h;

  refreshStepNoteIndicators();


  // المسار العام (يمكن تطويره لاحقاً)
  renderTimelineGlobal();
}

// رقم البلاغ الحالي المفتوح في نافذة الإدارة
let currentReportId = null;

// فتح نافذة إدارة البلاغ و تعبئة البيانات
function openReportModal(id) {
  const r = getReportById(id);
  if (!r) return;
  // تحميل ملاحظات الخطوات من التخزين (إن وجدت)
r.stepNotes = loadStepNotesForReport(r.id) || r.stepNotes || [];
if (!Array.isArray(r.stepNotes)) r.stepNotes = [];


  currentReportId = r.id;

  // بيانات أساسية
  const created = r.createdAt || r.date || '-';
  document.getElementById('infoId').textContent = r.id || '-';
  document.getElementById('infoType').textContent = r.type || '-';
  document.getElementById('infoCreated').textContent = created || '-';

  // بيانات مسار البلاغ
  document.getElementById('infoReceivedBy').textContent = r.receivedBy || '-';
  document.getElementById('infoReceivedAt').textContent = r.receivedAt || '-';

  document.getElementById('infoAssignedDept').textContent = r.assignedDept || '-';
  document.getElementById('infoCoordinator').textContent = r.coordinator || '-';
  document.getElementById('infoAssignedAt').textContent = r.assignedAt || '-';

  document.getElementById('infoExecutor').textContent = r.executor || '-';
  document.getElementById('infoForwardedAt').textContent = r.forwardedAt || '-';

  document.getElementById('infoDoneAt').textContent = r.doneAt || '-';

  // قناة التواصل + نص البلاغ
  document.getElementById('infoContact').textContent = r.contact || 'غير متاح';
  document.getElementById('infoDesc').textContent = r.desc || '-';

  // سبب السرية – يظهر فقط إذا النوع سري
  const secretRow = document.getElementById('secretReasonRow');
  if (secretRow) {
    if (r.type === 'سري') {
      secretRow.style.display = '';
      document.getElementById('infoSecretReason').textContent = r.secretReason || '-';
    } else {
      secretRow.style.display = 'none';
      document.getElementById('infoSecretReason').textContent = '';
    }
  }

  // رسم التايملاين الجديد
  buildTimeline(r);

  // إظهار السجل التاريخي للحركات
  updateHistoryBox(r);

  // تفريغ مربع التعليق العام
  const cbox = document.getElementById('commentBox');
  if (cbox) cbox.value = '';

  // إظهار نافذة إدارة البلاغ
  const modal = document.getElementById('reportModal');
  if (modal) {
    modal.classList.remove('hidden');
  }
}

// إغلاق نافذة إدارة البلاغ
function closeReportModal() {
  const modal = document.getElementById('reportModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

// الحصول على البلاغ الحالي المفتوح في المودال
function getCurrentReport() {
  if (!currentReportId) return null;
  return getReportById(currentReportId);
}

/* =============================
   الخط الزمني الجديد داخل المودال
   ============================= */

function buildTimeline(report) {
  const container = document.getElementById('timeline-modal');
  if (!container) return;

  // تأمين حقل الملاحظات لكل خطوة
  if (!Array.isArray(report.stepNotes)) {
    report.stepNotes = [];
  }

  container.innerHTML = '';

  const steps = WF_STEPS.slice(); // نفس النصوص
  const currentIndex = report.statusIndex || 0;

  const times = [
    report.createdAt || '',
    report.receivedAt || '',
    report.assignedAt || '',
    report.coordinatorReceivedAt || '',
    report.forwardedAt || '',
    report.workStartedAt || '',
    report.doneAt || '',
    report.closedAt || ''
  ];

  // الخط الملون
  const line = document.createElement('div');
  line.className = 'timeline-line';

  container.appendChild(line);

  const grid = document.createElement('div');
  grid.className = 'timeline-grid';
  container.appendChild(grid);
const stepIcons = [
    "📨", // تم إرسال البلاغ
    "👷‍♂️", // استلام موظف السلامة
    "🏢", // إحالة إلى الإدارة
    "📥", // استلام الإحالة
    "👨‍🔧", // إرسال للموظف المعني
    "🔄", // جاري العمل
    "✔️", // تنفيذ الإجراء
    "🔒"  // إغلاق البلاغ
];

  steps.forEach((title, i) => {
    const step = document.createElement('div');
step.className = 'step';
step.classList.add(i % 2 === 0 ? 'top-row' : 'bottom-row');

    if (i < currentIndex) {
      step.classList.add('done');
    } else if (i === currentIndex) {
      step.classList.add('active');
    }

    const timeLabel = times[i] || '---';
    const noteText = report.stepNotes[i] || '';

    step.innerHTML = `
  <div class="step-circle" data-step="${i}">
    <span class="step-icon">${stepIcons[i]}</span>
  </div>

  <div class="step-title">${title}</div>

  <div class="step-time">${times[i] || ''}</div>

  ${noteText ? `<div class="step-note">${noteText}</div>` : ''}
`;

     step.querySelector('.step-circle').addEventListener('click', function () {
  openStepNoteModal(i, title, report);
});
 

    grid.appendChild(step);
  });

  // ربط الأحداث (فتح ملاحظات + تنفيذ إجراء)
  container.onclick = function (e) {
    const circle = e.target.closest('.step-circle');
    if (circle && container.contains(circle)) {
      const idx = parseInt(circle.getAttribute('data-step'), 10);
      if (!isNaN(idx)) openStepNoteModal(idx);
      return;
    }

    const dot = e.target.closest('.action-dot');
    if (dot && container.contains(dot)) {
      const idx = parseInt(dot.getAttribute('data-step'), 10);
      if (!isNaN(idx)) handleStepAction(idx);
    }
  };
}

/* =============================
   ملاحظات كل مرحلة (نافذة منبثقة)
   ============================= */

let currentNoteStepIndex = null;

function openStepNoteModal(stepIndex) {
  const r = getCurrentReport();
  if (!r) return;

  if (!Array.isArray(r.stepNotes)) {
    r.stepNotes = [];
  }

  currentNoteStepIndex = stepIndex;

  const modal = document.getElementById('stepNoteModal');
  const textarea = document.getElementById('stepNoteInput');
  if (!modal || !textarea) return;

  textarea.value = r.stepNotes[stepIndex] || '';
  modal.classList.remove('hidden');
}

function closeStepNoteModal() {
  const modal = document.getElementById('stepNoteModal');
  if (modal) {
    modal.classList.add('hidden');
  }
}

function saveStepNote() {
  if (!currentStepReport || currentStepIndex === null) {
    alert('حدث خطأ: لم يتم تحديد المرحلة');
    return;
  }

  // تأكد أن المصفوفة موجودة
  if (!Array.isArray(currentStepReport.stepNotes)) {
    currentStepReport.stepNotes = [];
  }

  const text = document
    .getElementById('stepNoteTextarea')
    .value
    .trim();
    if (!text) {
  alert('لا يمكن حفظ ملاحظة فارغة');
  return;
}


  // حفظ الملاحظة في التقرير الحالي
  currentStepReport.stepNotes[currentStepIndex] = text;
  ohsmsToast('تم الحفظ بنجاح');
refreshStepNoteIndicators();


  // 🔐 حفظ في LocalStorage
  if (currentReportId) {
    saveStepNotesForReport(currentReportId, currentStepReport.stepNotes);
  }

  closeStepNoteModal();

  // 🔄 إعادة بناء المسار لتحديث العرض
  buildTimeline(currentStepReport);
}

/* =============================
   ربط المرحلة بزر الإجراء الصغير
   ============================= */

function handleStepAction(stepIndex) {
  const r = getCurrentReport();
  if (!r) return;

  const currentIndex = r.statusIndex || 0;
  if (stepIndex !== currentIndex) {
    alert('يمكن تنفيذ الإجراء للمرحلة الحالية فقط.');
    return;
  }

  // نربط فقط الخطوات التي لها إجراء واضح
  switch (stepIndex) {
    case 1:
      actionReceive();
      break;
    case 2:
      actionAssign();
      break;
    case 4:
      actionForward();
      break;
    case 6:
      actionDone();
      break;
    case 7:
      actionCloseCase();
      break;
    default:
      // الخطوات 0,3,5 لا تملك إجراء مباشر
      break;
  }
}

/* =============================
   السجل التاريخي للبلاغ
   ============================= */

function updateHistoryBox(r) {
  const box = document.getElementById('historyBox');
  if (!box) return;

  if (!r.history || !r.history.length) {
    box.textContent = 'لا يوجد سجل سابق.';
    return;
  }

  box.innerHTML = r.history
    .map(h => '• [' + h.at + '] ' + h.action + (h.note ? ' – ' + h.note : ''))
    .join('<br>');
}

// إضافة سطر جديد في السجل التاريخي للبلاغ
function pushHistory(r, title, note) {
  r.history = r.history || [];
  r.history.push({
    action: title,
    note: note || '',
    at: new Date().toLocaleString()
  });
}

// تطبيق حركة عامة على البلاغ (تغيير حالة + سجل)
function applyAction(targetIndex, titleOverride) {
  let r = getCurrentReport();
  if (!r) return;

  const note = document.getElementById('commentBox').value.trim();

  // تحديث مؤشر الحالة (لا نرجع إلى الوراء)
  if (targetIndex > (r.statusIndex || 0)) {
    r.statusIndex = targetIndex;
  }

  r.status = WF_STEPS[r.statusIndex] || r.status || 'تم إرسال البلاغ';

  const title = titleOverride || r.status;
  pushHistory(r, title, note);

  updateReport(r);

  document.getElementById('commentBox').value = '';

  // إعادة تحميل الجدول والنافذة بالمعلومات المحدثة
  renderReportsTable();
  openReportModal(r.id);
}

/* =============================
   إجراءات مراحل المسار
   ============================= */

// استلام البلاغ من موظف السلامة
function actionReceive() {
  let r = getCurrentReport();
  if (!r) return;

  // تسجيل المستلم لأول مرة فقط
  if (!r.receivedBy && typeof ohsmsGetCurrentUser === 'function') {
    const u = ohsmsGetCurrentUser();
    if (u) {
      r.receivedBy = u.fullNameAr || u.username || 'موظف النظام';
    }
  }

  if (!r.receivedAt) {
    r.receivedAt = new Date().toLocaleString();
  }

  updateReport(r);
  applyAction(1, 'استلام البلاغ من موظف السلامة');
}

// إحالة البلاغ إلى الإدارة المعنية
function actionAssign() {
  const m = document.getElementById('assignModal');
  if (m) m.classList.remove('hidden');
}

function closeAssignModal() {
  const m = document.getElementById('assignModal');
  if (m) m.classList.add('hidden');
}

function saveAssign() {
  let r = getCurrentReport();
  if (!r) return;

  r.assignedDept = document.getElementById('assignDept').value.trim();
  r.coordinator = document.getElementById('assignCoord').value.trim();
  r.assignedNote = document.getElementById('assignNote').value.trim();
  r.assignedAt = new Date().toLocaleString();

  // history
  pushHistory(r, 'إحالة البلاغ إلى ' + r.assignedDept, r.assignedNote);

  // اعتبار مرحلة الإحالة مكتملة
  if ((r.statusIndex || 0) < 2) {
    r.statusIndex = 2;
    r.status = WF_STEPS[r.statusIndex];
  }

  updateReport(r);

  closeAssignModal();
  renderReportsTable();
  openReportModal(r.id);
}

// تحويل إلى الموظف المعني (الميداني) + وضعه "جاري العمل"
function actionForward() {
  let r = getCurrentReport();
  if (!r) return;

  const note = document.getElementById('commentBox').value.trim();

  if (!r.forwardedAt) {
    r.forwardedAt = new Date().toLocaleString();
  }
  if (!r.workStartedAt) {
    r.workStartedAt = r.forwardedAt;
  }

  // رفع الحالة للمراحل 4 و 5 (تحويل + جاري العمل)
  if ((r.statusIndex || 0) < 4) r.statusIndex = 4;
  if (r.statusIndex < 5) r.statusIndex = 5;

  r.status = WF_STEPS[r.statusIndex];

  pushHistory(r, 'تحويل إلى الموظف المعني بالإجراء / جاري العمل', note);
  updateReport(r);

  document.getElementById('commentBox').value = '';
  renderReportsTable();
  openReportModal(r.id);
}

// تم تنفيذ الإجراء التصحيحي والوقائي
function actionDone() {
  let r = getCurrentReport();
  if (!r) return;

  if (!r.doneAt) {
    r.doneAt = new Date().toLocaleString();
    updateReport(r);
  }

  applyAction(6, 'تم تنفيذ الإجراء التصحيحي والوقائي');
}

// إغلاق البلاغ
function actionCloseCase() {
  let r = getCurrentReport();
  if (!r) return;

  if (!r.closedAt) {
    r.closedAt = new Date().toLocaleString();
    updateReport(r);
  }

  applyAction(7, 'إغلاق البلاغ');
}

// التصعيد (قسم / إدارة / لجنة / إدارة عليا)
function actionEscalate() {
  let r = getCurrentReport();
  if (!r) return;

  r.escalationLevel = (r.escalationLevel || 0) + 1;

  const levels = [
    'تصعيد إلى مدير القسم',
    'تصعيد إلى مدير الإدارة',
    'تصعيد إلى لجنة السلامة',
    'تصعيد إلى الإدارة العليا'
  ];

  const txt = levels[Math.min(r.escalationLevel - 1, levels.length - 1)];
  const note = document.getElementById('commentBox').value.trim();

  pushHistory(r, txt, note);
  updateReport(r);

  document.getElementById('commentBox').value = '';
  renderReportsTable();
  openReportModal(r.id);
}

// التواصل مع المبلغ (يستخدم حقل contact)
function actionContact() {
  const r = getCurrentReport();
  if (!r) return;

  if (!r.contact || r.contact === 'غير محدد' || r.contact.indexOf('غير متاح') !== -1) {
    alert('لا توجد وسيلة تواصل مسجلة لهذا البلاغ.');
    return;
  }

  alert('يمكن التواصل مع المبلّغ عبر: ' + r.contact);
}

/* =============================
   المسار العام ( placeholder )
   ============================= */

function renderTimelineGlobal() {
  // يمكن مستقبلاً عرض مسار تجميعي هنا
  const c = document.getElementById('timeline-global');
  if (!c) return;
  c.innerHTML = '<div class="hint" style="font-size:12px;">يتم تتبع المسار التفصيلي من داخل كل بلاغ.</div>';
}

/* =============================
   عند تحميل الصفحة
   ============================= */

document.addEventListener('DOMContentLoaded', function () {
  renderReportsTable();

  const saveBtn = document.getElementById('saveStepNoteBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveCurrentStepNote);
  }
});

/* ===============================
   Step Notes – Modal Control
   =============================== */



// فتح نافذة ملاحظات المرحلة
function openStepNoteModal(stepIndex, stepTitle, report) {
  currentStepIndex = stepIndex;

  document.getElementById("stepNoteTitle").textContent =
    "ملاحظات المرحلة: " + stepTitle;

  const textarea = document.getElementById("stepNoteTextarea");

  if (!Array.isArray(report.stepNotes)) {
    report.stepNotes = [];
  }

  textarea.value = report.stepNotes[stepIndex] || "";

  document.getElementById("stepNoteModal").classList.remove("hidden");
}

// إغلاق النافذة
function closeStepNoteModal() {
  document.getElementById("stepNoteModal").classList.add("hidden");
  currentStepIndex = null;
}

// حفظ الملاحظة
function saveStepNote() {

  if (!report || currentStepIndex === null) return;

  if (!Array.isArray(report.stepNotes)) {
    report.stepNotes = [];
  }

  report.stepNotes[currentStepIndex] =
    document.getElementById("stepNoteTextarea").value.trim();

  updateReport(report);
  renderTimelineModal(report);

  closeStepNoteModal();
}
// ================================
// Step Notes UI Indicators + Toast
// ================================

// (1) Toast بسيط
function ohsmsToast(msg){
  let el = document.getElementById('ohsmsToast');
  if(!el){
    el = document.createElement('div');
    el.id = 'ohsmsToast';
    el.className = 'ohsms-toast';
    document.body.appendChild(el);
  }
  el.textContent = msg || 'تم الحفظ بنجاح';
  el.classList.add('show');
  clearTimeout(window.__ohsmsToastTimer);
  window.__ohsmsToastTimer = setTimeout(()=> el.classList.remove('show'), 1600);
}

// (2) قراءة الملاحظات — بدون تغيير نظامك الحالي
// إذا عندك دالة جاهزة loadStepNotes(reportId) استخدمها كما هي.
// هذا fallback فقط لو غير موجودة.
function ohsmsGetNotesMap(reportId){
  try{
    if(typeof loadStepNotes === 'function'){
      // نتوقع أنها ترجع كائن مثل: {0:"...", 1:"..."} أو مصفوفة
      return loadStepNotes(reportId) || {};
    }
  }catch(e){}
  // fallback: افترض تخزينها في key خاص (عدّل الاسم هنا فقط إذا نظامك مختلف)
  try{
    return JSON.parse(localStorage.getItem('ohsms_step_notes_'+reportId) || '{}');
  }catch(e){
    return {};
  }
}

function ohsmsStepHasNote(reportId, stepIndex){
  const m = ohsmsGetNotesMap(reportId);
  let v = '';
  if(Array.isArray(m)) v = m[stepIndex];
  else v = m[String(stepIndex)] ?? m[stepIndex];
  return !!(v && String(v).trim().length);
}

// (3) تلوين/وضع ✏️ على الخطوات التي فيها ملاحظة
function refreshStepNoteIndicators(){
  const r = (typeof getCurrentReport === 'function') ? getCurrentReport() : null;
  if(!r || !r.id) return;

  const container = document.getElementById('timeline-modal');
  if(!container) return;

  const steps = container.querySelectorAll('.wf-step');
  if(!steps || !steps.length) return;

  steps.forEach((stepEl, i)=>{
    const has = ohsmsStepHasNote(r.id, i);

    // class للتلوين
    stepEl.classList.toggle('has-note', has);

    // badge ✏️
    let badge = stepEl.querySelector('.wf-note-badge');
    if(has){
      if(!badge){
        badge = document.createElement('div');
        badge.className = 'wf-note-badge';
        badge.textContent = '✏️';
        stepEl.appendChild(badge);
      }
    }else{
      if(badge) badge.remove();
    }
  });
}
