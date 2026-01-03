// ======================================================
//  OHSMS SYSTEM CORE (CLEAN MODE)
//  ------------------------------------------------------
//  IMPORTANT:
//  - NO authentication
//  - NO authorization
//  - NO sessionStorage
//  - Django is the ONLY source of truth
// ======================================================


// ======================================================
//  LOGIN DISABLED (SECURITY NOTICE)
// ======================================================
window.ohsmsHandleLogin = function(){
  alert("تم إيقاف أي نظام دخول تجريبي. استخدم صفحة الدخول الرسمية للنظام.");
};
function openNormalModal() {
  if (!ohsmsGetCurrentUser()) {
    window.location.href = "/login/";
    return;
  }
  document.getElementById("modal-normal").classList.remove("hidden");
}

function openSecretModal() {
  document.getElementById("modal-secret").classList.remove("hidden");
}

function openUrgentModal() {
  document.getElementById("modal-urgent").classList.remove("hidden");
}

function closeModal() {
  document.querySelectorAll(".modal").forEach(m => m.classList.add("hidden"));
}
function submitSecret() {
  const location = document.getElementById("s-location").value;
  const description = document.getElementById("s-desc").value;
  const reason = document.getElementById("s-reason").value;

  if (!description || !reason) {
    alert("يرجى تعبئة وصف البلاغ وسبب السرية");
    return;
  }

  fetch("/api/incidents/secret/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-CSRFToken": getCSRFToken()
    },
    body: JSON.stringify({
      title: location || "بلاغ سري",
      description: description,
      secrecy_reason: reason
    })
  })
  .then(res => res.json())
  .then(data => {
    alert("تم إرسال البلاغ السري بنجاح\nرمز المتابعة: " + data.secret_key);
    closeModal();
  });
}
