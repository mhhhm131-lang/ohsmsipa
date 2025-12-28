from django.contrib import admin
from .models import Incident

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ('title', 'incident_type', 'created_at')
    list_filter = ('incident_type',)
    search_fields = ('title', 'description')
from .models import Branch

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name',)
from .models import Department

@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ('name', 'branch')
    list_filter = ('branch',)
from .models import Section

@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ('name', 'department')
    list_filter = ('department',)
from .models import UserProfile

admin.site.register(UserProfile)
