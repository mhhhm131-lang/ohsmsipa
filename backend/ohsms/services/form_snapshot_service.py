from django.db.models import Count
from django.utils import timezone
from datetime import timedelta

from ohsms.models import (
    FormTemplate,
    FormSubmission,
    FormEvent,
)


class FormSnapshotService:
    """
    Read-only snapshots للنماذج الرقمية
    """

    # =========================
    # Dashboard – High Level
    # =========================

    @staticmethod
    def forms_dashboard_snapshot():
        return {
            "kpis": FormSnapshotService.forms_kpis(days=90),
            "events_by_action": FormSnapshotService.events_by_action(days=90),
            "recent_submissions": FormSnapshotService.recent_submissions(limit=10),
        }

    # =========================
    # KPIs
    # =========================

    @staticmethod
    def forms_kpis(days: int = 90):
        since = timezone.now() - timedelta(days=days)

        total_forms = FormTemplate.objects.count()
        active_forms = FormTemplate.objects.filter(is_active=True).count()

        total_submissions = FormSubmission.objects.count()
        recent_submissions = FormSubmission.objects.filter(
            submitted_at__gte=since
        ).count()

        return {
            "total_forms": total_forms,
            "active_forms": active_forms,
            "total_submissions": total_submissions,
            "recent_submissions": recent_submissions,
        }

    # =========================
    # Events
    # =========================

    @staticmethod
    def events_by_action(days: int = 90):
        since = timezone.now() - timedelta(days=days)

        qs = (
            FormEvent.objects
            .filter(created_at__gte=since)
            .values("action")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        return list(qs)

    # =========================
    # Submissions
    # =========================

    @staticmethod
    def recent_submissions(limit: int = 10):
        qs = (
            FormSubmission.objects
            .select_related("form")
            .order_by("-submitted_at")[:limit]
        )

        return [
            {
                "id": s.id,
                "form": s.form.title,
                "submitted_at": s.submitted_at,
                "submitted_by": s.submitted_by,
            }
            for s in qs
        ]
