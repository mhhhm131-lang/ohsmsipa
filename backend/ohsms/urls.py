from django.urls import path
from . import views
from ohsms.views_home import home_view
from .views import reports_view


urlpatterns = [
path("legacy-home/", home_view, name="home"),

    path("", views.home, name="home"),
    path("login/", views.login_view, name="login"),
    path("logout/", views.logout_view, name="logout"),
    path("incident/normal/", views.normal_incident, name="incident_normal"),
        path("incident/secret/", views.secret_incident, name="incident_secret"),
        path("incident/urgent/", views.urgent_incident, name="incident_urgent"),
        path('reports/', reports_view, name='reports'),
            path("risk/", views.risk_view, name="risk"),
            path("forms/", views.forms_view, name="forms"),
path("dashboard/", views.dashboard_view, name="dashboard"),
path("system/", views.system_view, name="system"),
path("incident/secret/track/", views.secret_track, name="secret_track"),





    # AJAX URLs
    path("ajax/departments/", views.get_departments, name="get_departments"),
    path("ajax/sections/", views.get_sections, name="get_sections"),
]
