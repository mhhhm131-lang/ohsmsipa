/* ======================================================
   OHSMS SYSTEM JS (Django-Friendly, UI Only)
   - No JS redirects
   - CSRF-safe fetch helper (for Django)
   - Generic modal helpers
   - Safe stubs for legacy functions to avoid runtime errors
====================================================== */

(function () {
  "use strict";

  /* =========================
     CSRF Helpers (Django)
  ========================= */
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
  }

  // Wrapper for fetch that automatically sends CSRF token on unsafe methods
  window.ohsmsFetch = async function (url, options = {}) {
    const opts = { ...options };
    opts.headers = { ...(opts.headers || {}) };

    const method = (opts.method || "GET").toUpperCase();
    const unsafe = ["POST", "PUT", "PATCH", "DELETE"].includes(method);

    if (unsafe) {
      const token = getCookie("csrftoken");
      if (token) opts.headers["X-CSRFToken"] = token;
    }

    // Helps Django distinguish AJAX if needed
    opts.headers["X-Requested-With"] = opts.headers["X-Requested-With"] || "XMLHttpRequest";

    return fetch(url, opts);
  };

  /* =========================
     Generic Modal Helpers
  ========================= */
  window.ohsmsOpenModalById = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove("hidden");
  };

  window.ohsmsCloseModalById = function (id) {
    const el = document.getElementById(id);
    if (el) el.classList.add("hidden");
  };

  window.closeModal = function () {
    document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
  };

  /* =========================
     Auth / Permissions (No JS auth)
     - Keep as safe stubs only (do not enforce anything here)
  ========================= */
  window.ohsmsGetCurrentUser = function () {
    // Source of truth is Django session, not JS.
    // Keep null to avoid any fake/legacy logic.
    return null;
  };

  window.ohsmsHasPermission = function () {
    // Do NOT decide permissions in JS. Django controls access.
    // Returning true avoids breaking old UI that used to hide links.
    return true;
  };

window.ohsmsHandleLogin = function () {
  alert("يرجى استخدام صفحة تسجيل الدخول الرسمية للنظام.");
};

  // Optional: logout (UI only). If you have a Django logout url /logout/ it will work.
  window.ohsmsLogout = function () {
    // No redirects as a policy? This is a user-initiated navigation.
    // If you prefer: replace /logout/ with your actual logout route.
    window.location.href = "/logout/";
  };

  /* =========================
     Legacy Home Buttons (Deprecated)
     - We moved to real Django pages (incident_normal/secret/urgent).
     - Keep these to avoid runtime errors if old templates still call them.
  ========================= */
  window.openNormalModal = function () {
    alert("تم استبدال البلاغ العادي بصفحة مستقلة. استخدم زر/رابط: بلاغ عادي.");
  };

  window.openSecretModal = function () {
    // if old modal exists, open it; otherwise tell user
    const m = document.getElementById("modal-secret");
    if (m) m.classList.remove("hidden");
    else alert("تم استبدال البلاغ السري بصفحة مستقلة. استخدم رابط: بلاغ سري.");
  };

  window.openUrgentModal = function () {
    const m = document.getElementById("modal-urgent");
    if (m) m.classList.remove("hidden");
    else alert("تم استبدال البلاغ العاجل بصفحة مستقلة. استخدم رابط: بلاغ عاجل.");
  };

  /* =========================
     Secret Incident Submit (Optional / Safe)
     - Only works if you still use the old modal form.
     - Adds CSRF and handles JSON response safely.
  ========================= */
  window.submitSecret = async function () {
    const locEl = document.getElementById("s-location");
    const descEl = document.getElementById("s-desc");
    const reasonEl = document.getElementById("s-reason");

    if (!descEl || !reasonEl) {
      alert("هذه الصفحة لا تستخدم نموذج البلاغ السري داخل مودال.");
      return;
    }

    const location = (locEl?.value || "").trim();
    const description = descEl.value.trim();
    const reason = reasonEl.value.trim();

  if (!description || !reason) {
    alert("يرجى تعبئة وصف البلاغ وسبب اختيار البلاغ السري.");
    return;
  }

    try {
      const res = await window.ohsmsFetch("/incident/secret/", {
    method: "POST",
    headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
    },
    body: new URLSearchParams({
      title: location || "بلاغ سري",
      description: description,
      secrecy_reason: reason
    })
      });

      if (!res.ok) {
        // Django might return HTML on error; handle gracefully
        const txt = await res.text();
        console.error("Secret submit failed:", res.status, txt);
        alert("تعذر إرسال البلاغ السري. تأكد من CSRF ومسار الـ View.");
        return;
      }

      // Expect JSON with secret_key
      const data = await res.json();
      alert("تم إرسال البلاغ السري بنجاح ✅\nرمز المتابعة:\n" + (data.secret_key || "—"));
    closeModal();
    } catch (err) {
      console.error(err);
    alert("حدث خطأ أثناء إرسال البلاغ السري.");
}
  };

  /* =========================
     System Admin Page Stubs
     - Prevent console errors until we connect to Django APIs.
     - These only open/close modals. (No localStorage roles/users.)
  ========================= */
  window.ohsmsOpenAddUserModal = function () {
    window.ohsmsOpenModalById("addUserModal");
  };
  window.ohsmsCloseAddUserModal = function () {
    window.ohsmsCloseModalById("addUserModal");
  };
  window.ohsmsOpenEditUserModal = function () {
    window.ohsmsOpenModalById("editUserModal");
  };
  window.ohsmsCloseEditUserModal = function () {
    window.ohsmsCloseModalById("editUserModal");
  };

  window.ohsmsOpenAddRoleModal = function () {
    window.ohsmsOpenModalById("addRoleModal");
  };
  window.ohsmsCloseAddRoleModal = function () {
    window.ohsmsCloseModalById("addRoleModal");
  };
  window.ohsmsOpenEditRoleModal = function () {
    window.ohsmsOpenModalById("editRoleModal");
  };
  window.ohsmsCloseEditRoleModal = function () {
    window.ohsmsCloseModalById("editRoleModal");
  };

  // Placeholders (no-op) until backend endpoints exist
  window.ohsmsSaveNewUser = function () {
    alert("حفظ المستخدم: هذه الواجهة تحتاج ربطها بـ Django API (سنفعلها في الخطوة التالية).");
  };
  window.ohsmsSaveEditedUser = function () {
    alert("تعديل المستخدم: تحتاج ربطها بـ Django API.");
  };
  window.ohsmsSaveNewRole = function () {
    alert("حفظ الدور: تحتاج ربطها بـ Django API.");
  };
  window.ohsmsSaveEditedRole = function () {
    alert("تعديل صلاحيات الدور: تحتاج ربطها بـ Django API.");
  };

  window.ohsmsExportRoles = function () {
    alert("تصدير الأدوار: سيتم تفعيله بعد ربط Django API.");
  };
  window.ohsmsImportRoles = function () {
    // open file input if exists
    const f = document.getElementById("rolesImportFile");
    if (f) f.click();
    else alert("استيراد الأدوار: سيتم تفعيله بعد ربط Django API.");
  };
  window.ohsmsImportRolesFile = function () {
    alert("استيراد ملف الأدوار: سيتم تفعيله بعد ربط Django API.");
  };

})();
