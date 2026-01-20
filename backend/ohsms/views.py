from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q
import json

from ohsms.models import Incident, IncidentEvent, Risk, Branch, Department, Section
from ohsms.services.IncidentService import IncidentService
from ohsms.services.audit_log import AuditLogService
from ohsms.services.permissions import PermissionService


# =========================
# Helpers
# =========================

def require_roles(request, allowed_roles, forbidden_message):
    """
    توحيد التحقق من الصلاحيات عبر RBAC فقط (UserRole مصدر الحقيقة الوحيد).
    - لا يوجد UserProfile fallback
    """
    # السماح المطلق للسوبر يوزر
    if request.user.is_superuser:
        return None

    for role_code in allowed_roles:
        if PermissionService.has_role(request.user, role_code):
            return None

    return render(
        request,
        "ohsms/403.html",
        {"message": forbidden_message},
        status=403
    )


# =========================
# Auth
# =========================

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username", "").strip()
        password = request.POST.get("password", "")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)

            try:
                AuditLogService.log(
                    user=user,
                    action="login",
                    model_name="User",
                    object_id=user.id,
                    description="تسجيل دخول المستخدم",
                    ip_address=request.META.get("REMOTE_ADDR")
                )
            except Exception:
                pass

            if user.is_superuser:
                return redirect("/system/")

            return redirect("/dashboard/")

        messages.error(request, "اسم المستخدم أو كلمة المرور غير صحيحة")

    return render(request, "ohsms/login.html")


def logout_view(request):
    if request.user.is_authenticated:
        try:
            AuditLogService.log(
                user=request.user,
                action="logout",
                model_name="User",
                object_id=request.user.id,
                description="تسجيل خروج المستخدم",
                ip_address=request.META.get("REMOTE_ADDR")
            )
        except Exception:
            pass

    logout(request)
    return redirect("/login/")


# =========================
# Incidents
# =========================

@login_required(login_url="/login/")
def normal_incident(request):
    """
    إنشاء بلاغ عادي (مبلّغ معروف)
    مربوط بـ IncidentService
    """
    branches = Branch.objects.all()
    departments = Department.objects.all()
    sections = Section.objects.all()

    if request.method == "POST":
        title = request.POST.get("title", "").strip()
        description = request.POST.get("description", "").strip()

        branch_id = request.POST.get("branch")
        department_id = request.POST.get("department")
        section_id = request.POST.get("section")

        if not all([title, description, branch_id, department_id, section_id]):
            return render(
                request,
                "ohsms/incident_normal.html",
                {
                    "branches": branches,
                    "departments": departments,
                    "sections": sections,
                    "error": "يرجى تعبئة جميع الحقول المطلوبة",
                }
            )

        incident = IncidentService.create_normal_incident(
            user=request.user,
            title=title,
            description=description,
            branch_id=branch_id,
            department_id=department_id,
            section_id=section_id,
        )

        return render(
            request,
            "ohsms/incident_normal.html",
            {
                "branches": branches,
                "departments": departments,
                "sections": sections,
                "success": True,
                "incident": incident,
            }
        )

    return render(
        request,
        "ohsms/incident_normal.html",
        {
            "branches": branches,
            "departments": departments,
            "sections": sections,
        }
    )


@login_required(login_url="/login/")
def secret_incident(request):
    """
    إنشاء بلاغ سري (مجهول الهوية)
    مربوط بـ IncidentService
    """
    branches = Branch.objects.all()

    if request.method == "POST":
        title = request.POST.get("title", "").strip()
        description = request.POST.get("description", "").strip()
        secrecy_reason = request.POST.get("secrecy_reason", "").strip()

        incident, secret_key = IncidentService.create_secret_incident(
            title=title,
            description=description,
            secrecy_reason=secrecy_reason,
        )

        return render(
            request,
            "ohsms/incident_secret.html",
            {
                "branches": branches,
                "success": True,
                "secret_key": secret_key,
            }
        )

    return render(
        request,
        "ohsms/incident_secret.html",
        {
            "branches": branches,
        }
    )


