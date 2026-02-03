/* =========================
   OHSMS Dashboard JS
   UI only – no auth, no redirects
========================= */

(function () {

  /**
   * نحاول قراءة بيانات dashboard التي يمررها Django
   * نتوقع أنها JSON أو dict مطبوع داخل <pre>
   */
  function parseDashboardData() {
    const pre = document.querySelector('pre');
    if (!pre) return null;

    const raw = pre.textContent.trim();
    if (!raw) return null;

    try {
      // محاولة JSON
      return JSON.parse(raw);
    } catch (e) {
      // ليست JSON – نرجعها كنص
      return raw;
    }
}

  function renderSummary(data) {
    if (!data || typeof data !== 'object') return;

    const container = document.createElement('div');
    container.className = 'grid-3';
    container.style.marginBottom = '16px';

    Object.keys(data).forEach(key => {
      const box = document.createElement('div');
      box.className = 'info-box';
      box.innerHTML = `
        <strong>${key}</strong>
        <p>${data[key]}</p>
      `;
      container.appendChild(box);
  });

    const content = document.querySelector('.content');
    if (content) {
      content.insertBefore(container, content.firstChild);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    const data = parseDashboardData();

    // إذا كانت بيانات منظمة (dict / JSON)
    if (data && typeof data === 'object') {
      renderSummary(data);
    }

    // وإلا نترك العرض الخام داخل <pre>
  });

})();
