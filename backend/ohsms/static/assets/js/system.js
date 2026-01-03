// ======================================================
//  OHSMS SYSTEM CORE (BACKEND MODE – SAFE VERSION)
// ======================================================
//  ✔ Django Backend هو المصدر الوحيد
//  ✔ لا LocalStorage
//  ✔ لا كود تجريبي
//  ✔ إصلاح زر البلاغ السري فقط
// ======================================================


// ===============================
//  LOGIN (للتوافق فقط)
// ===============================
window.ohsmsHandleLogin = function () {
  alert("يرجى استخدام صفحة تسجيل الدخول الرسمية للنظام.");
};


// ===============================
//  MODALS CONTROL
// ===============================
function openNormalModal() {
  // البلاغ العادي يتطلب تسجيل دخول
  window.location.href = "/login/";
}

function openSecretModal() {
  document.getElementById("modal-secret").classList.remove("hidden");
}

function openUrgentModal() {
  document.getElementById("modal-urgent").classList.remove("hidden");
}

function closeModal() {
  document.querySelectorAll(".modal")
    .forEach(m => m.classList.add("hidden"));
}


// ===============================
//  SUBMIT SECRET INCIDENT
// ===============================
function submitSecret() {
  const location = document.getElementById("s-location").value.trim();
  const description = document.getElementById("s-desc").value.trim();
  const reason = document.getElementById("s-reason").value.trim();

  if (!description || !reason) {
    alert("يرجى تعبئة وصف البلاغ وسبب اختيار البلاغ السري.");
    return;
  }

  fetch("/incident/secret/", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Requested-With": "XMLHttpRequest"
    },
    body: new URLSearchParams({
      title: location || "بلاغ سري",
      description: description,
      secrecy_reason: reason
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error("فشل الإرسال");
    }
    return response.json();
  })
  .then(data => {
    alert(
      "تم إرسال البلاغ السري بنجاح ✅\n" +
      "رمز المتابعة:\n" +
      data.secret_key
    );
    closeModal();
  })
  .catch(error => {
    console.error(error);
    alert("حدث خطأ أثناء إرسال البلاغ السري.");
  });
}


// ===============================
//  USER CHECK (لمنع أخطاء فقط)
// ===============================
function ohsmsGetCurrentUser() {
  return null;
}