@login_required(login_url="/login/")
def urgent_incident(request):
    """
    إنشاء بلاغ عاجل
    مربوط بـ IncidentService
    """
    branches = Branch.objects.all()
    departments = Department.objects.all()
    sections = Section.objects.all()

    if request.method == "POST":
        title = request.POST.get("title", "").strip()
        description = request.POST.get("description", "").strip()

        branch_id = request.POST.get("branch")
        department_id = request.POST.get("department")
        section_id = request.POST.get("section")

        if not all([title, description, branch_id, department_id, section_id]):
            return render(
                request,
                "ohsms/incident_urgent.html",
                {
                    "branches": branches,
                    "departments": departments,
                    "sections": sections,
                    "error": "يرجى تعبئة جميع الحقول المطلوبة",
                }
            )

        incident = IncidentService.create_urgent_incident(
            system_user=request.user,
            title=title,
            description=description,
            branch=Branch.objects.get(id=branch_id),
            department=Department.objects.get(id=department_id),
            section=Section.objects.get(id=section_id),
        )

        return render(
            request,
            "ohsms/incident_urgent.html",
            {
                "branches": branches,
                "departments": departments,
                "sections": sections,
                "success": True,
                "incident": incident,
            }
        )

    return render(
        request,
        "ohsms/incident_urgent.html",
        {
            "branches": branches,
            "departments": departments,
            "sections": sections,
        }
    )


# =========================
# Reports
# =========================

@login_required(login_url="/login/")
def reports_view(request):
    denied = require_roles(
        request,
        [
            "system_admin",
            "system_staff",
            "safety_committee",
            "branch_manager",
            "department_manager",
            "section_manager",
            "safety_coordinator",
        ],
        "غير مخوّل للاطلاع على سجل البلاغات"
    )
    if denied:
        return denied

    user = request.user

    # Global يشوف كل شيء
    if PermissionService.is_global(user):
        qs = Incident.objects.all()
    else:
        scopes = PermissionService.get_user_scopes(user)

        q = Q()
        for ur in scopes:
            if getattr(ur, "section_id", None):
                q |= Q(section_id=ur.section_id)
            elif getattr(ur, "department_id", None):
                q |= Q(department_id=ur.department_id)
            elif getattr(ur, "branch_id", None):
                q |= Q(branch_id=ur.branch_id)
            else:
                q = Q()
                break

        qs = Incident.objects.filter(q) if q else Incident.objects.none()

    incidents = (
        qs.select_related("branch", "department", "section", "risk")
          .prefetch_related("events")
          .order_by("-created_at")
    )

    return render(request, "ohsms/reports.html", {"incidents": incidents})


# =========================
# Risk / Forms / Dashboard / System
# =========================

@login_required(login_url="/login/")
def risk_view(request):
    denied = require_roles(
        request,
        [
            "system_admin",
            "system_staff",
            "safety_committee",
            "branch_manager",
            "department_manager",
            "section_manager",
            "safety_coordinator",
        ],
        "غير مخوّل للوصول إلى إدارة المخاطر"
    )
    if denied:
        return denied
    return render(request, "ohsms/risk.html")


@login_required(login_url="/login/")
def forms_view(request):
    return render(request, "ohsms/forms.html")


@login_required(login_url="/login/")
def dashboard_view(request):
    from ohsms.services.dashboard import DashboardService

    full = request.GET.get("full") == "1"
    if not full:
        data = {"note": "Dashboard light mode. Append ?full=1 for full snapshot."}
        return render(request, "ohsms/dashboard.html", {"dashboard": data})

    try:
        # ✅ مهم: تمرير المستخدم حتى تُطبق scopes داخل DashboardService
        dashboard_data = DashboardService.dashboard_snapshot(user=request.user)
    except Exception as e:
        dashboard_data = {"error": str(e)}

    return render(request, "ohsms/dashboard.html", {"dashboard": dashboard_data})


