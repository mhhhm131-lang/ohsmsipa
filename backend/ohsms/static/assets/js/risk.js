/* =========================
   Local Storage Helpers
========================= */
function loadRisks() {
  try {
    return JSON.parse(localStorage.getItem('ohsms_risks') || '[]');
  } catch (e) {
    return [];
  }
}

function saveRisks(arr) {
  localStorage.setItem('ohsms_risks', JSON.stringify(arr));
}

function generateRiskId() {
  const year = new Date().getFullYear();
  const all = loadRisks();
  const nums = all
    .filter(r => r.id && String(r.id).startsWith('RISK-' + year))
    .map(r => parseInt(String(r.id).split('-').pop() || '0', 10) || 0);

  const next = (nums.length ? Math.max.apply(null, nums) : 0) + 1;
  return 'RISK-' + year + '-' + String(next).padStart(4, '0');
}

/* =========================
   Risk Rating
========================= */
function calcRating() {
  const s = parseInt(document.getElementById('severity').value || '0', 10);
  const l = parseInt(document.getElementById('likelihood').value || '0', 10);
  const r = (s > 0 && l > 0) ? s * l : '';
  document.getElementById('rating').value = r;
}

/* =========================
   Render Tables
========================= */
function renderTables() {
  const data = loadRisks();

  const pubBody = document.querySelector('#publicRisksTable tbody');
  const prvBody = document.querySelector('#privateRisksTable tbody');

  pubBody.innerHTML = '';
  prvBody.innerHTML = '';

  const pub = data.filter(r => !r.isPrivate);
  const prv = data.filter(r => r.isPrivate && r.status === 'approved');

  document.getElementById('publicEmpty').style.display = pub.length ? 'none' : 'block';
  document.getElementById('privateEmpty').style.display = prv.length ? 'none' : 'block';

  pub.forEach(r => {
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td>${r.id}</td>
      <td>${r.mainCategory || ''}</td>
      <td>${r.subCategory || ''}</td>
      <td><button class="btn btn-small" onclick="openModal('مسببات الخطر','${escapeHtml(r.hazardCause)}')">🔍 عرض</button></td>
      <td><button class="btn btn-small" onclick="openModal('المتأثرون','${escapeHtml(r.affected)}')">👥 عرض</button></td>
      <td>${r.likelihood || ''}</td>
      <td>${r.severity || ''}</td>
   <td>
  <span class="risk-badge ${
    r.rating >= 12 ? 'risk-high' :
    r.rating >= 6  ? 'risk-medium' :
                     'risk-low'
        }">${r.rating}</span>
    </td>
      <td><button class="btn btn-small" onclick="openModal('الإجراء التصحيحي','${escapeHtml(r.correctiveAction)}')">🔧 عرض</button></td>
      <td><button class="btn btn-small" onclick="openModal('الإجراء الوقائي','${escapeHtml(r.preventiveAction)}')">🛡️ عرض</button></td>
      <td>${r.ownerDept || ''}</td>
      <td>${r.ownerPerson || ''}</td>
      <td><button class="btn btn-small" onclick="openModal('قناة التواصل','${escapeHtml(r.channel)}')">📞 عرض</button></td>
  `;
  pubBody.appendChild(tr);
});

  prv.forEach(r => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${r.id}</td>
      <td>${r.branch || ''}</td>
      <td>${r.department || ''}</td>
      <td>${r.section || ''}</td>
      <td>${r.mainCategory || ''}</td>
      <td>${r.subCategory || ''}</td>
      <td>${r.hazardCause || ''}</td>
      <td>${r.severity || ''}</td>
      <td>${r.likelihood || ''}</td>
      <td>${r.rating || ''}</td>
      <td>${r.ownerDept || ''}</td>
      <td>${r.ownerPerson || ''}</td>
      <td>${r.channel || ''}</td>
      <td>${r.notes || ''}</td>
    `;
    prvBody.appendChild(tr);
  });
}

/* =========================
   Pending Risks (UI only)
========================= */
function renderPendingRisks() {
  const body = document.querySelector('#pendingRisksTable tbody');
  if (!body) return;

  body.innerHTML = '';

  loadRisks()
    .filter(r => r.isPrivate && r.status === 'pending')
    .forEach(r => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${r.id}</td>
        <td>${r.branch}</td>
        <td>${r.department}</td>
        <td>${r.section}</td>
        <td>${r.mainCategory}</td>
        <td>${r.rating}</td>
        <td>
          <button class="btn btn-small btn-primary" onclick="approveRisk('${r.id}')">اعتماد</button>
          <button class="btn btn-small btn-secondary" onclick="rejectRisk('${r.id}')">رفض</button>
        </td>
      `;
      body.appendChild(tr);
    });
}

function approveRisk(id) {
  const data = loadRisks();
  const r = data.find(x => x.id === id);
  if (!r) return;

  r.status = 'approved';
  r.approvedAt = new Date().toISOString();

  saveRisks(data);
  renderTables();
  renderPendingRisks();
}

function rejectRisk(id) {
  const data = loadRisks();
  const r = data.find(x => x.id === id);
  if (!r) return;

  r.status = 'rejected';
  saveRisks(data);
  renderPendingRisks();
}

/* =========================
   Utilities
========================= */
function escapeHtml(text) {
  if (!text) return '—';
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* =========================
   Global Modal
========================= */
window.openModal = function (title, content) {
  const modal = document.getElementById('riskModal');
  document.getElementById('modalTitle').textContent = title || '';
  document.getElementById('modalContent').textContent = content || '—';
  modal.classList.remove('hidden');
};

window.closeModal = function () {
  const modal = document.getElementById('riskModal');
  modal.classList.add('hidden');
};

/* =========================
   DOM Ready
========================= */
document.addEventListener('DOMContentLoaded', function () {

  document.getElementById('severity').addEventListener('input', calcRating);
  document.getElementById('likelihood').addEventListener('input', calcRating);
  calcRating();

  document.getElementById('riskForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const isPrivate = document.querySelector('input[name="privacy"]:checked').value === 'private';

    const record = {
      id: generateRiskId(),
      branch: branch.value.trim(),
      department: department.value.trim(),
      section: section.value.trim(),
      mainCategory: mainCategory.value.trim(),
      subCategory: subCategory.value.trim(),
      hazardCause: hazardCause.value.trim(),
      severity: +severity.value,
      likelihood: +likelihood.value,
      rating: rating.value,
      affected: affected.value.trim(),
      preventiveAction: preventiveAction.value.trim(),
      correctiveAction: correctiveAction.value.trim(),
      ownerDept: ownerDept.value.trim(),
      ownerPerson: ownerPerson.value.trim(),
      channel: channel.value.trim(),
      notes: notes.value.trim(),
      isPrivate,
      status: isPrivate ? 'pending' : 'approved',
      createdAt: new Date().toISOString()
    };

    const arr = loadRisks();
    arr.push(record);
    saveRisks(arr);

    riskMsg.textContent = isPrivate
      ? '✔ تم حفظ الخطر وبانتظار الاعتماد.'
      : '✔ تم حفظ الخطر بنجاح.';

    setTimeout(() => riskMsg.textContent = '', 3000);
    e.target.reset();
    renderTables();
    renderPendingRisks();
  });

  renderTables();
  renderPendingRisks();
});
