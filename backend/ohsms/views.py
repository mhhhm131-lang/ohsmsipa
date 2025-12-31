from ohsms.models import Incident, IncidentEvent, Branch, Department, Section
from ohsms.services.incidents import IncidentService
from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse



# الصفحة الرئيسية (عامة)
def home(request):
    return render(request, 'ohsms/index.html')


# تسجيل الدخول
def login_view(request):
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            login(request, user)
            next_url = request.GET.get('next')
            return redirect(next_url if next_url else '/')
        else:
            messages.error(request, 'اسم المستخدم أو كلمة المرور غير صحيحة')

    return render(request, 'ohsms/login.html')


# تسجيل الخروج
def logout_view(request):
    logout(request)
    return redirect('/login/')

# البلاغ العادي (محمي
@login_required(login_url='/login/')
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

    return render(request, 'ohsms/incident_normal.html', {
        'branches': branches
    })


# AJAX: جلب الإدارات حسب الفرع
def get_departments(request):
    branch_id = request.GET.get("branch_id")
    departments = Department.objects.filter(branch_id=branch_id)

    data = [
        {"id": dept.id, "name": dept.name}
        for dept in departments
    ]
    return JsonResponse(data, safe=False)


# AJAX: جلب الأقسام حسب الإدارة
def get_sections(request):
    department_id = request.GET.get("department_id")
    sections = Section.objects.filter(department_id=department_id)

    data = [
        {"id": sec.id, "name": sec.name}
        for sec in sections
    ]
    return JsonResponse(data, safe=False)

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

    return render(request, "ohsms/incident_secret.html", {
        "branches": branches
    })


from django.views.decorators.csrf import csrf_exempt

@csrf_exempt
def urgent_incident(request):
    if request.method == "POST":
        IncidentService.create_urgent_incident()
        return redirect("reports")

    return render(request, "ohsms/incident_urgent.html")

@login_required
def reports_view(request):
    incidents = Incident.objects.select_related(
        'branch', 'department', 'section'
    ).prefetch_related('events').order_by('-created_at')

    return render(request, 'ohsms/reports.html', {
        'incidents': incidents
    })


    incidents = Incident.objects.select_related(
        'branch', 'department', 'section'
    ).prefetch_related('events').order_by('-created_at')

    return render(request, 'ohsms/reports.html', {
        'incidents': incidents
    })


from .models import SystemContent


def home(request):
    contents = {
        item.content_type: item
        for item in SystemContent.objects.filter(is_active=True)
    }

    return render(request, 'ohsms/index.html', {
        'policy': contents.get('policy'),
        'objectives': contents.get('objectives'),
        'scope': contents.get('scope'),
    })
from django.shortcuts import render
from ohsms.models import Incident



from django.shortcuts import redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from ohsms.models import Incident
from ohsms.services.incidents import IncidentService



from django.shortcuts import render

def risk_view(request):
    return render(request, "ohsms/risk.html")
from django.shortcuts import render

def forms_view(request):
    return render(request, "ohsms/forms.html")

def dashboard_view(request):
    return render(request, "ohsms/dashboard.html")

def system_view(request):
    return render(request, "ohsms/admin.html")

from django.shortcuts import get_object_or_404
from django.http import JsonResponse

@login_required
def change_incident_status(request, incident_id):
    if request.method != 'POST':
        return JsonResponse({'error': 'Invalid request'}, status=400)

    new_status = request.POST.get('status')
    note = request.POST.get('note', '')

    incident = get_object_or_404(Incident, id=incident_id)

    IncidentService.change_status(
        incident=incident,
        new_status=new_status,
        actor=request.user,
        note=note
    )

    return JsonResponse({'success': True})
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




