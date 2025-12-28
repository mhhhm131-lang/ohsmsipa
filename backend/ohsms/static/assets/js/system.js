// ======================================================
//  OHSMS SYSTEM AUTHORIZATION CORE
//  This file defines ROLES & PERMISSIONS for the whole system
//  ------------------------------------------------------
//  IMPORTANT:
//  - Permissions are GLOBAL and reusable across pages
//  - New permissions can be ADDED later (do not remove old ones)
//  - system_admin always has full access (*)
// ======================================================


// ======================================================
//  AUTH STORAGE KEYS
// ======================================================
const OHSMS_AUTH_KEY = 'ohsms_current_user';


// ======================================================
//  PERMISSIONS CATALOG (REFERENCE ONLY)
//  (Used by roles below – pages only CHECK permissions)
// ======================================================
/*
GENERAL ACCESS
- view_home
- view_dashboard
- view_reports
- view_risks
- view_awareness
- view_forms
- view_partners
- view_system

RISK MANAGEMENT
- view_public_risks
- add_public_risk
- view_private_risks_scoped
- add_private_risk
- approve_private_risk
- add_risk_notes_scoped
- add_risk_notes_global

REPORTS (INCIDENTS / COMPLAINTS)
- submit_report
- view_all_reports
- view_assigned_reports
- receive_report
- assign_report
- accept_assignment
- update_corrective_action
- add_report_notes_scoped
- add_report_notes_global
- close_report
- escalate_report

DIGITAL FORMS
- fill_assigned_forms
- review_forms
- assign_forms

AWARENESS
- manage_awareness

PARTNERS
- manage_partners

SYSTEM ADMIN
- manage_users
- manage_roles
- manage_system
*/


// ======================================================
//  ROLES DEFINITION
// ======================================================
const OHSMS_ROLES = {

  // --------------------------------------------------
  // SYSTEM ADMIN (Full Control – cannot be restricted)
  // --------------------------------------------------
  system_admin: {
    nameAr: "مدير النظام",
    permissions: ["*"]
  },

  // --------------------------------------------------
  // SYSTEM OPERATOR (Operational supervision)
  // --------------------------------------------------
  system_operator: {
    nameAr: "موظف النظام",
    permissions: [
      "view_home","view_dashboard","view_reports","view_risks",
      "view_awareness","view_forms","view_partners",

      "view_all_reports","receive_report","assign_report",
      "add_report_notes_global",

      "add_risk_notes_global",

      "assign_forms","manage_awareness"
    ]
  },

  // --------------------------------------------------
  // TOP MANAGEMENT
  // --------------------------------------------------
  top_management: {
    nameAr: "الإدارة العليا",
    permissions: [
      "view_home","view_dashboard","view_reports","view_risks",
      "view_awareness","view_forms",

      "view_all_reports",
      "add_report_notes_global",
      "add_risk_notes_global"
    ]
  },

  // --------------------------------------------------
  // OHS COMMITTEE
  // --------------------------------------------------
  ohs_committee: {
    nameAr: "لجنة السلامة والصحة المهنية",
    permissions: [
      "view_home","view_dashboard","view_reports","view_risks",
      "view_awareness","view_forms",

      "view_all_reports",
      "add_report_notes_global",
      "add_risk_notes_global",

      "add_public_risk",
      "escalate_report"
    ]
  },

  // --------------------------------------------------
  // MANAGERS (Branch / Department / Section)
  // --------------------------------------------------
  branch_manager: {
    nameAr: "مدير فرع",
    permissions: [
      "view_dashboard","view_reports","view_risks",

      "view_assigned_reports",
      "add_report_notes_scoped",
      "escalate_report",
      "close_report",

      "approve_private_risk",
      "add_risk_notes_scoped"
    ]
  },

  department_manager: {
    nameAr: "مدير إدارة",
    permissions: [
      "view_dashboard","view_reports","view_risks",

      "view_assigned_reports",
      "add_report_notes_scoped",
      "escalate_report",
      "close_report",

      "approve_private_risk",
      "add_risk_notes_scoped"
    ]
  },

  section_manager: {
    nameAr: "مدير قسم",
    permissions: [
      "view_dashboard","view_reports","view_risks",

      "view_assigned_reports",
      "add_report_notes_scoped",
      "escalate_report",
      "close_report",

      "approve_private_risk",
      "add_risk_notes_scoped"
    ]
  },

  // --------------------------------------------------
  // SAFETY COORDINATORS
  // --------------------------------------------------
  safety_coordinator: {
    nameAr: "منسق السلامة",
    permissions: [
      "view_dashboard","view_reports","view_risks",

      "view_assigned_reports",
      "accept_assignment",
      "assign_report",
      "add_report_notes_scoped",

      "add_private_risk",
      "add_risk_notes_scoped"
    ]
  },

  // --------------------------------------------------
  // EXECUTION STAFF (Corrective / Preventive Actions)
  // --------------------------------------------------
  safety_executor: {
    nameAr: "منفذ الإجراء",
    permissions: [
      "view_assigned_reports",
      "accept_assignment",
      "update_corrective_action",
      "add_report_notes_scoped",
      "close_report",
      "escalate_report"
    ]
  },

  // --------------------------------------------------
  // EMPLOYEE
  // --------------------------------------------------
  employee: {
    nameAr: "موظف",
    permissions: [
      "view_home","view_awareness","view_risks",
      "view_private_risks_scoped",

      "submit_report",
      "fill_assigned_forms"
    ]
  },

  // --------------------------------------------------
  // PARTNER / CUSTOMER
  // --------------------------------------------------
  partner: {
    nameAr: "عميل / شريك",
    permissions: [
      "view_home","view_awareness",
      "submit_report",
      "fill_assigned_forms"
    ]
  }
};


