from ohsms.models import IncidentEvent
from ohsms.services.audit_log import AuditLogService


class IncidentEventWriter:
    """
    Event Policy Writer
    المكان الوحيد المسموح به لإنشاء أحداث البلاغات
    """

    @staticmethod
    def note(*, incident, actor, note: str):
        IncidentEvent.objects.create(
            incident=incident,
            action="note",
            from_status=incident.status,
            to_status=incident.status,
            actor=actor.username,
            note=note,
        )

    @staticmethod
    def assign(*, incident, actor, assignee, note=""):
        IncidentEvent.objects.create(
            incident=incident,
            action="assign",
            from_status=incident.status,
            to_status=incident.status,
            actor=actor.username,
            note=f"إحالة إلى {assignee.username}. {note}",
        )

        AuditLogService.log(
            user=actor,
            action="assign",
            model_name="Incident",
            object_id=incident.id,
            description=f"إحالة البلاغ إلى {assignee.username}",
        )

    @staticmethod
    def escalate(*, incident, actor, note=""):
        IncidentEvent.objects.create(
            incident=incident,
            action="escalate",
            from_status=incident.status,
            to_status=incident.status,
            actor=actor.username,
            note=note or "تم تصعيد البلاغ",
        )

        AuditLogService.log(
            user=actor,
            action="escalate",
            model_name="Incident",
            object_id=incident.id,
            description="تصعيد البلاغ",
        )
    @staticmethod
    def receive(*, incident, actor, note=""):
        # Event
        IncidentEvent.objects.create(
            incident=incident,
            action="receive",
            from_status="open",
            to_status="in_progress",
            actor=actor.username,
            note=note or "تم استلام البلاغ",
        )

        # Audit
        AuditLogService.log(
            user=actor,
            action="receive",
            model_name="Incident",
            object_id=incident.id,
            description="استلام البلاغ",
        )
