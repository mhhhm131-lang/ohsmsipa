from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt

from ohsms.models import (
    Incident, Branch, Department, Section,
    SystemContent
)
from ohsms.services.incidents import IncidentService


# =========================
# Helpers
# =========================
def get_user_role(request):
    """
    يرجع دور المستخدم من UserProfile
    """
    try:
        return request.user.profile.role
    except Exception:
        return None


def require_roles(request, allowed_roles, forbidden_message):
    # السماح الكامل لمدير النظام (Superuser)
    if request.user.is_superuser:
        return None

    role = get_user_role(request)
    if not role:
        return HttpResponse("غير مخوّل", status=403)

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
# Home
# =========================
def home(request):
    """
    الصفحة الرئيسية:
    - سياسة السلامة
    - النطاق
    - الأهداف
    - أزرار البلاغات
    """
    return render(request, "ohsms/home.html")



# =========================
# Auth
# =========================
def login_view(request):
    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)

            try:
                role = user.profile.role
            except Exception:
                logout(request)
                messages.error(request, "حسابك غير مهيأ (لا يوجد دور مستخدم)")
                return redirect("/login/")

            next_url = request.POST.get("next") or request.GET.get("next")
            if next_url:
                return redirect(next_url)

            if user.is_superuser or role == "مدير النظام":
                return redirect("/system/")
            return redirect("/dashboard/")

        messages.error(request, "اسم المستخدم أو كلمة المرور غير صحيحة")

    return render(request, "ohsms/login.html")


def logout_view(request):
    logout(request)
    return redirect("/login/")


# =========================
# Incidents
# =========================
@login_required(login_url="/login/")
def normal_incident(request):
    branches = Branch.objects.all()

    if request.method == "POST":
        title = request.POST.get("title")
        description = request.POST.get("description")
        branch_id = request.POST.get("branch")
        department_id = request.POST.get("department")
        section_id = request.POST.get("section")

        branch = Branch.objects.get(id=branch_id)
        department = Department.objects.get(id=department_id)
        section = Section.objects.get(id=section_id)

        IncidentService.create_normal_incident(
            user=request.user,
            title=title,
            description=description,
            branch=branch,
            department=department,
            section=section
        )
        return redirect("reports")

    return render(request, "ohsms/incident_normal.html", {"branches": branches})


@login_required(login_url="/login/")
def secret_incident(request):
    branches = Branch.objects.all()

    if request.method == "POST":
        title = request.POST.get("title")
        description = request.POST.get("description")
        secrecy_reason = request.POST.get("secrecy_reason")

        incident, secret_key = IncidentService.create_secret_incident(
            title=title,
            description=description,
            secrecy_reason=secrecy_reason
        )

        return render(request, "ohsms/incident_secret.html", {
            "branches": branches,
            "success": True,
            "secret_key": secret_key
        })

    return render(request, "ohsms/incident_secret.html", {"branches": branches})


@csrf_exempt
@login_required(login_url="/login/")
def urgent_incident(request):
    if request.method == "POST":
        IncidentService.create_urgent_incident()
        return redirect("reports")

    return render(request, "ohsms/incident_urgent.html")


# =========================
# Reports
# =========================
@login_required(login_url="/login/")
def reports_view(request):
    denied = require_roles(
        request,
        allowed_roles=["system_admin", "system_staff"],
        forbidden_message="غير مخوّل للاطلاع على سجل البلاغات"
    )
    if denied:
        return denied

    incidents = Incident.objects.select_related(
        "branch", "department", "section"
    ).prefetch_related("events").order_by("-created_at")

    return render(request, "ohsms/reports.html", {"incidents": incidents})


@login_required(login_url="/login/")
def change_incident_status(request, incident_id):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid request"}, status=400)

    new_status = request.POST.get("status")
    note = request.POST.get("note", "")

    incident = get_object_or_404(Incident, id=incident_id)

    IncidentService.change_status(
        incident=incident,
        new_status=new_status,
        actor=request.user,
        note=note
    )

    return JsonResponse({"success": True})


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

    return render(request, "ohsms/incident_secret_track.html", {
        "incident": incident,
        "error": error,
        "closed": closed
    })


# =========================
# Risk / Forms / Dashboard / System
# =========================
@login_required(login_url="/login/")
def risk_view(request):
    denied = require_roles(
        request,
        allowed_roles=[
            "system_admin",
            "system_staff",
            "safety_committee",
            "branch_manager",
            "department_manager",
            "section_manager",
            "safety_coordinator",
        ],
        forbidden_message="غير مخوّل للوصول إلى إدارة المخاطر"
    )
    if denied:
        return denied

    return render(request, "ohsms/risk.html")


@login_required(login_url="/login/")
def forms_view(request):
    return render(request, "ohsms/forms.html")


@login_required(login_url="/login/")
def dashboard_view(request):
    return render(request, "ohsms/dashboard.html")


@login_required(login_url="/login/")
def system_view(request):
    denied = require_roles(
        request,
        allowed_roles=["system_admin", "system_staff"],
        forbidden_message="غير مخوّل للوصول إلى إدارة النظام"
    )
    if denied:
        return denied

    return render(request, "ohsms/admin.html")


# =========================
# AJAX
# =========================
@login_required(login_url="/login/")
def get_departments(request):
    branch_id = request.GET.get("branch_id")
    departments = Department.objects.filter(branch_id=branch_id)

    data = [{"id": dept.id, "name": dept.name} for dept in departments]
    return JsonResponse(data, safe=False)


@login_required(login_url="/login/")
def get_sections(request):
    department_id = request.GET.get("department_id")
    sections = Section.objects.filter(department_id=department_id)

    data = [{"id": sec.id, "name": sec.name} for sec in sections]
    return JsonResponse(data, safe=False)
