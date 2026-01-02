from django.contrib import admin
from .models import (
    Branch, Department, Section,
    Incident,
    UserProfile,

    RiskCategory, RiskSubCategory, RiskCause,
    AffectedGroup, Risk, RiskNote,

    FormTemplate, FormField, FormSubmission, FormAnswer
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
# Users
# =========================
admin.site.register(UserProfile)
