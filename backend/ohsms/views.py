from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
import json

from ohsms.models import (
    Incident, Branch, Department, Section,
    SystemContent
)
from ohsms.services.incidents import IncidentService
from ohsms.services.audit_log import AuditLogService


# =========================
# Helpers
# =========================

def get_user_role(request):
    try:
        return request.user.profile.role
    except Exception:
        return None


def require_roles(request, allowed_roles, forbidden_message):
    if request.user.is_superuser:
        return None

    role = get_user_role(request)

    if not role:
        return render(
            request,
            "ohsms/403.html",
            {"message": "حسابك مسجّل دخول لكنه غير مهيأ بصلاحيات"},
            status=403
        )

    ROLE_MAP = {
        "مدير النظام": "system_admin",
        "موظف النظام": "system_staff",
        "الإدارة العليا": "top_management",
        "لجنة السلامة": "safety_committee",
        "مدير فرع": "branch_manager",
        "مدير إدارة": "department_manager",
        "مدير قسم": "section_manager",
        "منسق السلامة": "safety_coordinator",
        "موظف": "employee",
        "عميل / مورد / جهة خدمة": "partner",
    }

    normalized_role = ROLE_MAP.get(role)
    if not normalized_role:
        return HttpResponse("غير مخوّل", status=403)

    if normalized_role not in allowed_roles:
        return HttpResponse(forbidden_message, status=403)

    return None


# =========================
# Auth
# =========================

def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)  # ← هذا السطر صحيح وموجود

            AuditLogService.log(
                user=user,
                action="login",
                model_name="User",
                object_id=user.id,
                description="تسجيل دخول المستخدم",
                ip_address=request.META.get("REMOTE_ADDR")
            )

            # التأكد من وجود profile
            try:
                role = user.profile.role
            except Exception:
                logout(request)
                messages.error(request, "حسابك غير مهيأ (لا يوجد دور مستخدم)")
                return redirect("/login/")

            # توجيه حسب الدور
            if user.is_superuser or role == "مدير النظام":
                return redirect("/system/")

            return redirect("/dashboard/")

        else:
            messages.error(request, "اسم المستخدم أو كلمة المرور غير صحيحة")

    return render(request, "ohsms/login.html")



def logout_view(request):
    if request.user.is_authenticated:
        AuditLogService.log(
            user=request.user,
            action="logout",
            model_name="User",
            object_id=request.user.id,
            description="تسجيل خروج المستخدم",
            ip_address=request.META.get("REMOTE_ADDR")
        )

    logout(request)
    return redirect("/login/")


# =========================
# Incidents
# =========================

@login_required(login_url="/login/")
def normal_incident(request):
    branches = Branch.objects.all()

    if request.method == "POST":
        IncidentService.create_normal_incident(
            user=request.user,
            title=request.POST.get("title"),
            description=request.POST.get("description"),
            branch=Branch.objects.get(id=request.POST.get("branch")),
            department=Department.objects.get(id=request.POST.get("department")),
            section=Section.objects.get(id=request.POST.get("section")),
        )
        return redirect("reports")

    return render(request, "ohsms/incident_normal.html", {"branches": branches})


@login_required(login_url="/login/")
def secret_incident(request):
    branches = Branch.objects.all()

    if request.method == "POST":
        incident, secret_key = IncidentService.create_secret_incident(
            title=request.POST.get("title"),
            description=request.POST.get("description"),
            secrecy_reason=request.POST.get("secrecy_reason"),
        )

        return render(
            request,
            "ohsms/incident_secret.html",
            {"branches": branches, "success": True, "secret_key": secret_key}
        )

    return render(request, "ohsms/incident_secret.html", {"branches": branches})


@login_required(login_url="/login/")
def urgent_incident(request):
    if request.method == "POST":
        IncidentService.create_urgent_incident()
        return redirect("reports")

    return render(request, "ohsms/incident_urgent.html")


# =========================
# Reports (✅ الإصلاح هنا)
# =========================

@login_required(login_url="/login/")
# =========================
# Reports
# =========================

@login_required(login_url="/login/")
def reports_view(request):
    from ohsms.services.permissions import PermissionService

    user = request.user

    # السماح المطلق لمدير النظام
    if user.is_superuser:
        has_access = True
    else:
        allowed_roles = [
            "system_admin",
            "system_staff",
            "safety_committee",
            "branch_manager",
            "department_manager",
            "section_manager",
            "safety_coordinator",
        ]

        has_access = any(
            PermissionService.has_role(user, role)
            for role in allowed_roles
        )

    if not has_access:
        return HttpResponse(
            "غير مخوّل للاطلاع على سجل البلاغات",
            status=403
        )

    # تحديد نطاق البلاغات
    if PermissionService.is_global(user):
        incidents = Incident.objects.all()
    else:
        qs = Incident.objects.all()
        if hasattr(user, "profile"):
            p = user.profile
            if p.section:
                qs = qs.filter(section=p.section)
            elif p.department:
                qs = qs.filter(department=p.department)
            elif p.branch:
                qs = qs.filter(branch=p.branch)
            else:
                qs = qs.none()
        incidents = qs

    incidents = incidents.select_related(
        "branch", "department", "section", "risk"
    ).prefetch_related("events").order_by("-created_at")

    return render(
        request,
        "ohsms/reports.html",
        {"incidents": incidents}
    )



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


from ohsms.services.dashboard import DashboardService

@login_required(login_url="/login/")
def dashboard_view(request):
    dashboard_data = DashboardService.dashboard_snapshot()
    return render(
        request,
        "ohsms/dashboard.html",
        {"dashboard": dashboard_data}
    )



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
            return JsonResponse(
                {"error": "البيانات غير مكتملة"},
                status=400
            )

        incident, secret_key = IncidentService.create_secret_incident(
            title="بلاغ سري",
            description=description,
            secrecy_reason=secrecy_reason
        )

        return JsonResponse({
            "success": True,
            "secret_key": secret_key
        })

    except json.JSONDecodeError:
        return JsonResponse(
            {"error": "صيغة البيانات غير صحيحة"},
            status=400
        )

    except Exception as e:
        return JsonResponse(
            {"error": str(e)},
            status=500
        )
# =========================
# Secret Incident Tracking
# ======================

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
        {
            "incident": incident,
            "error": error,
            "closed": closed
        }
    )

