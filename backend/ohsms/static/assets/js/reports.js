// ============================
// Global State
// ============================
let currentReportId = null;
let currentStepIndex = null;
let currentStepReport = null;

// ============================
// Workflow Steps
// ============================
const WF_STEPS = [
  'تم إرسال البلاغ',
  'استلام موظف السلامة',
  'إحالة إلى الإدارة',
  'استلام الإحالة',
  'تحويل للميداني',
  'جاري العمل',
  'تم التنفيذ',
  'إغلاق البلاغ'
];

// ============================
// Data Access (Mock – UI Only)
// ============================
function loadReports() {
  try {
    return JSON.parse(localStorage.getItem('ohsms_reports') || '[]');
  } catch {
    return [];
  }
}

function saveReports(list) {
  localStorage.setItem('ohsms_reports', JSON.stringify(list));
}

function getAllReports() {
  return loadReports();
}

function getReportById(id) {
  return getAllReports().find(r => r.id === id);
}

function updateReport(rep) {
  const list = getAllReports();
  const i = list.findIndex(r => r.id === rep.id);
  if (i !== -1) {
    list[i] = rep;
    saveReports(list);
  }
}

// ============================
// Table Rendering
// ============================
function renderReportsTable() {
  const el = document.getElementById('reports-table');
  const reports = getAllReports();

  if (!reports.length) {
    el.innerHTML = '<p class="hint">لا توجد بلاغات.</p>';
    return;
  }

  let html = `
    <table class="reports">
      <thead>
        <tr>
          <th>رقم</th><th>النوع</th><th>الموقع</th>
          <th>التاريخ</th><th>الحالة</th><th></th>
        </tr>
      </thead><tbody>
  `;

  reports.forEach(r => {
    html += `
      <tr>
        <td>${r.id}</td>
        <td>${r.type || '-'}</td>
        <td>${r.location || '-'}</td>
        <td>${r.createdAt || '-'}</td>
        <td>${WF_STEPS[r.statusIndex || 0]}</td>
        <td>
          <button onclick="openReportModal('${r.id}')">إدارة</button>
        </td>
      </tr>
    `;
  });

  html += '</tbody></table>';
  el.innerHTML = html;
}

// ============================
// Modal Control
// ============================
function openReportModal(id) {
  const r = getReportById(id);
  if (!r) return;

  currentReportId = id;
  currentStepReport = r;

  document.getElementById('infoId').textContent = r.id;
  document.getElementById('infoType').textContent = r.type || '-';
  document.getElementById('infoCreated').textContent = r.createdAt || '-';
  document.getElementById('infoLocation').textContent = r.location || '-';
  document.getElementById('infoContact').textContent = r.contact || '-';
  document.getElementById('infoDesc').textContent = r.desc || '-';

  buildTimeline(r);
  document.getElementById('reportModal').classList.remove('hidden');
  }

function closeReportModal() {
  document.getElementById('reportModal').classList.add('hidden');
}

// ============================
// Timeline
// ============================
function buildTimeline(report) {
  const el = document.getElementById('timeline-modal');
  el.innerHTML = '';

  report.stepNotes = report.stepNotes || [];

  WF_STEPS.forEach((title, i) => {
    const step = document.createElement('div');
step.className = 'step';
    if (i === report.statusIndex) step.classList.add('active');
    if (i < report.statusIndex) step.classList.add('done');

    step.innerHTML = `
  <div class="step-title">${title}</div>
      ${report.stepNotes[i] ? `<div class="step-note">${report.stepNotes[i]}</div>` : ''}
`;

    step.onclick = () => openStepNoteModal(i, title, report);
    el.appendChild(step);
  });
}

// ============================
// Step Notes
// ============================
function openStepNoteModal(index, title, report) {
  currentStepIndex = index;
  currentStepReport = report;
  document.getElementById('stepNoteTitle').textContent = title;
  document.getElementById('stepNoteTextarea').value =
    report.stepNotes[index] || '';
  document.getElementById('stepNoteModal').classList.remove('hidden');
}

function closeStepNoteModal() {
  document.getElementById('stepNoteModal').classList.add('hidden');
}

function saveStepNote() {
  const text = document.getElementById('stepNoteTextarea').value.trim();
  if (!currentStepReport) return;
  currentStepReport.stepNotes[currentStepIndex] = text;
  updateReport(currentStepReport);
  buildTimeline(currentStepReport);
  closeStepNoteModal();
  }

// ============================
// Actions
// ============================
function applyAction(targetIndex, label) {
  const r = currentStepReport;
  if (!r) return;

  if (targetIndex > (r.statusIndex || 0)) {
    r.statusIndex = targetIndex;
  }

  r.history = r.history || [];
  r.history.push({ action: label, at: new Date().toLocaleString() });

  updateReport(r);
  renderReportsTable();
  openReportModal(r.id);
}

function actionReceive() { applyAction(1, 'استلام البلاغ'); }
function actionAssign() { applyAction(2, 'إحالة البلاغ'); }
function actionForward() { applyAction(5, 'تحويل للميداني'); }
function actionDone() { applyAction(6, 'تنفيذ الإجراء'); }
function actionCloseCase() { applyAction(7, 'إغلاق البلاغ'); }
function actionEscalate() { alert('تم تسجيل التصعيد'); }

// ============================
// Init
// ============================
document.addEventListener('DOMContentLoaded', renderReportsTable);
