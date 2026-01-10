from django.contrib import admin
from django.core.exceptions import ValidationError

from .models import (
    # Organization
    Branch, Department, Section,

    # Incidents
    Incident, IncidentEvent,

    # Users & RBAC
    UserProfile, Role, UserRole,

    # Risk Management
    RiskCategory, RiskSubCategory, RiskCause,
    AffectedGroup, Risk, RiskNote,

    # Digital Forms
    FormTemplate, FormField, FormSubmission, FormAnswer,

)

# =========================
# Organization Structure
# =========================

@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(Department)
class DepartmentAdmin(admin.ModelAdmin):
    list_display = ("name", "branch")
    list_filter = ("branch",)


@admin.register(Section)
class SectionAdmin(admin.ModelAdmin):
    list_display = ("name", "department")
    list_filter = ("department",)


# =========================
# Incidents
# =========================

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ("title", "incident_type", "status", "created_at")
    list_filter = ("incident_type", "status")
    search_fields = ("title", "description")


@admin.register(IncidentEvent)
class IncidentEventAdmin(admin.ModelAdmin):
    list_display = ("incident", "action", "from_status", "to_status", "created_at")
    list_filter = ("action", "created_at")


# =========================
# Risk Management
# =========================

@admin.register(RiskCategory)
class RiskCategoryAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(RiskSubCategory)
class RiskSubCategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "category")
    list_filter = ("category",)


@admin.register(RiskCause)
class RiskCauseAdmin(admin.ModelAdmin):
    list_display = ("name", "sub_category")
    list_filter = ("sub_category",)


@admin.register(AffectedGroup)
class AffectedGroupAdmin(admin.ModelAdmin):
    list_display = ("name",)


@admin.register(Risk)
class RiskAdmin(admin.ModelAdmin):
    list_display = ("title", "status", "risk_score", "scope_type", "created_at")
    list_filter = ("status", "scope_type", "category")
    search_fields = ("title", "description")


@admin.register(RiskNote)
class RiskNoteAdmin(admin.ModelAdmin):
    list_display = ("risk", "created_by", "created_at")


# =========================
# Digital Forms
# =========================

@admin.register(FormTemplate)
class FormTemplateAdmin(admin.ModelAdmin):
    list_display = ("title", "visibility", "is_active", "created_at")
    list_filter = ("visibility", "is_active")


@admin.register(FormField)
class FormFieldAdmin(admin.ModelAdmin):
    list_display = ("label", "form", "field_type", "order")
    list_filter = ("field_type",)


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    list_display = ("form", "submitted_by", "submitted_at")


@admin.register(FormAnswer)
class FormAnswerAdmin(admin.ModelAdmin):
    list_display = ("field", "submission")


# =========================
# RBAC - Roles & Scopes
# =========================

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ("name", "code", "is_global")
    list_filter = ("is_global",)
    search_fields = ("name", "code")



@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "branch", "department", "section", "assigned_at")
    list_filter = ("role", "branch", "department")
    search_fields = ("user__username",)

    def save_model(self, request, obj, form, change):
        """
        فرض قواعد النطاق عند الحفظ من Admin
        """
        try:
            obj.full_clean()
        except ValidationError as e:
            form.add_error(None, e)
            return
        super().save_model(request, obj, form, change)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role", "branch", "department", "section", "is_active")
    list_filter = ("role", "is_active", "branch")
    search_fields = ("user__username",)




# =========================
# System Content
# =========================

from .models import SystemContent

@admin.register(SystemContent)
class SystemContentAdmin(admin.ModelAdmin):
    list_display = ("content_type", "title", "is_active", "updated_at")
    list_filter = ("content_type", "is_active")
    search_fields = ("title", "body")