// ======================================================
//  DEFAULT USERS (Demo / Initial Access)
// ======================================================
const OHSMS_DEFAULT_USERS = [
  {username:"admin",     password:"1234", role:"system_admin"},
  {username:"operator",  password:"1234", role:"system_operator"},
  {username:"top",       password:"1234", role:"top_management"},
  {username:"committee", password:"1234", role:"ohs_committee"},
  {username:"manager",   password:"1234", role:"branch_manager"},
  {username:"coord",     password:"1234", role:"safety_coordinator"},
  {username:"exec",      password:"1234", role:"safety_executor"},
  {username:"employee",  password:"1234", role:"employee"},
  {username:"partner",   password:"1234", role:"partner"}
];


// ======================================================
//  AUTH HELPERS
// ======================================================
function ohsmsSetCurrentUser(user){
  if(user){
    sessionStorage.setItem(OHSMS_AUTH_KEY, JSON.stringify(user));
  }else{
    sessionStorage.removeItem(OHSMS_AUTH_KEY);
  }
}

function ohsmsGetCurrentUser(){
  try{
    return JSON.parse(sessionStorage.getItem(OHSMS_AUTH_KEY));
  }catch(e){
    return null;
  }
}

async function ohsmsLoadUsers(){
  return OHSMS_DEFAULT_USERS;
}


// ======================================================
//  PERMISSION CHECKER (USED BY ALL PAGES)
// ======================================================
function ohsmsHasPermission(permission){
  const user = ohsmsGetCurrentUser();
  if(!user) return false;

  const role = OHSMS_ROLES[user.role];
  if(!role) return false;

  // system_admin shortcut
  if(role.permissions.includes("*")) return true;

  return role.permissions.includes(permission);
}
// ======================================================
//  LOGIN HANDLER (GLOBAL)
// ======================================================
window.ohsmsHandleLogin = async function(form, lang){
  const usernameInput =
    form.querySelector('input[name="username"]') ||
    form.querySelector('#username');

  const passwordInput =
    form.querySelector('input[name="password"]') ||
    form.querySelector('#password');

  if(!usernameInput || !passwordInput){
    alert("حقول تسجيل الدخول غير مكتملة");
    return;
  }

  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  if(!username || !password){
    alert("الرجاء إدخال اسم المستخدم وكلمة المرور");
    return;
  }

  const users = await ohsmsLoadUsers();
  const user = users.find(
    u => u.username === username && u.password === password
  );

  if(!user){
    alert("اسم المستخدم أو كلمة المرور غير صحيحة");
    return;
  }

  // حفظ المستخدم في الجلسة
  ohsmsSetCurrentUser(user);

  // الانتقال للصفحة الرئيسية
location.href = "/";

};
