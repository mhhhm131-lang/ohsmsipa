function loadReports(){
  try {
    return JSON.parse(localStorage.getItem('reports') || '[]');
  } catch(e){
    return [];
  }
}

function saveReports(arr){
  localStorage.setItem('reports', JSON.stringify(arr));
}

function generateReportId(){
  const year = new Date().getFullYear();
  const list = loadReports();
  let max = 0;

  list.forEach(r => {
   if (String(r.id).startsWith(String(year))) {

      const p = r.id.split('-');
      if (p.length === 2) {
        const n = parseInt(p[1]);
        if (!isNaN(n) && n > max) max = n;
      }
    }
  });

  const next = max + 1;
  return year + '-' + String(next).padStart(4, '0');
}

function nowStr(){
  return new Date().toLocaleString();
}

function resetMsg(){
  const m = document.getElementById('homeMsg');
  if (m) m.textContent = '';
}

function openModal(type){
  resetMsg();
  document.getElementById('modal-' + type).classList.remove('hidden');
}

function openUrgent(){
  resetMsg();
  document.getElementById('modal-urgent').classList.remove('hidden');
}

function closeModal(){
  document.querySelectorAll('.modal')
    .forEach(m => m.classList.add('hidden'));
}

function submitNormal(){
  const desc = document.getElementById('n-desc').value.trim();
  if (!desc) {
    alert('الرجاء كتابة وصف البلاغ.');
    return;
  }

  const report = {
    id: generateReportId(),
    type: 'عادي',
    reporterName: document.getElementById('n-name').value.trim() || 'غير محدد',
    contact: document.getElementById('n-contact').value.trim() || 'غير محدد',
    location: document.getElementById('n-location').value.trim() || 'غير محدد',
    danger: document.getElementById('n-danger').value.trim() || '',
    desc: desc,
    reasonSecret: '',
    statusIndex: 0,
    status: 'تم إرسال البلاغ',
    createdAt: nowStr(),
    history: [{ action:'إدخال البلاغ (عادي)', note:'', at: nowStr() }],
    escalationLevel: 0
  };

  const list = loadReports();
  list.push(report);
  saveReports(list);

  closeModal();
  document.getElementById('homeMsg').textContent =
    'تم إرسال البلاغ بنجاح، رقم البلاغ: ' + report.id;

  ['n-name','n-contact','n-location','n-danger','n-desc']
    .forEach(id => document.getElementById(id).value = '');
}

function submitSecret(){
  const desc = document.getElementById('s-desc').value.trim();
  const reason = document.getElementById('s-reason').value.trim();

  if (!desc) {
    alert('الرجاء كتابة وصف البلاغ.');
    return;
  }
  if (!reason) {
    alert('الرجاء توضيح سبب اختيار البلاغ السري.');
    return;
  }

  const report = {
    id: generateReportId(),
    type: 'سري',
    reporterName: 'سري / غير معلن',
    contact: 'غير متاح (بلاغ سري)',
    location: document.getElementById('s-location').value.trim() || 'غير محدد',
    danger: '',
    desc: desc,
    reasonSecret: reason,
    statusIndex: 0,
    status: 'تم إرسال البلاغ',
    createdAt: nowStr(),
    history: [{ action:'إدخال البلاغ (سري)', note:'', at: nowStr() }],
    escalationLevel: 0
  };

  const list = loadReports();
  list.push(report);
  saveReports(list);

  closeModal();
  document.getElementById('homeMsg').textContent =
    'تم إرسال البلاغ السري بنجاح، رقم البلاغ: ' + report.id;

  ['s-location','s-desc','s-reason']
    .forEach(id => document.getElementById(id).value = '');
}

function submitUrgent(){
  const report = {
    id: generateReportId(),
    type: 'عاجل',
    reporterName: 'غير محدد',
    contact: 'يتم التواصل فوراً (بلاغ عاجل)',
    location: 'غير محدد',
    danger: '',
    desc: 'بلاغ عاجل تم إدخاله من الواجهة الرئيسية.',
    reasonSecret: '',
    statusIndex: 0,
    status: 'تم إرسال البلاغ',
    createdAt: nowStr(),
    history: [{ action:'تسجيل بلاغ عاجل', note:'', at: nowStr() }],
    escalationLevel: 0
  };

  const list = loadReports();
  list.push(report);
  saveReports(list);

  closeModal();
  document.getElementById('homeMsg').textContent =
    'تم تسجيل بلاغ عاجل بنجاح، رقم البلاغ: ' + report.id;
}
// ===============================
// Workflow – Step Notes
// ===============================

function saveCurrentStepNote(reportId, stepIndex, noteText) {
  if (!reportId || stepIndex === undefined) {
    console.error("Invalid parameters for saveCurrentStepNote");
    return;
  }

  const reports = JSON.parse(localStorage.getItem("ohsms_reports") || "[]");

  const report = reports.find(r => r.id === reportId);
  if (!report) {
    console.error("Report not found:", reportId);
    return;
  }

  if (!report.workflow) {
    report.workflow = [];
  }

  if (!report.workflow[stepIndex]) {
    report.workflow[stepIndex] = {};
  }

  report.workflow[stepIndex].note = noteText;
  report.workflow[stepIndex].updatedAt = new Date().toISOString();

  localStorage.setItem("ohsms_reports", JSON.stringify(reports));
}
