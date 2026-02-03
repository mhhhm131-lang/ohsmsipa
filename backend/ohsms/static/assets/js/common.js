/* ===============================
   OHSMS – Common Utilities
   مسؤول عن:
   - تخزين البلاغات
   - إنشاء رقم البلاغ
   - مودالات الصفحة الرئيسية
================================ */

/* ========= Storage ========= */

const REPORTS_KEY = 'ohsms_reports';

function loadReports() {
  try {
    return JSON.parse(localStorage.getItem(REPORTS_KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function saveReports(arr) {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(arr));
}

/* ========= Helpers ========= */

function generateReportId() {
  const year = new Date().getFullYear();
  const list = loadReports();
  let max = 0;

  list.forEach(r => {
    if (String(r.id || '').startsWith(String(year))) {
      const p = r.id.split('-');
      if (p.length === 2) {
        const n = parseInt(p[1], 10);
        if (!isNaN(n) && n > max) max = n;
      }
    }
  });

  return year + '-' + String(max + 1).padStart(4, '0');
}

function nowStr() {
  return new Date().toLocaleString();
}

/* ========= UI ========= */

function resetMsg() {
  const m = document.getElementById('homeMsg');
  if (m) m.textContent = '';
}

function openModal(type) {
  resetMsg();
  const modal = document.getElementById('modal-' + type);
  if (modal) modal.classList.remove('hidden');
}

function closeModal() {
  document.querySelectorAll('.modal')
    .forEach(m => m.classList.add('hidden'));
}

/* ========= Submissions ========= */

// بلاغ عادي
function submitNormal() {
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
    desc,
    statusIndex: 0,
    status: 'تم إرسال البلاغ',
    createdAt: nowStr(),
    history: [{
      action: 'إدخال البلاغ (عادي)',
      note: '',
      at: nowStr()
    }],
    escalationLevel: 0,
    stepNotes: []
  };

  const list = loadReports();
  list.push(report);
  saveReports(list);

  closeModal();
  document.getElementById('homeMsg').textContent =
    'تم إرسال البلاغ بنجاح، رقم البلاغ: ' + report.id;

  ['n-name', 'n-contact', 'n-location', 'n-danger', 'n-desc']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
}

// بلاغ سري
function submitSecret() {
  const desc = document.getElementById('s-desc').value.trim();
  const reason = document.getElementById('s-reason').value.trim();

  if (!desc || !reason) {
    alert('الرجاء تعبئة جميع الحقول المطلوبة.');
    return;
  }

  const report = {
    id: generateReportId(),
    type: 'سري',
    reporterName: 'غير معلن',
    contact: 'غير متاح',
    location: document.getElementById('s-location').value.trim() || 'غير محدد',
    danger: '',
    desc,
    reasonSecret: reason,
    statusIndex: 0,
    status: 'تم إرسال البلاغ',
    createdAt: nowStr(),
    history: [{
      action: 'إدخال البلاغ (سري)',
      note: '',
      at: nowStr()
    }],
    escalationLevel: 0,
    stepNotes: []
  };

  const list = loadReports();
  list.push(report);
  saveReports(list);

  closeModal();
  document.getElementById('homeMsg').textContent =
    'تم إرسال البلاغ السري بنجاح، رقم البلاغ: ' + report.id;

  ['s-location', 's-desc', 's-reason']
    .forEach(id => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
}

// بلاغ عاجل
function submitUrgent() {
  const report = {
    id: generateReportId(),
    type: 'عاجل',
    reporterName: 'غير محدد',
    contact: 'بلاغ عاجل',
    location: 'غير محدد',
    danger: '',
    desc: 'بلاغ عاجل تم إدخاله من الواجهة الرئيسية.',
    statusIndex: 0,
    status: 'تم إرسال البلاغ',
    createdAt: nowStr(),
    history: [{
      action: 'تسجيل بلاغ عاجل',
      note: '',
      at: nowStr()
    }],
    escalationLevel: 0,
    stepNotes: []
  };

  const list = loadReports();
  list.push(report);
  saveReports(list);

  closeModal();
  document.getElementById('homeMsg').textContent =
    'تم تسجيل بلاغ عاجل بنجاح، رقم البلاغ: ' + report.id;
}
