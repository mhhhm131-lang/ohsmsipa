from django.urls import path
from . import views
from .views_home import home_view

urlpatterns = [
    # الصفحة الرئيسية العامة
    path("", home_view, name="home"),

    # تسجيل الدخول
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),

    # البلاغات
    path("incident/normal/", views.normal_incident, name="incident_normal"),
    path("incident/secret/", views.secret_incident, name="incident_secret"),
    path("incident/urgent/", views.urgent_incident, name="incident_urgent"),
    path("incident/secret/track/", views.secret_track, name="secret_track"),

    # سجل البلاغات
    path("reports/", views.reports_view, name="reports"),

    # القوائم (محمية)
    path("risk/", views.risk_view, name="risk"),
    path("forms/", views.forms_view, name="forms"),
    path("dashboard/", views.dashboard_view, name="dashboard"),
    path("system/", views.system_view, name="system"),

    # AJAX
    path("ajax/departments/", views.get_departments, name="get_departments"),
    path("ajax/sections/", views.get_sections, name="get_sections"),
]
# API – البلاغات
path("api/incidents/secret/", views.api_create_secret_incident, name="api_secret_incident"),
