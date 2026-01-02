from django.urls import path
from . import views

urlpatterns = [
    path("", views.home, name="home"),

    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),

    # البلاغات (نماذج الإدخال)
    path("incident/normal/", views.normal_incident, name="incident_normal"),
    path("incident/secret/", views.secret_incident, name="incident_secret"),
    path("incident/urgent/", views.urgent_incident, name="incident_urgent"),
    path("incident/secret/track/", views.secret_track, name="secret_track"),

    # سجل المتابعة / قائمة البلاغات
    path("reports/", views.reports_view, name="reports"),

    # القوائم الرئيسية
    path("risk/", views.risk_view, name="risk"),
    path("forms/", views.forms_view, name="forms"),
    path("dashboard/", views.dashboard_view, name="dashboard"),
    path("system/", views.system_view, name="system"),

    # ❌ تم تعطيل المسارات غير المنفذة مؤقتًا
    # path("incidents/<int:incident_id>/start/", views.start_incident_processing, name="incident-start"),
    # path("incidents/<int:incident_id>/close/", views.close_incident, name="incident-close"),

    # AJAX
    path("ajax/departments/", views.get_departments, name="get_departments"),
    path("ajax/sections/", views.get_sections, name="get_sections"),
]