@login_required(login_url="/login/")
def system_view(request):
    denied = require_roles(
        request,
        ["system_admin", "system_staff"],
        "غير مخوّل للوصول إلى إدارة النظام"
    )
    if denied:
        return denied
    return render(request, "ohsms/admin.html")


# =========================
# AJAX
# =========================

@login_required(login_url="/login/")
def get_departments(request):
    departments = Department.objects.filter(branch_id=request.GET.get("branch_id"))
    return JsonResponse(
        [{"id": d.id, "name": d.name} for d in departments],
        safe=False
    )


@login_required(login_url="/login/")
def get_sections(request):
    sections = Section.objects.filter(department_id=request.GET.get("department_id"))
    return JsonResponse(
        [{"id": s.id, "name": s.name} for s in sections],
        safe=False
    )


# =========================
# API
# =========================

@csrf_exempt
def api_create_secret_incident(request):
    if request.method != "POST":
        return JsonResponse({"error": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body.decode("utf-8"))

        description = data.get("description")
        secrecy_reason = data.get("secrecy_reason")

        if not description or not secrecy_reason:
            return JsonResponse({"error": "البيانات غير مكتملة"}, status=400)

        incident, secret_key = IncidentService.create_secret_incident(
            title="بلاغ سري",
            description=description,
            secrecy_reason=secrecy_reason
        )

        return JsonResponse({"success": True, "secret_key": secret_key})

    except json.JSONDecodeError:
        return JsonResponse({"error": "صيغة البيانات غير صحيحة"}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)


# =========================
# Secret Incident Tracking
# =========================

def secret_track(request):
    incident = None
    error = None
    closed = False

    if request.method == "POST":
        key = request.POST.get("secret_key")

        try:
            incident = Incident.objects.prefetch_related("events").get(
                secret_key=key,
                incident_type="secret"
            )
            if incident.status == "closed":
                closed = True
        except Incident.DoesNotExist:
            error = "مفتاح المتابعة غير صحيح"

    return render(
        request,
        "ohsms/incident_secret_track.html",
        {"incident": incident, "error": error, "closed": closed}
    )


# =========================
# Incidents Dashboard (System Staff)
# =========================

@login_required(login_url="/login/")
def incidents_dashboard(request):
    incidents = (
        Incident.objects
        .select_related("branch", "department", "section")
        .order_by("-created_at")
    )

    return render(
        request,
        "ohsms/incidents_dashboard.html",
        {"incidents": incidents}
    )


@login_required(login_url="/login/")
def incident_detail_dashboard(request, incident_id):
    incident = (
        Incident.objects
        .select_related("branch", "department", "section")
        .prefetch_related("events")
        .get(id=incident_id)
    )

    events = incident.events.order_by("created_at")

    users = User.objects.all()
    risks = Risk.objects.all()

    return render(
        request,
        "ohsms/incident_detail_dashboard.html",
        {
            "incident": incident,
            "events": events,
            "users": users,
            "risks": risks,
        }
    )


@login_required(login_url="/login/")
def incident_receive(request, incident_id):
    incident = get_object_or_404(Incident, id=incident_id)

    try:
        IncidentService.receive_incident(
            incident=incident,
            actor=request.user,
        )
        messages.success(request, "تم استلام البلاغ بنجاح")
    except Exception as e:
        messages.error(request, str(e))

    return redirect("incident_detail_dashboard", incident_id=incident.id)


@login_required(login_url="/login/")
def incident_add_note(request, incident_id):
    incident = get_object_or_404(Incident, id=incident_id)

    if request.method == "POST":
        note = request.POST.get("note", "").strip()

        if note:
            IncidentService.add_note(
                incident=incident,
                actor=request.user,
                note=note,
            )
            messages.success(request, "تمت إضافة الملاحظة")
        else:
            messages.error(request, "الملاحظة لا يمكن أن تكون فارغة")

    return redirect("incident_detail_dashboard", incident_id=incident.id)


@login_required(login_url="/login/")
def assign_incident(request, incident_id):
    if request.method != "POST":
        return redirect("/dashboard/incidents/")

    incident = get_object_or_404(Incident, id=incident_id)

    assignee_id = request.POST.get("assignee")
    note = request.POST.get("note", "").strip()

    if not assignee_id:
        messages.error(request, "يجب اختيار مستخدم للإحالة")
        return redirect(f"/dashboard/incidents/{incident.id}/")

    assignee = get_object_or_404(User, id=assignee_id)

    IncidentEvent.objects.create(
        incident=incident,
        action="assign",
        from_status=incident.status,
        to_status=incident.status,
        actor=request.user.username,
        note=f"تمت الإحالة إلى {assignee.username}. {note}",
    )

    AuditLogService.log(
        user=request.user,
        action="assign",
        model_name="Incident",
        object_id=incident.id,
        description=f"إحالة البلاغ إلى {assignee.username}",
    )

    messages.success(request, "تمت إحالة البلاغ بنجاح")
    return redirect(f"/dashboard/incidents/{incident.id}/")


@login_required(login_url="/login/")
def incident_start_progress(request, incident_id):
    if request.method != "POST":
        return redirect("/dashboard/incidents/")

    incident = get_object_or_404(Incident, id=incident_id)

    try:
        IncidentService.change_status(
            incident=incident,
            new_status="in_progress",
            actor=request.user,
            note="تم بدء معالجة البلاغ",
        )
        messages.success(request, "تم تحويل البلاغ إلى قيد المعالجة")
    except Exception as e:
        messages.error(request, str(e))

    return redirect("incident_detail_dashboard", incident_id=incident.id)


@login_required(login_url="/login/")
def incident_close(request, incident_id):
    if request.method != "POST":
        return redirect("/dashboard/incidents/")

    incident = get_object_or_404(Incident, id=incident_id)
    note = request.POST.get("note", "").strip()

    try:
        IncidentService.change_status(
            incident=incident,
            new_status="closed",
            actor=request.user,
            note=note or "تم إغلاق البلاغ",
        )
        messages.success(request, "تم إغلاق البلاغ بنجاح")
    except Exception as e:
        messages.error(request, str(e))

    return redirect("incident_detail_dashboard", incident_id=incident.id)


@login_required(login_url="/login/")
def incident_escalate(request, incident_id):
    if request.method != "POST":
        return redirect("/dashboard/incidents/")

    incident = get_object_or_404(Incident, id=incident_id)
    note = request.POST.get("note", "").strip()

    IncidentEvent.objects.create(
        incident=incident,
        action="escalate",
        from_status=incident.status,
        to_status=incident.status,
        actor=request.user.username,
        note=note or "تم تصعيد البلاغ",
    )

    AuditLogService.log(
        user=request.user,
        action="escalate",
        model_name="Incident",
        object_id=incident.id,
        description="تصعيد البلاغ",
    )

    messages.success(request, "تم تصعيد البلاغ")
    return redirect("incident_detail_dashboard", incident_id=incident.id)


@login_required(login_url="/login/")
def incident_link_risk(request, incident_id):
    if request.method != "POST":
        return redirect("/dashboard/incidents/")

    incident = get_object_or_404(Incident, id=incident_id)
    risk_id = request.POST.get("risk_id")

    if not risk_id:
        messages.error(request, "يجب اختيار خطر من السجل العام")
        return redirect("incident_detail_dashboard", incident_id=incident.id)

    risk = get_object_or_404(Risk, id=risk_id)

    IncidentService.link_risk(
        incident=incident,
        risk=risk,
        actor=request.user
    )

    messages.success(request, "تم ربط البلاغ بالخطر بنجاح")
    return redirect("incident_detail_dashboard", incident_id=incident.id)


@login_required(login_url="/login/")
def risk_incidents(request, risk_id):
    risk = get_object_or_404(Risk, id=risk_id)

    incidents = (
        Incident.objects
        .filter(risk=risk)
        .select_related("branch", "department", "section")
        .order_by("-created_at")
    )

    return render(
        request,
        "ohsms/risk_incidents.html",
        {"risk": risk, "incidents": incidents}
    )
