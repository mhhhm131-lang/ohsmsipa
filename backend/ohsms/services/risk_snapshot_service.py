from django.shortcuts import get_object_or_404
from django.db.models import Count, Q

from ohsms.models import Risk, RiskEvent
from ohsms.services.permissions import PermissionService


class RiskSnapshotService:
    """
    Read-only snapshots for Risk domain
    """

    # =========================
    # Helpers
    # =========================

    @staticmethod
    def _scoped_risks(user):
        """
        Apply RBAC scopes to Risk queryset
        """
        if PermissionService.is_global(user):
            return Risk.objects.all()

        scopes = PermissionService.get_user_scopes(user)
        q = Q()

        for ur in scopes:
            if ur.section_id:
                q |= Q(section_id=ur.section_id)
            elif ur.department_id:
                q |= Q(department_id=ur.department_id)
            elif ur.branch_id:
                q |= Q(branch_id=ur.branch_id)
            else:
                # نطاق شامل
                return Risk.objects.all()

        return Risk.objects.filter(q) if q else Risk.objects.none()

    # =========================
    # Snapshots
    # =========================

    @staticmethod
    def risk_detail_snapshot(*, risk_id, user):
        """
        Snapshot تفصيلي لخطر واحد
        """
        risk = get_object_or_404(
            RiskSnapshotService._scoped_risks(user),
            id=risk_id
        )

        events = (
            RiskEvent.objects
            .filter(risk=risk)
            .order_by("created_at")
        )

        return {
            "risk": risk,
            "events": events,
        }

    @staticmethod
    def risk_register_snapshot(*, user):
        """
        Snapshot لسجل المخاطر (Risk Register)
        """
        risks = (
            RiskSnapshotService
            ._scoped_risks(user)
            .select_related(
                "category",
                "sub_category",
                "cause",
                "branch",
                "department",
                "section",
            )
            .order_by("-created_at")
        )

        return {
            "risks": risks,
            "total": risks.count(),
        }

    @staticmethod
    def risk_dashboard_snapshot(*, user):
        """
        Snapshot تحليلي للمخاطر (Dashboard)
        """
        risks = RiskSnapshotService._scoped_risks(user)

        by_status = (
            risks
            .values("status")
            .annotate(count=Count("id"))
        )

        by_category = (
            risks
            .values("category__name")
            .annotate(count=Count("id"))
        )

        return {
            "total_risks": risks.count(),
            "by_status": list(by_status),
            "by_category": list(by_category),
        }
