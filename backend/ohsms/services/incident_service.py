from django.utils import timezone
from django.db import transaction

from ohsms.core.model_context import allow_model_mutation
from ohsms.models import Incident, IncidentEvent
from ohsms.services.audit_log import AuditLogService
from ohsms.core.errors import (
    ValidationFailed,
    InvalidTransition,
    PermissionDenied,
)


class IncidentService:
    """
    مصدر الحقيقة الوحيد لكل منطق البلاغات
    """

    # =========================
    # Creation
    # =========================

    @staticmethod
    @transaction.atomic
    def create_normal_incident(
        *,
        user,
        title,
        description,
        branch_id,
        department_id,
        section_id,
    ):
        incident = Incident.objects.create(
            title=title,
            description=description,
            incident_type="normal",
            branch_id=branch_id,
            department_id=department_id,
            section_id=section_id,
            status="open",
            actor=user,
        )

        IncidentEvent.objects.create(
            incident=incident,
            action="create",
            from_status="",
            to_status="open",
            actor=user.username,
            note="إنشاء بلاغ عادي",
        )

        AuditLogService.log(
            user=user,
            action="create",
            model_name="Incident",
            object_id=incident.id,
            description="إنشاء بلاغ عادي",
        )

        return incident

    @staticmethod
    @transaction.atomic
    def create_secret_incident(*, title, description, secrecy_reason):
        import uuid

        if not secrecy_reason:
            raise ValidationFailed(message="سبب السرية مطلوب")

        secret_key = uuid.uuid4().hex

        incident = Incident.objects.create(
            title=title,
            description=description,
            incident_type="secret",
            status="open",
            secret_key=secret_key,
            reason_for_secrecy=secrecy_reason,
        )

        IncidentEvent.objects.create(
            incident=incident,
            action="create",
            from_status="",
            to_status="open",
            actor="anonymous",
            note="إنشاء بلاغ سري",
        )

        return incident, secret_key

    @staticmethod
    @transaction.atomic
    def create_urgent_incident(*, system_user, title, description, branch, department, section):
        if not system_user:
            raise PermissionDenied(message="مستخدم النظام غير موجود")

        incident = Incident.objects.create(
            title=title,
            description=description,
            incident_type="urgent",
            branch=branch,
            department=department,
            section=section,
            status="open",
            actor=system_user,
        )

        IncidentEvent.objects.create(
            incident=incident,
            action="create",
            from_status="",
            to_status="open",
            actor=system_user.username,
            note="إنشاء بلاغ عاجل",
        )

        AuditLogService.log(
            user=system_user,
            action="create",
            model_name="Incident",
            object_id=incident.id,
            description="إنشاء بلاغ عاجل",
        )

        return incident

    # =========================
    # State Management
    # =========================

    @staticmethod
    @transaction.atomic
    def change_status(*, incident, new_status, actor, note=""):
        if not actor:
            raise PermissionDenied(message="يجب وجود منفذ للعملية")

        if incident.status == new_status:
            raise InvalidTransition(
                message="الحالة الجديدة مطابقة للحالة الحالية",
                details={"status": new_status},
            )

        allowed_transitions = {
    "open": {"in_progress"},
    "in_progress": {"closed"},
    "closed": set(),
}


        if new_status not in allowed_transitions.get(incident.status, set()):
            raise InvalidTransition(
                details={
                    "from": incident.status,
                    "to": new_status,
                }
            )

        old_status = incident.status

        with allow_model_mutation("incident_status"):
            incident.status = new_status
            if new_status == "in_progress":
                incident.handled_at = timezone.now()
            incident.save(update_fields=["status", "handled_at"])

        IncidentEvent.objects.create(
            incident=incident,
            action="status_change",
            from_status=old_status,
            to_status=new_status,
            actor=actor.username,
            note=note,
        )

        AuditLogService.log(
            user=actor,
            action="status_change",
            model_name="Incident",
            object_id=incident.id,
            description=f"تغيير حالة البلاغ من {old_status} إلى {new_status}",
        )

        return incident

    # =========================
    # Notes & Relations
    # =========================

    @staticmethod
    def add_note(*, incident, actor, note):
        if not actor:
            raise PermissionDenied(message="يجب تسجيل الدخول لإضافة ملاحظة")

        if not note:
            raise ValidationFailed(message="الملاحظة لا يمكن أن تكون فارغة")

        IncidentEvent.objects.create(
            incident=incident,
            action="note",
            from_status=incident.status,
            to_status=incident.status,
            actor=actor.username,
            note=note,
        )

    @staticmethod
    def link_risk(*, incident, risk, actor):
        if not actor:
            raise PermissionDenied(message="غير مخوّل لربط الخطر")

        if not risk:
            raise ValidationFailed(message="الخطر غير موجود")

        incident.risk = risk
        incident.save(update_fields=["risk"])

        IncidentEvent.objects.create(
            incident=incident,
            action="note",
            from_status=incident.status,
            to_status=incident.status,
            actor=actor.username,
            note=f"تم ربط البلاغ بالخطر: {risk.title}",
        )

        AuditLogService.log(
            user=actor,
            action="update",
            model_name="Incident",
            object_id=incident.id,
            description=f"ربط البلاغ بالخطر {risk.title}",
        )

        return incident