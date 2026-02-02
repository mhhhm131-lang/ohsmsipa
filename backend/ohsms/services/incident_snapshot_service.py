from django.db.models import Count, Max
from ohsms.models import Incident, IncidentEvent


class IncidentSnapshotService:
    """
    Snapshot Service
    ----------------
    مسؤول عن توليد صور لحالة النظام (Read Only).
    لا ينشئ ولا يعدّل أي بيانات.
    """

    @staticmethod
    def system_snapshot():
        """
        Snapshot عام للنظام (للإدارة العليا)
        """
        return {
            "incidents_total": Incident.objects.count(),
            "incidents_by_status": (
                Incident.objects
                .values("status")
                .annotate(count=Count("id"))
            ),
            "events_total": IncidentEvent.objects.count(),
            "last_event_at": (
                IncidentEvent.objects.aggregate(last=Max("created_at"))["last"]
            ),
        }

    @staticmethod
    def incidents_timeline(incident_id):
        """
        Timeline كامل لبلاغ واحد
        """
        return (
            IncidentEvent.objects
            .filter(incident_id=incident_id)
            .order_by("created_at")
        )
    @staticmethod
    def incident_dashboard_snapshot(*, incident_id, user):
        """
        Snapshot لتفاصيل بلاغ واحد لاستخدامه في شاشة dashboard.
        Read-only فقط.
        """
        incident = Incident.objects.get(id=incident_id)


        events = (
            IncidentEvent.objects
            .filter(incident_id=incident_id)
            .order_by("created_at")
        )

        # ملاحظة: users/risks تُستخدم في الواجهة للاختيار/الربط
        # سنبقيها هنا مؤقتًا لأنها "بيانات عرض" وليست منطق تشغيل.
        from django.contrib.auth.models import User
        from ohsms.models import Risk

        users = User.objects.all()
        risks = Risk.objects.all()

        return {
            "incident": incident,
            "events": events,
            "users": users,
            "risks": risks,
        }
    @staticmethod
    def system_snapshot_for_user(*, user):
        """
        Snapshot عام للوحة التحكم حسب صلاحيات المستخدم.
        Read-only فقط.
        """
        from django.db.models import Count, Max
        from ohsms.services.permissions import PermissionService

        if not user:
            return {"error": "user is required"}

        # تحديد نطاق البيانات
        if PermissionService.is_global(user):
            qs = Incident.objects.all()
        else:
            scopes = PermissionService.get_user_scopes(user)
            if not scopes:
                qs = Incident.objects.none()
            else:
                from django.db.models import Q
                q = Q()
                for ur in scopes:
                    if getattr(ur, "section_id", None):
                        q |= Q(section_id=ur.section_id)
                    elif getattr(ur, "department_id", None):
                        q |= Q(department_id=ur.department_id)
                    elif getattr(ur, "branch_id", None):
                        q |= Q(branch_id=ur.branch_id)
                    else:
                        q = Q()
                        break
                qs = Incident.objects.filter(q) if q else Incident.objects.none()

        # Snapshot
        incidents_total = qs.count()

        incidents_by_status = list(
            qs.values("status").annotate(count=Count("id")).order_by("status")
        )

        # آخر حدث ضمن نفس النطاق (نربط الأحداث على incident_id)
        last_event_at = (
            IncidentEvent.objects
            .filter(incident_id__in=qs.values_list("id", flat=True))
            .aggregate(last=Max("created_at"))["last"]
        )

        return {
            "incidents_total": incidents_total,
            "incidents_by_status": incidents_by_status,
            "last_event_at": last_event_at,
        }
